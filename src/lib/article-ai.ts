import {getSetting, setSetting} from "./db";
import {IMAGE_LINE, parseInline} from "./article-body";
import {getPublishedArticles, type FaqEntry, type RelatedLink} from "./articles";
import {
    brandPages,
    commonPages,
    DEFAULT_SHOP_LINKS,
    MAX_SHOP_LINKS,
    normalizePath,
    parseShopLinks,
    servicePages,
    SHOP_LINKS_KEY,
    shopUrl,
    type SitePage,
} from "./site-pages";
import {NAVIGATION_URL} from "@/constants/navigation";
import {SITE} from "@/constants/site";

/* ------------------------------------------------------------------ */
/* Промпты                                                              */
/* ------------------------------------------------------------------ */

export type PromptKey = "article" | "rewrite" | "review";

export const PROMPT_TITLES: Record<PromptKey, string> = {
    article: "Статья: как писать",
    rewrite: "Переработка статьи конкурента (добавляется к заданию)",
    review: "Проверка качества: SEO-редактор",
};

const FORMAT = `Разметка текста:
## Заголовок раздела
### Подзаголовок
Абзацы разделяй пустой строкой. **Жирный** — только для ключевых мыслей.
- пункт списка
1. шаг инструкции
| Колонка | Колонка |
|---|---|
| значение | значение |
> совет или предупреждение
Заголовок первого уровня (#) не ставь — он добавится сам. Картинки, эмодзи и HTML не вставляй.

Ответ верни строго в таком виде, без вступлений и пояснений:
ЗАГОЛОВОК: заголовок статьи (H1), до 70 знаков, с главным запросом
SEO_ЗАГОЛОВОК: заголовок для поиска, до 50 знаков (к нему сам добавится « | Prime Auto»)
SEO_ОПИСАНИЕ: описание для поиска, 140–160 знаков, с главным запросом и пользой для читателя
АННОТАЦИЯ: 2–3 предложения — прямой ответ на главный вопрос статьи
===ТЕКСТ===
текст статьи в разметке выше
===ВОПРОСЫ===
JSON-массив из 4–6 вопросов, которые люди задают по теме и на которые нет прямого ответа в заголовках: [{"q": "вопрос", "a": "ответ в 1–3 предложения"}]`;

