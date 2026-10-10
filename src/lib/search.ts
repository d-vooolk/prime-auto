import {getDb} from "./db";

/**
 * Вкладка «Поиск»: свежий снимок из search_snapshots (собирает
 * scripts/search-collect.mjs раз в сутки) и расчёты поверх него.
 *
 * Точки роста — запросы на 4–20 месте с заметными показами: страница уже
 * почти в топе, её стоит усилить. Низкий CTR — в топ-5, а кликают редко:
 * переписать title и description. Брендовые запросы («прайм авто») из точек
 * роста убраны — по ним сайт и так первый.
 */

export type Engine = "google" | "yandex";

export interface QueryRow {
    engine: Engine;
    query: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    prevPosition: number | null;
    prevImpressions: number;
    brand: boolean;
}

export interface EngineTotals {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number | null;
    prevClicks: number;
    prevImpressions: number;
    prevPosition: number | null;
}

export interface SearchReport {
    day: string;
    collectedAt: number;
    errors: string[];
    google: EngineTotals | null;
    yandex: EngineTotals | null;
    googleDates: {from: string; to: string} | null;
    yandexDates: {from: string; to: string} | null;
    sqi: number | null;
    inSearch: number | null;
    excluded: number | null;
    googleDaily: {day: string; clicks: number; impressions: number}[];
    yandexDaily: {day: string; clicks: number; impressions: number}[];
    queries: QueryRow[];
    growth: QueryRow[];
    lowCtr: QueryRow[];
    pages: {path: string; clicks: number; impressions: number; position: number; prevClicks: number}[];
    events: {date: string; url: string; title: string; event: string}[];
    problems: {code: string; severity: string}[];
}

const BRAND = /прайм|prime|праим|прайм-авто|primeauto|брилевск/i;

/* сырые ответы API — их форма описана в seo-collect.mjs */
type Raw = any;

const googleRows = (rows: Raw[] = [], prev: Raw[] = []): QueryRow[] => {
    const prevMap = new Map(prev.map((row) => [row.keys[0], row]));
    return rows.map((row) => {
        const before = prevMap.get(row.keys[0]);
        return {
            engine: "google",
            query: row.keys[0],
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            position: row.position,
            prevPosition: before ? before.position : null,
            prevImpressions: before ? before.impressions : 0,
            brand: BRAND.test(row.keys[0]),
        };
    });
};

const yandexRows = (rows: Raw[] = [], prev: Raw[] = []): QueryRow[] => {
    const prevMap = new Map(prev.map((row) => [row.query_text, row.indicators]));
    return rows
        .filter((row) => row.indicators?.TOTAL_SHOWS)
        .map((row) => {
            const ind = row.indicators;
            const before = prevMap.get(row.query_text);
            return {
                engine: "yandex",
                query: row.query_text,
                impressions: ind.TOTAL_SHOWS,
                clicks: ind.TOTAL_CLICKS ?? 0,
                ctr: ind.TOTAL_SHOWS ? (ind.TOTAL_CLICKS ?? 0) / ind.TOTAL_SHOWS : 0,
                position: ind.AVG_SHOW_POSITION,
                prevPosition: before?.TOTAL_SHOWS ? before.AVG_SHOW_POSITION : null,
                prevImpressions: before?.TOTAL_SHOWS ?? 0,
                brand: BRAND.test(row.query_text),
            };
        });
};

const yandexTotals = (rows: QueryRow[], prev: Raw[] = []): EngineTotals => {
    const sum = (list: {impressions: number; clicks: number; position: number}[]) => {
        const impressions = list.reduce((s, r) => s + r.impressions, 0);
        const clicks = list.reduce((s, r) => s + r.clicks, 0);
        const position = impressions ? list.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : null;
        return {impressions, clicks, position};
    };
    const cur = sum(rows);
    const before = sum(prev.filter((r) => r.indicators?.TOTAL_SHOWS).map((r) => ({
        impressions: r.indicators.TOTAL_SHOWS, clicks: r.indicators.TOTAL_CLICKS ?? 0, position: r.indicators.AVG_SHOW_POSITION,
    })));
    return {
        clicks: cur.clicks,
        impressions: cur.impressions,
        ctr: cur.impressions ? cur.clicks / cur.impressions : 0,
        position: cur.position,
        prevClicks: before.clicks,
        prevImpressions: before.impressions,
        prevPosition: before.position,
    };
};

