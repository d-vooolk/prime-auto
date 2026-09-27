import {getSetting, setSetting} from "./db";
import {env} from "./env.mjs";

/**
 * Настройки нейросети и проверок, которые правятся в админке.
 *
 * Порядок поиска значения: настройки админки → .env → значение по умолчанию.
 * .env остаётся запасным вариантом: если поле в админке очистить, снова
 * действует то, что задано на сервере. Значения читаются из базы на каждый
 * запрос — это микросекунды, зато правка действует сразу, без перезапуска.
 */

export type ConfigName =
    | "AI_API_KEY"
    | "AI_BASE_URL"
    | "AI_MODEL"
    | "AI_ARTICLE_MODEL"
    | "AI_PROXY"
    | "AI_TEMPERATURE"
    | "AI_REVIEW_TEMPERATURE"
    | "AI_TIMEOUT_MS"
    | "AI_ARTICLE_TIMEOUT_MS"
    | "AI_ARTICLE_MAX_TOKENS"
    | "TEXTRU_API_KEY"
    | "TEXTRU_MIN_UNIQUE"
    | "UNIQUE_MAX_ROUNDS"
    | "NGINX_CACHE_DIR";

export interface ConfigField {
    name: ConfigName;
    label: string;
    hint: string;
    type: "secret" | "text" | "number";
    group: "ai" | "unique" | "site";
    fallback: string;
    min?: number;
    max?: number;
}

export const CONFIG_FIELDS: ConfigField[] = [
    {
        name: "AI_API_KEY", group: "ai", type: "secret", fallback: "",
        label: "API-ключ нейросети",
        hint: "Ключ OpenRouter (sk-or-v1-…) — тот же, что в админке vdf.by. Без него генерация выключена.",
    },
    {
        name: "AI_BASE_URL", group: "ai", type: "text", fallback: "https://openrouter.ai/api/v1",
        label: "Адрес API",
        hint: "Любой OpenAI-совместимый API. Для OpenRouter оставьте как есть.",
    },
    {
        name: "AI_MODEL", group: "ai", type: "text", fallback: "deepseek/deepseek-v4.1-flash,deepseek/deepseek-v4-flash",
        label: "Модели",
        hint: "Через запятую. OpenRouter пробует их по очереди: если первая недоступна, отвечает следующая.",
    },
    {
        name: "AI_ARTICLE_MODEL", group: "ai", type: "text", fallback: "",
        label: "Модели для статей",
        hint: "Необязательно. Если задать, статьи, редактура и рерайт пойдут через эти модели, а разбор страниц — через основные.",
    },
    {
        name: "AI_PROXY", group: "ai", type: "text", fallback: "",
        label: "Прокси",
        hint: "OpenRouter не принимает российские адреса. На сервере работает тот же прокси, что у vdf.by: http://127.0.0.1:25345",
    },
    {
        name: "AI_TEMPERATURE", group: "ai", type: "number", fallback: "0.7", min: 0, max: 2,
        label: "Температура при написании",
        hint: "0–2. Выше — живее и разнообразнее текст, но больше риск фантазий. Обычно 0.6–0.8.",
    },
    {
        name: "AI_REVIEW_TEMPERATURE", group: "ai", type: "number", fallback: "0.4", min: 0, max: 2,
        label: "Температура при проверке",
        hint: "Для редактора ниже, чем для автора: он должен исправлять, а не сочинять заново.",
    },
    {
        name: "AI_ARTICLE_MAX_TOKENS", group: "ai", type: "number", fallback: "24000", min: 1000, max: 200000,
        label: "Лимит токенов на ответ",
        hint: "Статья на 12 000 знаков — это примерно 6–8 тысяч токенов. Запас нужен, чтобы ответ не обрывался.",
    },
    {
        name: "AI_ARTICLE_TIMEOUT_MS", group: "ai", type: "number", fallback: "420000", min: 30000, max: 1800000,
        label: "Таймаут длинных ответов, мс",
        hint: "Сколько ждать статью или редактуру целиком. 420000 — семь минут.",
    },
    {
        name: "AI_TIMEOUT_MS", group: "ai", type: "number", fallback: "90000", min: 5000, max: 600000,
        label: "Таймаут коротких ответов, мс",
        hint: "Разбор страницы конкурента и проверка связи.",
    },
    {
        name: "TEXTRU_API_KEY", group: "unique", type: "secret", fallback: "",
        label: "API-ключ text.ru",
        hint: "Проверка по всему интернету. API text.ru платный: статья на 10 000 знаков — около 20–40 ₽ за проверку (пакеты от 400 ₽). Без ключа статья сравнивается только с текстом конкурента.",
    },
    {
        name: "TEXTRU_MIN_UNIQUE", group: "unique", type: "number", fallback: "100", min: 50, max: 100,
        label: "Порог уникальности, %",
        hint: "Ниже порога совпавшие абзацы переписываются и проверка повторяется.",
    },
    {
        name: "UNIQUE_MAX_ROUNDS", group: "unique", type: "number", fallback: "2", min: 0, max: 5,
        label: "Кругов переписывания",
        hint: "Каждый круг — ещё одна платная проверка в text.ru. После последнего статья остаётся черновиком с отчётом.",
    },
    {
        name: "NGINX_CACHE_DIR", group: "site", type: "text", fallback: "",
        label: "Каталог кеша nginx",
        hint: "Например /var/cache/nginx. Очищается после публикации, чтобы новая статья появлялась сразу. Пусто — не трогать.",
    },
];

