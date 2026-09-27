import {articleImages, articleLinks, articlePlainText, parseArticleBody} from "./article-body";
import {
    cleanPlainText,
    describeArticleRequest,
    formatArticle,
    getPrompt,
    markerPattern,
    parseGeneratedArticle,
    type ArticleRequest,
    type GeneratedArticle,
} from "./article-ai";
import type {ArticleReview} from "./articles";
import {shopUrl} from "./site-pages";

/**
 * Проверка качества статьи.
 *
 * Два слоя. Сначала формальные проверки кодом — объём, структура, длина
 * SEO-полей, ссылки: их нейросеть сама себе оценивает плохо, а код считает
 * точно. Потом второй вызов нейросети в роли строгого редактора: он получает
 * черновик вместе с найденными замечаниями, ставит оценку и возвращает
 * исправленную версию.
 */

export const MIN_BODY_LENGTH = 1500;

export const articleChecks = (article: GeneratedArticle, keyword?: string): string[] => {
    const plain = articlePlainText(article.body);
    const blocks = parseArticleBody(article.body);
    const count = (type: string) => blocks.filter((block) => block.type === type).length;
    const links = articleLinks(article.body);
    const shopLinks = links.filter((href) => shopUrl(href)).length;
    const problems: string[] = [];

    if (plain.length < 6000) problems.push(`Текст ${plain.length} знаков — меньше 6000, раскрыть тему глубже`);
    if (count("h2") < 4) problems.push(`Разделов ## всего ${count("h2")} — нужно 5–8`);
    if (!count("table")) problems.push("Нет ни одной таблицы сравнения");
    if (!count("ul") && !count("ol")) problems.push("Нет ни одного списка");
    if (!article.metaTitle) problems.push("Нет SEO_ЗАГОЛОВКА");
    else if (article.metaTitle.length > 55) problems.push(`SEO_ЗАГОЛОВОК ${article.metaTitle.length} знаков — сократить до 50`);
    const description = article.metaDescription.length;
    if (description < 130 || description > 170) problems.push(`SEO_ОПИСАНИЕ ${description} знаков — нужно 140–160`);
    if (!article.excerpt) problems.push("Нет АННОТАЦИИ");
    if (article.faq.length < 4) problems.push(`Вопросов в блоке ВОПРОСЫ ${article.faq.length} — нужно 4–6`);
    if (links.length - shopLinks < 3) problems.push("Меньше трёх ссылок на страницы услуг сайта — добавить уместные");
    if (/\d+\s*(?:руб|byn|р\.|\$|€)/i.test(plain)) problems.push("В тексте есть конкретные цены — убрать, вместо них ссылка на прайс");

    const phrase = keyword?.trim().toLowerCase();
    if (phrase) {
        const lead = `${article.title} ${article.excerpt} ${plain.slice(0, 800)}`.toLowerCase();
        if (!lead.includes(phrase)) problems.push(`Главный запрос «${keyword}» не встречается в заголовке и начале текста`);
    }
    return problems;
};

export const describeReview = (article: GeneratedArticle, request: ArticleRequest, extra: string[] = []): string => {
    const checks = [...articleChecks(article, request.keyword), ...extra];
    return [
        describeArticleRequest(request),
        "",
        checks.length
            ? ["Автоматическая проверка нашла:", ...checks.map((check) => `- ${check}`)].join("\n")
            : "Автоматическая проверка формальных требований замечаний не нашла.",
        "",
        "Черновик статьи:",
        formatArticle(article),
    ].join("\n");
};

export const reviewSystemPrompt = (): string => getPrompt("review");

const parseNotes = (head: string): string[] =>
    (head.split(/ЗАМЕЧАНИЯ\**\s*:/i)[1] ?? "")
        .split("\n")
        .map((line) => cleanPlainText(line.replace(/^\s*(?:[-*•—]|\d+[.)])\s*/, "")))
        .filter((line) => line.length > 3)
        .slice(0, 12)
        .map((line) => line.slice(0, 600));

/**
 * Разбор ответа редактора. Исправленная версия принимается, только если не
 * потеряла заметную часть текста: модель иногда «исправляет» статью, выкидывая
 * половину разделов, и такую правку лучше не брать вовсе.
 */
export const parseReview = (
    text: string,
    draft: GeneratedArticle,
): {article: GeneratedArticle; review: ArticleReview} => {
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const marker = cleaned.search(markerPattern("СТАТЬЯ"));
    const head = marker < 0 ? cleaned.slice(0, 3000) : cleaned.slice(0, marker);
    const score = Math.max(0, Math.min(100, Number(head.match(/ОЦЕНКА\**\s*:\s*\**\s*(\d{1,3})/i)?.[1] ?? 0)));
    const notes = parseNotes(head);
    const base = {score, notes, at: Date.now()};

    if (marker < 0) return {article: draft, review: {...base, revised: false}};

    const revised = parseGeneratedArticle(cleaned.slice(marker).replace(/^[^\n]*\n/, ""), draft.title);
    const lostText = articlePlainText(revised.body).length < articlePlainText(draft.body).length * 0.8;
    const lostImages = !articleImages(draft.body).every((src) => revised.body.includes(src));
    if (lostText || lostImages) {
        return {
            article: draft,
            review: {
                ...base,
                revised: false,
                notes: [...notes, `Исправленная версия потеряла ${lostImages ? "фото" : "часть текста"} — оставлен исходный вариант`],
            },
        };
    }

    return {
        article: {
            ...revised,
            faq: revised.faq.length >= Math.min(draft.faq.length, 3) ? revised.faq : draft.faq,
            metaTitle: revised.metaTitle || draft.metaTitle,
            metaDescription: revised.metaDescription || draft.metaDescription,
            excerpt: revised.excerpt || draft.excerpt,
        },
        review: {...base, revised: true},
    };
};
