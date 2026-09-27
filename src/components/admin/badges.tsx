import type {ArticleRecord} from "@/lib/articles";

export const formatDateTime = (ms: number) =>
    new Date(ms).toLocaleString("ru-RU", {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"});

export const StatusBadge = ({status}: {status: ArticleRecord["status"]}) =>
    status === "published"
        ? <span className="a-badge a-badge-ok">опубликована</span>
        : <span className="a-badge">черновик</span>;

export const ScoreBadge = ({review}: {review: ArticleRecord["review"]}) => {
    if (!review) return <span className="a-badge">—</span>;
    const tone = review.score >= 80 ? "a-badge-ok" : review.score >= 60 ? "a-badge-warn" : "a-badge-bad";
    return <span className={`a-badge ${tone}`} title="Оценка черновика редактором до правок">{review.score}/100</span>;
};

export const UniquenessBadge = ({uniqueness}: {uniqueness: ArticleRecord["uniqueness"]}) => {
    if (!uniqueness) return <span className="a-badge">не проверена</span>;
    const web = uniqueness.web ?? uniqueness.textru;
    // без text.ru и без исходника проверять было не с чем — зелёная плашка тут соврала бы
    if (!web && !uniqueness.source) return <span className="a-badge">по интернету не проверена</span>;
    const tone = uniqueness.passed ? "a-badge-ok" : "a-badge-bad";
    const label = web ? `${web.percent}%` : `совпадение с исходником ${uniqueness.source!.percent}%`;
    return <span className={`a-badge ${tone}`}>{label}</span>;
};
