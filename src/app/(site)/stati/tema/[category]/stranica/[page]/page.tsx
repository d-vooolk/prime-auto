import {notFound} from "next/navigation";
import '../../../../styles.css';
import ArticlesListing, {extraPages, listingMetadata, parsePage} from "@/components/ArticlesListing/ArticlesListing";
import {ARTICLE_CATEGORIES, getArticleCategory} from "@/constants/articleCategories";

interface PageProps {
    params: Promise<{category: string; page: string}>;
}

export const revalidate = 3600;
export const dynamicParams = true;

export const generateStaticParams = async () =>
    ARTICLE_CATEGORIES.flatMap((category) => extraPages(category).map((page) => ({category: category.slug, page})));

const resolve = async (params: PageProps["params"]) => {
    const {category: slug, page: raw} = await params;
    const category = getArticleCategory(slug) ?? notFound();
    return {category, page: parsePage(raw, category)};
};

export const generateMetadata = async ({params}: PageProps) => listingMetadata(await resolve(params));

const CategoryPageN = async ({params}: PageProps) => <ArticlesListing {...await resolve(params)} />;

export default CategoryPageN;