const pathOf = (url: string) => url.replace(/^https?:\/\/(www\.)?prime-auto\.by/, "") || "/";

export const latestSnapshotDay = (): string | null =>
    (getDb().prepare("SELECT day FROM search_snapshots ORDER BY day DESC LIMIT 1").get() as {day: string} | undefined)?.day ?? null;

export const searchReport = (): SearchReport | null => {
    const row = getDb()
        .prepare("SELECT day, collected_at, data FROM search_snapshots ORDER BY day DESC LIMIT 1")
        .get() as {day: string; collected_at: number; data: string} | undefined;
    if (!row) return null;
    const data: Raw = JSON.parse(row.data);
    const g = data.google?.ok ? data.google.data : null;
    const w = data.webmaster?.ok ? data.webmaster.data : null;
    const errors = ["google", "webmaster", "metrika"]
        .filter((key) => data[key] && !data[key].ok)
        .map((key) => `${key}: ${data[key].error ?? "ошибка"}`);

    const gQueries = g ? googleRows(g.queries, g.previousQueries) : [];
    const yQueries = w ? yandexRows(w.queries, w.previousQueries) : [];
    const queries = [...yQueries, ...gQueries].sort((a, b) => b.impressions - a.impressions);

    const prevPages = new Map<string, number>((g?.previousPages ?? []).map((p: Raw) => [pathOf(p.keys[0]), p.clicks]));
    const history = (series: Raw[] = []) => series.map((p: Raw) => p.value);

    return {
        day: row.day,
        collectedAt: row.collected_at,
        errors,
        google: g?.totals ? {
            clicks: g.totals.clicks,
            impressions: g.totals.impressions,
            ctr: g.totals.ctr,
            position: g.totals.position,
            prevClicks: g.previousTotals?.clicks ?? 0,
            prevImpressions: g.previousTotals?.impressions ?? 0,
            prevPosition: g.previousTotals?.position ?? null,
        } : null,
        yandex: w ? yandexTotals(yQueries, w.previousQueries) : null,
        googleDates: g?.dates?.current ?? null,
        yandexDates: w?.dates?.current ?? null,
        sqi: w?.summary?.sqi ?? null,
        inSearch: w?.summary?.searchable_pages_count ?? null,
        excluded: w?.summary?.excluded_pages_count ?? null,
        googleDaily: (g?.daily ?? []).map((d: Raw) => ({day: d.keys[0], clicks: d.clicks, impressions: d.impressions})),
        yandexDaily: (w?.queryHistory?.TOTAL_SHOWS ?? []).map((p: Raw, i: number) => ({
            day: String(p.date).slice(0, 10),
            impressions: p.value,
            clicks: history(w.queryHistory.TOTAL_CLICKS)[i] ?? 0,
        })),
        queries,
        growth: queries
            .filter((q) => !q.brand && q.position >= 4 && q.position <= 20 && q.impressions >= 10)
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 40),
        lowCtr: queries
            .filter((q) => !q.brand && q.position < 5.5 && q.impressions >= 20 && q.ctr < 0.03)
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 30),
        pages: (g?.pages ?? []).map((p: Raw) => ({
            path: pathOf(p.keys[0]),
            clicks: p.clicks,
            impressions: p.impressions,
            position: p.position,
            prevClicks: prevPages.get(pathOf(p.keys[0])) ?? 0,
        })),
        events: (w?.events ?? []).slice(0, 30).map((e: Raw) => ({
            date: String(e.event_date).slice(0, 10),
            url: pathOf(e.url),
            title: e.title ?? "",
            event: e.event,
        })),
        problems: Object.entries(w?.diagnostics ?? {})
            .filter(([, d]: [string, Raw]) => d.state === "PRESENT")
            .map(([code, d]: [string, Raw]) => ({code, severity: d.severity})),
    };
};