export const DEFAULT_PROMPTS: Record<PromptKey, string> = {
    article: `Ты — мастер по автомобильной оптике с многолетним опытом и SEO-редактор блога мастерской Prime Auto в Минске. Напиши экспертную статью, которая займёт первые места в Яндексе и Google и которую нейросети (Алиса, ChatGPT, Perplexity) будут цитировать в ответах.

Как писать:
- Начни с прямого ответа на главный вопрос темы в 2–3 предложениях — это аннотация. Поисковики и нейросети берут в ответ именно такой абзац.
- Каждый раздел (## заголовок) открывай одним-двумя предложениями, которые сразу отвечают на вопрос из заголовка, дальше — подробности. Заголовки формулируй так, как люди спрашивают в поиске: «Почему потеет фара изнутри», «Сколько служит Bi-Led модуль».
- Пиши как практик: причины, признаки, сравнения, пошаговые объяснения, типичные ошибки владельцев и мастеров, что можно сделать самому, а когда нужна мастерская. Хотя бы одна таблица сравнения и хотя бы один список.
- Отвечай честно, даже если честный ответ — «в вашем случае это не нужно» или «дешевле заменить фару». Это главная ценность статей мастерской.
- Ничего не выдумывай. Конкретных цен не называй — вместо них ссылка на прайс. Не ссылайся на законы, ГОСТы и правила техосмотра по номерам: они меняются, а неверная ссылка хуже её отсутствия. Не обещай того, чего нет в данных о мастерской.
- Главный запрос — в заголовке, в аннотации, в первом абзаце и ещё 2–4 раза по тексту, плюс синонимы и близкие формулировки. Без переспама.
- Мастерскую упоминай естественно, 2–4 раза за статью, там, где это помогает читателю (осмотр, диагностика, сложный ремонт). Статья должна быть полезной сама по себе, а не рекламной.
- Ссылайся на страницы сайта из списка ниже в формате [текст ссылки](/адрес): на подходящие услуги — обязательно, 3–6 ссылок за статью. Адресов не из списка не придумывай.
- Если читателю по теме нужно купить запчасть или лампу, можно 1–2 раза сослаться на магазин автосвета VDF.BY — только по адресам из списка магазина, полным адресом [текст](https://vdf.by/...). На другие сайты не ссылайся.
- Объём — 7000–12000 знаков, 5–8 разделов. Лучше подробно и по делу, чем коротко: статья должна закрывать все вопросы человека по теме. Живой экспертный тон, без воды, канцелярита, штампов («широкий ассортимент», «высокое качество», «индивидуальный подход») и восклицательных знаков. Русский язык.
- Текст должен быть полностью оригинальным: свои формулировки, свои примеры, никаких заимствованных оборотов из чужих статей.

${FORMAT}`,

    rewrite: `Ниже дана статья конкурента. Используй её только как источник фактов и перечня вопросов, которые волнуют читателя, — не как текст для пересказа.

Как переработать:
- Напиши полностью новую статью для Prime Auto: своя структура, свои заголовки, другой порядок изложения, свои примеры и формулировки.
- Ни одного предложения и ни одного оборота длиннее четырёх слов подряд из исходника. Не пересказывай абзацы близко к тексту — излагай суть своими словами, как объяснял бы клиенту мастер.
- Заголовок, SEO-заголовок, SEO-описание, аннотация и заголовки разделов — полностью свои. Не повторяй заголовок конкурента и не перефразируй его близко: возьми другой угол и другие слова. Совпадать могут только слова главного запроса.
- Убери всё, что относится к конкуренту: название, адреса, телефоны, цены, акции, гарантии, их услуги, которых нет у нас.
- Сомнительные или устаревшие утверждения не переноси; явные ошибки исправь.
- Добавь то, чего исходнику не хватает, чтобы статья была полнее и полезнее исходной: причины, сравнения, ошибки, когда нужна мастерская.
- Требования к формату, объёму, ссылкам и честности — те же, что в основном задании.`,

    review: `Ты — строгий SEO-редактор и мастер по автомобильной оптике. Тебе дают черновик статьи для блога мастерской Prime Auto в Минске. Оцени, насколько статья готова занять первые места в Яндексе и Google и попадать в ответы нейросетей, и выдай исправленную версию.

Оцени по шкале 0–100 с учётом:
- полноты и пользы: ответ на главный вопрос сразу, конкретика, причины, сравнения, ошибки, всё, что человек захочет узнать по теме;
- точности: ничего выдуманного, нет противоречий и технических ошибок, нет конкретных цен и номеров законов;
- честности: нет навязывания услуг, есть случаи «это не нужно» там, где это правда;
- структуры: заголовки в форме поисковых вопросов, каждый раздел начинается с прямого ответа, есть таблица и списки, логичный порядок;
- SEO: главный запрос и синонимы в заголовке, аннотации, первых абзацах и подзаголовках без переспама; SEO_ЗАГОЛОВОК до 50 знаков; SEO_ОПИСАНИЕ 140–160 знаков;
- перелинковки: 3–6 уместных ссылок на услуги и страницы сайта из списка, ссылки на магазин VDF.BY — не больше двух и только там, где нужно что-то купить. Проверь каждую ссылку: адрес должен быть из списков задания, а текст ссылки — соответствовать странице, на которую она ведёт (по названию в списке). Ссылку не по смыслу замени подходящей или убери;
- заголовка: если дан заголовок статьи конкурента, наш ЗАГОЛОВОК и SEO_ЗАГОЛОВОК не должны его повторять или близко перефразировать;
- языка: живой экспертный русский, без воды, канцелярита, штампов, повторов и шаблонных оборотов, по которым узнаётся текст нейросети;
- оригинальности: нет оборотов, похожих на чужой текст (если дан исходник конкурента — ни одной фразы оттуда);
- блока вопросов: 4–6 реальных вопросов, не дублирующих заголовки.

Исправь все найденные недостатки: допиши недостающие разделы, усиль ответы, перепиши шаблонные и заимствованные места своими словами, поправь заголовки, SEO-поля, ссылки и вопросы. Не сокращай хорошие части и не делай текст короче без причины. Адреса ссылок бери только из списков в задании.
Строки вида ![описание](/uploads/…) — это фото, которые поставил редактор: сохраняй их дословно и на тех же местах.

Ответ верни строго в таком виде:
ОЦЕНКА: число от 0 до 100 — оценка черновика до правок
ЗАМЕЧАНИЯ:
- что было не так и что исправлено, 3–10 пунктов, коротко
===СТАТЬЯ===
исправленная статья целиком в исходном формате: ЗАГОЛОВОК, SEO_ЗАГОЛОВОК, SEO_ОПИСАНИЕ, АННОТАЦИЯ, ===ТЕКСТ===, ===ВОПРОСЫ===`,
};

