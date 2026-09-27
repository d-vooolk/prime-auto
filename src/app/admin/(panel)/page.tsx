import Link from "next/link";
import {listArticles} from "@/lib/articles";
import {JOB_TITLES, recentJobs} from "@/lib/article-jobs";
import {createEmptyArticleAction} from "@/app/admin/actions";
import {formatDateTime, ScoreBadge, StatusBadge, UniquenessBadge} from "@/components/admin/badges";

export const dynamic = "force-dynamic";

const JOB_STATUS = {running: "идёт", done: "готово", error: "ошибка"} as const;

const Dashboard = () => {
    const articles = listArticles();
    const jobs = recentJobs(8);

    return (
        <>
            <div className="a-row" style={{justifyContent: "space-between", marginBottom: 16}}>
                <h1 className="a-h1" style={{margin: 0}}>Статьи</h1>
                <div className="a-row">
                    <form action={createEmptyArticleAction}>
                        <button className="a-btn">Пустая статья</button>
                    </form>
                    <Link href="/admin/new" className="a-btn a-btn-primary">Написать с нейросетью</Link>
                </div>
            </div>

            {jobs.length > 0 && (
                <section className="a-card">
                    <h2 className="a-h2">Последние задачи</h2>
                    <table className="a-table">
                        <tbody>
                        {jobs.map((job) => (
                            <tr key={job.id}>
                                <td><Link href={`/admin/jobs/${job.id}`}>{JOB_TITLES[job.kind]}</Link></td>
                                <td>{job.input.topic || job.input.sourceUrl || "—"}</td>
                                <td>
                                    <span className={`a-badge ${job.status === "done" ? "a-badge-ok" : job.status === "error" ? "a-badge-bad" : "a-badge-warn"}`}>
                                        {JOB_STATUS[job.status]}
                                    </span>
                                </td>
                                <td className="a-note">{formatDateTime(job.createdAt)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            )}

            <section className="a-card">
                {articles.length ? (
                    <table className="a-table">
                        <thead>
                        <tr>
                            <th>Заголовок</th>
                            <th>Статус</th>
                            <th>Качество</th>
                            <th>Уникальность</th>
                            <th>Изменена</th>
                        </tr>
                        </thead>
                        <tbody>
                        {articles.map((article) => (
                            <tr key={article.id}>
                                <td>
                                    <Link href={`/admin/articles/${article.id}`}>{article.title}</Link>
                                    <div className="a-note" style={{margin: 0}}>/stati/{article.slug}</div>
                                </td>
                                <td><StatusBadge status={article.status} /></td>
                                <td><ScoreBadge review={article.review} /></td>
                                <td><UniquenessBadge uniqueness={article.uniqueness} /></td>
                                <td className="a-note">{formatDateTime(article.updatedAt)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Статей пока нет.</p>
                )}
            </section>
        </>
    );
};

export default Dashboard;
