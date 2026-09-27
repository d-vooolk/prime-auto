import {completeStreaming, longAiOptions} from "./ai";
import {getConfig, getConfigNumber} from "./config";
import {articlePlainText, bodyChunks, IMAGE_LINE, inlineText} from "./article-body";
import {markerPattern, sanitizeArticleBody} from "./article-ai";
import {SHINGLE, shingles, words} from "./shingles";

/**
 * Уникальность текста.
 *
 * Нейросеть сама не знает, есть ли её фразы в интернете, поэтому «напиши
 * уникально» в промпте — пожелание, а не проверка. Проверяем снаружи, двумя
 * способами:
 *
 * 1. Против текста конкурента — локально, по шинглам (цепочкам из пяти слов
 *    подряд). Бесплатно, мгновенно и ловит главный риск рерайта: дословно
 *    перенесённые куски исходника.
 * 2. Против всего интернета — через API text.ru, если в настройках задан ключ.
 *    Та же проверка, по которой уникальность оценивают копирайтеры и биржи.
 *
 * Неуникальные куски не переписываются всей статьёй заново — только они сами,
 * остальной текст остаётся как был. Кругов переписывания не больше
 * заданного в настройках: если после них процент всё ещё ниже порога, статья
 * остаётся черновиком с отчётом, а решение за человеком.
 */

export const uniqueMin = (): number => getConfigNumber("TEXTRU_MIN_UNIQUE");
export const uniqueRounds = (): number => getConfigNumber("UNIQUE_MAX_ROUNDS");
export const textruConfigured = (): boolean => Boolean(getConfig("TEXTRU_API_KEY"));

const chunkText = (chunk: string): string => articlePlainText(chunk) || inlineText(chunk);

/** Куски тела статьи с номерами; пустые и служебные пропускаются */
const numberedChunks = (body: string) =>
    bodyChunks(body).map((chunk, index) => ({index, chunk, text: chunkText(chunk)}));

export interface SourceMatch {
    /** Доля шинглов статьи, найденных в исходнике, % */
    percent: number;
    /** Номера кусков тела, в которых есть дословные совпадения */
    chunks: number[];
}

/**
 * Дословные совпадения с исходником. Кусок считается заимствованным, если в
 * нём есть хотя бы две цепочки из пяти слов подряд из исходника — одна может
 * совпасть случайно («установка bi led модулей в фары»), две уже нет.
 */
export const compareWithSource = (body: string, source: string): SourceMatch => {
    const sourceSet = new Set(shingles(source));
    let total = 0;
    let matched = 0;
    const chunks: number[] = [];

    for (const {index, text} of numberedChunks(body)) {
        const own = shingles(text);
        const hits = own.filter((shingle) => sourceSet.has(shingle)).length;
        total += own.length;
        matched += hits;
        if (hits >= 2) chunks.push(index);
    }
    return {percent: total ? Math.round((matched / total) * 1000) / 10 : 0, chunks};
};

/* ------------------------------------------------------------------ */
/* text.ru                                                             */
/* ------------------------------------------------------------------ */

const TEXTRU_URL = "https://api.text.ru/post";
const TEXTRU_NOT_READY = 181;
const TEXTRU_POLL_MS = 15000;
const TEXTRU_WAIT_MS = 12 * 60 * 1000;

export class TextRuError extends Error {}

export interface TextRuResult {
    percent: number;
    urls: {url: string; percent: number}[];
    /** Фразы из статьи, найденные в интернете */
    phrases: string[];
}

interface TextRuAnswer {
    text_uid?: string;
    text_unique?: string | number;
    result_json?: string;
    error_code?: number;
    error_desc?: string;
}

const textRuPost = async (params: Record<string, string>): Promise<TextRuAnswer> => {
    let response: Response;
    try {
        response = await fetch(TEXTRU_URL, {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({userkey: getConfig("TEXTRU_API_KEY"), ...params}),
            signal: AbortSignal.timeout(30000),
        });
    } catch (error) {
        throw new TextRuError(`text.ru не ответил: ${(error as Error).message}`);
    }
    if (!response.ok) throw new TextRuError(`text.ru ответил ошибкой ${response.status}`);
    return (await response.json().catch(() => ({}))) as TextRuAnswer;
};

