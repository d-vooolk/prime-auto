import type {MetadataRoute} from "next";
import {SITE_URL} from "@/constants/site";
import {NAVIGATION_URL} from "@/constants/navigation";
import {allBrandPagePaths} from "@/utils/brandPages";
import {getPublishedArticles} from "@/lib/articles";
import {ARTICLE_CATEGORIES, categoryOf, categoryPath} from "@/constants/articleCategories";

interface SitemapEntry {
    path: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    /** Дата последней правки текста страницы. Меняйте вместе с текстом */
    updated: string;
}

const STATIC_PAGES: SitemapEntry[] = [
    {path: NAVIGATION_URL.home, priority: 1, changeFrequency: 'weekly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.uslugi, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.uluchsheniyeKachestvaSveta, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.biled, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.remont, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.zamenaStekla, priority: 0.8, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.remontLed, priority: 0.8, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.polirovkaOkleyka, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.tehObsluzhivaniye, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.regulirovka, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.zapotevaniye, priority: 0.9, changeFrequency: 'monthly', updated: '2026-10-10'},
    {path: NAVIGATION_URL.price, priority: 0.8, changeFrequency: 'monthly', updated: '2026-09-27'},
    {path: NAVIGATION_URL.reviews, priority: 0.7, changeFrequency: 'weekly', updated: '2026-09-27'},
    {path: NAVIGATION_URL.articles, priority: 0.7, changeFrequency: 'weekly', updated: '2026-09-27'},
    {path: NAVIGATION_URL.contacts, priority: 0.7, changeFrequency: 'monthly', updated: '2026-09-27'},
    {path: NAVIGATION_URL.confidencePolicy, priority: 0.2, changeFrequency: 'yearly', updated: '2026-09-27'},
];

/*
  Тексты страниц марок живут в src/constants (carBrands, brandServices,
  brandServiceNotes). Дату меняйте, когда правите эти файлы.
*/
const BRAND_PAGES_UPDATED = '2026-10-10';

/* Статьи публикуются из админки — карта пересобирается вместе с ними */
export const revalidate = 3600;

/**
 * Отдаётся по адресу /sitemap.xml.
 *
 * lastmod — настоящая дата правки, а не время сборки. Если дата у всех страниц
 * каждый раз новая, поисковики перестают ей верить и перечитывать по ней
 * страницы, в том числе свежие статьи.
 */
const sitemap = (): MetadataRoute.Sitemap => {
    const articles = getPublishedArticles();
    // список статей меняется вместе с самой свежей из них
    const newestArticle = Math.max(0, ...articles.map((article) => new Date(article.updatedAt).getTime()));

    return [
        ...STATIC_PAGES.map((page) => ({
            // главная в canonical отдаётся без завершающего слэша — держим одинаково
            url: page.path === '/' ? SITE_URL : `${SITE_URL}${page.path}`,
            lastModified: page.path === NAVIGATION_URL.articles
                ? new Date(Math.max(newestArticle, Date.parse(page.updated)))
                : new Date(page.updated),
            changeFrequency: page.changeFrequency,
            priority: page.priority,
        })),
        // страницы рубрик; страницы пагинации (/stranica/2…) не включаем — они noindex
        ...ARTICLE_CATEGORIES.flatMap((category) => {
            const inCategory = articles.filter((article) => categoryOf(article).slug === category.slug);
            if (!inCategory.length) return [];
            return [{
                url: `${SITE_URL}${categoryPath(category.slug)}`,
                lastModified: new Date(Math.max(...inCategory.map((article) => article.updatedAt))),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }];
        }),
        ...articles.map((article) => ({
            url: `${SITE_URL}${NAVIGATION_URL.articles}/${article.slug}`,
            // у статей дата настоящая: поисковик по ней решает, стоит ли перечитать страницу
            lastModified: new Date(article.updatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),
        ...allBrandPagePaths().map((path) => ({
            url: `${SITE_URL}${path}`,
            lastModified: new Date(BRAND_PAGES_UPDATED),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),
    ];
};

export default sitemap;