export const MAX_PROMPT = 12000;
const promptKey = (key: PromptKey) => `ai:prompt:${key}`;

export const getPrompt = (key: PromptKey): string => getSetting(promptKey(key)) || DEFAULT_PROMPTS[key];

export const savePrompt = (key: PromptKey, text: string): void => {
    const value = text.trim().slice(0, MAX_PROMPT);
    setSetting(promptKey(key), !value || value === DEFAULT_PROMPTS[key].trim() ? null : value);
};

export const getShopLinks = (): SitePage[] => {
    const saved = getSetting(SHOP_LINKS_KEY);
    return saved === undefined ? DEFAULT_SHOP_LINKS : parseShopLinks(saved);
};

/* ------------------------------------------------------------------ */
/* Задание для нейросети                                               */
/* ------------------------------------------------------------------ */

export interface ArticleRequest {
    topic: string;
    keyword?: string;
    notes?: string;
    /** Текст статьи конкурента, если статья пишется на его основе */
    sourceText?: string;
    /** Заголовок статьи конкурента — наш не должен его повторять */
    sourceTitle?: string;
}

export const MAX_SOURCE = 40000;

const pageLines = (pages: SitePage[]) => pages.map((page) => `- ${page.path} — ${page.title}`);

const articlePages = (): SitePage[] =>
    getPublishedArticles().slice(0, 40).map((article) => ({
        path: `${NAVIGATION_URL.articles}/${article.slug}`,
        title: article.title,
    }));

export const describeArticleRequest = (request: ArticleRequest): string => {
    const shop = getShopLinks();
    const articles = articlePages();
    const lines = [
        request.sourceText?.trim() && request.topic.trim() === request.sourceTitle?.trim()
            ? `Тема статьи — та же, что у статьи конкурента ниже (главный вопрос читателя). Заголовок придумай свой.`
            : `Тема статьи: ${request.topic.trim()}`,
        ...(request.sourceTitle?.trim()
            ? [`Заголовок статьи конкурента — НЕ используй его и близкие формулировки: «${request.sourceTitle.trim()}»`]
            : []),
        ...(request.keyword?.trim() ? [`Главный поисковый запрос: ${request.keyword.trim()}`] : []),
        ...(request.notes?.trim() ? ["", "Нюансы и пожелания:", request.notes.trim()] : []),
        "",
        "О мастерской:",
        `- ${SITE.name} — мастерская по ремонту, восстановлению и улучшению света автомобильных фар, ${SITE.city}, ${SITE.street}`,
        `- часы работы: ${SITE.openingHoursText}`,
        "- работы: установка Bi-Led и линз в фары, ремонт корпусов и креплений, замена стёкол, полировка и оклейка фар плёнкой, устранение запотевания, герметизация, техническое обслуживание фар",
        "- стоимость называем после осмотра и до начала работ; если по ходу разборки открылось скрытое — останавливаемся и пересогласовываем",
        "- если ремонт невыгоден, говорим об этом прямо",
        "",
        "Страницы услуг (адрес — название):",
        ...pageLines(servicePages()),
        "",
        "Другие страницы сайта:",
        ...pageLines(commonPages()),
        "",
        "Страницы услуг для конкретных марок (ссылайся, только если статья про эту марку):",
        ...pageLines(brandPages()),
    ];
    if (shop.length) {
        lines.push("", `Магазин автосвета VDF.BY — можно сослаться не больше ${MAX_SHOP_LINKS} раз, только по этим адресам:`, ...pageLines(shop));
    }
    if (articles.length) {
        lines.push("", "Уже опубликованные статьи — не повторяй их темы, можно сослаться:", ...pageLines(articles));
    }
    if (request.sourceText?.trim()) {
        lines.push("", "===СТАТЬЯ КОНКУРЕНТА===", request.sourceText.trim().slice(0, MAX_SOURCE), "===КОНЕЦ СТАТЬИ КОНКУРЕНТА===");
    }
    return lines.join("\n");
};

