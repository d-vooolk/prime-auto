import {IMAGE_LINE, parseInline} from "./article-body";
import {allowedLinks} from "./article-ai";
import {normalizePath, shopUrl} from "./site-pages";

/**
 * Проверка ссылок статьи — настоящими запросами, а не только по списку.
 *
 * Список разрешённых адресов защищает от выдуманных страниц сайта, но не от
 * устаревших: раздел магазина могли переименовать, и ссылка из списка ведёт
 * в 404. Поэтому внешние ссылки (магазин) запрашиваются: 404/410 — ссылка
 * битая и убирается, остаётся текст. Если сайт просто не ответил, ссылку не
 * трогаем — это может быть минутный сбой, — но сообщаем о ней.
 */

const TIMEOUT_MS = 10000;
const USER_AGENT = "Mozilla/5.0 (compatible; PrimeAutoLinkCheck/1.0; +https://prime-auto.by)";

export type LinkState = "ok" | "dead" | "unknown";

export interface LinkProblem {
    href: string;
    text: string;
    state: Exclude<LinkState, "ok">;
    reason: string;
}

const cache = new Map<string, {state: LinkState; reason: string; at: number}>();
const CACHE_MS = 10 * 60 * 1000;

export const checkUrl = async (url: string): Promise<{state: LinkState; reason: string}> => {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit;

    let result: {state: LinkState; reason: string};
    try {
        const response = await fetch(url, {
            redirect: "follow",
            headers: {"User-Agent": USER_AGENT, Accept: "text/html"},
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        await response.body?.cancel();
        result =
            response.ok
                ? {state: "ok", reason: ""}
                : response.status === 404 || response.status === 410
                    ? {state: "dead", reason: `страница не существует (${response.status})`}
                    : {state: "unknown", reason: `сайт ответил ${response.status}`};
    } catch (error) {
        result = {state: "unknown", reason: (error as Error).name === "TimeoutError" ? "сайт не ответил за 10 секунд" : "сайт недоступен"};
    }
    cache.set(url, {...result, at: Date.now()});
    return result;
};

const linksOf = (body: string): {href: string; text: string}[] =>
    body.split("\n").flatMap((line) =>
        IMAGE_LINE.test(line.trim())
            ? []
            : parseInline(line).flatMap((part) => (part.type === "link" ? [{href: part.href, text: part.text}] : [])),
    );

/** Все проблемные ссылки статьи: не из списка разрешённых и битые */
export const findLinkProblems = async (body: string): Promise<LinkProblem[]> => {
    const {site, shop} = allowedLinks();
    const problems: LinkProblem[] = [];
    const external = new Map<string, string>();

    for (const {href, text} of linksOf(body)) {
        const shopHref = shopUrl(href);
        if (shopHref) {
            if (!shop.has(shopHref)) problems.push({href, text, state: "dead", reason: "адреса нет в списке ссылок магазина"});
            else external.set(shopHref, text);
            continue;
        }
        if (/^https?:\/\//i.test(href) && !normalizePath(href)) {
            problems.push({href, text, state: "dead", reason: "ссылка на чужой сайт"});
            continue;
        }
        const path = normalizePath(href);
        if (!path || !site.has(path)) problems.push({href, text, state: "dead", reason: "такой страницы на сайте нет или статья не опубликована"});
    }

    const checked = await Promise.all([...external].map(async ([href, text]) => ({href, text, ...(await checkUrl(href))})));
    for (const link of checked) {
        if (link.state !== "ok") problems.push({href: link.href, text: link.text, state: link.state, reason: link.reason});
    }
    return problems;
};

/** Убирает битые ссылки (оставляя их текст). Ссылки с неясным статусом не трогает */
export const removeDeadLinks = (body: string, problems: LinkProblem[]): string => {
    const dead = new Set(problems.filter((problem) => problem.state === "dead").map((problem) => problem.href));
    if (!dead.size) return body;
    return body
        .split("\n")
        .map((line) =>
            IMAGE_LINE.test(line.trim())
                ? line
                : parseInline(line)
                    .map((part) => {
                        if (part.type === "bold") return `**${part.text}**`;
                        if (part.type === "text") return part.text;
                        return dead.has(part.href) ? part.text : `[${part.text}](${part.href})`;
                    })
                    .join(""),
        )
        .join("\n");
};

export const describeProblem = (problem: LinkProblem) => `«${problem.text}» → ${problem.href}: ${problem.reason}`;