/**
 * Номера слов, найденных на чужом сайте, приходят как позиции в clear_text.
 * Склеиваем соседние позиции в фразы: по ним потом ищем куски статьи.
 */
const matchedPhrases = (clearText: string, positions: number[]): string[] => {
    const list = clearText.split(/\s+/).filter(Boolean);
    const sorted = [...new Set(positions)].filter((n) => n >= 0 && n < list.length).sort((a, b) => a - b);
    const phrases: string[] = [];
    let run: number[] = [];
    const flush = () => {
        if (run.length >= SHINGLE) phrases.push(run.map((n) => list[n]).join(" "));
        run = [];
    };
    for (const position of sorted) {
        if (run.length && position !== run[run.length - 1] + 1) flush();
        run.push(position);
    }
    flush();
    return phrases;
};

const positionsOf = (value: unknown): number[] => {
    if (Array.isArray(value)) return value.map(Number).filter(Number.isInteger);
    if (typeof value === "string") return value.split(/[\s,]+/).map(Number).filter(Number.isInteger);
    return [];
};

/**
 * Проверка текста в text.ru. Сервис проверяет не сразу: сначала отдаёт
 * номер задания, результат готов через одну–десять минут.
 *
 * copying=noadd — не добавлять наш текст в базу text.ru. Иначе повторная
 * проверка той же статьи (после правки) нашла бы её саму и показала 0%.
 */
export const checkTextRu = async (text: string, onWait: () => void): Promise<TextRuResult> => {
    if (!textruConfigured()) throw new TextRuError("text.ru не подключён: задайте его ключ в настройках админки");

    const started = await textRuPost({text, copying: "noadd", exceptdomain: "prime-auto.by"});
    if (!started.text_uid) {
        throw new TextRuError(`text.ru не принял текст: ${started.error_desc ?? `код ${started.error_code ?? "?"}`}`);
    }

    const deadline = Date.now() + TEXTRU_WAIT_MS;
    while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, TEXTRU_POLL_MS));
        onWait();
        const answer = await textRuPost({uid: started.text_uid, jsonvisible: "detail"});
        if (answer.error_code === TEXTRU_NOT_READY) continue;
        if (answer.error_code) throw new TextRuError(`text.ru: ${answer.error_desc ?? `код ${answer.error_code}`}`);

        let details: {unique?: number; urls?: {url?: string; plagiat?: number; words?: unknown}[]; clear_text?: string} = {};
        try {
            details = answer.result_json ? JSON.parse(answer.result_json) : {};
        } catch {
            details = {};
        }
        const percent = Number(answer.text_unique ?? details.unique ?? NaN);
        if (!Number.isFinite(percent)) throw new TextRuError("text.ru вернул ответ без процента уникальности");

        const urls = (details.urls ?? [])
            .filter((item) => item.url)
            .map((item) => ({url: String(item.url), percent: Number(item.plagiat) || 0}))
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 10);
        const positions = (details.urls ?? []).flatMap((item) => positionsOf(item.words));
        return {percent, urls, phrases: matchedPhrases(details.clear_text ?? text, positions)};
    }
    throw new TextRuError("text.ru не успел проверить текст за 12 минут — запустите проверку ещё раз позже");
};

/** Куски тела, в которых встречается хотя бы одна фраза, найденная text.ru */
export const chunksWithPhrases = (body: string, phrases: string[]): number[] => {
    const needles = phrases.map((phrase) => words(phrase).join(" ")).filter((phrase) => phrase.split(" ").length >= SHINGLE);
    if (!needles.length) return [];
    return numberedChunks(body)
        .filter(({text}) => {
            const haystack = words(text).join(" ");
            return needles.some((needle) => haystack.includes(needle));
        })
        .map(({index}) => index);
};

