import React from "react";
import {searchReport, type Engine, type EngineTotals, type QueryRow} from "@/lib/search";
import {refreshSearchAction} from "@/app/admin/actions";
import {SITE_URL} from "@/constants/site";
import {Change, number, StatsHeader, titleResolver} from "@/components/admin/stats-ui";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{e?: string}>;
}

const ENGINE = {google: "Google", yandex: "Яндекс"} as const;

const EVENTS: Record<string, string> = {
    APPEARED_IN_SEARCH: "появилась в поиске",
    REMOVED_FROM_SEARCH: "исключена из поиска",
};

const PROBLEMS: Record<string, string> = {
    DUPLICATE_PAGES: "Дубли страниц",
    NO_METRIKA_COUNTER_BINDING: "Счётчик Метрики не привязан",
    NO_METRIKA_COUNTER_CRAWL_ENABLED: "Обход по счётчику выключен",
    NO_SITEMAP_MODIFICATIONS: "Sitemap давно не менялся",
    SLOW_AVG_RESPONSE_TIME: "Медленный ответ сервера",
    DOCUMENTS_MISSING_TITLE: "Страницы без title",
    DOCUMENTS_MISSING_DESCRIPTION: "Страницы без description",
};

const pos = (value: number | null) => (value === null ? "—" : value.toFixed(1));

/** Изменение позиции: меньше — лучше, поэтому рост позиции зелёный при уменьшении числа */
const PosChange = ({now, before}: {now: number; before: number | null}) => {
    if (before === null) return <span className="a-note">новый</span>;
    const delta = before - now;
    if (Math.abs(delta) < 0.5) return <span className="a-note">≈</span>;
    return <span style={{color: delta > 0 ? "var(--a-accent)" : "var(--a-danger)"}}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}</span>;
};

const Totals = ({title, totals, dates}: {title: string; totals: EngineTotals | null; dates: {from: string; to: string} | null}) => (
    <section className="a-card">
        <h2 className="a-h2">{title}</h2>
        {totals ? (
            <>
                <div className="a-row" style={{gap: 32, flexWrap: "wrap"}}>
                    <div><div className="a-note">Клики</div><b style={{fontSize: 26}}>{number(totals.clicks)}</b> <Change now={totals.clicks} before={totals.prevClicks} /></div>
                    <div><div className="a-note">Показы</div><b style={{fontSize: 26}}>{number(totals.impressions)}</b> <Change now={totals.impressions} before={totals.prevImpressions} /></div>
                    <div><div className="a-note">CTR</div><b style={{fontSize: 26}}>{(totals.ctr * 100).toFixed(1)}%</b></div>
                    <div><div className="a-note">Ср. позиция</div><b style={{fontSize: 26}}>{pos(totals.position)}</b> {totals.position !== null && <PosChange now={totals.position} before={totals.prevPosition} />}</div>
                </div>
                {dates && <p className="a-hint" style={{marginTop: 8}}>{dates.from} — {dates.to}, сравнение с предыдущими 28 днями.</p>}
            </>
        ) : <p className="a-note">Нет данных.</p>}
    </section>
);

const Daily = ({title, series}: {title: string; series: {day: string; clicks: number; impressions: number}[]}) => {
    if (series.length < 2) return null;
    const max = Math.max(1, ...series.map((d) => d.impressions));
    return (
        <div>
            <div className="a-note" style={{marginBottom: 6}}>{title}: показы (светлые) и клики (тёмные) по дням</div>
            <div style={{display: "flex", alignItems: "flex-end", gap: 1, height: 90}}>
                {series.map((d) => (
                    <div key={d.day} title={`${d.day}: ${d.impressions} показов, ${d.clicks} кликов`}
                         style={{flex: 1, position: "relative", height: `${(d.impressions / max) * 100}%`, minHeight: 1, background: "rgba(31,138,76,.25)", borderRadius: "2px 2px 0 0"}}>
                        <div style={{position: "absolute", bottom: 0, left: 0, right: 0, height: `${d.impressions ? (d.clicks / d.impressions) * 100 : 0}%`, background: "var(--a-accent)"}} />
                    </div>
                ))}
            </div>
            <div className="a-row a-note" style={{justifyContent: "space-between"}}><span>{series[0].day}</span><span>{series[series.length - 1].day}</span></div>
        </div>
    );
};

const QueryTable = ({rows, empty}: {rows: QueryRow[]; empty: string}) =>
    rows.length ? (
        <table className="a-table">
            <thead><tr><th>Запрос</th><th></th><th>Показы</th><th>Клики</th><th>CTR</th><th>Позиция</th><th>За 28 дней</th></tr></thead>
            <tbody>
            {rows.map((q) => (
                <tr key={`${q.engine}-${q.query}`}>
                    <td>{q.query}{q.brand && <span className="a-note"> · бренд</span>}</td>
                    <td className="a-note">{ENGINE[q.engine]}</td>
                    <td>{number(q.impressions)}</td>
                    <td>{number(q.clicks)}</td>
                    <td>{(q.ctr * 100).toFixed(1)}%</td>
                    <td><b>{pos(q.position)}</b></td>
                    <td><PosChange now={q.position} before={q.prevPosition} /></td>
                </tr>
            ))}
            </tbody>
        </table>
    ) : <p className="a-note">{empty}</p>;

