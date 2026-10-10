import Link from "next/link";
import React from "react";
import {listArticles} from "@/lib/articles";
import {DEVICE_LABELS, SOURCE_LABELS, statsReport, type Source} from "@/lib/stats";
import {breadcrumbLabels, NAVIGATION_URL} from "@/constants/navigation";
import {BRAND_SERVICES} from "@/constants/brandServices";
import {CAR_BRANDS} from "@/constants/carBrands";
import {SITE_URL} from "@/constants/site";

export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90, 365];

interface PageProps {
    searchParams: Promise<{d?: string}>;
}

/** Человеческое название страницы по адресу */
const titleResolver = () => {
    const titles = new Map<string, string>(Object.entries(breadcrumbLabels));
    titles.set("/", "Главная");
    for (const article of listArticles()) titles.set(`${NAVIGATION_URL.articles}/${article.slug}`, article.title);
    for (const service of BRAND_SERVICES) {
        for (const brand of CAR_BRANDS) titles.set(`${service.basePath}/${brand.slug}`, `${service.label} ${brand.name}`);
    }
    return (path: string) => titles.get(path) ?? path;
};

const number = (n: number) => n.toLocaleString("ru-RU");
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

const Change = ({now, before}: {now: number; before: number}) => {
    if (!before) return <span className="a-note">{now ? "новое" : "—"}</span>;
    const delta = Math.round(((now - before) / before) * 100);
    return <span style={{color: delta >= 0 ? "var(--a-accent)" : "var(--a-danger)"}}>{delta >= 0 ? "+" : ""}{delta}%</span>;
};

const Bar = ({value, max}: {value: number; max: number}) => (
    <span style={{display: "inline-block", height: 8, borderRadius: 4, background: "var(--a-accent)", width: `${max ? Math.max(2, (value / max) * 100) : 0}%`, verticalAlign: "middle"}} />
);

const sourceList = (sources: {source: Source; n: number}[]) =>
    sources.slice(0, 3).map((item) => `${SOURCE_LABELS[item.source]} ${item.n}`).join(", ") || "—";

/**
 * Популярное: просмотры страниц по своему счётчику (src/lib/stats.ts).
 * Считать начали с выкладки счётчика — первые недели цифры маленькие.
 * Метрика остаётся основной аналитикой, здесь — быстрый ответ «что читают».
 */
