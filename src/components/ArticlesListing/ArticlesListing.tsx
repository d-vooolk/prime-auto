import React from "react";
import Link from "next/link";
import {notFound, permanentRedirect} from "next/navigation";
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {formatArticleDate} from "@/components/ArticleView/ArticleView";
import {imageSize} from "@/lib/article-body";
import {getPublishedArticles, type ArticleRecord} from "@/lib/articles";
import {ARTICLE_CATEGORIES, categoryCover, categoryOf, categoryPath, type ArticleCategory} from "@/constants/articleCategories";
import {NAVIGATION_URL} from "@/constants/navigation";
import {absoluteUrl, breadcrumbJsonLd, buildMetadata} from "@/utils/seo";

/*
  Список статей: общий для /stati, рубрик /stati/tema/<рубрика> и их страниц
  /…/stranica/<n>. Как это устроено для поисковиков:

  - фильтр по темам — обычные ссылки на страницы рубрик, а не кнопки на JS:
    у каждой рубрики свой адрес, H1, текст и место в sitemap;
  - пагинация — тоже ссылки с адресом в пути. Вторая и дальше страницы
    отдаются с noindex, follow и собственным canonical: в выдаче им делать
    нечего (тот же раздел, только старее), а ссылки на статьи с них
    учитываются. Каждая статья при этом лежит в sitemap и на странице своей
    рубрики, так что с индексируемых страниц до неё одна ссылка;
  - /stati/stranica/1 — постоянный редирект на /stati, номер страницы
    больше последней — 404, чтобы не плодить пустые дубли.
*/

export const ARTICLES_PER_PAGE = 15;

const ALL = {
    title: 'Статьи про автосвет и ремонт фар',
    metaTitle: 'Статьи про автосвет и ремонт фар | Prime Auto',
    metaDescription: 'Разборы по автосвету: Bi-Led против ксенона, запотевание фар, светодиоды ' +
        'в галоген, полировка и защита плёнкой. Опыт мастерской в Минске.',
    lead: 'Разбираем вопросы, которые чаще всего задают перед работой: чем один тип света ' +
        'отличается от другого, почему фары потеют и мутнеют, что стоит спросить у мастера. ' +
        'Без рекламы и без «закажите прямо сейчас» — если ответ «вам это не нужно», так и написано.',
};

interface ListingArgs {
    page: number;
    category?: ArticleCategory;
}

const listPath = ({page, category}: ListingArgs) => {
    const base = category ? categoryPath(category.slug) : NAVIGATION_URL.articles;
    return page > 1 ? `${base}/stranica/${page}` : base;
};

const articlesOf = (category?: ArticleCategory) => {
    const articles = getPublishedArticles();
    return category ? articles.filter((article) => categoryOf(article).slug === category.slug) : articles;
};

const pageCount = (total: number) => Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE));

/** Номер страницы из адреса: только целое ≥ 2 (первая живёт без /stranica/1) */
export const parsePage = (raw: string, category?: ArticleCategory): number => {
    if (raw === '1') permanentRedirect(listPath({page: 1, category}));
    if (!/^[2-9]\d*$|^1\d+$/.test(raw)) notFound();
    return Number(raw);
};

/** Номера страниц для generateStaticParams */
export const extraPages = (category?: ArticleCategory): string[] =>
    Array.from({length: pageCount(articlesOf(category).length) - 1}, (_, index) => String(index + 2));

export const listingMetadata = ({page, category}: ListingArgs) => {
    const title = category ? `${category.metaTitle} | Prime Auto` : ALL.metaTitle;
    const description = category ? category.metaDescription : ALL.metaDescription;
    return buildMetadata({
        title: page > 1 ? title.replace(' | Prime Auto', ` — страница ${page} | Prime Auto`) : title,
        description: page > 1 ? `Страница ${page}. ${description}` : description,
        path: listPath({page, category}),
        noIndex: page > 1,
    });
};

/** Плитка статьи. Первые картинки грузятся сразу — они на первом экране */
const ArticleTile = ({article, eager}: {article: ArticleRecord; eager: boolean}) => {
    // своей обложки нет — берём обложку рубрики
    const cover = article.cover || categoryCover(categoryOf(article).slug);
    const size = imageSize(cover);
    return (
        <Link href={`${NAVIGATION_URL.articles}/${article.slug}`} className="article-tile">
            {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    className="article-tile-cover"
                    src={cover}
                    alt={article.cover ? (article.coverAlt || article.title) : ''}
                    width={size?.width}
                    height={size?.height}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                />
            ) : (
                <div className="article-tile-placeholder" aria-hidden="true">Prime Auto</div>
            )}
            <div className="article-tile-body">
                <span className="article-tile-meta">
                    <span className="article-tile-category">{categoryOf(article).name}</span>
                    <time className="article-tile-date" dateTime={new Date(article.publishedAt ?? article.createdAt).toISOString()}>
                        {formatArticleDate(article.publishedAt ?? article.createdAt)}
                    </time>
                </span>
                <h2 className="article-tile-title">{article.title}</h2>
                {article.excerpt && <p className="article-tile-excerpt">{article.excerpt}</p>}
                <span className="article-tile-more">Читать →</span>
            </div>
        </Link>
    );
};