export const writeSystemPrompt = (request: ArticleRequest): string =>
    request.sourceText?.trim()
        ? `${getPrompt("article")}\n\n${getPrompt("rewrite")}`
        : getPrompt("article");

/* ------------------------------------------------------------------ */
/* Разбор ответа                                                       */
/* ------------------------------------------------------------------ */

export interface GeneratedArticle {
    title: string;
    metaTitle: string;
    metaDescription: string;
    excerpt: string;
    body: string;
    faq: FaqEntry[];
}

export const cleanPlainText = (text: string): string =>
    text
        .replace(/^```[a-z]*\s*|```\s*$/gi, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/^#{1,6}[ \t]+/gm, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const unquote = (text: string): string => text.trim().replace(/^["«„]+|["»“]+$/g, "").trim();

const field = (text: string, names: string[]): string => {
    for (const name of names) {
        const match = text.match(new RegExp(`^\\s*\\**${name}\\**\\s*:\\s*(.+)$`, "im"));
        if (match) return unquote(cleanPlainText(match[1].replace(/\*+/g, "")));
    }
    return "";
};

/* Модели иногда пишут маркер латинскими буквами-двойниками: «TEKCT» вместо «ТЕКСТ» */
const LOOKALIKES: Record<string, string> = {
    А: "АA", В: "ВB", Е: "ЕE", К: "КK", М: "МM", Н: "НH", О: "ОO", Р: "РP", С: "СC", Т: "ТT", Х: "ХX",
};

export const markerPattern = (name: string): RegExp => {
    const letters = [...name].map((letter) => (LOOKALIKES[letter] ? `[${LOOKALIKES[letter]}]` : letter)).join("");
    return new RegExp(`^[\\s*#]*=+\\s*${letters}\\s*=+[\\s*]*$`, "im");
};

const section = (text: string, marker: string, next?: string): string => {
    const start = text.search(markerPattern(marker));
    if (start < 0) return "";
    const rest = text.slice(start).replace(/^[^\n]*\n/, "");
    if (!next) return rest;
    const end = rest.search(markerPattern(next));
    return end < 0 ? rest : rest.slice(0, end);
};

export const parseFaq = (text: string): FaqEntry[] => {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end <= start) return [];
    try {
        const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((item) => ({
                q: cleanPlainText(String((item as {q?: unknown})?.q ?? "")),
                a: cleanPlainText(String((item as {a?: unknown})?.a ?? "")),
            }))
            .filter((item) => item.q && item.a)
            .slice(0, 8);
    } catch {
        return [];
    }
};

/** Все адреса, на которые статье разрешено ссылаться */
export const allowedLinks = (): {site: Map<string, string>; shop: Map<string, string>} => ({
    site: new Map(
        [...servicePages(), ...commonPages(), ...brandPages(), ...articlePages(), {path: "/", title: "Главная"}].map(
            (page) => [page.path, page.title],
        ),
    ),
    shop: new Map(getShopLinks().map((link) => [link.path, link.title])),
});

/**
 * Приводит ссылки к разрешённым: свои страницы — относительным адресом,
 * магазин — полным и не больше MAX_SHOP_LINKS раз, остальное — просто текст.
 */
