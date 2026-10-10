import '../../styles.css';
import ArticlesListing, {extraPages, listingMetadata, parsePage} from "@/components/ArticlesListing/ArticlesListing";

interface PageProps {
    params: Promise<{page: string}>;
}

export const revalidate = 3600;
export const dynamicParams = true;

export const generateStaticParams = async () => extraPages().map((page) => ({page}));

export const generateMetadata = async ({params}: PageProps) =>
    listingMetadata({page: parsePage((await params).page)});

const ArticlesPageN = async ({params}: PageProps) => <ArticlesListing page={parsePage((await params).page)} />;

export default ArticlesPageN;
