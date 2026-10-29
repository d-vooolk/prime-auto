import {getDb, getSetting, setSetting} from "./db";
import {AiError, aiConfigured, completeWithSources} from "./ai";
import {minskDay} from "./stats";
import {AI_BOTS, AI_REFERRER} from "./ai-seo-shared.mjs";

/**
 * AI-SEO: насколько сайт виден в ответах нейросетей. Три слоя:
 *
 * 1. Ответы — главный показатель. Набор запросов раз в месяц: назван ли
 *    Prime Auto, есть ли ссылка, на кого ссылаются вместо нас. Perplexity,
 *    ChatGPT и Gemini проверяются автоматически через OpenRouter (модель +
 *    поиск в интернете — близко к тому, что видит человек, но не то же самое:
 *    у приложений свои настройки и память). Яндекс Нейро, Алиса и Google AI
 *    Overviews API не дают — их вносим руками.
 * 2. Объективные сигналы: переходы из нейросетей (свой счётчик) и заходы
 *    ИИ-ботов по логам nginx (scripts/ai-seo-collect.mjs).
 * 3. Вопросные запросы в Search Console и Вебмастере: на них поиск всё чаще
 *    отвечает сам, и показы без кликов — признак нейроответа.
 */

/* ------------------------------------------------------------------ */
/* Набор запросов и системы                                            */
/* ------------------------------------------------------------------ */

export type QueryGroup = "commercial" | "info" | "brand";

export const AI_QUERIES: {query: string; group: QueryGroup}[] = [
    {query: "ремонт фар минск", group: "commercial"},
    {query: "где отремонтировать фары в минске", group: "commercial"},
    {query: "замена стекла фары минск", group: "commercial"},
    {query: "установка bi-led линз минск цена", group: "commercial"},
    {query: "полировка фар минск цена", group: "commercial"},
    {query: "регулировка фар минск", group: "commercial"},
    {query: "запотевает фара что делать минск", group: "commercial"},
    {query: "ремонт led фар и дхо минск", group: "commercial"},
    {query: "ретрофит фар минск", group: "commercial"},
    {query: "оклейка фар защитной плёнкой минск", group: "commercial"},
    {query: "лучшая мастерская по ремонту фар в минске", group: "commercial"},
    {query: "автосвет минск", group: "commercial"},
    {query: "почему запотевает фара изнутри", group: "info"},
    {query: "можно ли пройти техосмотр с би лед линзами в беларуси", group: "info"},
    {query: "сколько стоит ремонт фары в минске", group: "info"},
    {query: "сколько стоит установка би лед линз в минске", group: "info"},
    {query: "что выгоднее: ремонт фары или новая фара", group: "info"},
    {query: "сколько держится полировка фар", group: "info"},
    {query: "почему одна фара светит тусклее другой", group: "info"},
    {query: "как проверить фару на герметичность", group: "info"},
    {query: "можно ли ставить led лампы в галогеновые фары в беларуси", group: "info"},
    {query: "что такое ретрофит фар", group: "info"},
    {query: "prime auto минск отзывы", group: "brand"},
    {query: "prime-auto.by", group: "brand"},
    {query: "первый автосвет минск", group: "brand"},
];

export const GROUP_LABELS: Record<QueryGroup, string> = {commercial: "Коммерческие", info: "Информационные", brand: "Брендовые"};

export interface AiEngine {
    id: string;
    label: string;
    /** нет — вносится руками */
    model?: string;
    extra?: Record<string, unknown>;
}

export const AI_ENGINES: AiEngine[] = [
    {id: "perplexity", label: "Perplexity", model: "perplexity/sonar"},
    {id: "chatgpt", label: "ChatGPT (GPT + поиск)", model: "openai/gpt-5.4-mini", extra: {plugins: [{id: "web", max_results: 8}]}},
    {id: "gemini", label: "Gemini (+ поиск)", model: "google/gemini-3.5-flash", extra: {plugins: [{id: "web", max_results: 8}]}},
    {id: "yandex", label: "Яндекс Нейро / Алиса"},
    {id: "google_aio", label: "Google AI Overviews / AI Mode"},
];

