import React from "react";
import Link from "next/link";
import ArticleContent from "@/components/ArticleContent/ArticleContent";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {imageSize} from "@/lib/article-body";
import type {ArticleRecord} from "@/lib/articles";
import {faqJsonLd} from "@/utils/seo";
import {categoryCover, categoryOf, categoryPath} from "@/constants/articleCategories";

/** Дата в подписи под заголовком — человекочитаемо, в разметке остаётся ISO */
export const formatArticleDate = (ms: number) =>
    new Date(ms).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});

/*
  Вопросы-ответы — в колонке статьи и в её стиле. Общий тёмный FaqBlock
  растягивается на всю ширину экрана и рядом с узкой колонкой текста
  смотрелся чужеродно. Раскрытие на <details> — работает без JavaScript.
*/
const ArticleFaq = ({items}: {items: ArticleRecord['faq']}) => {
    if (!items.length) return null;
    return (
        <section className="article-faq" aria-labelledby="article-faq-title">
            <JsonLd data={faqJsonLd(items.map((item) => ({question: item.q, answer: item.a})))} />
            <h2 className="article-faq-title" id="article-faq-title">Частые вопросы</h2>
            <div className="article-faq-list">
                {items.map((item) => (
                    <details className="article-faq-item" key={item.q}>
                        <summary className="article-faq-question">{item.q}</summary>
                        <div className="article-faq-answer">{item.a}</div>
                    </details>
                ))}
            </div>
        </section>
    );
};

/**
 * Статья: заголовок, обложка, аннотация, текст, вопросы-ответы и ссылки по
 * теме. Одна и та же на сайте и в предпросмотре админки.
 */
const ArticleView = ({article}: {article: ArticleRecord}) => {
    const category = categoryOf(article);
    // без своей обложки — обложка рубрики (декоративная, поэтому пустой alt)
    const coverSrc = article.cover || categoryCover(category.slug);
    const cover = imageSize(coverSrc);
    return (
        <article className="article-body">
            <h1 className="article-h1">{article.title}</h1>
            <p className="article-meta">
                <time dateTime={new Date(article.updatedAt).toISOString()}>
                    Обновлено {formatArticleDate(article.updatedAt)}
                </time>
                {' · '}
                <Link href={categoryPath(category.slug)} className="article-meta-category">{category.name}</Link>
            </p>

            {coverSrc && (
                <figure className="article-cover">
                    {/* обложка — первый экран, поэтому без lazy и с высоким приоритетом */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={coverSrc}
                        alt={article.cover ? (article.coverAlt || article.title) : ''}
                        width={cover?.width}
                        height={cover?.height}
                        fetchPriority="high"
                    />
                </figure>
            )}

            {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}

            <ArticleContent body={article.body} />

            <ArticleFaq items={article.faq} />

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
};

export default ArticleView;
