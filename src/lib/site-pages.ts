import {breadcrumbLabels, NAVIGATION_URL} from "@/constants/navigation";
import {BRAND_SERVICES} from "@/constants/brandServices";
import {CAR_BRANDS} from "@/constants/carBrands";
import {INDEXED_BRAND_LIMIT, INDEXED_SERVICE_KEYS, brandPagePath} from "@/utils/brandPages";

/**
 * Страницы сайта, на которые статья может ссылаться.
 *
 * Нейросеть получает этот список в задании, а после генерации все ссылки
 * сверяются с ним: выдуманный адрес превращается в обычный текст, а не в
 * битую ссылку. Страницы марок — только индексируемые: ссылка из статьи на
 * noindex-страницу впустую тратит вес.
 */

export interface SitePage {
    path: string;
    title: string;
}

const SERVICE_PATHS = [
    NAVIGATION_URL.uslugi,
    NAVIGATION_URL.uluchsheniyeKachestvaSveta,
    NAVIGATION_URL.biled,
    NAVIGATION_URL.remont,
    NAVIGATION_URL.polirovkaOkleyka,
    NAVIGATION_URL.tehObsluzhivaniye,
    NAVIGATION_URL.regulirovka,
    NAVIGATION_URL.zapotevaniye,
];

export const servicePages = (): SitePage[] =>
    SERVICE_PATHS.map((path) => ({path, title: breadcrumbLabels[path]}));

export const commonPages = (): SitePage[] => [
    {path: NAVIGATION_URL.price, title: "Цены на работы"},
    {path: NAVIGATION_URL.reviews, title: "Отзывы клиентов"},
    {path: NAVIGATION_URL.contacts, title: "Контакты и адрес мастерской"},
    {path: NAVIGATION_URL.articles, title: "Все статьи"},
];

export const brandPages = (): SitePage[] =>
    BRAND_SERVICES.filter((service) => INDEXED_SERVICE_KEYS.includes(service.key)).flatMap((service) =>
        CAR_BRANDS.slice(0, INDEXED_BRAND_LIMIT).map((brand) => ({
            path: brandPagePath(service.basePath, brand.slug),
            title: `${breadcrumbLabels[service.basePath] ?? service.basePath} ${brand.name}`,
        })),
    );

/*
  Магазин автосвета VDF.BY — свой, поэтому на него статьи иногда ссылаются:
  там, где читателю нужно купить линзы, лампы или стёкла, а не ставить их у
  нас. Список правится в админке (Настройки); здесь — значение по умолчанию.
*/
export const SHOP_LINKS_KEY = "shop:links";
export const MAX_SHOP_LINKS = 2;

/* Разделы сверены с https://vdf.by/sitemap.xml — ссылки проверяются и при генерации */
export const DEFAULT_SHOP_LINKS: SitePage[] = [
    {path: "https://vdf.by/", title: "Магазин автосвета VDF.BY"},
    {path: "https://vdf.by/catalog/linzy/", title: "Линзы для фар"},
    {path: "https://vdf.by/catalog/bi-led-moduli/", title: "Светодиодные Bi-LED линзы"},
    {path: "https://vdf.by/catalog/stekla-far/", title: "Стёкла фар"},
    {path: "https://vdf.by/catalog/korpusa-far/", title: "Корпуса фар"},
    {path: "https://vdf.by/catalog/svetodiodnye-lampy/", title: "Светодиодные лампы"},
    {path: "https://vdf.by/catalog/linzy-dlya-ptf/", title: "Линзы для ПТФ"},
    {path: "https://vdf.by/catalog/maski-dlya-linz/", title: "Маски для линз"},
    {path: "https://vdf.by/catalog/tovary-dlya-ustanovki/", title: "Товары для установки: герметики и расходники"},
];

/** Строки «https://vdf.by/... | Название» из настроек */
export const parseShopLinks = (text: string): SitePage[] =>
    text
        .split("\n")
        .map((line) => {
            const [url = "", ...title] = line.split("|");
            return {path: shopUrl(url), title: title.join("|").trim()};
        })
        .filter((link) => link.path && link.title);

export const formatShopLinks = (links: SitePage[]): string =>
    links.map((link) => `${link.path} | ${link.title}`).join("\n");

/** Канонический вид ссылки на магазин или пустая строка, если это не vdf.by */
export const shopUrl = (href: string): string => {
    try {
        const url = new URL(href.trim());
        if (!/^(www\.)?vdf\.by$/i.test(url.hostname)) return "";
        const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
        return `https://vdf.by${path}`;
    } catch {
        return "";
    }
};

/** Адрес без домена, хвостового слэша, query и якоря */
export const normalizePath = (href: string): string => {
    const path = href
        .trim()
        .replace(/^https?:\/\/(www\.)?prime-auto\.by/i, "")
        .split(/[?#]/)[0];
    if (!path.startsWith("/")) return "";
    return path.length > 1 ? path.replace(/\/+$/, "") : path;
};
