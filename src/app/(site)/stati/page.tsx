import React from "react";
import Link from "next/link";
import './styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {formatArticleDate} from "@/components/ArticleView/ArticleView";
import {imageSize} from "@/lib/article-body";
import {getPublishedArticles, type ArticleRecord} from "@/lib/articles";
import {NAVIGATION_URL} from "@/constants/navigation";
import {absoluteUrl, breadcrumbJsonLd, buildMetadata} from "@/utils/seo";

const PAGE = {
    title: 'Статьи про автосвет и ремонт фар',
    lead: 'Разбираем вопросы, которые чаще всего задают перед работой: чем один тип света ' +
        'отличается от другого, почему фары потеют и мутнеют, что стоит спросить у мастера. ' +
        'Без рекламы и без «закажите прямо сейчас» — если ответ «вам это не нужно», так и написано.',
};

export const metadata = buildMetadata({
    title: 'Статьи про автосвет и ремонт фар | Prime Auto',
    description: 'Разборы по автосвету: Bi-Led против ксенона, запотевание фар, светодиоды ' +
        'в галоген, полировка и защита плёнкой. Опыт мастерской в Минске.',
    path: NAVIGATION_URL.articles,
});

/* Список собирается из базы; после публикации в админке обновляется сразу */
export const revalidate = 3600;

/** Список статей: ItemList помогает поисковику увидеть раздел целиком */
const listJsonLd = (articles: ArticleRecord[]) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absoluteUrl(NAVIGATION_URL.articles)}#list`,
    name: PAGE.title,
    itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`${NAVIGATION_URL.articles}/${article.slug}`),
        name: article.title,
    })),
});

/** Плитка статьи. Первые картинки грузятся сразу — они на первом экране */
const ArticleTile = ({article, eager}: {article: ArticleRecord; eager: boolean}) => {
    const size = article.cover ? imageSize(article.cover) : null;
    return (
        <Link href={`${NAVIGATION_URL.articles}/${article.slug}`} className="article-tile">
            {article.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    className="article-tile-cover"
                    src={article.cover}
                    alt={article.coverAlt || article.title}
                    width={size?.width}
                    height={size?.height}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                />
            ) : (
                <div className="article-tile-placeholder" aria-hidden="true">Prime Auto</div>
            )}
            <div className="article-tile-body">
                <time className="article-tile-date" dateTime={new Date(article.publishedAt ?? article.createdAt).toISOString()}>
                    {formatArticleDate(article.publishedAt ?? article.createdAt)}
                </time>
                <h2 className="article-tile-title">{article.title}</h2>
                {article.excerpt && <p className="article-tile-excerpt">{article.excerpt}</p>}
                <span className="article-tile-more">Читать →</span>
            </div>
        </Link>
    );
};

const ArticlesPage = () => {
    const articles = getPublishedArticles();

    return (
        <main>
            <div className="articles-page-wrapper">
                <JsonLd
                    data={[
                        listJsonLd(articles),
                        breadcrumbJsonLd([
                            {name: 'Главная', path: NAVIGATION_URL.home},
                            {name: 'Статьи', path: NAVIGATION_URL.articles},
                        ]),
                    ]}
                />

                <div className="articles-container">
                    <Breadcrumbs />

                    <div className="articles-intro">
                        <h1 className="articles-h1">{PAGE.title}</h1>
                        <p className="articles-lead">{PAGE.lead}</p>
                    </div>

                    <ul className="articles-grid">
                        {articles.map((article, index) => (
                            <li key={article.slug}>
                                <ArticleTile article={article} eager={index < 5} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <FormBlock />
        </main>
    );
};

export default ArticlesPage;
