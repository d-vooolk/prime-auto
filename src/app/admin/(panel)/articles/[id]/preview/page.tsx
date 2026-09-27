import {notFound} from "next/navigation";
import "@/app/(site)/globals.css";
import "@/app/(site)/stati/styles.css";
import {getArticle} from "@/lib/articles";
import ArticleView, {ArticleFaq} from "@/components/ArticleView/ArticleView";

export const dynamic = "force-dynamic";

/** Черновик так, как он будет выглядеть на сайте, — без шапки и формы заявки */
const PreviewPage = async ({params}: {params: Promise<{id: string}>}) => {
    const article = getArticle(Number((await params).id));
    if (!article) notFound();
    return (
        <>
            <div className="article-wrapper">
                <ArticleView article={article} />
            </div>
            <ArticleFaq article={article} />
        </>
    );
};

export default PreviewPage;
