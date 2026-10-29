import React from "react";
import {
    AI_ENGINES,
    AI_QUERIES,
    aiSeoReport,
    GROUP_LABELS,
    MANUAL_ENGINES,
    READINESS,
    type CheckRow,
    type EngineQuestions,
} from "@/lib/ai-seo";
import {minskDay} from "@/lib/stats";
import {saveManualAiAction} from "@/app/admin/actions";
import {SITE_URL} from "@/constants/site";
import {Bar, number, percent, titleResolver} from "@/components/admin/stats-ui";
import AiCheckButton from "@/components/admin/AiCheckButton";

export const dynamic = "force-dynamic";

type Level = "ok" | "warn" | "bad" | "none";

const BADGE: Record<Level, string> = {ok: "a-badge a-badge-ok", warn: "a-badge a-badge-warn", bad: "a-badge a-badge-bad", none: "a-badge"};
const LEVEL_TEXT: Record<Level, string> = {ok: "хорошо", warn: "средне", bad: "плохо", none: "нет данных"};

const level = (value: number | null, good: number, fair: number): Level =>
    value === null ? "none" : value >= good ? "ok" : value >= fair ? "warn" : "bad";

const Tile = ({title, value, sub, lvl}: {title: string; value: string; sub: string; lvl: Level}) => (
    <div style={{minWidth: 200, flex: 1}}>
        <div className="a-note">{title}</div>
        <b style={{fontSize: 26}}>{value}</b> <span className={BADGE[lvl]}>{LEVEL_TEXT[lvl]}</span>
        <div className="a-hint">{sub}</div>
    </div>
);

const KIND_LABELS: Record<string, string> = {
    answer: "ответ человеку",
    search: "поиск нейросети",
    train: "обучение",
    other: "прочее",
};

const KIND_COLORS: Record<string, string> = {
    answer: "var(--a-accent)",
    search: "rgba(31,138,76,.55)",
    train: "rgba(31,138,76,.25)",
    other: "rgba(0,0,0,.12)",
};

const Mark = ({row}: {row: CheckRow | undefined}) => {
    if (!row) return <span className="a-note">·</span>;
    if (row.error) return <span className="a-note" title={row.error}>ошибка</span>;
    if (row.linked) return <span className="a-badge a-badge-ok" title={row.citedUrl || "ссылка в ответе"}>ссылка{row.rank ? ` #${row.rank}` : ""}</span>;
    if (row.mentioned) return <span className="a-badge a-badge-warn">назван</span>;
    return <span className="a-note">—</span>;
};

const hostOf = (url: string) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
};

const questionShare = (q: EngineQuestions | null) =>
    q ? {impressions: q.questions.impressions, ctr: q.questions.impressions ? q.questions.clicks / q.questions.impressions : 0,
        top5: q.questions.top5, top5Ctr: q.questions.top5 ? q.questions.top5Clicks / q.questions.top5 : 0} : null;

/**
 * AI-SEO: видимость в ответах нейросетей (src/lib/ai-seo.ts). Здесь и сводка
 * «насколько всё хорошо», и динамика по прогонам, месяцам и неделям.
 */
