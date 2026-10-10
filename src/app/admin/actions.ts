"use server";

import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {changePassword, getAdmin, login, logout, requireAdmin} from "@/lib/auth";
import {saveConfig, type ConfigUpdate} from "@/lib/config";
import {AiError, checkConnection} from "@/lib/ai";
import {PROMPT_TITLES, savePrompt, type PromptKey} from "@/lib/article-ai";
import {
    createArticle,
    deleteArticle,
    freeSlug,
    getArticle,
    setArticleStatus,
    updateArticle,
    type FaqEntry,
    type RelatedLink,
} from "@/lib/articles";
import {setSetting} from "@/lib/db";
import {revalidateArticles} from "@/lib/revalidate";
import {toSlug} from "@/lib/slug";
import {isUploadUrl} from "@/lib/uploads";
import {checkUrl, describeProblem, findLinkProblems} from "@/lib/link-check";
import {formatShopLinks, parseShopLinks, SHOP_LINKS_KEY} from "@/lib/site-pages";
import {getArticleCategory} from "@/constants/articleCategories";

/*
  Каждое действие начинается с requireAdmin(): Server Action — обычный POST,
  до него можно достучаться в обход интерфейса, и proxy.ts этого не ловит.
*/

export type ActionResult = {ok: true; message?: string; slug?: string} | {ok: false; error: string};

export const loginAction = async (_: ActionResult | null, form: FormData): Promise<ActionResult> => {
    const list = await headers();
    // Адрес клиента передаёт nginx; без него все попытки считались бы одним адресом
    const ip = list.get("x-real-ip") ?? list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const result = await login(String(form.get("password") ?? ""), list.get("user-agent") ?? "", ip);
    if (!result.ok) return result;
    redirect("/admin");
};

export const logoutAction = async (): Promise<void> => {
    if (await getAdmin()) await logout();
    redirect("/admin/login");
};

export interface ArticleForm {
    title: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
    excerpt: string;
    body: string;
    cover: string;
    coverAlt: string;
    faq: FaqEntry[];
    related: RelatedLink[];
    keyword: string;
    category: string;
}

const text = (value: unknown, limit: number) => (typeof value === "string" ? value.trim().slice(0, limit) : "");

export const saveArticleAction = async (id: number, form: ArticleForm): Promise<ActionResult> => {
    await requireAdmin();
    const article = getArticle(id);
    if (!article) return {ok: false, error: "Статья не найдена — возможно, её удалили"};

    const title = text(form.title, 200);
    if (!title) return {ok: false, error: "Заголовок пустой"};
    const wanted = toSlug(text(form.slug, 100) || title);
    const slug = freeSlug(wanted, id);

    updateArticle(id, {
        title,
        slug,
        metaTitle: text(form.metaTitle, 120),
        metaDescription: text(form.metaDescription, 300),
        excerpt: text(form.excerpt, 800),
        body: typeof form.body === "string" ? form.body.slice(0, 200000) : article.body,
        // обложка — только своя картинка из /uploads, чужой адрес не принимаем
        cover: isUploadUrl(text(form.cover, 300)) ? text(form.cover, 300) : "",
        coverAlt: text(form.coverAlt, 200),
        keyword: text(form.keyword, 200),
        category: getArticleCategory(text(form.category, 60)) ? text(form.category, 60) : "",
        faq: (form.faq ?? [])
            .map((item) => ({q: text(item.q, 500), a: text(item.a, 3000)}))
            .filter((item) => item.q && item.a),
        related: (form.related ?? [])
            .map((item) => ({title: text(item.title, 200), href: text(item.href, 300)}))
            .filter((item) => item.title && item.href.startsWith("/")),
    });
    if (article.status === "published") revalidateArticles(article.slug, slug);
    return {ok: true, slug, message: slug === wanted ? "Сохранено" : `Сохранено. Адрес ${wanted} занят — статья получила ${slug}`};
};

export const setStatusAction = async (id: number, published: boolean): Promise<ActionResult> => {
    await requireAdmin();
    const article = getArticle(id);
    if (!article) return {ok: false, error: "Статья не найдена"};
    if (published && article.body.trim().length < 300) return {ok: false, error: "В статье почти нет текста — публиковать рано"};
    if (published) {
        const dead = (await findLinkProblems(article.body)).filter((problem) => problem.state === "dead");
        if (dead.length) {
            return {
                ok: false,
                error: `Битые ссылки — исправьте их или запустите «Проверить и улучшить»: ${dead.map(describeProblem).join("; ")}`,
            };
        }
    }
    setArticleStatus(id, published ? "published" : "draft");
    revalidateArticles(article.slug);
    return {ok: true, message: published ? "Опубликовано" : "Снято с публикации"};
};

export const deleteArticleAction = async (id: number): Promise<void> => {
    await requireAdmin();
    const article = getArticle(id);
    if (article) {
        deleteArticle(id);
        if (article.status === "published") revalidateArticles(article.slug);
    }
    redirect("/admin");
};

export const createEmptyArticleAction = async (): Promise<void> => {
    await requireAdmin();
    const id = createArticle({title: "Новая статья", slug: "novaya-statya"});
    redirect(`/admin/articles/${id}`);
};

export const savePromptAction = async (key: PromptKey, value: string): Promise<ActionResult> => {
    await requireAdmin();
    if (!(key in PROMPT_TITLES)) return {ok: false, error: "Неизвестный промпт"};
    savePrompt(key, value);
    return {ok: true, message: value.trim() ? "Промпт сохранён" : "Возвращён промпт по умолчанию"};
};

export const saveShopLinksAction = async (value: string): Promise<ActionResult> => {
    await requireAdmin();
    const links = parseShopLinks(value);
    // Каждую ссылку открываем: несуществующий раздел магазина в списке — это битые ссылки во всех будущих статьях
    const checked = await Promise.all(links.map(async (link) => ({link, ...(await checkUrl(link.path))})));
    const alive = checked.filter((item) => item.state !== "dead").map((item) => item.link);
    const dead = checked.filter((item) => item.state === "dead");
    const unsure = checked.filter((item) => item.state === "unknown");
    setSetting(SHOP_LINKS_KEY, formatShopLinks(alive));
    const notes = [
        ...(dead.length ? [`не сохранены — страниц нет: ${dead.map((item) => item.link.path).join(", ")}`] : []),
        ...(unsure.length ? [`не удалось проверить (сохранены): ${unsure.map((item) => item.link.path).join(", ")}`] : []),
    ];
    return {ok: true, message: `Сохранено ссылок: ${alive.length}${notes.length ? `; ${notes.join("; ")}` : ""}`};
};


export const checkAiAction = async (): Promise<ActionResult> => {
    await requireAdmin();
    try {
        return {ok: true, message: `Нейросеть отвечает: «${await checkConnection()}»`};
    } catch (error) {
        return {ok: false, error: error instanceof AiError ? error.message : "Внутренняя ошибка, подробности в логе сервера"};
    }
};

export const saveConfigAction = async (updates: ConfigUpdate[]): Promise<ActionResult> => {
    await requireAdmin();
    const error = saveConfig(Array.isArray(updates) ? updates : []);
    return error ? {ok: false, error} : {ok: true, message: "Настройки сохранены и уже действуют"};
};

export const changePasswordAction = async (current: string, next: string, repeat: string): Promise<ActionResult> => {
    await requireAdmin();
    if (next !== repeat) return {ok: false, error: "Новые пароли не совпадают"};
    const result = await changePassword(String(current ?? ""), String(next ?? ""));
    return result.ok ? {ok: true, message: "Пароль изменён, остальные сессии закрыты"} : result;
};
