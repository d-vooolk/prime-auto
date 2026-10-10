import {notFound} from "next/navigation";
import '../../styles.css';
import ArticlesListing, {listingMetadata} from "@/components/ArticlesListing/ArticlesListing";
import {ARTICLE_CATEGORIES, getArticleCategory} from "@/constants/articleCategories";

interface PageProps {
    params: Promise<{category: string}>;
}

export const revalidate = 3600;
export const dynamicParams = false;

export const generateStaticParams = async () => ARTICLE_CATEGORIES.map((category) => ({category: category.slug}));

const categoryFrom = async (params: PageProps["params"]) => getArticleCategory((await params).category) ?? notFound();

export const generateMetadata = async ({params}: PageProps) =>
    listingMetadata({page: 1, category: await categoryFrom(params)});

const CategoryPage = async ({params}: PageProps) => <ArticlesListing page={1} category={await categoryFrom(params)} />;

export default CategoryPage;
