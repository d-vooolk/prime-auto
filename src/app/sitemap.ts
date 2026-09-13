import type {MetadataRoute} from "next";
import {SITE_URL} from "@/constants/site";
import {NAVIGATION_URL} from "@/constants/navigation";
import {allBrandPagePaths} from "@/utils/brandPages";

interface SitemapEntry {
    path: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

const STATIC_PAGES: SitemapEntry[] = [
    {path: NAVIGATION_URL.home, priority: 1, changeFrequency: 'weekly'},
    {path: NAVIGATION_URL.uslugi, priority: 0.9, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.uluchsheniyeKachestvaSveta, priority: 0.9, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.biled, priority: 0.9, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.remont, priority: 0.9, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.polirovkaOkleyka, priority: 0.9, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.tehObsluzhivaniye, priority: 0.9, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.zapotevaniye, priority: 0.9, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.price, priority: 0.8, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.reviews, priority: 0.7, changeFrequency: 'weekly'},
    {path: NAVIGATION_URL.contacts, priority: 0.7, changeFrequency: 'monthly'},
    {path: NAVIGATION_URL.confidencePolicy, priority: 0.2, changeFrequency: 'yearly'},
];

/** Отдаётся по адресу /sitemap.xml */
const sitemap = (): MetadataRoute.Sitemap => {
    const lastModified = new Date();

    return [
        ...STATIC_PAGES.map((page) => ({
            // главная в canonical отдаётся без завершающего слэша — держим одинаково
            url: page.path === '/' ? SITE_URL : `${SITE_URL}${page.path}`,
            lastModified,
            changeFrequency: page.changeFrequency,
            priority: page.priority,
        })),
        ...allBrandPagePaths().map((path) => ({
            url: `${SITE_URL}${path}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),
    ];
};

export default sitemap;
