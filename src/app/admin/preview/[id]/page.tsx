import Link from "next/link";
import {notFound} from "next/navigation";
import "@/app/(site)/globals.css";
import "@/app/(site)/stati/styles.css";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header.jsx";
import MobileHeader from "@/components/_Mobile/MobileHeader/MobileHeader.jsx";
import "@/components/_HelperComponents/Breadcrumbs/styles.css";
import ArticleView from "@/components/ArticleView/ArticleView";
import {requireAdmin} from "@/lib/auth";
import {getArticle} from "@/lib/articles";

export const dynamic = "force-dynamic";

/* Обычные крошки строятся по адресу страницы, а здесь он /admin/preview/… — рисуем их так, как они будут на сайте */
const PreviewBreadcrumbs = ({title}: {title: string}) => (
    <nav aria-label="breadcrumb" className="breadcrumbs">
        <ul>
            <li><Link href="/">Главная</Link></li>
            <li><Link href="/stati">Статьи</Link></li>
            <li className="current">{title}</li>
        </ul>
    </nav>
);

/*
  Предпросмотр черновика ровно так, как статья будет выглядеть на сайте: с
  шапкой, подвалом и во всю ширину. Поэтому страница вне (panel) — рамка
  админки с её max-width сжимала статью в узкую полосу.
*/
const PreviewPage = async ({params}: {params: Promise<{id: string}>}) => {
    await requireAdmin();
    const article = getArticle(Number((await params).id));
    if (!article) notFound();

    return (
        <>
            <Header />
            <MobileHeader />
            <main>
                <div className="article-wrapper">
                    <div className="article-container">
                        <PreviewBreadcrumbs title={article.title} />
                        <ArticleView article={article} />
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default PreviewPage;
