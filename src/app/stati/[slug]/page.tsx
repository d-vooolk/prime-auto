import React from "react";
import Link from "next/link";
import {notFound} from "next/navigation";
import '../styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {articleSlugs, getArticle} from "@/constants/articles";
import {NAVIGATION_URL} from "@/constants/navigation";
import {articleJsonLd, breadcrumbJsonLd, buildMetadata} from "@/utils/seo";

interface PageProps {
    params: Promise<{slug: string}>;
}

export const generateStaticParams = async () => articleSlugs().map((slug) => ({slug}));
/*
  Списком статических путей набор исчерпывается: любой другой слаг
  отдаёт 404 сразу, без рендера страницы. Без этого Next пытается
  собрать страницу под любой присланный адрес.
*/
export const dynamicParams = false;


export const generateMetadata = async ({params}: PageProps) => {
    const {slug} = await params;
    const article = getArticle(slug);

    if (!article) {
        return {title: 'Статья не найдена'};
    }

    return buildMetadata({
        title: `${article.metaTitle} | Prime Auto`,
        description: article.metaDescription,
        path: `${NAVIGATION_URL.articles}/${article.slug}`,
    });
};

/** Дата в подписи под заголовком — человекочитаемо, в разметке остаётся ISO */
const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});

const ArticlePage = async ({params}: PageProps) => {
    const {slug} = await params;
    const article = getArticle(slug);

    if (!article) {
        notFound();
    }

    const path = `${NAVIGATION_URL.articles}/${article.slug}`;

    return (
        <main className="article-wrapper">
            <JsonLd
                data={[
                    articleJsonLd({
                        title: article.title,
                        description: article.excerpt,
                        path,
                        published: article.published,
                        updated: article.updated,
                    }),
                    breadcrumbJsonLd([
                        {name: 'Главная', path: NAVIGATION_URL.home},
                        {name: 'Статьи', path: NAVIGATION_URL.articles},
                        {name: article.title, path},
                    ]),
                ]}
            />

            <Breadcrumbs currentLabel={article.title} />

            <article className="article-body">
                <h1 className="article-h1">{article.title}</h1>
                <p className="article-meta">
                    <time dateTime={article.updated}>Обновлено {formatDate(article.updated)}</time>
                </p>

                <p className="article-excerpt">{article.excerpt}</p>

                {article.sections.map((section) => (
                    <section key={section.heading}>
                        <h2 className="article-section-title">{section.heading}</h2>

                        {section.paragraphs.map((paragraph) => (
                            <p className="article-paragraph" key={paragraph.slice(0, 40)}>{paragraph}</p>
                        ))}

                        {section.list && (
                            <ul className="article-list">
                                {section.list.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}

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
            </article>

            <FormBlock />
        </main>
    );
};

export default ArticlePage;
