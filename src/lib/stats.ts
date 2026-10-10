import crypto from "node:crypto";
import {getDb, getSetting, setSetting} from "./db";

/**
 * Свой счётчик просмотров.
 *
 * Метрика остаётся главной аналитикой, но её данные живут у Яндекса, а этот
 * счётчик нужен самому сайту: сортировать статьи по популярности и показывать
 * в админке, что читают. Поэтому он простой и без cookies:
 *
 * - просмотр шлёт браузер (src/components/PageViewTracker) — страницы сайта
 *   статические, сервер их отдаёт из кеша и о заходе не знает;
 * - посетитель — хеш IP + браузера + дня с секретной солью: уникальных за день
 *   посчитать можно, отследить человека между днями — нет;
 * - повторный просмотр той же страницы тем же посетителем в течение 30 минут
 *   (обновление, «назад») не считается;
 * - боты по User-Agent отсекаются, а большинство ботов JS и не выполняет.
 */

export type Source = "yandex" | "google" | "maps" | "social" | "messenger" | "ads" | "direct" | "internal" | "other";
export type Device = "mobile" | "tablet" | "desktop";

export const SOURCE_LABELS: Record<Source, string> = {
    yandex: "Яндекс (поиск)",
    google: "Google (поиск)",
    maps: "Карты (Яндекс, Google)",
    social: "Соцсети",
    messenger: "Мессенджеры",
    ads: "Реклама (utm)",
    direct: "Прямые заходы",
    internal: "Переходы по сайту",
    other: "Другие сайты",
};

export const DEVICE_LABELS: Record<Device, string> = {mobile: "Телефон", tablet: "Планшет", desktop: "Компьютер"};

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|vkshare|whatsapp\/|telegrambot|curl|wget|python|java\/|okhttp|go-http/i;
const DEDUP_MS = 30 * 60 * 1000;
const KEEP_DAYS = 400;

/** День по Минску: YYYY-MM-DD */
export const minskDay = (ms: number = Date.now()): string =>
    new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/Minsk"}).format(new Date(ms));

const salt = (): string => {
    let value = getSetting("stats_salt");
    if (!value) {
        value = crypto.randomBytes(16).toString("hex");
        setSetting("stats_salt", value);
    }
    return value;
};

export const visitorId = (ip: string, ua: string, day: string): string =>
    crypto.createHash("sha256").update(`${salt()}|${ip}|${ua}|${day}`).digest("hex").slice(0, 16);

export const isBot = (ua: string): boolean => !ua || BOT.test(ua);