export const MANUAL_ENGINES = AI_ENGINES.filter((engine) => !engine.model);

const OUR_NAME = /prime[\s-]?auto|прайм[\s-]?авто|prime-auto\.by/i;
const OUR_HOST = /(^|\.)prime-auto\.by$/i;

const hostOf = (url: string): string => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
};

/* ------------------------------------------------------------------ */
/* Автоматическая проверка ответов                                     */
/* ------------------------------------------------------------------ */

const RUN_KEY = "aiseo_run";

export interface RunState {
    run: string;
    startedAt: number;
    finishedAt: number | null;
    done: number;
    total: number;
    errors: number;
}

export const runState = (): RunState | null => {
    const raw = getSetting(RUN_KEY);
    return raw ? (JSON.parse(raw) as RunState) : null;
};

const SYSTEM = "Отвечай на русском, коротко и по делу. Пользователь находится в Минске, Беларусь.";

const checkOne = async (engine: AiEngine, query: string) => {
    try {
        const {text, sources} = await completeWithSources(SYSTEM, query, "aiseo", {
            models: [engine.model!],
            temperature: 0.2,
            maxTokens: 1500,
            timeout: 120_000,
            extra: engine.extra,
        });
        const ourIndex = sources.findIndex((url) => OUR_HOST.test(hostOf(url)));
        const linked = ourIndex >= 0 || /prime-auto\.by/i.test(text);
        return {
            mentioned: linked || OUR_NAME.test(text),
            linked,
            citedUrl: ourIndex >= 0 ? sources[ourIndex] : "",
            rank: ourIndex >= 0 ? ourIndex + 1 : null,
            sources,
            answer: text.slice(0, 6000),
            error: "",
        };
    } catch (error) {
        return {mentioned: false, linked: false, citedUrl: "", rank: null, sources: [], answer: "",
            error: error instanceof AiError ? error.message : (error as Error).message};
    }
};

const saveCheck = (run: string, engine: string, query: string, r: {
    mentioned: boolean; linked: boolean; citedUrl: string; rank: number | null; sources: string[]; answer: string; error: string;
}, manual = false) => {
    getDb().prepare(
        `INSERT INTO ai_checks (run, ts, engine, query, mentioned, linked, cited_url, rank, sources, answer, error, manual)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(run, engine, query) DO UPDATE SET
            ts = excluded.ts, mentioned = excluded.mentioned, linked = excluded.linked, cited_url = excluded.cited_url,
            rank = excluded.rank, sources = excluded.sources, answer = excluded.answer, error = excluded.error, manual = excluded.manual`,
    ).run(run, Date.now(), engine, query, r.mentioned ? 1 : 0, r.linked ? 1 : 0, r.citedUrl, r.rank,
        JSON.stringify(r.sources), r.answer, r.error, manual ? 1 : 0);
};

/**
 * Прогнать набор по автоматическим системам. Идёт в фоне 1–3 минуты
 * (75 запросов по 4 одновременно), ход виден в runState(). Стоит около
 * $1 за прогон — по счёту OpenRouter.
 */
export const startAnswerCheck = (): {ok: true} | {ok: false; error: string} => {
    if (!aiConfigured()) return {ok: false, error: "Нейросеть не подключена: задайте API-ключ в «Настройках»"};
    const state = runState();
    if (state && !state.finishedAt && Date.now() - state.startedAt < 15 * 60_000) {
        return {ok: false, error: "Проверка уже идёт"};
    }
    const engines = AI_ENGINES.filter((engine) => engine.model);
    const tasks = engines.flatMap((engine) => AI_QUERIES.map(({query}) => ({engine, query})));
    const run = minskDay();
    const progress: RunState = {run, startedAt: Date.now(), finishedAt: null, done: 0, total: tasks.length, errors: 0};
    setSetting(RUN_KEY, JSON.stringify(progress));

    const worker = async () => {
        for (let task = tasks.shift(); task; task = tasks.shift()) {
            const result = await checkOne(task.engine, task.query);
            saveCheck(run, task.engine.id, task.query, result);
            progress.done += 1;
            if (result.error) progress.errors += 1;
            setSetting(RUN_KEY, JSON.stringify(progress));
        }
    };
    void Promise.all(Array.from({length: 4}, worker))
        .catch((error) => console.error("[ai-seo]", error))
        .finally(() => {
            progress.finishedAt = Date.now();
            setSetting(RUN_KEY, JSON.stringify(progress));
        });
    return {ok: true};
};

