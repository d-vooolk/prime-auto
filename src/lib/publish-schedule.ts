import {getArticle, setArticleStatus} from "./articles";
import {getDb, getSetting, setSetting} from "./db";
import {purgeNginxCache, revalidateArticles} from "./revalidate";
import {minskDay} from "./stats";

/*
  Публикация по расписанию: одна статья в день в 9:00 по Минску.

  Десятки статей разом на сайте из сотни страниц выглядят как генерация и
  проседают; ровный поток по одной — как живой блог. В очередь статьи ставит
  тот, кто их проверил (факты, цены, ссылки), — сюда попадают только готовые
  черновики. Двигает очередь таймер из src/instrumentation.ts.

  Статью забираем в транзакции IMMEDIATE: при blue-green деплое ненадолго
  работают два процесса, и опубликовать они должны одну статью, а не две.
*/

const QUEUE_KEY = "publish_queue";
const LAST_DAY_KEY = "publish_last_day";
export const PUBLISH_HOUR = 9;

export const publishQueue = (): number[] => JSON.parse(getSetting(QUEUE_KEY) ?? "[]") as number[];

const minskHour = (ms = Date.now()) => Number(new Intl.DateTimeFormat("en-GB", {hour: "numeric", hourCycle: "h23", timeZone: "Europe/Minsk"}).format(ms));

/** Опубликовать следующую статью, если сегодня ещё не публиковали и уже 9:00 */
export const publishScheduled = (): string | null => {
    if (minskHour() < PUBLISH_HOUR) return null;
    const today = minskDay();
    const slug = getDb().transaction(() => {
        if (getSetting(LAST_DAY_KEY) === today) return null;
        const queue = publishQueue();
        while (queue.length) {
            const article = getArticle(queue.shift()!);
            if (article?.status !== "draft") continue;
            setArticleStatus(article.id, "published");
            setSetting(QUEUE_KEY, JSON.stringify(queue));
            setSetting(LAST_DAY_KEY, today);
            return article.slug;
        }
        setSetting(QUEUE_KEY, null);
        return null;
    }).immediate();
    if (!slug) return null;
    try {
        revalidateArticles(slug);
    } catch {
        // вне запроса revalidatePath недоступен — списки обновятся по revalidate (час), кеш nginx чистим сами
        purgeNginxCache();
    }
    console.log(`[publish] опубликована /stati/${slug}`);
    return slug;
};
