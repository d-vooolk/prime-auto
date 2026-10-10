import React from "react";
import {notFound} from "next/navigation";
import '../styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import ArticleView from "@/components/ArticleView/ArticleView";
import ArticleVote from "@/components/ArticleVote/ArticleVote";
import {getPublishedArticle, getPublishedArticles, isoDate} from "@/lib/articles";
import {NAVIGATION_URL} from "@/constants/navigation";
import {categoryCover, categoryOf, categoryPath} from "@/constants/articleCategories";
import {imageSize} from "@/lib/article-body";
import {articleJsonLd, breadcrumbJsonLd, buildMetadata} from "@/utils/seo";

interface PageProps {
    params: Promise<{slug: string}>;
}

/*
  Статьи живут в базе и публикуются из админки, поэтому набор адресов на
  сборке не окончательный: опубликованные к этому моменту собираются заранее,
  новые — при первом заходе, дальше отдаются из кеша. После правки в админке
  страница обновляется сразу (revalidatePath), а revalidate — страховка на
  случай, если это не сработало.
*/
export const revalidate = 3600;
export const dynamicParams = true;

export const generateStaticParams = async () => getPublishedArticles().map((article) => ({slug: article.slug}));

export const generateMetadata = async ({params}: PageProps) => {
    const {slug} = await params;
    const article = getPublishedArticle(slug);

    if (!article) {
        return {title: 'Статья не найдена'};
    }

    return buildMetadata({
        title: `${article.metaTitle || article.title} | Prime Auto`,
        description: article.metaDescription || article.excerpt,
        path: `${NAVIGATION_URL.articles}/${article.slug}`,
        // без своей обложки в превью соцсетей уходит обложка рубрики
        ogImage: article.cover || categoryCover(categoryOf(article).slug),
        ogImageSize: imageSize(article.cover || categoryCover(categoryOf(article).slug)),
        article: {
            published: isoDate(article.publishedAt ?? article.createdAt),
            modified: isoDate(article.updatedAt),
            section: categoryOf(article).name,
        },
    });
};

const ArticlePage = async ({params}: PageProps) => {
    const {slug} = await params;
    const article = getPublishedArticle(slug);

    if (!article) {
        notFound();
    }

    const path = `${NAVIGATION_URL.articles}/${article.slug}`;
    const category = categoryOf(article);
    const crumbs = [
        {name: 'Статьи', path: NAVIGATION_URL.articles},
        {name: category.name, path: categoryPath(category.slug)},
        {name: article.title, path},
    ];

    return (
        <main>
            <div className="article-wrapper">
                <JsonLd
                    data={[
                        articleJsonLd({
                            title: article.title,
                            description: article.excerpt || article.metaDescription,
                            path,
                            published: isoDate(article.publishedAt ?? article.createdAt),
                            updated: isoDate(article.updatedAt),
                            image: article.cover || categoryCover(category.slug),
                            section: category.name,
                        }),
                        breadcrumbJsonLd([{name: 'Главная', path: NAVIGATION_URL.home}, ...crumbs]),
                    ]}
                />

                <div className="article-container">
                    <Breadcrumbs items={crumbs} />
                    <ArticleView article={article} />
                    <ArticleVote slug={article.slug} />
                </div>
            </div>

            <FormBlock />
        </main>
    );
};

export default ArticlePage;
