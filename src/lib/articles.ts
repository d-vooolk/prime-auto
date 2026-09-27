import {getDb} from "./db";
import {toSlug} from "./slug";

/**
 * Статьи раздела /stati. Хранятся в базе и правятся в админке.
 *
 * Правила наполнения остались прежними (см. src/constants/articles.ts):
 * отвечаем на вопрос честно, включая случаи «вам это не нужно», конкретных
 * цен в статьях нет — они живут в прайсе, ссылок на нормативные документы тоже.
 */

export interface FaqEntry {
    q: string;
    a: string;
}

export interface RelatedLink {
    title: string;
    href: string;
}

/** Оценка второго прохода — нейросети в роли SEO-редактора */
export interface ArticleReview {
    score: number;
    notes: string[];
    revised: boolean;
    at: number;
}

/** Итог проверки уникальности */
export interface ArticleUniqueness {
    at: number;
    /** Процент по text.ru; null — сервис не подключён или не ответил */
    textru: {percent: number; urls: {url: string; percent: number}[]} | null;
    textruError?: string;
    /** Доля текста, совпадающая с текстом конкурента дословно, % */
    source: {percent: number; fragments: number} | null;
    /** Сколько раз переписывались неуникальные куски */
    rounds: number;
    passed: boolean;
}

export type ArticleStatus = "draft" | "published";

export interface ArticleRecord {
    id: number;
    slug: string;
    status: ArticleStatus;
    title: string;
    metaTitle: string;
    metaDescription: string;
    excerpt: string;
    body: string;
    faq: FaqEntry[];
    related: RelatedLink[];
    topic: string;
    keyword: string;
    notes: string;
    sourceUrl: string;
    sourceText: string;
    review: ArticleReview | null;
    uniqueness: ArticleUniqueness | null;
    createdAt: number;
    updatedAt: number;
    publishedAt: number | null;
}

interface Row {
    id: number;
    slug: string;
    status: string;
    title: string;
    meta_title: string;
    meta_description: string;
    excerpt: string;
    body: string;
    faq: string;
    related: string;
    topic: string;
    keyword: string;
    notes: string;
    source_url: string;
    source_text: string;
    review: string | null;
    uniqueness: string | null;
    created_at: number;
    updated_at: number;
    published_at: number | null;
}

const json = <T>(text: string | null, fallback: T): T => {
    if (!text) return fallback;
    try {
        return JSON.parse(text) as T;
    } catch {
        return fallback;
    }
};

const fromRow = (row: Row): ArticleRecord => ({
    id: row.id,
    slug: row.slug,
    status: row.status === "published" ? "published" : "draft",
    title: row.title,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    excerpt: row.excerpt,
    body: row.body,
    faq: json<FaqEntry[]>(row.faq, []),
    related: json<RelatedLink[]>(row.related, []),
    topic: row.topic,
    keyword: row.keyword,
    notes: row.notes,
    sourceUrl: row.source_url,
    sourceText: row.source_text,
    review: json<ArticleReview | null>(row.review, null),
    uniqueness: json<ArticleUniqueness | null>(row.uniqueness, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
});

export const listArticles = (): ArticleRecord[] =>
    (getDb().prepare("SELECT * FROM articles ORDER BY updated_at DESC").all() as Row[]).map(fromRow);

export const getPublishedArticles = (): ArticleRecord[] =>
    (
        getDb()
            .prepare("SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC, id DESC")
            .all() as Row[]
    ).map(fromRow);

export const getPublishedArticle = (slug: string): ArticleRecord | null => {
    const row = getDb()
        .prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published'")
        .get(slug) as Row | undefined;
    return row ? fromRow(row) : null;
};

export const getArticle = (id: number): ArticleRecord | null => {
    const row = getDb().prepare("SELECT * FROM articles WHERE id = ?").get(id) as Row | undefined;
    return row ? fromRow(row) : null;
};

/** Свободный адрес: к занятому добавляется -2, -3… */
export const freeSlug = (wanted: string, exceptId?: number): string => {
    const base = toSlug(wanted) || "statya";
    const taken = (slug: string) =>
        Boolean(getDb().prepare("SELECT 1 FROM articles WHERE slug = ? AND id != ?").get(slug, exceptId ?? -1));
    let slug = base;
    for (let n = 2; taken(slug); n += 1) slug = `${base}-${n}`;
    return slug;
};

export type ArticleInput = Partial<Omit<ArticleRecord, "id" | "createdAt" | "updatedAt" | "publishedAt" | "status">>;

const COLUMNS: Record<keyof ArticleInput, string> = {
    slug: "slug",
    title: "title",
    metaTitle: "meta_title",
    metaDescription: "meta_description",
    excerpt: "excerpt",
    body: "body",
    faq: "faq",
    related: "related",
    topic: "topic",
    keyword: "keyword",
    notes: "notes",
    sourceUrl: "source_url",
    sourceText: "source_text",
    review: "review",
    uniqueness: "uniqueness",
};

const JSON_FIELDS = new Set(["faq", "related", "review", "uniqueness"]);

const toColumns = (input: ArticleInput): [string[], unknown[]] => {
    const names: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(input)) {
        const column = COLUMNS[key as keyof ArticleInput];
        if (!column || value === undefined) continue;
        names.push(column);
        values.push(JSON_FIELDS.has(key) ? (value === null ? null : JSON.stringify(value)) : value);
    }
    return [names, values];
};

export const createArticle = (input: ArticleInput & {title: string}): number => {
    const now = Date.now();
    const [names, values] = toColumns({...input, slug: freeSlug(input.slug || input.title)});
    const result = getDb()
        .prepare(
            `INSERT INTO articles (${[...names, "status", "created_at", "updated_at"].join(", ")})
             VALUES (${[...names.map(() => "?"), "'draft'", "?", "?"].join(", ")})`,
        )
        .run(...values, now, now);
    return Number(result.lastInsertRowid);
};

export const updateArticle = (id: number, input: ArticleInput): void => {
    const [names, values] = toColumns(input);
    if (!names.length) return;
    getDb()
        .prepare(`UPDATE articles SET ${names.map((name) => `${name} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
        .run(...values, Date.now(), id);
};

export const setArticleStatus = (id: number, status: ArticleStatus): void => {
    getDb()
        .prepare(
            `UPDATE articles
                SET status = ?, updated_at = ?,
                    published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END
              WHERE id = ?`,
        )
        .run(status, Date.now(), status, Date.now(), id);
};

export const deleteArticle = (id: number): void => {
    getDb().prepare("DELETE FROM articles WHERE id = ?").run(id);
};

export const isoDate = (ms: number): string => new Date(ms).toISOString();
