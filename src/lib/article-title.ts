import {AiError, complete} from "./ai";
import {articlePlainText, parseArticleBody} from "./article-body";
import {cleanPlainText, type GeneratedArticle} from "./article-ai";

/**
 * Заголовок при переработке статьи конкурента.
 *
 * Модель охотно оставляет чужой заголовок почти как есть — он же «с главным
 * запросом». А заголовок и адрес — первое, что сравнивает поисковик, и
 * одинаковый H1 у двух статей на одну тему — прямой сигнал «это копия».
 * Поэтому после генерации заголовок сверяется с заголовком конкурента кодом,
 * а не просьбой в промпте, и при совпадении придумывается заново.
 */

const STOP_WORDS = new Set([
    "и", "в", "во", "на", "по", "с", "со", "к", "ко", "о", "об", "от", "до", "за", "из", "у", "не", "ли",
    "или", "а", "но", "что", "как", "для", "при", "без", "под", "над", "это", "же", "то", "ваш", "ваши",
    "чем", "где", "когда", "почему", "какой", "какие", "какая", "нужно", "ли", "the", "and",
]);

const stems = (text: string): Set<string> =>
    new Set(
        text
            .toLowerCase()
            .replace(/ё/g, "е")
            .split(/[^a-zа-я0-9]+/i)
            .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
            .map((word) => (/^[а-я]+$/.test(word) && word.length > 5 ? word.slice(0, 5) : word)),
    );

/**
 * Похожи ли заголовки. Слова главного запроса не считаются: «Bi-LED» в обоих
 * заголовках — это тема, а не копирование. Похожи — если совпадает половина
 * значимых слов более длинного заголовка или один целиком входит в другой.
 */
export const titlesSimilar = (ours: string, theirs: string, keyword = ""): boolean => {
    if (!ours.trim() || !theirs.trim()) return false;
    const skip = stems(keyword);
    const a = [...stems(ours)].filter((stem) => !skip.has(stem));
    const b = new Set([...stems(theirs)].filter((stem) => !skip.has(stem)));
    if (!a.length || !b.size) return ours.trim().toLowerCase() === theirs.trim().toLowerCase();
    const common = a.filter((stem) => b.has(stem)).length;
    return common === Math.min(a.length, b.size) || common / Math.max(a.length, b.size) >= 0.5;
};

const TITLE_PROMPT = `Ты — редактор блога мастерской по ремонту и тюнингу автомобильных фар в Минске. Придумай для готовой статьи новый заголовок.

Требования:
- ЗАГОЛОВОК (H1) — до 70 знаков, с главным запросом, отражает суть статьи.
- SEO_ЗАГОЛОВОК — до 50 знаков, для выдачи поисковика.
- Формулировка должна заметно отличаться от запрещённых заголовков ниже: другой угол, другие слова и порядок, не перефразирование. Одинаковыми могут быть только слова главного запроса.
- Без кавычек, восклицательных знаков и кликбейта.

Верни строго две строки:
ЗАГОЛОВОК: …
SEO_ЗАГОЛОВОК: …`;

const line = (text: string, name: string): string =>
    cleanPlainText(text.match(new RegExp(`^\\s*\\**${name}\\**\\s*:\\s*(.+)$`, "im"))?.[1] ?? "")
        .replace(/^["«„]+|["»“]+$/g, "")
        .replace(/\s*\|\s*Prime Auto\s*$/i, "")
        .trim();

export interface TitleCheck {
    article: GeneratedArticle;
    /** Что поменялось — для журнала задачи и заметок редактора */
    note: string | null;
}

/**
 * Если заголовок или SEO-заголовок похожи на заголовок конкурента —
 * просит модель придумать новые, до двух попыток.
 */
export const ensureDistinctTitle = async (
    article: GeneratedArticle,
    sourceTitle: string,
    keyword = "",
): Promise<TitleCheck> => {
    if (!sourceTitle.trim()) return {article, note: null};
    const similar = (value: string) => titlesSimilar(value, sourceTitle, keyword);
    if (!similar(article.title) && !similar(article.metaTitle)) return {article, note: null};

    const forbidden = [sourceTitle];
    const headings = parseArticleBody(article.body)
        .flatMap((block) => (block.type === "h2" ? [block.text] : []))
        .slice(0, 8);

    for (let attempt = 0; attempt < 2; attempt += 1) {
        let answer: string;
        try {
            answer = await complete(
                TITLE_PROMPT,
                [
                    ...(keyword ? [`Главный запрос: ${keyword}`] : []),
                    `Аннотация статьи: ${article.excerpt || articlePlainText(article.body).slice(0, 600)}`,
                    `Разделы статьи: ${headings.join("; ")}`,
                    "",
                    "Запрещённые заголовки (так называется статья конкурента и уже отклонённые варианты):",
                    ...forbidden.map((title) => `- ${title}`),
                ].join("\n"),
                "article",
                {temperature: 0.9},
            );
        } catch (error) {
            if (error instanceof AiError) break;
            throw error;
        }
        const title = line(answer, "ЗАГОЛОВОК").slice(0, 200);
        const metaTitle = line(answer, "SEO_ЗАГОЛОВОК").slice(0, 120);
        if (title && !similar(title)) {
            return {
                article: {...article, title, metaTitle: metaTitle && !similar(metaTitle) ? metaTitle : article.metaTitle && !similar(article.metaTitle) ? article.metaTitle : title.slice(0, 60)},
                note: `Заголовок совпадал с заголовком конкурента — заменён на «${title}»`,
            };
        }
        if (title) forbidden.push(title);
    }
    return {article, note: "Заголовок похож на заголовок конкурента, а новый придумать не вышло — поменяйте его вручную"};
};
