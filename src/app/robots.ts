import type {MetadataRoute} from "next";
import {SITE_URL} from "@/constants/site";

/** Отдаётся по адресу /robots.txt */
const robots = (): MetadataRoute.Robots => ({
    rules: [
        {
            userAgent: '*',
            allow: '/',
            // /api — служебные обработчики формы, /admin — админка статей
            disallow: ['/api/', '/admin/'],
        },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
});

export default robots;