/** Ручная отметка: 0 — не назван, 1 — назван без ссылки, 2 — назван со ссылкой */
export const saveManualChecks = (run: string, engine: string, marks: Record<string, number>, competitors: string): void => {
    const sources = competitors.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
        .map((s) => (s.includes("://") ? s : `https://${s}`));
    const save = getDb().transaction(() => {
        for (const {query} of AI_QUERIES) {
            const mark = marks[query];
            if (mark === undefined || mark < 0) continue;
            saveCheck(run, engine, query, {
                mentioned: mark >= 1, linked: mark === 2, citedUrl: "", rank: null, sources, answer: "", error: "",
            }, true);
        }
    });
    save();
};

/* ------------------------------------------------------------------ */
/* Отчёт                                                               */
/* ------------------------------------------------------------------ */

export interface CheckRow {
    run: string;
    engine: string;
    query: string;
    mentioned: boolean;
    linked: boolean;
    citedUrl: string;
    rank: number | null;
    sources: string[];
    answer: string;
    error: string;
    manual: boolean;
}

export interface EngineScore {
    engine: string;
    run: string;
    total: number;
    mentioned: number;
    linked: number;
}

export interface BotStat {
    bot: string;
    owner: string;
    kind: string;
    hits28: number;
    hitsAll: number;
    pages28: number;
}

export interface QuestionStats {
    queries: number;
    impressions: number;
    clicks: number;
    top5: number;
    top5Clicks: number;
}

export interface EngineQuestions {
    total: {queries: number; impressions: number; clicks: number};
    questions: QuestionStats;
}

export interface AiSeoReport {
    referrals: {
        firstDay: string | null;
        total: number;
        organic: number;
        byMonth: {month: string; ai: number; organic: number}[];
        byHost: {host: string; n: number}[];
        byPage: {path: string; n: number}[];
        contacts: number;
        recent: {day: string; host: string; path: string}[];
    };
    bots: {
        from: string | null;
        to: string | null;
        list: BotStat[];
        weekly: {week: string; answer: number; search: number; train: number; other: number}[];
        answerPages: {path: string; n: number}[];
        searchPages: {path: string; n: number}[];
    };
    questions: {
        day: string;
        google: EngineQuestions | null;
        yandex: EngineQuestions | null;
    }[];
    scores: EngineScore[];
    latest: Map<string, Map<string, CheckRow>>;
    competitors: {host: string; n: number}[];
    run: RunState | null;
}

const isAiEntry = (referrer: string, utm: string, source: string) =>
    source === "ai" || AI_REFERRER.test(referrer) || AI_REFERRER.test(utm.split(" / ")[0] ?? "");

