import React from "react";
import Link from "next/link";
import './styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
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

const ArticlesPage = () => {
    const articles = getPublishedArticles();

    return (
        <main className="articles-page-wrapper">
            <JsonLd
                data={[
                    listJsonLd(articles),
                    breadcrumbJsonLd([
                        {name: 'Главная', path: NAVIGATION_URL.home},
                        {name: 'Статьи', path: NAVIGATION_URL.articles},
                    ]),
                ]}
            />

            <Breadcrumbs />

            <div className="articles-intro">
                <h1 className="articles-h1">{PAGE.title}</h1>
                <p className="articles-lead">{PAGE.lead}</p>
            </div>

            <ul className="articles-list">
                {articles.map((article) => (
                    <li key={article.slug}>
                        <Link href={`${NAVIGATION_URL.articles}/${article.slug}`} className="article-card">
                            <h2 className="article-card-title">{article.title}</h2>
                            <p className="article-card-excerpt">{article.excerpt}</p>
                        </Link>
                    </li>
                ))}
            </ul>

            <FormBlock />
        </main>
    );
};

export default ArticlesPage;
