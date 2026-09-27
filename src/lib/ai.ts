import {fetch as undiciFetch, ProxyAgent} from "undici";
import {getDb} from "./db";
import {getConfig, getConfigNumber} from "./config";

/**
 * Клиент нейросети — тот же, что в админке vdf.by.
 *
 * Любой OpenAI-совместимый API (по умолчанию OpenRouter) без SDK: один POST
 * на /chat/completions. Ключ, модели, прокси и таймауты правятся в админке
 * (Настройки), запасной вариант — те же переменные .env, что у vdf.by.
 * Список и описания — src/lib/config.ts.
 */

export type AiTask = "article" | "review" | "extract" | "unique" | "check";

export class AiError extends Error {}

interface Usage {
    prompt_tokens?: number;
    completion_tokens?: number;
    cost?: number;
}

interface ResponseMeta {
    model?: string;
    provider?: string;
    usage?: Usage;
    error?: {message?: string; code?: number | string};
}

interface ChatResponse extends ResponseMeta {
    choices?: Array<{message?: {content?: string | null}}>;
}

interface StreamChunk extends ResponseMeta {
    choices?: Array<{delta?: {content?: string | null}}>;
}

interface AiTrace {
    task: AiTask;
    startedAt: number;
    model: string;
    provider: string;
    firstTokenMs: number | null;
    usage: Usage;
}

export interface AiRequestOptions {
    timeout?: number;
    maxTokens?: number;
    models?: string[];
    temperature?: number;
}

const LOG_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

const splitModels = (value: string): string[] =>
    value.split(",").map((model) => model.trim()).filter(Boolean);

export const aiConfigured = (): boolean => Boolean(getConfig("AI_API_KEY"));

export const aiConfig = () => {
    const baseUrl = getConfig("AI_BASE_URL").replace(/\/+$/, "");
    return {
        baseUrl,
        models: splitModels(getConfig("AI_MODEL")),
        isOpenRouter: baseUrl.includes("openrouter.ai"),
        timeout: getConfigNumber("AI_TIMEOUT_MS"),
    };
};

/** Настройки для длинных ответов: статья целиком, редактура, рерайт фрагментов */
export const longAiOptions = (): AiRequestOptions => {
    const models = splitModels(getConfig("AI_ARTICLE_MODEL"));
    return {
        timeout: getConfigNumber("AI_ARTICLE_TIMEOUT_MS"),
        maxTokens: getConfigNumber("AI_ARTICLE_MAX_TOKENS"),
        temperature: getConfigNumber("AI_TEMPERATURE"),
        ...(models.length ? {models} : {}),
    };
};

let proxyAgent: {url: string; agent: ProxyAgent} | null = null;

const aiFetch = (url: string, init: RequestInit): Promise<Response> => {
    const proxyUrl = getConfig("AI_PROXY");
    if (!proxyUrl) return fetch(url, init);
    if (proxyAgent?.url !== proxyUrl) {
        proxyAgent = {url: proxyUrl, agent: new ProxyAgent(proxyUrl)};
    }
    return undiciFetch(url, {
        ...(init as Parameters<typeof undiciFetch>[1]),
        dispatcher: proxyAgent.agent,
    }) as unknown as Promise<Response>;
};

const failure = (status: number, detail: string): AiError => {
    if (status === 429) return new AiError(`Модели сейчас перегружены — попробуйте через минуту (${detail})`);
    if (status === 401) return new AiError("API-ключ нейросети не подошёл — проверьте его в настройках админки");
    if (status === 402) return new AiError(`На счёте OpenRouter закончились деньги — пополните баланс (${detail})`);
    return new AiError(`Нейросеть вернула ошибку: ${detail}`);
};

const startTrace = (task: AiTask): AiTrace =>
    ({task, startedAt: Date.now(), model: "", provider: "", firstTokenMs: null, usage: {}});

const noteMeta = (trace: AiTrace, meta: ResponseMeta) => {
    if (!trace.model && meta.model) trace.model = meta.model;
    if (!trace.provider && meta.provider) trace.provider = meta.provider;
    if (meta.usage) trace.usage = meta.usage;
};

