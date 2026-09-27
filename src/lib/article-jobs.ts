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
import {createArticle, getArticle, updateArticle, type ArticleRecord, type ArticleUniqueness} from "./articles";
import {getConfigNumber} from "./config";
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
    type TextRuResult,
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
});

/** Второй проход: нейросеть-редактор оценивает черновик и исправляет его */
const review = async (ctx: JobContext, draft: GeneratedArticle, request: ArticleRequest) => {
    const extra: string[] = [];
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

/**
 * Доводка уникальности. Сначала бесплатное сравнение с текстом конкурента —
 * его совпадения переписываются без обращения к text.ru. Потом text.ru;
 * если процент ниже порога, переписываются куски с найденными фразами и
 * проверка повторяется.
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

        let textru: TextRuResult | null = null;
        let textruError: string | undefined;
        if (textruConfigured()) {
            ctx.step("Проверяю уникальность в text.ru — обычно это занимает 1–10 минут");
            try {
                textru = await checkTextRu(articleTextForCheck(article), () => ctx.preview(""));
                ctx.step(`text.ru: уникальность ${textru.percent}% (нужно не меньше ${min}%)`);
            } catch (error) {
                if (!(error instanceof TextRuError)) throw error;
                textruError = error.message;
                ctx.step(error.message);
            }
        } else {
            textruError = "text.ru не подключён — проверено только сравнение с исходником";
        }

        const sourceOk = !source || source.chunks.length === 0;
        const textruOk = textru ? textru.percent >= min : !textruConfigured();
        const report: ArticleUniqueness = {
            at: Date.now(),
            textru: textru ? {percent: textru.percent, urls: textru.urls} : null,
            ...(textruError ? {textruError} : {}),
            source: source ? {percent: source.percent, fragments: source.chunks.length} : null,
            rounds,
            passed: sourceOk && textruOk,
        };
        updateArticle(articleId, {uniqueness: report});

        if (report.passed || !textru || rounds >= maxRounds) return report;

        const targets = chunksWithPhrases(article.body, textru.phrases);
        if (!targets.length) {
            ctx.step("text.ru не показал, какие именно фразы совпали, — переписывать нечего, решение за вами");
            return report;
        }
        rounds += 1;
        ctx.step(`Переписываю ${targets.length} фрагм. с совпадениями, круг ${rounds} из ${maxRounds}`);
        const result = await rewriteChunks(article.body, targets, {title: article.title, phrases: textru.phrases}, ctx.preview);
        updateArticle(articleId, {body: result.body});
    }
};

const generate = async (ctx: JobContext, input: JobInput) => {
    const request: ArticleRequest = {...input};

    if (input.sourceUrl && !input.sourceText) {
        ctx.step(`Загружаю статью конкурента: ${input.sourceUrl}`);
        const source = await fetchSourceArticle(input.sourceUrl);
        request.sourceText = source.text;
        if (!request.topic) request.topic = source.title;
        ctx.step(`Статья конкурента загружена: «${source.title}», ${source.text.length.toLocaleString("ru-RU")} знаков`);
    }
    if (!request.topic) request.topic = request.sourceText?.split("\n").find((line) => line.trim())?.slice(0, 200) ?? "";

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
    let reviewResult = null;
    try {
        const reviewed = await review(ctx, draft, request);
        article = reviewed.article;
        reviewResult = reviewed.review;
        ctx.step(`Оценка редактора: ${reviewed.review.score}/100${reviewed.review.revised ? ", исправления внесены" : ""}`);
    } catch (error) {
        if (!(error instanceof AiError)) throw error;
        ctx.step(`Проверка качества не удалась (${error.message}) — сохраняю черновик без правок`);
    }

    const id = createArticle({
        ...article,
        slug: article.title,
        related: relatedFromBody(article.body),
        topic: request.topic,
        keyword: request.keyword ?? "",
        notes: request.notes ?? "",
        sourceUrl: input.sourceUrl ?? "",
        sourceText: request.sourceText ?? "",
        review: reviewResult,
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
    updateArticle(articleId, {
        ...revised,
        related: result.revised ? relatedFromBody(revised.body) : article.related,
        review: result,
    });
    ctx.step(`Оценка редактора: ${result.score}/100${result.revised ? ", исправления внесены" : ""}`);
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
