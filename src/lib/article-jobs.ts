import {AiError, completeStreaming, longAiOptions} from "./ai";
import {
    describeArticleRequest,
    parseGeneratedArticle,
    relatedFromBody,
    writeSystemPrompt,
    type ArticleRequest,
    type GeneratedArticle,
} from "./article-ai";
import {describeReview, MIN_BODY_LENGTH, parseReview, reviewSystemPrompt} from "./article-review";
import {ensureDistinctTitle, titlesSimilar} from "./article-title";
import {createArticle, getArticle, updateArticle, type ArticleRecord, type ArticleReview, type ArticleUniqueness} from "./articles";
import {getConfigNumber} from "./config";
import {describeProblem, findLinkProblems, removeDeadLinks} from "./link-check";
import {getDb} from "./db";
import {fetchSourceArticle, SourcePageError} from "./source-page";
import {
    articleTextForCheck,
    checkTextRu,
    chunksWithPhrases,
    compareWithSource,
    rewriteChunks,
    textruConfigured,
    uniqueMin,
    uniqueRounds,
    TextRuError,
} from "./uniqueness";

/**
 * Фоновые задачи нейросети: написать статью, проверить и улучшить готовую,
 * проверить уникальность.
 *
 * Статья пишется 5–15 минут, а с проверкой в text.ru — до получаса. Держать
 * всё это время открытым HTTP-запрос ненадёжно: закрытая вкладка или таймаут
 * nginx обрывали бы работу. Поэтому задача живёт в процессе сервера, ход
 * пишет в таблицу jobs, а админка раз в пару секунд спрашивает, как дела.
 *
 * Процесс может перезапуститься посреди задачи (деплой). Признак живой
 * задачи — свежий updated_at: пока она работает, раз в 20 секунд отмечается.
 * Задачу, молчащую дольше трёх минут, считаем оборванной.
 */

export type JobKind = "generate" | "review" | "unique";
export type JobStatus = "running" | "done" | "error";

export interface JobInput extends ArticleRequest {
    sourceUrl?: string;
    articleId?: number;
}

export interface JobLogEntry {
    at: number;
    text: string;
}

export interface Job {
    id: number;
    kind: JobKind;
    status: JobStatus;
    input: JobInput;
    step: string;
    log: JobLogEntry[];
    preview: string;
    error: string;
    articleId: number | null;
    revalidate: string;
    createdAt: number;
    updatedAt: number;
}

interface JobRow {
    id: number;
    kind: string;
    status: string;
    input: string;
    step: string;
    log: string;
    preview: string;
    error: string;
    article_id: number | null;
    revalidate: string;
    created_at: number;
    updated_at: number;
}

const HEARTBEAT_MS = 20000;
const STALE_MS = 3 * 60 * 1000;
const PREVIEW_EVERY_MS = 1500;
const PREVIEW_LIMIT = 8000;
const MAX_RUNNING = 2;

export const JOB_TITLES: Record<JobKind, string> = {
    generate: "Новая статья",
    review: "Проверка и улучшение",
    unique: "Проверка уникальности",
};

