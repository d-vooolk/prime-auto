import {aiConfigured} from "@/lib/ai";
import {NewArticleForm} from "@/components/admin/NewArticleForm";
import {enqueueArticlesAction} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const NewArticlePage = () => (
    <>
        <h1 className="a-h1">Написать статью</h1>
        <NewArticleForm aiReady={aiConfigured()} />

        <section className="a-card">
            <h2 className="a-h2">Пакетом</h2>
            <p className="a-note">
                По одной теме на строку: <code>тема | главный запрос | нюансы</code> (запрос и нюансы — по желанию).
                Статьи пишутся по две одновременно, готовые появляются черновиками в списке статей.
            </p>
            <form action={enqueueArticlesAction}>
                <textarea name="topics" rows={10} className="a-textarea" />
                <button className="a-btn a-btn-primary" disabled={!aiConfigured()}>Поставить в очередь</button>
            </form>
        </section>
    </>
);

export default NewArticlePage;
