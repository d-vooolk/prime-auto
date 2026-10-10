import Link from "next/link";
import React from "react";
import {listArticles} from "@/lib/articles";
import {breadcrumbLabels, NAVIGATION_URL} from "@/constants/navigation";
import {BRAND_SERVICES} from "@/constants/brandServices";
import {CAR_BRANDS} from "@/constants/carBrands";

/* Общие куски вкладок «Популярное» и «Конверсии» */

export const PERIODS = [7, 30, 90, 365];

export const periodFrom = (raw: string | undefined) => {
    const requested = Number(raw);
    return PERIODS.includes(requested) ? requested : 30;
};

/** Человеческое название страницы по адресу */
export const titleResolver = () => {
    const titles = new Map<string, string>(Object.entries(breadcrumbLabels));
    titles.set("/", "Главная");
    for (const article of listArticles()) titles.set(`${NAVIGATION_URL.articles}/${article.slug}`, article.title);
    for (const service of BRAND_SERVICES) {
        for (const brand of CAR_BRANDS) titles.set(`${service.basePath}/${brand.slug}`, `${service.label} ${brand.name}`);
    }
    return (path: string) => titles.get(path) ?? path;
};

export const number = (n: number) => n.toLocaleString("ru-RU");
export const percent = (part: number, whole: number, digits = 0) =>
    whole ? `${((part / whole) * 100).toFixed(digits)}%` : "—";

export const Change = ({now, before}: {now: number; before: number}) => {
    if (!before) return <span className="a-note">{now ? "новое" : "—"}</span>;
    const delta = Math.round(((now - before) / before) * 100);
    return <span style={{color: delta >= 0 ? "var(--a-accent)" : "var(--a-danger)"}}>{delta >= 0 ? "+" : ""}{delta}%</span>;
};

export const Bar = ({value, max}: {value: number; max: number}) => (
    <span style={{display: "inline-block", height: 8, borderRadius: 4, background: "var(--a-accent)", width: `${max ? Math.max(2, (value / max) * 100) : 0}%`, verticalAlign: "middle"}} />
);

/** Заголовок раздела статистики: вкладки «Просмотры / Конверсии» и период */
export const StatsHeader = ({tab, days}: {tab: "views" | "conversions"; days: number}) => {
    const base = tab === "views" ? "/admin/stats" : "/admin/stats/conversions";
    return (
        <>
            <div className="a-tabs" style={{marginBottom: 12}}>
                <Link href={`/admin/stats?d=${days}`} className={`a-tab${tab === "views" ? " a-tab-active" : ""}`}>Просмотры</Link>
                <Link href={`/admin/stats/conversions?d=${days}`} className={`a-tab${tab === "conversions" ? " a-tab-active" : ""}`}>Конверсии</Link>
            </div>
            <div className="a-row" style={{justifyContent: "space-between", marginBottom: 16}}>
                <h1 className="a-h1" style={{margin: 0}}>{tab === "views" ? "Популярное" : "Конверсии"}</h1>
                <div className="a-tabs">
                    {PERIODS.map((period) => (
                        <Link key={period} href={`${base}?d=${period}`} className={`a-tab${period === days ? " a-tab-active" : ""}`}>
                            {period === 365 ? "Год" : `${period} дней`}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
};