/**
 * Поиск: Google Search Console и Яндекс Вебмастер — что ищут, где сайт стоит,
 * что усилить. Данные — снимок раз в сутки (scripts/search-collect.mjs по cron),
 * у Google они отстают на 2–3 дня, у Вебмастера — на 1–2.
 */
const SearchPage = async ({searchParams}: PageProps) => {
    const engineFilter = (await searchParams).e as Engine | undefined;
    const report = searchReport();
    const title = titleResolver();

    const refresh = (
        <form action={refreshSearchAction}>
            <button className="a-btn">Обновить сейчас</button>
            <span className="a-hint" style={{marginLeft: 10}}>сбор занимает до минуты</span>
        </form>
    );

    if (!report) {
        return (
            <>
                <StatsHeader tab="search" />
                <section className="a-card"><p>Данных ещё нет — снимок собирается раз в сутки.</p>{refresh}</section>
            </>
        );
    }

    const all = engineFilter ? report.queries.filter((q) => q.engine === engineFilter) : report.queries;

    return (
        <>
            <StatsHeader tab="search" />

            <section className="a-card">
                <div className="a-row" style={{justifyContent: "space-between", flexWrap: "wrap", gap: 12}}>
                    <div className="a-note">
                        Снимок за {report.day}, собран {new Date(report.collectedAt).toLocaleString("ru-RU", {timeZone: "Europe/Minsk"})}.
                        {report.sqi !== null && <> ИКС Яндекса: <b>{report.sqi}</b>.</>}
                        {report.inSearch !== null && <> В поиске Яндекса страниц: <b>{report.inSearch}</b>, исключено: <b>{report.excluded}</b>.</>}
                    </div>
                    {refresh}
                </div>
                {report.errors.length > 0 && <p className="a-error">Не собралось: {report.errors.join("; ")}</p>}
                {report.problems.length > 0 && (
                    <p className="a-error">Вебмастер видит проблемы: {report.problems.map((p) => PROBLEMS[p.code] ?? p.code).join(", ")}</p>
                )}
            </section>

            <div className="a-grid2">
                <Totals title="Яндекс" totals={report.yandex} dates={report.yandexDates} />
                <Totals title="Google" totals={report.google} dates={report.googleDates} />
            </div>

            <section className="a-card">
                <Daily title="Яндекс" series={report.yandexDaily} />
                <div style={{height: 16}} />
                <Daily title="Google" series={report.googleDaily} />
            </section>

            <section className="a-card">
                <h2 className="a-h2">Точки роста</h2>
                <p className="a-hint">
                    Запросы на 4–20 месте с показами от 10 за 28 дней (без брендовых). Страница почти в топе — усилить:
                    дописать текст под запрос, добавить FAQ, фото, внутренние ссылки, или написать статью.
                </p>
                <QueryTable rows={report.growth} empty="Подходящих запросов нет." />
            </section>

            <section className="a-card">
                <h2 className="a-h2">В топе, но мало кликают</h2>
                <p className="a-hint">Позиция до 5, показов от 20, CTR ниже 3%. Переписать title и description страницы — сниппет не цепляет.</p>
                <QueryTable rows={report.lowCtr} empty="Таких запросов нет — хорошо." />
            </section>

            <section className="a-card">
                <div className="a-row" style={{justifyContent: "space-between", marginBottom: 8}}>
                    <h2 className="a-h2" style={{margin: 0}}>Все запросы ({all.length})</h2>
                    <div className="a-tabs">
                        <a href="/admin/stats/search" className={`a-tab${!engineFilter ? " a-tab-active" : ""}`}>Все</a>
                        <a href="/admin/stats/search?e=yandex" className={`a-tab${engineFilter === "yandex" ? " a-tab-active" : ""}`}>Яндекс</a>
                        <a href="/admin/stats/search?e=google" className={`a-tab${engineFilter === "google" ? " a-tab-active" : ""}`}>Google</a>
                    </div>
                </div>
                <QueryTable rows={all.slice(0, 300)} empty="Нет запросов." />
            </section>

            <div className="a-grid2">
                <section className="a-card">
                    <h2 className="a-h2">Страницы в Google</h2>
                    <table className="a-table">
                        <thead><tr><th>Страница</th><th>Клики</th><th>Показы</th><th>Поз.</th></tr></thead>
                        <tbody>
                        {report.pages.slice(0, 40).map((p) => (
                            <tr key={p.path}>
                                <td><a href={`${SITE_URL}${p.path}`} target="_blank" rel="noreferrer">{title(p.path)}</a></td>
                                <td>{number(p.clicks)} <Change now={p.clicks} before={p.prevClicks} /></td>
                                <td>{number(p.impressions)}</td>
                                <td>{pos(p.position)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>

                <section className="a-card">
                    <h2 className="a-h2">Индексация в Яндексе</h2>
                    <p className="a-hint">Последние события Вебмастера: страница появилась или пропала из поиска.</p>
                    <table className="a-table">
                        <tbody>
                        {report.events.map((e) => (
                            <tr key={`${e.date}-${e.url}-${e.event}`}>
                                <td className="a-note">{e.date}</td>
                                <td><a href={`${SITE_URL}${e.url}`} target="_blank" rel="noreferrer">{e.title || e.url}</a></td>
                                <td style={{color: e.event === "APPEARED_IN_SEARCH" ? "var(--a-accent)" : "var(--a-danger)"}}>{EVENTS[e.event] ?? e.event}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </>
    );
};

export default SearchPage;