export const sanitizeArticleBody = (body: string, title: string): string => {
    const {site, shop} = allowedLinks();
    let shopCount = 0;

    const fixLinks = (line: string) =>
        parseInline(line)
            .map((part) => {
                if (part.type === "bold") return `**${part.text}**`;
                if (part.type === "text") return part.text;
                const shopHref = shopUrl(part.href);
                if (shopHref) {
                    if (!shop.has(shopHref) || shopCount >= MAX_SHOP_LINKS) return part.text;
                    shopCount += 1;
                    return `[${part.text}](${shopHref})`;
                }
                const path = normalizePath(part.href);
                return path && site.has(path) ? `[${part.text}](${path})` : part.text;
            })
            .join("");

    const sameAsTitle = (heading: string) =>
        unquote(heading.replace(/\*+/g, "")).toLowerCase() === unquote(title).toLowerCase();

    return body
        .replace(/\r\n/g, "\n")
        .replace(/^```[a-z]*\s*$/gim, "")
        .replace(/^[\s*#]*=+[^=\n]*=+[\s*]*$/gm, "")
        .split("\n")
        .filter((line) => {
            const heading = line.match(/^#\s+(.+)$/);
            return !heading || !sameAsTitle(heading[1]);
        })
        .map((line) => {
            // Свои фото остаются как есть и отдельным абзацем — так их не
            // заденет переписывание соседнего текста. Чужие картинки — вон.
            if (IMAGE_LINE.test(line.trim())) return `\n${line.trim()}\n`;
            return fixLinks(line.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/^#\s+/, "## ").replace(/^#{4,}\s+/, "### "));
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const stripHeader = (text: string): string =>
    text
        .split("\n")
        .filter((line) => !/^\s*\**(ЗАГОЛОВОК|SEO_ЗАГОЛОВОК|SEO_ОПИСАНИЕ|АННОТАЦИЯ)\**\s*:/i.test(line))
        .join("\n");

export const parseGeneratedArticle = (text: string, fallbackTitle: string): GeneratedArticle => {
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const bodyStart = cleaned.search(markerPattern("ТЕКСТ"));
    const header = bodyStart < 0 ? cleaned.slice(0, 1500) : cleaned.slice(0, bodyStart);
    const title = (field(header, ["ЗАГОЛОВОК"]) || fallbackTitle.trim()).slice(0, 200);
    const rawBody = section(cleaned, "ТЕКСТ", "ВОПРОСЫ") || stripHeader(cleaned);

    return {
        title,
        metaTitle: field(header, ["SEO_ЗАГОЛОВОК", "SEO ЗАГОЛОВОК"]).replace(/\s*\|\s*Prime Auto\s*$/i, "").slice(0, 120),
        metaDescription: field(header, ["SEO_ОПИСАНИЕ", "SEO ОПИСАНИЕ"]).slice(0, 300),
        excerpt: field(header, ["АННОТАЦИЯ"]).slice(0, 600),
        body: sanitizeArticleBody(rawBody, title),
        faq: parseFaq(section(cleaned, "ВОПРОСЫ")),
    };
};

export const formatArticle = (article: GeneratedArticle): string =>
    [
        `ЗАГОЛОВОК: ${article.title}`,
        `SEO_ЗАГОЛОВОК: ${article.metaTitle}`,
        `SEO_ОПИСАНИЕ: ${article.metaDescription}`,
        `АННОТАЦИЯ: ${article.excerpt}`,
        "===ТЕКСТ===",
        article.body,
        "===ВОПРОСЫ===",
        JSON.stringify(article.faq),
    ].join("\n");

/**
 * Блок «По теме статьи»: услуги, на которые статья сама сослалась, а если
 * таких меньше двух — общий набор. Ссылки на магазин сюда не попадают:
 * блок ведёт читателя к нам, а не к покупке.
 */
export const relatedFromBody = (body: string): RelatedLink[] => {
    const services = new Map(servicePages().map((page) => [page.path, page.title]));
    const found = new Map<string, string>();
    for (const line of body.split("\n")) {
        for (const part of parseInline(line)) {
            if (part.type !== "link") continue;
            const path = normalizePath(part.href);
            if (services.has(path) && path !== NAVIGATION_URL.uslugi) found.set(path, services.get(path)!);
        }
    }
    const links = [...found].slice(0, 4).map(([href, title]) => ({title, href}));
    if (links.length < 2) links.push({title: "Все услуги", href: NAVIGATION_URL.uslugi});
    links.push({title: "Цены на работы", href: NAVIGATION_URL.price});
    return links;
};