/** Журнал запросов: сколько стоила статья и какая модель её писала */
const record = (trace: AiTrace, error: string | null) => {
    try {
        const db = getDb();
        db.prepare(
            `INSERT INTO ai_requests
                (created_at, task, model, provider, duration_ms, first_token_ms,
                 tokens_in, tokens_out, cost, ok, error)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
            trace.startedAt,
            trace.task,
            trace.model,
            trace.provider,
            Date.now() - trace.startedAt,
            trace.firstTokenMs,
            trace.usage.prompt_tokens ?? null,
            trace.usage.completion_tokens ?? null,
            trace.usage.cost ?? null,
            error === null ? 1 : 0,
            error ?? "",
        );
        db.prepare("DELETE FROM ai_requests WHERE created_at < ?").run(Date.now() - LOG_RETENTION_MS);
    } catch (logError) {
        console.error("[ai] журнал запросов", logError);
    }
};

const request = async (
    system: string,
    user: string,
    stream: boolean,
    options: AiRequestOptions = {},
): Promise<Response> => {
    const key = getConfig("AI_API_KEY");
    if (!key) throw new AiError("Нейросеть не подключена: задайте API-ключ в админке, раздел «Настройки»");

    const config = aiConfig();
    const models = options.models?.length ? options.models : config.models;
    const body: Record<string, unknown> = {
        model: models[0],
        messages: [
            {role: "system", content: system},
            {role: "user", content: user},
        ],
        temperature: options.temperature ?? 0.7,
        stream,
        ...(options.maxTokens ? {max_tokens: options.maxTokens} : {}),
    };
    if (config.isOpenRouter) {
        if (models.length > 1) body.models = models;
        body.reasoning = {enabled: false};
        body.provider = {sort: "throughput"};
        body.usage = {include: true};
    } else if (stream) {
        body.stream_options = {include_usage: true};
    }

    const send = async () => {
        try {
            return await aiFetch(`${config.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${key}`,
                    "Content-Type": "application/json",
                    ...(config.isOpenRouter ? {"HTTP-Referer": "https://prime-auto.by", "X-Title": "Prime Auto admin"} : {}),
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(options.timeout ?? config.timeout),
            });
        } catch (error) {
            const cause = (error as {cause?: Error}).cause?.message;
            throw new AiError(
                (error as Error).name === "TimeoutError"
                    ? "Нейросеть не ответила вовремя — попробуйте ещё раз"
                    : `Не удалось связаться с нейросетью: ${cause ?? (error as Error).message}`,
            );
        }
    };

    let response = await send();
    if (response.status === 429) {
        await response.body?.cancel();
        response = await send();
    }
    if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ChatResponse;
        throw failure(response.status, data.error?.message ?? `HTTP ${response.status}`);
    }
    return response;
};

export const stripThinking = (text: string): string =>
    text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

/** Короткий ответ целиком: разбор страницы, проверка связи */
export const complete = async (
    system: string,
    user: string,
    task: AiTask,
    options: AiRequestOptions = {},
): Promise<string> => {
    const trace = startTrace(task);
    try {
        const response = await request(system, user, false, options);
        const data = (await response.json().catch(() => ({}))) as ChatResponse;
        noteMeta(trace, data);
        if (data.error) throw failure(Number(data.error.code) || 500, data.error.message ?? "неизвестная ошибка");
        const text = data.choices?.[0]?.message?.content?.trim() ?? "";
        if (!text) throw new AiError("Нейросеть вернула пустой ответ — попробуйте ещё раз");
        trace.firstTokenMs = Date.now() - trace.startedAt;
        record(trace, null);
        return stripThinking(text);
    } catch (error) {
        record(trace, (error as Error).message);
        throw error;
    }
};

/**
 * Длинный ответ потоком. onProgress получает накопленный текст — по нему
 * админка показывает, что статья пишется, а не зависла.
 */
export const completeStreaming = async (
    system: string,
    user: string,
    task: AiTask,
    options: AiRequestOptions,
    onProgress: (text: string) => void,
): Promise<string> => {
    const trace = startTrace(task);
    let outcome: string | null = "генерация прервана";
    let answer = "";

    try {
        const response = await request(system, user, true, options);
        if (!response.body) throw new AiError("Нейросеть вернула пустой ответ — попробуйте ещё раз");

        const decoder = new TextDecoder();
        let pending = "";
        let finished = false;

        for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
            pending += decoder.decode(chunk, {stream: true});
            const lines = pending.split("\n");
            pending = lines.pop() ?? "";

            for (const raw of lines) {
                const line = raw.trim();
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (payload === "[DONE]") {
                    finished = true;
                    break;
                }
                let parsed: StreamChunk;
                try {
                    parsed = JSON.parse(payload) as StreamChunk;
                } catch {
                    continue;
                }
                noteMeta(trace, parsed);
                if (parsed.error) {
                    throw failure(Number(parsed.error.code) || 500, parsed.error.message ?? "обрыв генерации");
                }
                const piece = parsed.choices?.[0]?.delta?.content;
                if (piece) {
                    if (!answer) trace.firstTokenMs = Date.now() - trace.startedAt;
                    answer += piece;
                    onProgress(answer);
                }
            }
            if (finished) break;
        }

        if (!answer.trim()) throw new AiError("Нейросеть вернула пустой ответ — попробуйте ещё раз");
        outcome = null;
        return stripThinking(answer);
    } catch (error) {
        outcome = (error as Error).message;
        throw error;
    } finally {
        record(trace, outcome);
    }
};

export const checkConnection = async (): Promise<string> =>
    (await complete("Отвечай одним словом, без точки.", "Столица Беларуси?", "check")).slice(0, 40);

export interface AiUsageSummary {
    requests: number;
    failed: number;
    cost: number;
}

export const aiUsage = (sinceMs: number): AiUsageSummary => {
    const row = getDb()
        .prepare(
            `SELECT COUNT(*) AS requests, SUM(ok = 0) AS failed, COALESCE(SUM(cost), 0) AS cost
               FROM ai_requests WHERE created_at >= ?`,
        )
        .get(Date.now() - sinceMs) as {requests: number; failed: number | null; cost: number};
    return {requests: row.requests, failed: row.failed ?? 0, cost: row.cost};
};