const fromRow = (row: JobRow): Job => ({
    id: row.id,
    kind: row.kind as JobKind,
    status: row.status as JobStatus,
    input: JSON.parse(row.input) as JobInput,
    step: row.step,
    log: JSON.parse(row.log) as JobLogEntry[],
    preview: row.preview,
    error: row.error,
    articleId: row.article_id,
    revalidate: row.revalidate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export const getJob = (id: number): Job | null => {
    const db = getDb();
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as JobRow | undefined;
    if (!row) return null;
    if (row.status === "running" && Date.now() - row.updated_at > STALE_MS) {
        const error = "Задача прервалась — скорее всего, сервер перезапускался. Запустите её ещё раз";
        db.prepare("UPDATE jobs SET status = 'error', error = ? WHERE id = ?").run(error, id);
        return {...fromRow(row), status: "error", error};
    }
    return fromRow(row);
};

export const recentJobs = (limit = 15): Job[] =>
    (getDb().prepare("SELECT * FROM jobs ORDER BY id DESC LIMIT ?").all(limit) as JobRow[])
        .map((row) => getJob(row.id))
        .filter((job): job is Job => job !== null);

/** Пометка «страницы статьи обновлены» — её снимает запрос, который их обновил */
export const clearRevalidate = (id: number): void => {
    getDb().prepare("UPDATE jobs SET revalidate = '' WHERE id = ?").run(id);
};

const running = new Set<number>();

/* ------------------------------------------------------------------ */
/* Журнал задачи                                                       */
/* ------------------------------------------------------------------ */

class JobContext {
    private lastPreview = 0;
    private readonly heartbeat: ReturnType<typeof setInterval>;

    constructor(readonly id: number) {
        this.heartbeat = setInterval(() => this.touch(), HEARTBEAT_MS);
    }

    private touch() {
        getDb().prepare("UPDATE jobs SET updated_at = ? WHERE id = ?").run(Date.now(), this.id);
    }

    step(text: string) {
        const db = getDb();
        const row = db.prepare("SELECT log FROM jobs WHERE id = ?").get(this.id) as {log: string};
        const log = [...(JSON.parse(row.log) as JobLogEntry[]), {at: Date.now(), text}];
        db.prepare("UPDATE jobs SET step = ?, log = ?, preview = '', updated_at = ? WHERE id = ?").run(
            text,
            JSON.stringify(log),
            Date.now(),
            this.id,
        );
    }

    /** Текущий шаг без записи в журнал — для частых мелких шагов вроде «фраза 3 из 12» */
    status = (text: string) => {
        getDb().prepare("UPDATE jobs SET step = ?, updated_at = ? WHERE id = ?").run(text, Date.now(), this.id);
    };

    /** Текст, который прямо сейчас пишет нейросеть, — не чаще раза в 1,5 секунды */
    preview = (text: string) => {
        if (Date.now() - this.lastPreview < PREVIEW_EVERY_MS) return;
        this.lastPreview = Date.now();
        getDb()
            .prepare("UPDATE jobs SET preview = ?, updated_at = ? WHERE id = ?")
            .run(text.length > PREVIEW_LIMIT ? `…${text.slice(-PREVIEW_LIMIT)}` : text, Date.now(), this.id);
    };

    article(articleId: number, slug?: string) {
        getDb()
            .prepare("UPDATE jobs SET article_id = ?, revalidate = ?, updated_at = ? WHERE id = ?")
            .run(articleId, slug ?? "", Date.now(), this.id);
    }

    finish(status: "done" | "error", error = "") {
        clearInterval(this.heartbeat);
        getDb()
            .prepare("UPDATE jobs SET status = ?, error = ?, step = ?, preview = '', updated_at = ? WHERE id = ?")
            .run(status, error, status === "done" ? "Готово" : "Ошибка", Date.now(), this.id);
    }
}

/* ------------------------------------------------------------------ */
/* Шаги                                                                */
/* ------------------------------------------------------------------ */

const toGenerated = (article: ArticleRecord): GeneratedArticle => ({
    title: article.title,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    excerpt: article.excerpt,
    body: article.body,
    faq: article.faq,
});

const requestOf = (article: ArticleRecord): ArticleRequest => ({
    topic: article.topic || article.title,
    keyword: article.keyword,
    notes: article.notes,
    sourceText: article.sourceText,
    sourceTitle: article.sourceTitle,
});

/** Второй проход: нейросеть-редактор оценивает черновик и исправляет его */
const review = async (ctx: JobContext, draft: GeneratedArticle, request: ArticleRequest) => {
    const extra: string[] = [];
    if (request.sourceTitle && titlesSimilar(draft.title, request.sourceTitle, request.keyword)) {
        extra.push(`ЗАГОЛОВОК почти повторяет заголовок статьи конкурента «${request.sourceTitle}» — придумать свой`);
    }
    if (request.sourceText) {
        const match = compareWithSource(draft.body, request.sourceText);
        if (match.chunks.length) {
            extra.push(`${match.chunks.length} фрагм. текста совпадают с текстом конкурента дословно (${match.percent}%) — переписать своими словами`);
        }
    }
    ctx.step("Проверяю качество: нейросеть читает статью как SEO-редактор, ставит оценку и исправляет недочёты");
    const answer = await completeStreaming(
        reviewSystemPrompt(),
        describeReview(draft, request, extra),
        "review",
        {...longAiOptions(), temperature: getConfigNumber("AI_REVIEW_TEMPERATURE")},
        ctx.preview,
    );
    return parseReview(answer, draft);
};

/** Проверка по интернету через text.ru */
interface WebResult {
    provider: "textru";
    percent: number;
    urls: {url: string; percent: number}[];
    /** Куски тела статьи с найденными совпадениями */
    targets: number[];
    /** Совпавшие фразы — подсказка для переписывания */
    phrases: string[];
}

/*
  Бесплатной проверки по интернету нет намеренно. Пробовали искать фразы
  статьи в DuckDuckGo, Bing, Brave и Mojeek: после нескольких запросов все
  они включают капчу, а дословно скопированный абзац конкурента не нашёл ни
  один — проверка показывала ложные 100%. Честное «не проверено» лучше.
*/
const webCheck = async (ctx: JobContext, article: ArticleRecord): Promise<WebResult | {error: string} | null> => {
    if (!textruConfigured()) return null;
    try {
        ctx.step("Проверяю уникальность в text.ru — обычно это занимает 1–10 минут");
        const result = await checkTextRu(articleTextForCheck(article), () => ctx.preview(""));
        return {provider: "textru", percent: result.percent, urls: result.urls, targets: chunksWithPhrases(article.body, result.phrases), phrases: result.phrases};
    } catch (error) {
        if (error instanceof TextRuError) return {error: error.message};
        throw error;
    }
};

/**
 * Доводка уникальности. Сначала бесплатное сравнение с текстом конкурента —
 * его совпадения переписываются без обращения к text.ru. Потом
 * проверка по интернету; если процент ниже порога, переписываются куски с
 * найденными совпадениями и проверка повторяется.
 */
const ensureUnique = async (ctx: JobContext, articleId: number): Promise<ArticleUniqueness> => {
    const maxRounds = uniqueRounds();
    const min = uniqueMin();
    let rounds = 0;

    for (;;) {
        const article = getArticle(articleId);
        if (!article) throw new AiError("Статью удалили, пока шла проверка");

        const source = article.sourceText ? compareWithSource(article.body, article.sourceText) : null;
        if (source?.chunks.length && rounds < maxRounds) {
            rounds += 1;
            ctx.step(`Совпадения с текстом конкурента: ${source.chunks.length} фрагм. (${source.percent}%). Переписываю их, круг ${rounds} из ${maxRounds}`);
            const result = await rewriteChunks(article.body, source.chunks, {title: article.title, phrases: [], source: article.sourceText}, ctx.preview);
            updateArticle(articleId, {body: result.body});
            continue;
        }

        const checked = await webCheck(ctx, article);
        const web = checked && "percent" in checked ? checked : null;
        const webError = checked && "error" in checked ? checked.error : undefined;
        if (!checked) ctx.step("По интернету не проверялась: ключ text.ru не задан. Сравнение с текстом конкурента — выше");
        if (web) ctx.step(`Уникальность ${web.percent}% (нужно не меньше ${min}%)${web.urls.length ? `, совпадения на ${web.urls.length} стр.` : ""}`);
        if (webError) ctx.step(webError);

        const report: ArticleUniqueness = {
            at: Date.now(),
            web: web ? {provider: web.provider, percent: web.percent, urls: web.urls} : null,
            ...(webError ? {webError} : {}),
            source: source ? {percent: source.percent, fragments: source.chunks.length} : null,
            rounds,
            passed: (!source || source.chunks.length === 0) && (web ? web.percent >= min : !checked),
        };
        updateArticle(articleId, {uniqueness: report});

        if (report.passed || !web || rounds >= maxRounds) return report;
        if (!web.targets.length) {
            ctx.step("Проверка не показала, какие именно абзацы совпали, — переписывать нечего, решение за вами");
            return report;
        }
        rounds += 1;
        ctx.step(`Переписываю ${web.targets.length} фрагм. с совпадениями, круг ${rounds} из ${maxRounds}`);
        const result = await rewriteChunks(article.body, web.targets, {title: article.title, phrases: web.phrases}, ctx.preview);
        updateArticle(articleId, {body: result.body});
    }
};

/**
 * Финальная сверка перед сохранением: заголовок не повторяет конкурента,
 * все ссылки ведут на существующие страницы. Возвращает исправленную статью
 * и заметки для отчёта редактора.
 */
const finalChecks = async (
    ctx: JobContext,
    article: GeneratedArticle,
    context: {sourceTitle?: string; keyword?: string},
): Promise<{article: GeneratedArticle; notes: string[]}> => {
    const notes: string[] = [];
    let result = article;

    if (context.sourceTitle) {
        ctx.step("Сверяю заголовок с заголовком статьи конкурента");
        const checked = await ensureDistinctTitle(result, context.sourceTitle, context.keyword);
        result = checked.article;
        if (checked.note) {
            notes.push(checked.note);
            ctx.step(checked.note);
        }
    }

    ctx.step("Проверяю ссылки: существуют ли страницы, на которые ведёт статья");
    const problems = await findLinkProblems(result.body);
    if (problems.length) {
        result = {...result, body: removeDeadLinks(result.body, problems)};
        for (const problem of problems) {
            const note = `${problem.state === "dead" ? "Убрана ссылка" : "Не удалось проверить ссылку"} ${describeProblem(problem)}`;
            notes.push(note);
            ctx.step(note);
        }
    } else {
        ctx.step("Все ссылки ведут на существующие страницы");
    }
    return {article: result, notes};
};

const withNotes = (review: ArticleReview | null, notes: string[]): ArticleReview | null =>
    notes.length ? {...(review ?? {score: 0, revised: false, at: Date.now(), notes: []}), notes: [...(review?.notes ?? []), ...notes]} : review;

/** Заголовок из вставленного текста конкурента: первая короткая строка */
const titleFromText = (text: string): string => {
    const first = text.split("\n").map((line) => line.replace(/^#+\s*/, "").trim()).find(Boolean) ?? "";
    return first.length <= 160 ? first : "";
};

const generate = async (ctx: JobContext, input: JobInput) => {
    const request: ArticleRequest = {...input};

    if (input.sourceUrl && !input.sourceText) {
        ctx.step(`Загружаю статью конкурента: ${input.sourceUrl}`);
        const source = await fetchSourceArticle(input.sourceUrl);
        request.sourceText = source.text;
        request.sourceTitle = source.title;
        if (!request.topic) request.topic = source.title;
        ctx.step(`Статья конкурента загружена: «${source.title}», ${source.text.length.toLocaleString("ru-RU")} знаков`);
    } else if (request.sourceText) {
        request.sourceTitle = titleFromText(request.sourceText);
    }
    if (!request.topic) request.topic = request.sourceTitle || (request.sourceText?.split("\n").find((line) => line.trim())?.slice(0, 200) ?? "");

    ctx.step(request.sourceText ? "Пишу новую статью на основе статьи конкурента" : "Пишу черновик статьи");
    const answer = await completeStreaming(
        writeSystemPrompt(request),
        describeArticleRequest(request),
        "article",
        longAiOptions(),
        ctx.preview,
    );
    const draft = parseGeneratedArticle(answer, request.topic);
    if (draft.body.length < MIN_BODY_LENGTH) throw new AiError("Нейросеть вернула слишком короткий текст — попробуйте ещё раз");
    ctx.step(`Черновик готов: ${draft.body.length.toLocaleString("ru-RU")} знаков`);

    let article = draft;
    let reviewResult: ArticleReview | null = null;
    try {
        const reviewed = await review(ctx, draft, request);
        article = reviewed.article;
        reviewResult = reviewed.review;
        ctx.step(`Оценка редактора: ${reviewed.review.score}/100${reviewed.review.revised ? ", исправления внесены" : ""}`);
    } catch (error) {
        if (!(error instanceof AiError)) throw error;
        ctx.step(`Проверка качества не удалась (${error.message}) — сохраняю черновик без правок`);
    }

    const checked = await finalChecks(ctx, article, {sourceTitle: request.sourceTitle, keyword: request.keyword});
    article = checked.article;

    const id = createArticle({
        ...article,
        slug: article.title,
        related: relatedFromBody(article.body),
        topic: request.topic,
        keyword: request.keyword ?? "",
        notes: request.notes ?? "",
        sourceUrl: input.sourceUrl ?? "",
        sourceTitle: request.sourceTitle ?? "",
        sourceText: request.sourceText ?? "",
        review: withNotes(reviewResult, checked.notes),
    });
    ctx.article(id);
    ctx.step("Черновик сохранён — его уже можно открыть. Дальше проверка уникальности");

    await ensureUnique(ctx, id);
};

const improve = async (ctx: JobContext, articleId: number) => {
    const article = getArticle(articleId);
    if (!article) throw new AiError("Статья не найдена");
    ctx.article(articleId);
    const {article: revised, review: result} = await review(ctx, toGenerated(article), requestOf(article));
    ctx.step(`Оценка редактора: ${result.score}/100${result.revised ? ", исправления внесены" : ""}`);
    const checked = await finalChecks(ctx, revised, {sourceTitle: article.sourceTitle, keyword: article.keyword});
    updateArticle(articleId, {
        ...checked.article,
        related: result.revised ? relatedFromBody(checked.article.body) : article.related,
        review: withNotes(result, checked.notes),
    });
    await ensureUnique(ctx, articleId);
};

const run = async (id: number, kind: JobKind, input: JobInput) => {
    const ctx = new JobContext(id);
    running.add(id);
    try {
        if (kind === "generate") await generate(ctx, input);
        else if (kind === "review") await improve(ctx, input.articleId!);
        else {
            ctx.article(input.articleId!);
            await ensureUnique(ctx, input.articleId!);
        }
        const job = getJob(id);
        const article = job?.articleId ? getArticle(job.articleId) : null;
        if (article?.status === "published") ctx.article(article.id, article.slug);
        ctx.finish("done");
    } catch (error) {
        const known = error instanceof AiError || error instanceof SourcePageError || error instanceof TextRuError;
        if (!known) console.error("[jobs]", error);
        ctx.finish("error", known ? (error as Error).message : "Внутренняя ошибка, подробности в логе сервера");
    } finally {
        running.delete(id);
    }
};

export class JobError extends Error {}

export const startJob = (kind: JobKind, input: JobInput): number => {
    if (running.size >= MAX_RUNNING) {
        throw new JobError("Уже идут две задачи — дождитесь, пока одна закончится");
    }
    if (input.articleId) {
        const busy = getDb()
            .prepare("SELECT id FROM jobs WHERE status = 'running' AND article_id = ? ORDER BY id DESC LIMIT 1")
            .get(input.articleId) as {id: number} | undefined;
        if (busy && getJob(busy.id)?.status === "running") throw new JobError("Эта статья уже обрабатывается");
    }
    const now = Date.now();
    const result = getDb()
        .prepare(
            `INSERT INTO jobs (kind, status, input, step, article_id, created_at, updated_at)
             VALUES (?, 'running', ?, 'В очереди', ?, ?, ?)`,
        )
        .run(kind, JSON.stringify({...input, sourceText: input.sourceText ? "(текст вставлен вручную)" : undefined}), input.articleId ?? null, now, now);
    const id = Number(result.lastInsertRowid);
    void run(id, kind, input);
    return id;
};