export const aiSeoReport = (): AiSeoReport => {
    const db = getDb();
    const all = <T>(sql: string, ...args: unknown[]) => db.prepare(sql).all(...args) as T[];

    /* переходы из нейросетей — за всё время счётчика */
    const entries = all<{day: string; path: string; visitor: string; source: string; referrer: string; utm: string}>(
        "SELECT day, path, visitor, source, referrer, utm FROM page_views WHERE entry = 1 ORDER BY ts");
    const ai = entries.filter((e) => isAiEntry(e.referrer, e.utm, e.source));
    const months = new Map<string, {ai: number; organic: number}>();
    for (const e of entries) {
        const month = e.day.slice(0, 7);
        const m = months.get(month) ?? {ai: 0, organic: 0};
        if (isAiEntry(e.referrer, e.utm, e.source)) m.ai += 1;
        else if (e.source === "yandex" || e.source === "google") m.organic += 1;
        months.set(month, m);
    }
    const count = <K>(list: K[]) => {
        const map = new Map<K, number>();
        for (const item of list) map.set(item, (map.get(item) ?? 0) + 1);
        return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };
    const aiVisitors = new Set(ai.map((e) => e.visitor));
    const contacts = aiVisitors.size
        ? (all<{visitor: string}>(
            "SELECT visitor FROM conversions WHERE type IN ('lead','phone','telegram','viber','whatsapp')")
            .filter((c) => aiVisitors.has(c.visitor)).length)
        : 0;

    /* ИИ-боты */
    const range = db.prepare("SELECT MIN(day) a, MAX(day) b FROM ai_bot_hits").get() as {a: string | null; b: string | null};
    const since28 = range.b ? minskDay(Date.parse(`${range.b}T12:00:00Z`) - 27 * 86400000) : "";
    const byBot = new Map(all<{bot: string; all: number; recent: number; pages: number}>(
        `SELECT bot, SUM(hits) "all", SUM(CASE WHEN day >= ? THEN hits ELSE 0 END) recent,
                COUNT(DISTINCT CASE WHEN day >= ? AND path NOT IN ('/robots.txt', '/sitemap.xml') THEN path END) pages
           FROM ai_bot_hits WHERE bot != '-' GROUP BY bot`, since28, since28).map((r) => [r.bot, r]));
    const kindOf = new Map<string, string>(AI_BOTS.map((b) => [b.id, b.kind]));
    const weeks = new Map<string, {answer: number; search: number; train: number; other: number}>();
    for (const r of all<{day: string; bot: string; hits: number}>("SELECT day, bot, SUM(hits) hits FROM ai_bot_hits GROUP BY day, bot")) {
        const date = new Date(`${r.day}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
        const week = date.toISOString().slice(0, 10);
        const w = weeks.get(week) ?? {answer: 0, search: 0, train: 0, other: 0};
        const kind = kindOf.get(r.bot) as keyof typeof w | undefined;
        if (kind) w[kind] += r.hits;
        weeks.set(week, w);
    }
    const pagesFor = (kind: string) => {
        const bots = AI_BOTS.filter((b) => b.kind === kind && b.id !== "bingbot").map((b) => `'${b.id}'`).join(",");
        return all<{path: string; n: number}>(
            `SELECT path, SUM(hits) n FROM ai_bot_hits WHERE bot IN (${bots}) AND path NOT IN ('/robots.txt', '/sitemap.xml')
              GROUP BY path ORDER BY n DESC LIMIT 15`);
    };

    /* проверки ответов */
    const checks = all<{run: string; engine: string; query: string; mentioned: number; linked: number; cited_url: string;
        rank: number | null; sources: string; answer: string; error: string; manual: number}>(
        "SELECT run, engine, query, mentioned, linked, cited_url, rank, sources, answer, error, manual FROM ai_checks ORDER BY run");
    const queries = new Set(AI_QUERIES.map((q) => q.query));
    const scoreMap = new Map<string, EngineScore>();
    const latest = new Map<string, Map<string, CheckRow>>();
    for (const c of checks) {
        if (!queries.has(c.query)) continue;
        const row: CheckRow = {
            run: c.run, engine: c.engine, query: c.query, mentioned: !!c.mentioned, linked: !!c.linked, citedUrl: c.cited_url,
            rank: c.rank, sources: JSON.parse(c.sources), answer: c.answer, error: c.error, manual: !!c.manual,
        };
        const key = `${c.run}|${c.engine}`;
        const score = scoreMap.get(key) ?? {engine: c.engine, run: c.run, total: 0, mentioned: 0, linked: 0};
        if (!c.error) {
            score.total += 1;
            score.mentioned += c.mentioned;
            score.linked += c.linked;
        }
        scoreMap.set(key, score);
        const byQuery = latest.get(c.engine) ?? new Map<string, CheckRow>();
        byQuery.set(c.query, row);
        latest.set(c.engine, byQuery);
    }
    const competitors = count([...latest.values()].flatMap((m) => [...m.values()])
        .flatMap((r) => [...new Set(r.sources.map(hostOf))])
        .filter((host) => host && !OUR_HOST.test(host)))
        .slice(0, 20)
        .map(([host, n]) => ({host, n}));

    return {
        referrals: {
            firstDay: entries[0]?.day ?? null,
            total: ai.length,
            organic: entries.filter((e) => (e.source === "yandex" || e.source === "google") && !isAiEntry(e.referrer, e.utm, e.source)).length,
            byMonth: [...months.entries()].map(([month, m]) => ({month, ...m})),
            byHost: count(ai.map((e) => e.referrer || e.utm.split(" / ")[0])).map(([host, n]) => ({host, n})),
            byPage: count(ai.map((e) => e.path)).slice(0, 15).map(([path, n]) => ({path, n})),
            contacts,
            recent: ai.slice(-15).reverse().map((e) => ({day: e.day, host: e.referrer || e.utm, path: e.path})),
        },
        bots: {
            from: range.a,
            to: range.b,
            list: AI_BOTS.map((b) => ({
                bot: b.id, owner: b.owner, kind: b.kind,
                hits28: byBot.get(b.id)?.recent ?? 0, hitsAll: byBot.get(b.id)?.all ?? 0, pages28: byBot.get(b.id)?.pages ?? 0,
            })),
            weekly: [...weeks.entries()].sort().map(([week, w]) => ({week, ...w})),
            answerPages: pagesFor("answer"),
            searchPages: pagesFor("search"),
        },
        questions: all<{day: string; data: string}>("SELECT day, data FROM ai_daily ORDER BY day").map((r) => ({day: r.day, ...JSON.parse(r.data)})),
        scores: [...scoreMap.values()],
        latest,
        competitors,
        run: runState(),
    };
};

/* ------------------------------------------------------------------ */
/* Готовность сайта — правится в коде по мере выполнения               */
/* ------------------------------------------------------------------ */

export type ReadyStatus = "done" | "partial" | "todo";

export const READINESS: {item: string; status: ReadyStatus; who: string; note?: string}[] = [
    {item: "robots.txt открыт ИИ-ботам (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended)", status: "done", who: "Claude"},
    {item: "ИИ-боты получают 200, без капчи и блокировок", status: "done", who: "Claude", note: "проверено 29.10.2026: все 96 адресов sitemap с user-agent ChatGPT-User"},
    {item: "Текст страниц есть в HTML без JavaScript (боты нейросетей JS не выполняют)", status: "done", who: "Claude"},
    {item: "Микроразметка: AutoRepair, Service/Offer с ценами, FAQPage, Article, BreadcrumbList", status: "done", who: "Claude"},
    {item: "Первый экран услуг: цена «от», срок, гарантия — короткий самодостаточный ответ", status: "done", who: "Claude"},
    {item: "Блок «Коротко» (ответ в 2–3 предложения) в начале статей и FAQ с цифрами", status: "todo", who: "Claude"},
    {item: "llms.txt — краткая карта сайта для нейросетей", status: "todo", who: "Claude", note: "сейчас 404"},
    {item: "Свой лог nginx у сайта (сейчас общий с crm/zapis — главная у ботов может быть завышена)", status: "todo", who: "Claude"},
    {item: "Bing Webmaster Tools: сайт подтверждён, sitemap отправлен (индекс Bing = ChatGPT и Copilot)", status: "todo", who: "вы"},
    {item: "Одинаковые название, адрес, телефон, цены: Яндекс Карты, Google, 2ГИС, onlix, каталоги", status: "partial", who: "вы"},
    {item: "Упоминания на сторонних площадках: onliner, drive2, форумы, подборки «где сделать фары»", status: "todo", who: "вы"},
    {item: "Отзывы с подробностями (марка, услуга, цена) на Яндекс Картах и в Google", status: "partial", who: "вы"},
];