/** Текст для проверки: всё, что видит читатель и поисковик */
export const articleTextForCheck = (article: {title: string; excerpt: string; body: string; faq: {q: string; a: string}[]}) =>
    [article.title, article.excerpt, articlePlainText(article.body), ...article.faq.flatMap((item) => [item.q, item.a])]
        .filter(Boolean)
        .join("\n\n");

/* ------------------------------------------------------------------ */
/* Переписывание неуникальных кусков                                   */
/* ------------------------------------------------------------------ */

const REWRITE_PROMPT = `Ты — редактор блога мастерской по ремонту автомобильных фар. Тебе дают пронумерованные фрагменты статьи, которые проверка уникальности нашла в чужих текстах. Перепиши каждый фрагмент полностью своими словами.

Требования:
- Смысл, факты и полезность сохрани, объём — примерно тот же.
- Измени построение фраз, порядок изложения и формулировки так, чтобы ни одна цепочка из четырёх слов подряд не совпадала с исходным фрагментом и с найденными совпадениями. Общепринятые термины («Bi-Led модуль», «светотеневая граница») оставлять можно.
- Разметку сохрани: строки «## » и «### » остаются заголовками, «- » и «1. » — списками, «| … |» — таблицами с тем же числом колонок, «> » — советом, **жирный** и ссылки [текст](адрес) — с теми же адресами.
- Не добавляй вступлений, пояснений и новых фрагментов.

Ответ верни строго в таком виде, для каждого фрагмента по порядку:
===ФРАГМЕНТ 1===
переписанный текст
===ФРАГМЕНТ 2===
переписанный текст`;

/**
 * Переписывает указанные куски тела статьи и возвращает новое тело.
 * Кусок, который модель не вернула или вернула пустым, остаётся как был.
 */
export const rewriteChunks = async (
    body: string,
    indexes: number[],
    context: {title: string; phrases: string[]; source?: string},
    onProgress: (text: string) => void,
): Promise<{body: string; rewritten: number}> => {
    const chunks = bodyChunks(body);
    const targets = [...new Set(indexes)].filter((index) => index < chunks.length).sort((a, b) => a - b);
    if (!targets.length) return {body, rewritten: 0};

    const user = [
        `Статья: ${context.title}`,
        ...(context.phrases.length
            ? ["", "Совпадения, найденные в интернете (их формулировки нельзя повторять):", ...context.phrases.slice(0, 40).map((phrase) => `- ${phrase}`)]
            : []),
        ...(context.source ? ["", "Фрагменты совпадают с текстом конкурента — уйди от его формулировок полностью."] : []),
        "",
        ...targets.flatMap((index, position) => [`===ФРАГМЕНТ ${position + 1}===`, chunks[index]]),
    ].join("\n");

    const answer = await completeStreaming(REWRITE_PROMPT, user, "unique", {...longAiOptions(), temperature: Math.min(2, getConfigNumber("AI_TEMPERATURE") + 0.1)}, onProgress);

    let rewritten = 0;
    targets.forEach((index, position) => {
        const start = answer.search(markerPattern(`ФРАГМЕНТ ${position + 1}`));
        if (start < 0) return;
        const rest = answer.slice(start).replace(/^[^\n]*\n/, "");
        const end = rest.search(/^[\s*#]*=+\s*ФРАГМЕНТ\s+\d+\s*=+/im);
        const text = (end < 0 ? rest : rest.slice(0, end)).trim();
        if (text.length < chunks[index].length * 0.5) return;
        // фото из куска модель могла потерять — возвращаем их отдельными абзацами
        const images = chunks[index].split("\n").filter((line) => IMAGE_LINE.test(line.trim()) && !text.includes(line.trim()));
        chunks[index] = [text, ...images.map((line) => line.trim())].join("\n\n");
        rewritten += 1;
    });
    return {body: sanitizeArticleBody(chunks.join("\n\n"), context.title), rewritten};
};
