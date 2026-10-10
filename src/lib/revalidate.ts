import fs from "node:fs";
import path from "node:path";
import {revalidatePath} from "next/cache";
import {NAVIGATION_URL} from "@/constants/navigation";
import {getConfig} from "./config";

/**
 * Обновление страниц статей после правки в админке.
 *
 * Страницы /stati собираются заранее и лежат в кеше Next, а перед ним ещё
 * кеш nginx (см. docs/deploy.md). Next обновляем через revalidatePath, nginx —
 * очисткой его каталога, если он указан в настройках и у процесса есть права.
 * Без этого новая статья появилась бы на сайте только после деплоя.
 *
 * revalidatePath работает только внутри запроса, поэтому фоновые задачи сами
 * его не вызывают: они оставляют пометку, а обновляет страницы запрос,
 * которым админка спрашивает о ходе задачи.
 */

const purgeNginxCache = () => {
    const dir = getConfig("NGINX_CACHE_DIR");
    if (!dir) return;
    try {
        for (const entry of fs.readdirSync(dir)) {
            fs.rmSync(path.join(dir, entry), {recursive: true, force: true});
        }
    } catch (error) {
        console.error("[revalidate] не удалось очистить кеш nginx", (error as Error).message);
    }
};

export const revalidateArticles = (...slugs: string[]): void => {
    // "layout" — вместе со списком обновляются страницы рубрик и пагинации
    revalidatePath(NAVIGATION_URL.articles, "layout");
    for (const slug of new Set(slugs.filter(Boolean))) {
        revalidatePath(`${NAVIGATION_URL.articles}/${slug}`);
    }
    revalidatePath("/sitemap.xml");
    purgeNginxCache();
};