/** Фильтр по темам: ссылки на страницы рубрик с числом статей */
const CategoryNav = ({active, all}: {active?: ArticleCategory; all: ArticleRecord[]}) => {
    const counts = new Map<string, number>();
    for (const article of all) {
        const slug = categoryOf(article).slug;
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    const items = [
        {key: 'all', name: 'Все статьи', href: NAVIGATION_URL.articles, count: all.length, current: !active},
        ...ARTICLE_CATEGORIES
            .filter((category) => counts.get(category.slug))
            .map((category) => ({
                key: category.slug,
                name: category.name,
                href: categoryPath(category.slug),
                count: counts.get(category.slug) ?? 0,
                current: active?.slug === category.slug,
            })),
    ];

    return (
        <nav className="articles-topics" aria-label="Темы статей">
            <ul>
                {items.map((item) => (
                    <li key={item.key}>
                        <Link
                            href={item.href}
                            className={`articles-topic${item.current ? ' articles-topic--active' : ''}`}
                            aria-current={item.current ? 'page' : undefined}
                        >
                            {item.name}
                            <span className="articles-topic-count">{item.count}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

const Pagination = ({page, pages, category}: {page: number; pages: number; category?: ArticleCategory}) => {
    if (pages < 2) return null;
    return (
        <nav className="articles-pagination" aria-label="Страницы списка статей">
            {page > 1 ? (
                <Link href={listPath({page: page - 1, category})} className="articles-page-link articles-page-step">
                    ← Назад
                </Link>
            ) : <span className="articles-page-step articles-page-step--off" aria-hidden="true">← Назад</span>}
            <ul>
                {Array.from({length: pages}, (_, index) => index + 1).map((number) => (
                    <li key={number}>
                        {number === page ? (
                            <span className="articles-page-link articles-page-link--active" aria-current="page">{number}</span>
                        ) : (
                            <Link href={listPath({page: number, category})} className="articles-page-link">
                                {number}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
            {page < pages ? (
                <Link href={listPath({page: page + 1, category})} className="articles-page-link articles-page-step">
                    Дальше →
                </Link>
            ) : <span className="articles-page-step articles-page-step--off" aria-hidden="true">Дальше →</span>}
        </nav>
    );
};

const ArticlesListing = ({page, category}: ListingArgs) => {
    const all = getPublishedArticles();
    const articles = articlesOf(category);
    const pages = pageCount(articles.length);
    if (page > pages) notFound();

    const shown = articles.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);
    const path = listPath({page, category});
    const title = category ? category.h1 : ALL.title;
    const crumbs = [
        {name: 'Статьи', path: NAVIGATION_URL.articles},
        ...(category ? [{name: category.name, path: categoryPath(category.slug)}] : []),
        ...(page > 1 ? [{name: `Страница ${page}`, path}] : []),
    ];

    return (
        <main>
            <div className="articles-page-wrapper">
                <JsonLd
                    data={[
                        {
                            '@context': 'https://schema.org',
                            '@type': 'ItemList',
                            '@id': `${absoluteUrl(path)}#list`,
                            name: title,
                            itemListElement: shown.map((article, index) => ({
                                '@type': 'ListItem',
                                position: (page - 1) * ARTICLES_PER_PAGE + index + 1,
                                url: absoluteUrl(`${NAVIGATION_URL.articles}/${article.slug}`),
                                name: article.title,
                            })),
                        },
                        breadcrumbJsonLd([{name: 'Главная', path: NAVIGATION_URL.home}, ...crumbs]),
                    ]}
                />

                <div className="articles-container">
                    <Breadcrumbs items={crumbs} />

                    <div className="articles-intro">
                        <h1 className="articles-h1">
                            {title}
                            {page > 1 && <span className="articles-h1-page">, страница {page}</span>}
                        </h1>
                        {/* Вводный текст — только на первой странице: на остальных он был бы дублем */}
                        {page === 1 && <p className="articles-lead">{category ? category.intro : ALL.lead}</p>}
                        {page === 1 && category && (
                            <p className="articles-service">
                                Нужна работа, а не статья? <Link href={category.service.href}>{category.service.title} — цены и запись</Link>
                            </p>
                        )}
                    </div>

                    <CategoryNav active={category} all={all} />

                    <ul className="articles-grid">
                        {shown.map((article, index) => (
                            <li key={article.slug}>
                                <ArticleTile article={article} eager={page === 1 && index < 5} />
                            </li>
                        ))}
                    </ul>

                    <Pagination page={page} pages={pages} category={category} />
                </div>
            </div>

            <FormBlock />
        </main>
    );
};

export default ArticlesListing;
