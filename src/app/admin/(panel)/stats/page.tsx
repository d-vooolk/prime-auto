import React from "react";
import {listArticles} from "@/lib/articles";
import {DEVICE_LABELS, SOURCE_LABELS, statsReport, type Source} from "@/lib/stats";
import {SITE_URL} from "@/constants/site";
import {Bar, Change, number, percent, periodFrom, StatsHeader, titleResolver} from "@/components/admin/stats-ui";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{d?: string}>;
}

const sourceList = (sources: {source: Source; n: number}[]) =>
    sources.slice(0, 3).map((item) => `${SOURCE_LABELS[item.source]} ${item.n}`).join(", ") || "—";

/**
 * Популярное: просмотры страниц по своему счётчику (src/lib/stats.ts).
 * Считать начали с выкладки счётчика — первые недели цифры маленькие.
 * Метрика остаётся основной аналитикой, здесь — быстрый ответ «что читают».
 */
const StatsPage = async ({searchParams}: PageProps) => {
    const days = periodFrom((await searchParams).d);
    const report = statsReport(days);
    const title = titleResolver();
    const maxDaily = Math.max(1, ...report.daily.map((d) => d.views));
    const maxPage = Math.max(1, ...report.pages.map((p) => p.views));
    const entries = report.sources.reduce((sum, s) => sum + s.n, 0);
    const devicesTotal = report.devices.reduce((sum, d) => sum + d.n, 0);
    const articleTitles = new Map(listArticles().map((a) => [a.slug, a.title]));

    return (
        <>
            <StatsHeader tab="views" days={days} />

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

                    {report.comments.length > 0 && (
                        <>
                            <h2 className="a-h2" style={{marginTop: 20}}>Чего не хватило читателям</h2>
                            <table className="a-table">
                                <tbody>
                                {report.comments.map((c) => (
                                    <tr key={`${c.slug}-${c.ts}`}>
                                        <td>
                                            <div>{c.comment}</div>
                                            <div className="a-note">
                                                {new Date(c.ts).toLocaleDateString("ru-RU")} ·{" "}
                                                <a href={`${SITE_URL}/stati/${c.slug}`} target="_blank" rel="noreferrer">{articleTitles.get(c.slug) ?? c.slug}</a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </section>
            </div>
        </>
    );
};

export default StatsPage;
