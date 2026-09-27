import type Database from "better-sqlite3";
import {ARTICLES, type Article} from "@/constants/articles";

/**
 * Перенос статей, написанных до появления админки, в базу.
 *
 * Выполняется один раз: после него статьи живут только в базе и правятся
 * в админке. Метка в settings нужна, чтобы удалённая в админке старая статья
 * не воскресала при следующем запуске.
 */

const SEEDED_KEY = "seeded:legacy-articles";

const toBody = (article: Article): string =>
    article.sections
        .map((section) =>
            [
                `## ${section.heading}`,
                ...section.paragraphs,
                ...(section.list?.length ? [section.list.map((item) => `- ${item}`).join("\n")] : []),
            ].join("\n\n"),
        )
        .join("\n\n");

export const seedLegacyArticles = (db: Database.Database): void => {
    const seed = db.transaction(() => {
        const done = db.prepare("SELECT 1 FROM settings WHERE key = ?").get(SEEDED_KEY);
        if (done) return;

        const insert = db.prepare(
            `INSERT OR IGNORE INTO articles
                (slug, status, title, meta_title, meta_description, excerpt, body, related,
                 created_at, updated_at, published_at)
             VALUES (?, 'published', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const article of ARTICLES) {
            const published = Date.parse(article.published);
            const updated = Date.parse(article.updated);
            insert.run(
                article.slug,
                article.title,
                article.metaTitle,
                article.metaDescription,
                article.excerpt,
                toBody(article),
                JSON.stringify(article.related),
                published,
                updated,
                published,
            );
        }
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(SEEDED_KEY, String(Date.now()));
    });
    seed.immediate();
};
