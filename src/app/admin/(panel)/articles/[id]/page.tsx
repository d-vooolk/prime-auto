import Link from "next/link";
import {notFound} from "next/navigation";
import {aiConfigured} from "@/lib/ai";
import {articleChecks} from "@/lib/article-review";
import {getArticle} from "@/lib/articles";
import {describeProblem, findLinkProblems} from "@/lib/link-check";
import {textruConfigured, uniqueMin} from "@/lib/uniqueness";
import {ArticleEditor} from "@/components/admin/ArticleEditor";
import {formatDateTime, ScoreBadge, StatusBadge, UniquenessBadge} from "@/components/admin/badges";

export const dynamic = "force-dynamic";

const ArticlePage = async ({params}: {params: Promise<{id: string}>}) => {
    const article = getArticle(Number((await params).id));
    if (!article) notFound();

    const linkProblems = article.body.trim() ? await findLinkProblems(article.body) : [];
    const checks = article.body.trim()
        ? [
            ...articleChecks(article, article.keyword),
            ...linkProblems.map((problem) => `${problem.state === "dead" ? "Битая ссылка" : "Ссылку не удалось проверить"}: ${describeProblem(problem)}`),
        ]
        : [];
    const {review, uniqueness} = article;
    const web = uniqueness ? uniqueness.web ?? uniqueness.textru ?? null : null;

    return (
        <>
            <p className="a-note"><Link href="/admin">← Все статьи</Link></p>
            <h1 className="a-h1">{article.title}</h1>
            <div className="a-row" style={{marginBottom: 16}}>
                <StatusBadge status={article.status} />
                <span className="a-note" style={{margin: 0}}>
                    изменена {formatDateTime(article.updatedAt)}
                    {article.publishedAt ? `, опубликована ${formatDateTime(article.publishedAt)}` : ""}
                </span>
            </div>

            <div className="a-grid2">
                <section className="a-card">
                    <h2 className="a-h2">Качество <ScoreBadge review={review} /></h2>
                    {review ? (
                        <>
                            <p className="a-note">
                                Оценка редактора до правок, {formatDateTime(review.at)}.
                                {review.revised ? " Исправления внесены в текст." : " Текст не менялся."}
                            </p>
                            <ul className="a-list">{review.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>
                        </>
                    ) : (
                        <p className="a-note">Нейросеть-редактор эту статью ещё не проверяла.</p>
                    )}
                    {checks.length > 0 && (
                        <>
                            <h3 className="a-label" style={{marginTop: 12}}>Автопроверка сейчас</h3>
                            <ul className="a-list">{checks.map((check) => <li key={check}>{check}</li>)}</ul>
                        </>
                    )}
                </section>

                <section className="a-card">
                    <h2 className="a-h2">Уникальность <UniquenessBadge uniqueness={uniqueness} /></h2>
                    {uniqueness ? (
                        <>
                            <p className="a-note">
                                Проверено {formatDateTime(uniqueness.at)}
                                {uniqueness.rounds ? `, переписано кругов: ${uniqueness.rounds}` : ""}.
                                {uniqueness.passed ? " Порог пройден." : " Порог не пройден — посмотрите совпадения ниже."}
                            </p>
                            <ul className="a-list">
                                {web && (
                                    <li>
                                        text.ru:{" "}
                                        <strong>{web.percent}%</strong> (порог {uniqueMin()}%)
                                    </li>
                                )}
                                {(uniqueness.webError ?? uniqueness.textruError) && <li>{uniqueness.webError ?? uniqueness.textruError}</li>}
                                {uniqueness.source && (
                                    <li>
                                        Совпадения с текстом конкурента: {uniqueness.source.percent}%
                                        {uniqueness.source.fragments ? `, фрагментов: ${uniqueness.source.fragments}` : " — дословных заимствований нет"}
                                    </li>
                                )}
                            </ul>
                            {web && web.urls.length > 0 && (
                                <>
                                    <h3 className="a-label" style={{marginTop: 12}}>Где найдены совпадения</h3>
                                    <ul className="a-list">
                                        {web.urls.map((item) => (
                                            <li key={item.url}>
                                                <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a> — {item.percent}%
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </>
                    ) : (
                        <p className="a-note">
                            Ещё не проверялась.
                            {textruConfigured() ? "" : " text.ru не подключён — будет только сравнение с исходником."}
                        </p>
                    )}
                    {article.sourceUrl && (
                        <p className="a-note">
                            Исходник: <a href={article.sourceUrl} target="_blank" rel="noreferrer">{article.sourceUrl}</a>
                        </p>
                    )}
                </section>
            </div>

            <ArticleEditor
                id={article.id}
                published={article.status === "published"}
                aiReady={aiConfigured()}
                initial={{
                    title: article.title,
                    slug: article.slug,
                    metaTitle: article.metaTitle,
                    metaDescription: article.metaDescription,
                    excerpt: article.excerpt,
                    body: article.body,
                    cover: article.cover,
                    coverAlt: article.coverAlt,
                    faq: article.faq,
                    related: article.related,
                    keyword: article.keyword,
                    category: article.category,
                }}
            />
        </>
    );
};

export default ArticlePage;
