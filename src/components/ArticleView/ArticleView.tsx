import React from "react";
import Link from "next/link";
import ArticleContent from "@/components/ArticleContent/ArticleContent";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import type {ArticleRecord} from "@/lib/articles";

/** Дата в подписи под заголовком — человекочитаемо, в разметке остаётся ISO */
const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});

/**
 * Статья: заголовок, аннотация, текст и ссылки по теме. Одна и та же на
 * сайте и в предпросмотре админки.
 */
const ArticleView = ({article}: {article: ArticleRecord}) => (
    <article className="article-body">
        <h1 className="article-h1">{article.title}</h1>
        <p className="article-meta">
            <time dateTime={new Date(article.updatedAt).toISOString()}>Обновлено {formatDate(article.updatedAt)}</time>
        </p>

        {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}

        <ArticleContent body={article.body} />

        {article.related.length > 0 && (
            <aside className="article-related">
                <h2 className="article-related-title">По теме статьи</h2>
                <ul>
                    {article.related.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href}>{link.title}</Link>
                        </li>
                    ))}
                </ul>
            </aside>
        )}
    </article>
);

/**
 * Вопросы-ответы статьи — тёмный блок во всю ширину, как на страницах услуг,
 * поэтому стоит вне обёртки с отступами. Разметку FAQPage отдаёт сам блок.
 */
export const ArticleFaq = ({article}: {article: ArticleRecord}) => (
    <FaqBlock
        upperTitle="Коротко"
        title="Частые вопросы по теме"
        items={article.faq.map((item) => ({question: item.q, answer: item.a}))}
    />
);

export default ArticleView;