const AiSeoPage = async () => {
    const report = aiSeoReport();
    const title = titleResolver();
    const autoEngines = AI_ENGINES.filter((e) => e.model);

    /* сводка: последний прогон каждой автоматической системы */
    const lastScores = autoEngines
        .map((e) => report.scores.filter((s) => s.engine === e.id).at(-1))
        .filter((s): s is NonNullable<typeof s> => Boolean(s && s.total));
    const checked = lastScores.reduce((sum, s) => sum + s.total, 0);
    const mentionShare = checked ? lastScores.reduce((sum, s) => sum + s.mentioned, 0) / checked : null;
    const linkShare = checked ? lastScores.reduce((sum, s) => sum + s.linked, 0) / checked : null;

    const aiShare = report.referrals.organic ? report.referrals.total / report.referrals.organic : null;
    const answerBots = report.bots.list.filter((b) => b.kind === "answer");
    const answerHits = answerBots.reduce((sum, b) => sum + b.hits28, 0);
    const lastQuestions = report.questions.at(-1);
    const ready = READINESS.filter((r) => r.status === "done").length + READINESS.filter((r) => r.status === "partial").length / 2;

    const run = report.run;
    const running = Boolean(run && !run.finishedAt && Date.now() - run.startedAt < 15 * 60_000);
    const maxWeek = Math.max(1, ...report.bots.weekly.map((w) => w.answer + w.search + w.train + w.other));
    const maxMonth = Math.max(1, ...report.referrals.byMonth.map((m) => m.ai));
    const runs = [...new Set(report.scores.map((s) => s.run))].sort().reverse();

    return (
        <>
            <h1 className="a-h1">AI-SEO</h1>
            <p className="a-hint" style={{marginTop: -8, marginBottom: 16}}>
                Насколько Prime Auto видно в ответах нейросетей: ChatGPT, Perplexity, Gemini, Яндекс Нейро и Алиса,
                Google AI Overviews. Главный показатель — назван ли сервис и есть ли ссылка на сайт; рядом — объективные
                сигналы: переходы из нейросетей и заходы их ботов.
            </p>

            <section className="a-card">
                <h2 className="a-h2">Сводка</h2>
                <div className="a-row" style={{gap: 28, flexWrap: "wrap", alignItems: "flex-start"}}>
                    <Tile title="Названы в ответах" lvl={level(mentionShare, 0.4, 0.15)}
                          value={mentionShare === null ? "—" : percent(mentionShare * 100, 100)}
                          sub={checked ? `ссылка на сайт — ${percent((linkShare ?? 0) * 100, 100)}; ${checked} ответов в последних прогонах` : "проверка ещё не запускалась"} />
                    <Tile title="Переходы из нейросетей" lvl={level(aiShare, 0.02, 0.005)}
                          value={number(report.referrals.total)}
                          sub={`${aiShare === null ? "—" : percent(aiShare * 100, 100, 1)} от переходов из поиска; с ${report.referrals.firstDay ?? "—"}`} />
                    <Tile title="Нейросети открывали страницы для ответа" lvl={report.bots.to ? level(answerHits, 100, 20) : "none"}
                          value={number(answerHits)}
                          sub="заходы ChatGPT-User, Perplexity-User и др. за 28 дней, только проверенные IP" />
                    <Tile title="Готовность сайта" lvl={level(ready / READINESS.length, 0.8, 0.5)}
                          value={`${ready}/${READINESS.length}`} sub="пункты чек-листа внизу страницы" />
                </div>
                {lastQuestions && (
                    <p className="a-hint" style={{marginTop: 12}}>
                        Вопросные запросы (снимок {lastQuestions.day}):{" "}
                        {(["yandex", "google"] as const).map((key) => {
                            const q = questionShare(lastQuestions[key]);
                            return q ? <span key={key}>{key === "yandex" ? "Яндекс" : "Google"} — {number(q.impressions)} показов, CTR {(q.ctr * 100).toFixed(1)}%,
                                в топ-5 {number(q.top5)} показов с CTR {(q.top5Ctr * 100).toFixed(1)}%. </span> : null;
                        })}
                        Вопрос в топ-5 без кликов — обычно ответ дал сам поиск (нейроответ).
                    </p>
                )}
            </section>

            <section className="a-card">
                <div className="a-row" style={{justifyContent: "space-between", flexWrap: "wrap", gap: 12}}>
                    <h2 className="a-h2" style={{margin: 0}}>Ответы нейросетей — {AI_QUERIES.length} запросов</h2>
                    <AiCheckButton running={running} />
                </div>
                {run && (
                    <p className="a-hint">
                        {running ? <>Идёт проверка: {run.done} из {run.total}{run.errors ? `, ошибок ${run.errors}` : ""}.</>
                            : <>Последний автоматический прогон: {run.run}, {run.done} ответов{run.errors ? `, ошибок ${run.errors}` : ""}.</>}
                    </p>
                )}
                <p className="a-hint">
                    Perplexity, ChatGPT и Gemini проверяются автоматически через OpenRouter: модель с поиском в интернете,
                    без истории и личных настроек — это близко к ответу обычному человеку, но не то же самое, что приложение.
                    Яндекс Нейро, Алису и Google AI Overviews API не дают — их раз в месяц отмечаем руками (форма ниже).
                    Прогон стоит около $1. Делать раз в месяц, в первые выходные.
                </p>

                {runs.length > 0 ? (
                    <>
                        <h3 className="a-h2" style={{fontSize: 16, marginTop: 16}}>Динамика по прогонам</h3>
                        <table className="a-table">
                            <thead><tr><th>Дата</th>{AI_ENGINES.map((e) => <th key={e.id}>{e.label}</th>)}</tr></thead>
                            <tbody>
                            {runs.map((r) => (
                                <tr key={r}>
                                    <td>{r}</td>
                                    {AI_ENGINES.map((e) => {
                                        const s = report.scores.find((x) => x.run === r && x.engine === e.id);
                                        return <td key={e.id}>{s?.total
                                            ? <>назван {percent(s.mentioned, s.total)}, ссылка {percent(s.linked, s.total)}</>
                                            : <span className="a-note">·</span>}</td>;
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <h3 className="a-h2" style={{fontSize: 16, marginTop: 16}}>По запросам (последняя проверка каждой системы)</h3>
                        <table className="a-table">
                            <thead><tr><th>Запрос</th>{AI_ENGINES.map((e) => <th key={e.id}>{e.label}</th>)}</tr></thead>
                            <tbody>
                            {AI_QUERIES.map(({query, group}, index) => (
                                <tr key={query}>
                                    <td>
                                        {index === 0 || AI_QUERIES[index - 1].group !== group
                                            ? <div className="a-note">{GROUP_LABELS[group]}</div> : null}
                                        <details>
                                            <summary style={{cursor: "pointer"}}>{query}</summary>
                                            {autoEngines.map((e) => {
                                                const row = report.latest.get(e.id)?.get(query);
                                                if (!row?.answer) return null;
                                                return (
                                                    <div key={e.id} style={{margin: "8px 0", fontSize: 13}}>
                                                        <b>{e.label}</b> <span className="a-note">{row.run}</span>
                                                        <div style={{whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto"}}>{row.answer}</div>
                                                        {row.sources.length > 0 && <div className="a-note">Источники: {row.sources.map(hostOf).join(", ")}</div>}
                                                    </div>
                                                );
                                            })}
                                        </details>
                                    </td>
                                    {AI_ENGINES.map((e) => <td key={e.id}><Mark row={report.latest.get(e.id)?.get(query)} /></td>)}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <p className="a-hint">«ссылка #N» — prime-auto.by среди источников ответа, N — место в списке; «назван» — упомянут без ссылки.</p>

                        {report.competitors.length > 0 && (
                            <>
                                <h3 className="a-h2" style={{fontSize: 16, marginTop: 16}}>На кого нейросети ссылаются вместо нас</h3>
                                <p className="a-note">{report.competitors.map((c) => `${c.host} (${c.n})`).join(", ")}</p>
                                <p className="a-hint">Число — в скольких ответах сайт был источником. Каталоги и форумы из этого списка — площадки, где Prime Auto нужно появиться.</p>
                            </>
                        )}
                    </>
                ) : <p className="a-note">Проверок ещё не было — нажмите «Проверить ответы нейросетей».</p>}
            </section>

            <section className="a-card">
                <h2 className="a-h2">Ручная отметка: Яндекс Нейро, Алиса, Google AI Overviews</h2>
                <p className="a-hint">
                    Задайте каждый запрос в системе (без входа в аккаунт, в режиме инкогнито) и отметьте, что в ответе.
                    Пустое — не проверяли. Повторное сохранение за ту же дату перезаписывает отметки.
                </p>
                <form action={saveManualAiAction}>
                    <div className="a-row" style={{gap: 12, flexWrap: "wrap", marginBottom: 10}}>
                        <label className="a-label">Система{" "}
                            <select name="engine" className="a-input" style={{width: "auto"}}>
                                {MANUAL_ENGINES.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                            </select>
                        </label>
                        <label className="a-label">Дата{" "}
                            <input type="date" name="run" className="a-input" style={{width: "auto"}} defaultValue={minskDay()} />
                        </label>
                    </div>
                    <table className="a-table">
                        <tbody>
                        {AI_QUERIES.map(({query}, index) => (
                            <tr key={query}>
                                <td>{query}</td>
                                <td>
                                    <select name={`q${index}`} className="a-input" style={{width: "auto"}} defaultValue="">
                                        <option value="">не проверяли</option>
                                        <option value="0">не назван</option>
                                        <option value="1">назван без ссылки</option>
                                        <option value="2">назван со ссылкой</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <label className="a-label" style={{display: "block", marginTop: 10}}>
                        Кого называли вместо нас (сайты через запятую)
                        <input name="competitors" className="a-input" placeholder="onlix.by, 2gis.by, drive2.ru" />
                    </label>
                    <button className="a-btn a-btn-primary" style={{marginTop: 10}}>Сохранить отметки</button>
                </form>
            </section>

            <section className="a-card">
                <h2 className="a-h2">Переходы из нейросетей</h2>
                <p className="a-hint">
                    Свой счётчик, с {report.referrals.firstDay ?? "—"}: входы на сайт с chatgpt.com, perplexity.ai, gemini.google.com,
                    copilot, claude.ai, deepseek, alice.yandex.ru и по utm_source=chatgpt.com. Переходы из Яндекс Нейро
                    приходят с ya.ru и неотличимы от обычного поиска.
                    Обращений (заявка, звонок, мессенджер) от этих посетителей: <b>{report.referrals.contacts}</b>.
                </p>
                {report.referrals.byMonth.length > 0 && (
                    <table className="a-table">
                        <thead><tr><th>Месяц</th><th style={{width: "40%"}}>Из нейросетей</th><th>Из поиска</th><th>Доля</th></tr></thead>
                        <tbody>
                        {report.referrals.byMonth.map((m) => (
                            <tr key={m.month}>
                                <td>{m.month}</td>
                                <td><Bar value={m.ai} max={maxMonth} /> {m.ai}</td>
                                <td>{number(m.organic)}</td>
                                <td>{percent(m.ai, m.organic, 1)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
                {report.referrals.total > 0 ? (
                    <div className="a-grid2" style={{marginTop: 12}}>
                        <div>
                            <div className="a-note">Откуда</div>
                            <ul className="a-list">{report.referrals.byHost.map((h) => <li key={h.host}>{h.host} — {h.n}</li>)}</ul>
                        </div>
                        <div>
                            <div className="a-note">На какие страницы</div>
                            <ul className="a-list">{report.referrals.byPage.map((p) => (
                                <li key={p.path}><a href={`${SITE_URL}${p.path}`} target="_blank" rel="noreferrer">{title(p.path)}</a> — {p.n}</li>
                            ))}</ul>
                        </div>
                    </div>
                ) : <p className="a-note">Переходов пока не было.</p>}
            </section>

            <section className="a-card">
                <h2 className="a-h2">ИИ-боты на сайте</h2>
                <p className="a-hint">
                    По логам nginx{report.bots.from ? `, ${report.bots.from} — ${report.bots.to}` : ""}, собирается каждое утро.
                    Засчитаны только настоящие боты: IP из официальных списков OpenAI, Perplexity, Google, Bing, а у
                    остальных — без попыток взлома с того же адреса. Под ИИ-ботов массово маскируются сканеры: в октябре
                    это 60–100% «заходов» ChatGPT-User, Claude-User и Perplexity-User.
                </p>
                {report.bots.weekly.length > 0 ? (
                    <>
                        <div style={{display: "flex", alignItems: "flex-end", gap: 4, height: 110}}>
                            {report.bots.weekly.map((w) => {
                                const total = w.answer + w.search + w.train + w.other;
                                return (
                                    <div key={w.week} title={`неделя с ${w.week}: ответ ${w.answer}, поиск ${w.search}, обучение ${w.train}, прочее ${w.other}`}
                                         style={{flex: 1, display: "flex", flexDirection: "column-reverse", height: `${(total / maxWeek) * 100}%`, minHeight: 2}}>
                                        {(["answer", "search", "train", "other"] as const).map((kind) => (
                                            <div key={kind} style={{flex: w[kind], background: KIND_COLORS[kind]}} />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="a-row a-note" style={{justifyContent: "space-between", marginTop: 4}}>
                            <span>{report.bots.weekly[0].week}</span>
                            <span>{Object.entries(KIND_LABELS).map(([k, l]) => <span key={k} style={{marginLeft: 10}}>
                                <span style={{display: "inline-block", width: 10, height: 10, background: KIND_COLORS[k], marginRight: 4}} />{l}</span>)}</span>
                        </div>

                        <table className="a-table" style={{marginTop: 12}}>
                            <thead><tr><th>Бот</th><th>Чей</th><th>Зачем</th><th>28 дней</th><th>Страниц</th><th>Всего</th></tr></thead>
                            <tbody>
                            {report.bots.list.filter((b) => b.hitsAll).sort((a, b) => b.hits28 - a.hits28).map((b) => (
                                <tr key={b.bot}>
                                    <td className="a-mono">{b.bot}</td>
                                    <td>{b.owner}</td>
                                    <td className="a-note">{KIND_LABELS[b.kind]}</td>
                                    <td>{number(b.hits28)}</td>
                                    <td>{b.pages28}</td>
                                    <td>{number(b.hitsAll)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="a-grid2" style={{marginTop: 12}}>
                            <div>
                                <div className="a-note">Страницы, открытые для ответа человеку</div>
                                <ul className="a-list">{report.bots.answerPages.map((p) => (
                                    <li key={p.path}>{title(p.path)} — {p.n}</li>
                                ))}</ul>
                            </div>
                            <div>
                                <div className="a-note">Что индексируют поисковые боты нейросетей</div>
                                <ul className="a-list">{report.bots.searchPages.map((p) => (
                                    <li key={p.path}>{title(p.path)} — {p.n}</li>
                                ))}</ul>
                            </div>
                        </div>
                    </>
                ) : <p className="a-note">Данных ещё нет — сбор раз в сутки (scripts/ai-seo-collect.mjs).</p>}
            </section>

            {report.questions.length > 0 && (
                <section className="a-card">
                    <h2 className="a-h2">Вопросные запросы в поиске</h2>
                    <p className="a-hint">
                        «Как / почему / сколько / можно ли…» и запросы от пяти слов, без бренда, за 28 дней из снимка
                        Search Console и Вебмастера. Именно на них поиск отвечает нейроответом: если показы растут, а CTR в
                        топ-5 падает — ответ забирает нейросеть, и важно, чтобы она ссылалась на нас.
                    </p>
                    <table className="a-table">
                        <thead><tr><th>Снимок</th><th>Яндекс: показы</th><th>CTR</th><th>CTR в топ-5</th><th>Google: показы</th><th>CTR</th><th>CTR в топ-5</th></tr></thead>
                        <tbody>
                        {[...report.questions].reverse().slice(0, 30).map((q) => {
                            const y = questionShare(q.yandex);
                            const g = questionShare(q.google);
                            return (
                                <tr key={q.day}>
                                    <td>{q.day}</td>
                                    <td>{y ? number(y.impressions) : "—"}</td>
                                    <td>{y ? `${(y.ctr * 100).toFixed(1)}%` : "—"}</td>
                                    <td>{y ? `${(y.top5Ctr * 100).toFixed(1)}%` : "—"}</td>
                                    <td>{g ? number(g.impressions) : "—"}</td>
                                    <td>{g ? `${(g.ctr * 100).toFixed(1)}%` : "—"}</td>
                                    <td>{g ? `${(g.top5Ctr * 100).toFixed(1)}%` : "—"}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </section>
            )}

            <section className="a-card">
                <h2 className="a-h2">Готовность сайта</h2>
                <table className="a-table">
                    <tbody>
                    {READINESS.map((r) => (
                        <tr key={r.item}>
                            <td style={{width: 110}}>
                                <span className={r.status === "done" ? "a-badge a-badge-ok" : r.status === "partial" ? "a-badge a-badge-warn" : "a-badge a-badge-bad"}>
                                    {r.status === "done" ? "сделано" : r.status === "partial" ? "частично" : "не сделано"}
                                </span>
                            </td>
                            <td>{r.item}{r.note && <div className="a-hint">{r.note}</div>}</td>
                            <td className="a-note">{r.who}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <p className="a-hint">Список правится в коде (src/lib/ai-seo.ts) по мере выполнения. План — docs/seo-plan.md, раздел AEO / GEO.</p>
            </section>
        </>
    );
};

export default AiSeoPage;