export const deviceOf = (ua: string, width: number, touch: boolean): Device => {
    if (/ipad|tablet|kindle|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
    // iPad с iPadOS представляется Mac'ом — выдаёт его сенсорный экран
    if (/macintosh/i.test(ua) && touch) return "tablet";
    if (/mobi|iphone|ipod|android|opera mini|iemobile/i.test(ua)) return "mobile";
    if (width > 0 && width < 768) return "mobile";
    return "desktop";
};

/** Источник по адресу, с которого пришли, и utm-меткам */
export const sourceOf = (referrer: string, utmSource: string, utmMedium: string, siteHost: string): {source: Source; host: string} => {
    let host = "";
    try {
        host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
    } catch {
        host = "";
    }
    if (/^(cpc|ppc|paid|cpm|banner)/i.test(utmMedium) || /yandex_direct|direct|ads/i.test(utmSource)) return {source: "ads", host};
    if (host && (host === siteHost || host.endsWith(`.${siteHost}`))) return {source: "internal", host};
    if (!host) {
        if (utmSource) return {source: /insta|vk|facebook|tiktok|youtube/i.test(utmSource) ? "social" : "other", host: utmSource};
        return {source: "direct", host: ""};
    }
    if (/(^|\.)yandex\.|(^|\.)ya\.ru$/.test(host)) {
        return {source: /maps|business/.test(referrer) ? "maps" : "yandex", host};
    }
    if (/(^|\.)google\./.test(host)) return {source: /maps/.test(referrer) ? "maps" : "google", host};
    if (/2gis|maps\./.test(host)) return {source: "maps", host};
    if (/instagram|vk\.com|vk\.ru|facebook|fb\.|tiktok|youtube|youtu\.be|ok\.ru|pinterest|threads/.test(host)) return {source: "social", host};
    if (/t\.me|telegram|viber|whatsapp|wa\.me/.test(host)) return {source: "messenger", host};
    return {source: "other", host};
};

/** Адрес страницы без параметров, хвостового слэша и регистра */
export const normalizePath = (raw: string): string | null => {
    if (typeof raw !== "string" || !raw.startsWith("/") || raw.length > 300) return null;
    let path = raw.split(/[?#]/)[0].toLowerCase();
    if (path.length > 1) path = path.replace(/\/+$/, "");
    if (/^\/(admin|api|uploads|_next)(\/|$)/.test(path) || /\.[a-z0-9]{2,5}$/.test(path)) return null;
    return path;
};

export interface ViewInput {
    path: string;
    visitor: string;
    entry: boolean;
    source: Source;
    referrer: string;
    utm: string;
    device: Device;
}

/** Записать просмотр. false — повтор в течение 30 минут, не считали */
export const recordView = (view: ViewInput): boolean => {
    const db = getDb();
    const now = Date.now();
    const recent = db
        .prepare("SELECT 1 FROM page_views WHERE visitor = ? AND path = ? AND ts > ? LIMIT 1")
        .get(view.visitor, view.path, now - DEDUP_MS);
    if (recent) return false;
    db.prepare(
        `INSERT INTO page_views (ts, day, path, visitor, entry, source, referrer, utm, device)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(now, minskDay(now), view.path, view.visitor, view.entry ? 1 : 0, view.source, view.referrer, view.utm, view.device);
    // изредка чистим старое — таблица не растёт бесконечно
    if (Math.random() < 0.002) {
        db.prepare("DELETE FROM page_views WHERE ts < ?").run(now - KEEP_DAYS * 86400000);
    }
    return true;
};

/** Просмотры статей за всё время: slug → число */
export const articleViewCounts = (): Map<string, number> => {
    const rows = getDb()
        .prepare("SELECT substr(path, 8) AS slug, COUNT(*) AS n FROM page_views WHERE path LIKE '/stati/%' GROUP BY path")
        .all() as {slug: string; n: number}[];
    return new Map(rows.map((row) => [row.slug, row.n]));
};

export const recordVote = (slug: string, useful: boolean, visitor: string, comment = ""): void => {
    getDb()
        .prepare(
            `INSERT INTO article_votes (ts, slug, useful, visitor, comment) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(slug, visitor) DO UPDATE SET
                useful = excluded.useful, ts = excluded.ts,
                comment = CASE WHEN excluded.comment != '' THEN excluded.comment ELSE article_votes.comment END`,
        )
        .run(Date.now(), slug, useful ? 1 : 0, visitor, comment);
};

/* ------------------------------------------------------------------ */
/* Конверсии                                                           */
/* ------------------------------------------------------------------ */

export type ConversionType = "lead" | "lead_open" | "phone" | "telegram" | "viber" | "whatsapp" | "instagram" | "map";

export const CONVERSION_LABELS: Record<ConversionType, string> = {
    lead: "Заявка отправлена",
    lead_open: "Открыта форма заявки",
    phone: "Звонок",
    telegram: "Telegram",
    viber: "Viber",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    map: "Маршрут / карта",
};

/** Обращения — то, что считаем конверсией; открытие формы — только шаг к ней */
export const CONTACT_TYPES: ConversionType[] = ["lead", "phone", "telegram", "viber", "whatsapp"];

export const isConversionType = (value: unknown): value is ConversionType =>
    typeof value === "string" && value in CONVERSION_LABELS;

/** Записать конверсию. Источник — последний вход на сайт этого посетителя */
export const recordConversion = (type: ConversionType, path: string, visitor: string, device: Device): void => {
    const db = getDb();
    const now = Date.now();
    // двойной клик или повтор той же кнопки на той же странице за 10 минут — одно действие
    if (db.prepare("SELECT 1 FROM conversions WHERE visitor = ? AND type = ? AND path = ? AND ts > ?")
        .get(visitor, type, path, now - 10 * 60000)) return;
    const entry = db
        .prepare("SELECT source FROM page_views WHERE visitor = ? AND entry = 1 ORDER BY ts DESC LIMIT 1")
        .get(visitor) as {source: Source} | undefined;
    db.prepare("INSERT INTO conversions (ts, day, type, path, visitor, source, device) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(now, minskDay(now), type, path, visitor, entry?.source ?? "direct", device);
};

export interface ConversionPage {
    path: string;
    visitors: number;
    contacts: number;
    counts: Partial<Record<ConversionType, number>>;
}

export interface ConversionsReport {
    days: number;
    from: string;
    to: string;
    visitors: number;
    converted: number;
    byType: {type: ConversionType; n: number; prev: number}[];
    byPage: ConversionPage[];
    bySource: {source: Source; visitors: number; converted: number; contacts: number}[];
    byDevice: {device: Device; visitors: number; converted: number}[];
    recent: {ts: number; type: ConversionType; path: string; source: Source; device: Device}[];
}

export const conversionsReport = (days: number): ConversionsReport => {
    const db = getDb();
    const now = Date.now();
    const from = minskDay(now - (days - 1) * 86400000);
    const prevFrom = minskDay(now - (2 * days - 1) * 86400000);
    const all = <T>(sql: string, ...args: unknown[]) => db.prepare(sql).all(...args) as T[];
    const contactsSql = CONTACT_TYPES.map((t) => `'${t}'`).join(",");

    const visitors = (db.prepare("SELECT COUNT(DISTINCT visitor) n FROM page_views WHERE day >= ?").get(from) as {n: number}).n;
    const converted = (db.prepare(`SELECT COUNT(DISTINCT visitor) n FROM conversions WHERE day >= ? AND type IN (${contactsSql})`)
        .get(from) as {n: number}).n;

    const prevByType = new Map(all<{type: string; n: number}>(
        "SELECT type, COUNT(*) n FROM conversions WHERE day >= ? AND day < ? GROUP BY type", prevFrom, from).map((r) => [r.type, r.n]));
    const byType = all<{type: ConversionType; n: number}>(
        "SELECT type, COUNT(*) n FROM conversions WHERE day >= ? GROUP BY type ORDER BY n DESC", from)
        .map((r) => ({...r, prev: prevByType.get(r.type) ?? 0}));

    const pageVisitors = new Map(all<{path: string; n: number}>(
        "SELECT path, COUNT(DISTINCT visitor) n FROM page_views WHERE day >= ? GROUP BY path", from).map((r) => [r.path, r.n]));
    const pages = new Map<string, ConversionPage>();
    for (const row of all<{path: string; type: ConversionType; n: number}>(
        "SELECT path, type, COUNT(*) n FROM conversions WHERE day >= ? GROUP BY path, type", from)) {
        const page = pages.get(row.path) ?? {path: row.path, visitors: pageVisitors.get(row.path) ?? 0, contacts: 0, counts: {}};
        page.counts[row.type] = row.n;
        if (CONTACT_TYPES.includes(row.type)) page.contacts += row.n;
        pages.set(row.path, page);
    }

    const sourceVisitors = all<{source: Source; n: number}>(
        "SELECT source, COUNT(DISTINCT visitor) n FROM page_views WHERE day >= ? AND entry = 1 GROUP BY source", from);
    const sourceConv = new Map(all<{source: string; converted: number; contacts: number}>(
        `SELECT source, COUNT(DISTINCT visitor) converted, COUNT(*) contacts FROM conversions
          WHERE day >= ? AND type IN (${contactsSql}) GROUP BY source`, from).map((r) => [r.source, r]));
    const deviceConv = new Map(all<{device: string; n: number}>(
        `SELECT device, COUNT(DISTINCT visitor) n FROM conversions WHERE day >= ? AND type IN (${contactsSql}) GROUP BY device`, from)
        .map((r) => [r.device, r.n]));

    return {
        days,
        from,
        to: minskDay(now),
        visitors,
        converted,
        byType,
        byPage: [...pages.values()].sort((a, b) => b.contacts - a.contacts || b.visitors - a.visitors),
        bySource: sourceVisitors
            .map((s) => ({
                source: s.source,
                visitors: s.n,
                converted: sourceConv.get(s.source)?.converted ?? 0,
                contacts: sourceConv.get(s.source)?.contacts ?? 0,
            }))
            .sort((a, b) => b.converted - a.converted || b.visitors - a.visitors),
        byDevice: all<{device: Device; n: number}>(
            "SELECT device, COUNT(DISTINCT visitor) n FROM page_views WHERE day >= ? GROUP BY device ORDER BY n DESC", from)
            .map((d) => ({device: d.device, visitors: d.n, converted: deviceConv.get(d.device) ?? 0})),
        recent: all("SELECT ts, type, path, source, device FROM conversions ORDER BY ts DESC LIMIT 30"),
    };
};

/* ------------------------------------------------------------------ */
/* Отчёты для админки                                                  */
/* ------------------------------------------------------------------ */

export interface PageStat {
    path: string;
    views: number;
    visitors: number;
    mobile: number;
    entries: number;
    prevViews: number;
    sources: {source: Source; n: number}[];
}

export interface StatsReport {
    days: number;
    from: string;
    to: string;
    totals: {views: number; visitors: number; entries: number; prevViews: number; prevVisitors: number};
    daily: {day: string; views: number; visitors: number}[];
    pages: PageStat[];
    sources: {source: Source; n: number}[];
    referrers: {host: string; n: number}[];
    devices: {device: Device; n: number}[];
    votes: {slug: string; yes: number; no: number}[];
    comments: {slug: string; comment: string; ts: number}[];
}

export const statsReport = (days: number): StatsReport => {
    const db = getDb();
    const now = Date.now();
    const from = minskDay(now - (days - 1) * 86400000);
    const to = minskDay(now);
    const prevFrom = minskDay(now - (2 * days - 1) * 86400000);
    const one = <T>(sql: string, ...args: unknown[]) => db.prepare(sql).get(...args) as T;
    const all = <T>(sql: string, ...args: unknown[]) => db.prepare(sql).all(...args) as T[];

    const cur = one<{views: number; visitors: number; entries: number}>(
        "SELECT COUNT(*) views, COUNT(DISTINCT visitor) visitors, SUM(entry) entries FROM page_views WHERE day >= ?", from);
    const prev = one<{views: number; visitors: number}>(
        "SELECT COUNT(*) views, COUNT(DISTINCT visitor) visitors FROM page_views WHERE day >= ? AND day < ?", prevFrom, from);

    const pagesRaw = all<{path: string; views: number; visitors: number; mobile: number; entries: number}>(
        `SELECT path, COUNT(*) views, COUNT(DISTINCT visitor) visitors,
                SUM(device != 'desktop') mobile, SUM(entry) entries
           FROM page_views WHERE day >= ? GROUP BY path ORDER BY views DESC LIMIT 200`, from);
    const prevByPath = new Map(all<{path: string; n: number}>(
        "SELECT path, COUNT(*) n FROM page_views WHERE day >= ? AND day < ? GROUP BY path", prevFrom, from).map((r) => [r.path, r.n]));
    const srcByPath = new Map<string, {source: Source; n: number}[]>();
    for (const row of all<{path: string; source: Source; n: number}>(
        "SELECT path, source, COUNT(*) n FROM page_views WHERE day >= ? AND entry = 1 GROUP BY path, source ORDER BY n DESC", from)) {
        const list = srcByPath.get(row.path) ?? [];
        list.push({source: row.source, n: row.n});
        srcByPath.set(row.path, list);
    }

    return {
        days,
        from,
        to,
        totals: {views: cur.views, visitors: cur.visitors, entries: cur.entries ?? 0, prevViews: prev.views, prevVisitors: prev.visitors},
        daily: all("SELECT day, COUNT(*) views, COUNT(DISTINCT visitor) visitors FROM page_views WHERE day >= ? GROUP BY day ORDER BY day", from),
        pages: pagesRaw.map((page) => ({
            ...page,
            prevViews: prevByPath.get(page.path) ?? 0,
            sources: srcByPath.get(page.path) ?? [],
        })),
        // источники считаем по входам на сайт: откуда пришли, а не по каждому клику внутри
        sources: all("SELECT source, COUNT(*) n FROM page_views WHERE day >= ? AND entry = 1 GROUP BY source ORDER BY n DESC", from),
        referrers: all(
            `SELECT referrer host, COUNT(*) n FROM page_views
              WHERE day >= ? AND entry = 1 AND referrer != '' AND source != 'internal'
              GROUP BY referrer ORDER BY n DESC LIMIT 15`, from),
        devices: all("SELECT device, COUNT(DISTINCT visitor) n FROM page_views WHERE day >= ? GROUP BY device ORDER BY n DESC", from),
        votes: all("SELECT slug, SUM(useful) yes, SUM(1 - useful) no FROM article_votes GROUP BY slug ORDER BY yes + no DESC"),
        comments: all("SELECT slug, comment, ts FROM article_votes WHERE comment != '' ORDER BY ts DESC LIMIT 50"),
    };
};
