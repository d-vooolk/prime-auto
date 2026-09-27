import {aiConfigured} from "@/lib/ai";
import {NewArticleForm} from "@/components/admin/NewArticleForm";

export const dynamic = "force-dynamic";

const NewArticlePage = () => (
    <>
        <h1 className="a-h1">Написать статью</h1>
        <NewArticleForm aiReady={aiConfigured()} />
    </>
);

export default NewArticlePage;
