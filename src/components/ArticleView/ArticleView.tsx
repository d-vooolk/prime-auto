import React from "react";
import Link from "next/link";
import ArticleContent from "@/components/ArticleContent/ArticleContent";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {imageSize} from "@/lib/article-body";
import type {ArticleRecord} from "@/lib/articles";
import {faqJsonLd} from "@/utils/seo";
import {categoryCover, categoryOf, categoryPath} from "@/constants/articleCategories";
import {parseArticleBody} from "@/lib/article-body";
import {SERVICE_HERO} from "@/constants/serviceHero";
import LeadButton from "@/components/LeadModal/LeadButton";

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

/* Оглавление: разделы статьи (h2) ссылками на якоря; можно свернуть */
const ArticleToc = ({body}: {body: string}) => {
    const items = parseArticleBody(body).filter((block) => block.type === "h2") as {type: "h2"; text: string; id: string}[];
    if (items.length < 4) return null;
    return (
        <details className="article-toc" open>
            <summary className="article-toc-title">Содержание</summary>
            <ol>
                {items.map((item) => (
                    <li key={item.id}><a href={`#${item.id}`}>{item.text.replace(/\*\*/g, "")}</a></li>
                ))}
            </ol>
        </details>
    );
};

/* Карточка услуги рубрики в середине статьи: цена «от», срок и запись */
const ArticleServiceCard = ({href, title}: {href: string; title: string}) => {
    const hero = SERVICE_HERO[href];
    return (
        <aside className="article-service-card">
            <div className="article-service-card-label">Не хотите разбираться сами?</div>
            <div className="article-service-card-title">{title} в Prime Auto</div>
            {hero && <p className="article-service-card-text">{hero.lead}</p>}
            {hero && (
                <ul className="article-service-card-facts">
                    {hero.facts.slice(0, 2).map((fact) => <li key={fact.label}><b>{fact.value}</b> {fact.label}</li>)}
                </ul>
            )}
            <div className="article-service-card-actions">
                <LeadButton className="article-service-card-button" message={`Прочитал статью на сайте, интересует: ${title.toLowerCase()}.`}>
                    Записаться
                </LeadButton>
                <Link href={href} className="article-service-card-link">Цены и подробности →</Link>
            </div>
        </aside>
    );
};

/**
 * Статья: заголовок, обложка, аннотация, оглавление, текст с карточкой услуги
 * в середине, вопросы-ответы и ссылки по теме. Одна и та же на сайте и в
 * предпросмотре админки.
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

            <ArticleToc body={article.body} />

            <ArticleContent
                body={article.body}
                middle={<ArticleServiceCard href={category.service.href} title={category.service.title} />}
            />

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