const FIELDS = new Map(CONFIG_FIELDS.map((field) => [field.name, field]));
const key = (name: ConfigName) => `cfg:${name}`;

export const getConfig = (name: ConfigName): string =>
    getSetting(key(name))?.trim() || env(name, FIELDS.get(name)!.fallback);

export const getConfigNumber = (name: ConfigName): number => {
    const value = Number(getConfig(name));
    return Number.isFinite(value) ? value : Number(FIELDS.get(name)!.fallback);
};

/** Значение, сохранённое именно в админке (без .env и умолчаний) */
export const adminConfigValue = (name: ConfigName): string => getSetting(key(name))?.trim() ?? "";

/** Что действует, если в админке пусто */
export const fallbackConfigValue = (name: ConfigName): string => env(name, FIELDS.get(name)!.fallback);

export type ConfigSource = "admin" | "env" | "default";

export const configSource = (name: ConfigName): ConfigSource =>
    getSetting(key(name))?.trim() ? "admin" : env(name, "") ? "env" : "default";

/** Ключ целиком в браузер не уходит — только хвост, чтобы узнать его */
export const maskSecret = (value: string): string =>
    value ? `${"•".repeat(8)}${value.slice(-4)}` : "";

export interface ConfigUpdate {
    name: ConfigName;
    value: string;
    /** Для ключей: пустое поле значит «не менять», очистка — отдельным флагом */
    clear?: boolean;
}

/** Сохраняет изменения. Возвращает ошибку по первому неверному полю или null */
export const saveConfig = (updates: ConfigUpdate[]): string | null => {
    const prepared: [ConfigName, string | null][] = [];
    for (const update of updates) {
        const field = FIELDS.get(update.name);
        if (!field) continue;
        const value = update.value.trim();

        if (field.type === "secret") {
            if (update.clear) prepared.push([field.name, null]);
            else if (value) prepared.push([field.name, value]);
            continue;
        }
        if (!value) {
            prepared.push([field.name, null]);
            continue;
        }
        if (field.type === "number") {
            const number = Number(value.replace(",", "."));
            if (!Number.isFinite(number) || number < (field.min ?? -Infinity) || number > (field.max ?? Infinity)) {
                return `«${field.label}»: нужно число от ${field.min} до ${field.max}`;
            }
            prepared.push([field.name, String(number)]);
            continue;
        }
        if (field.name === "AI_BASE_URL" || field.name === "AI_PROXY") {
            try {
                const url = new URL(value);
                if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
            } catch {
                return `«${field.label}»: нужен адрес вида http://… или https://…`;
            }
        }
        prepared.push([field.name, value.slice(0, 2000)]);
    }
    for (const [name, value] of prepared) setSetting(key(name), value);
    return null;
};
