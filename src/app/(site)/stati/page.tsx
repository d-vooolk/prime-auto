import './styles.css';
import ArticlesListing, {listingMetadata} from "@/components/ArticlesListing/ArticlesListing";

export const metadata = listingMetadata({page: 1});

/* Список собирается из базы; после публикации в админке обновляется сразу */
export const revalidate = 3600;

const ArticlesPage = () => <ArticlesListing page={1} />;

export default ArticlesPage;