const StatsPage = async ({searchParams}: PageProps) => {
    const requested = Number((await searchParams).d);
    const days = PERIODS.includes(requested) ? requested : 30;
    const report = statsReport(days);
    const title = titleResolver();
    const maxDaily = Math.max(1, ...report.daily.map((d) => d.views));
    const maxPage = Math.max(1, ...report.pages.map((p) => p.views));
    const entries = report.sources.reduce((sum, s) => sum + s.n, 0);
    const devicesTotal = report.devices.reduce((sum, d) => sum + d.n, 0);
    const articleTitles = new Map(listArticles().map((a) => [a.slug, a.title]));

    return (
        <>
            <div className="a-row" style={{justifyContent: "space-between", marginBottom: 16}}>
                <h1 className="a-h1" style={{margin: 0}}>Популярное</h1>
                <div className="a-tabs">
                    {PERIODS.map((period) => (
                        <Link key={period} href={`/admin/stats?d=${period}`} className={`a-tab${period === days ? " a-tab-active" : ""}`}>
                            {period === 365 ? "Год" : `${period} дней`}
                        </Link>
                    ))}
                </div>
            </div>

            <section className="a-card">
                <div className="a-row" style={{gap: 40, flexWrap: "wrap"}}>
                    <div><div className="a-note">Просмотры</div><b style={{fontSize: 28}}>{number(report.totals.views)}</b> <Change now={report.totals.views} before={report.totals.prevViews} /></div>
                    <div><div className="a-note">Посетители (уник. за день)</div><b style={{fontSize: 28}}>{number(report.totals.visitors)}</b> <Change now={report.totals.visitors} before={report.totals.prevVisitors} /></div>
                    <div><div className="a-note">Визиты (входы на сайт)</div><b style={{fontSize: 28}}>{number(report.totals.entries)}</b></div>
                    <div><div className="a-note">Страниц за визит</div><b style={{fontSize: 28}}>{report.totals.entries ? (report.totals.views / report.totals.entries).toFixed(1) : "—"}</b></div>
                </div>
                <p className="a-hint" style={{marginTop: 12}}>
                    {report.from} — {report.to}, сравнение с предыдущими {days} днями. Свой счётчик сайта: без cookies,
                    повторный просмотр той же страницы в течение 30 минут не считается, боты отсечены.
                    Работает с 10.10.2026 — до этого данных нет.
                </p>
            </section>

            {report.daily.length > 1 && (
                <section className="a-card">
                    <h2 className="a-h2">По дням</h2>
                    <div style={{display: "flex", alignItems: "flex-end", gap: 2, height: 120}}>
                        {report.daily.map((d) => (
                            <div key={d.day} title={`${d.day}: ${d.views} просм., ${d.visitors} посет.`}
                                 style={{flex: 1, background: "var(--a-accent)", opacity: .85, borderRadius: "3px 3px 0 0", height: `${(d.views / maxDaily) * 100}%`, minHeight: 2}} />
                        ))}
                    </div>
                    <div className="a-row a-note" style={{justifyContent: "space-between", marginTop: 6}}>
                        <span>{report.daily[0].day}</span><span>{report.daily[report.daily.length - 1].day}</span>
                    </div>
                </section>
            )}

            <section className="a-card">
                <h2 className="a-h2">Страницы</h2>
                {report.pages.length ? (
                    <table className="a-table">
                        <thead>
                        <tr>
                            <th>Страница</th>
                            <th style={{width: "22%"}}>Просмотры</th>
                            <th>Посетители</th>
                            <th>С телефона</th>
                            <th>Входы и откуда</th>
                            <th>Динамика</th>
                        </tr>
                        </thead>
                        <tbody>
                        {report.pages.map((page) => (
                            <tr key={page.path}>
                                <td>
                                    <a href={`${SITE_URL}${page.path}`} target="_blank" rel="noreferrer">{title(page.path)}</a>
                                    <div className="a-note a-mono">{page.path}</div>
                                </td>
                                <td><b>{number(page.views)}</b> <Bar value={page.views} max={maxPage} /></td>
                                <td>{number(page.visitors)}</td>
                                <td>{percent(page.mobile, page.views)}</td>
                                <td className="a-note">{page.entries ? `${page.entries}: ${sourceList(page.sources)}` : "—"}</td>
                                <td><Change now={page.views} before={page.prevViews} /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p className="a-note">Пока нет данных — просмотры начнут появляться после первых заходов на сайт.</p>}
            </section>

            <div className="a-grid2">
                <section className="a-card">
                    <h2 className="a-h2">Откуда приходят</h2>
                    <p className="a-hint">По входам на сайт — первая страница визита.</p>
                    <table className="a-table">
                        <tbody>
                        {report.sources.map((s) => (
                            <tr key={s.source}>
                                <td>{SOURCE_LABELS[s.source]}</td>
                                <td style={{width: "40%"}}><Bar value={s.n} max={report.sources[0]?.n ?? 1} /></td>
                                <td>{number(s.n)}</td>
                                <td className="a-note">{percent(s.n, entries)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {report.referrers.length > 0 && (
                        <>
                            <h2 className="a-h2" style={{marginTop: 20}}>Сайты, с которых переходят</h2>
                            <table className="a-table">
                                <tbody>
                                {report.referrers.map((r) => (
                                    <tr key={r.host}><td className="a-mono">{r.host}</td><td>{number(r.n)}</td></tr>
                                ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </section>

                <section className="a-card">
                    <h2 className="a-h2">Устройства</h2>
                    <p className="a-hint">По посетителям.</p>
                    <table className="a-table">
                        <tbody>
                        {report.devices.map((d) => (
                            <tr key={d.device}>
                                <td>{DEVICE_LABELS[d.device]}</td>
                                <td style={{width: "40%"}}><Bar value={d.n} max={report.devices[0]?.n ?? 1} /></td>
                                <td>{number(d.n)}</td>
                                <td className="a-note">{percent(d.n, devicesTotal)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <h2 className="a-h2" style={{marginTop: 20}}>«Статья полезна?»</h2>
                    <p className="a-hint">Ответы под статьями, за всё время. Много «нет» — повод переписать статью.</p>
                    {report.votes.length ? (
                        <table className="a-table">
                            <tbody>
                            {report.votes.map((v) => (
                                <tr key={v.slug}>
                                    <td><a href={`${SITE_URL}/stati/${v.slug}`} target="_blank" rel="noreferrer">{articleTitles.get(v.slug) ?? v.slug}</a></td>
                                    <td style={{color: "var(--a-accent)"}}>👍 {v.yes}</td>
                                    <td style={{color: "var(--a-danger)"}}>👎 {v.no}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : <p className="a-note">Пока никто не ответил.</p>}
                </section>
            </div>
        </>
    );
};

export default StatsPage;
