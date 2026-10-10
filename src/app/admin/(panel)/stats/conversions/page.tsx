import React from "react";
import {
    CONTACT_TYPES,
    CONVERSION_LABELS,
    conversionsReport,
    DEVICE_LABELS,
    SOURCE_LABELS,
    type ConversionType,
} from "@/lib/stats";
import {SITE_URL} from "@/constants/site";
import {Bar, Change, number, percent, periodFrom, StatsHeader, titleResolver} from "@/components/admin/stats-ui";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{d?: string}>;
}

/* Колонки таблицы страниц: обращения и шаг «открыл форму» */
const PAGE_COLUMNS: ConversionType[] = ["lead", "lead_open", "phone", "telegram", "viber", "whatsapp"];

/**
 * Конверсии: где и откуда люди обращаются. Обращение — отправленная заявка,
 * звонок или переход в мессенджер (CONTACT_TYPES). Открытие формы, Instagram
 * и карта — промежуточные действия, показаны отдельно. Конверсия — доля
 * посетителей, совершивших хотя бы одно обращение.
 */
const ConversionsPage = async ({searchParams}: PageProps) => {
    const days = periodFrom((await searchParams).d);
    const report = conversionsReport(days);
    const title = titleResolver();
    const contacts = report.byType.filter((t) => CONTACT_TYPES.includes(t.type)).reduce((sum, t) => sum + t.n, 0);
    const leadOpen = report.byType.find((t) => t.type === "lead_open")?.n ?? 0;
    const leads = report.byType.find((t) => t.type === "lead")?.n ?? 0;
    const maxType = Math.max(1, ...report.byType.map((t) => t.n));

    return (
        <>
            <StatsHeader tab="conversions" days={days} />

            <section className="a-card">
                <div className="a-row" style={{gap: 40, flexWrap: "wrap"}}>
                    <div><div className="a-note">Обращения</div><b style={{fontSize: 28}}>{number(contacts)}</b></div>
                    <div><div className="a-note">Обратились посетителей</div><b style={{fontSize: 28}}>{number(report.converted)}</b></div>
                    <div><div className="a-note">Конверсия сайта</div><b style={{fontSize: 28}}>{percent(report.converted, report.visitors, 1)}</b></div>
                    <div><div className="a-note">Открыли форму → отправили</div><b style={{fontSize: 28}}>{percent(leads, leadOpen)}</b></div>
                </div>
                <p className="a-hint" style={{marginTop: 12}}>
                    {report.from} — {report.to}. Обращение — отправленная заявка, звонок, Telegram, Viber или WhatsApp
                    (клик по кнопке; дозвонился ли человек, сайт не знает). Повтор той же кнопки на той же странице
                    за 10 минут не считается. Работает с 10.10.2026.
                </p>
            </section>

            <section className="a-card">
                <h2 className="a-h2">По типу</h2>
                {report.byType.length ? (
                    <table className="a-table">
                        <tbody>
                        {report.byType.map((t) => (
                            <tr key={t.type}>
                                <td>{CONVERSION_LABELS[t.type]}{!CONTACT_TYPES.includes(t.type) && <span className="a-note"> · не обращение</span>}</td>
                                <td style={{width: "40%"}}><Bar value={t.n} max={maxType} /></td>
                                <td><b>{number(t.n)}</b></td>
                                <td><Change now={t.n} before={t.prev} /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p className="a-note">Пока ни одного действия — данные начнут появляться с первых заявок и кликов.</p>}
            </section>

            <section className="a-card">
                <h2 className="a-h2">Страницы, с которых обращаются</h2>
                <p className="a-hint">Страница, на которой нажали кнопку. Конверсия — обращения к посетителям страницы.</p>
                {report.byPage.length ? (
                    <table className="a-table">
                        <thead>
                        <tr>
                            <th>Страница</th>
                            {PAGE_COLUMNS.map((type) => <th key={type}>{CONVERSION_LABELS[type].replace("Заявка отправлена", "Заявки").replace("Открыта форма заявки", "Открыли форму")}</th>)}
                            <th>Посетители</th>
                            <th>Конверсия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {report.byPage.map((page) => (
                            <tr key={page.path}>
                                <td>
                                    <a href={`${SITE_URL}${page.path}`} target="_blank" rel="noreferrer">{title(page.path)}</a>
                                    <div className="a-note a-mono">{page.path}</div>
                                </td>
                                {PAGE_COLUMNS.map((type) => <td key={type}>{page.counts[type] ?? "—"}</td>)}
                                <td>{number(page.visitors)}</td>
                                <td><b>{percent(page.contacts, page.visitors, 1)}</b></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p className="a-note">Пока нет данных.</p>}
            </section>

            <div className="a-grid2">
                <section className="a-card">
                    <h2 className="a-h2">Источники, которые приводят клиентов</h2>
                    <p className="a-hint">Откуда пришёл посетитель, который потом обратился.</p>
                    <table className="a-table">
                        <thead><tr><th>Источник</th><th>Визиты</th><th>Обратились</th><th>Конверсия</th></tr></thead>
                        <tbody>
                        {report.bySource.map((s) => (
                            <tr key={s.source}>
                                <td>{SOURCE_LABELS[s.source]}</td>
                                <td>{number(s.visitors)}</td>
                                <td>{number(s.converted)}</td>
                                <td><b>{percent(s.converted, s.visitors, 1)}</b></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>

                <section className="a-card">
                    <h2 className="a-h2">Устройства</h2>
                    <table className="a-table">
                        <thead><tr><th>Устройство</th><th>Посетители</th><th>Обратились</th><th>Конверсия</th></tr></thead>
                        <tbody>
                        {report.byDevice.map((d) => (
                            <tr key={d.device}>
                                <td>{DEVICE_LABELS[d.device]}</td>
                                <td>{number(d.visitors)}</td>
                                <td>{number(d.converted)}</td>
                                <td><b>{percent(d.converted, d.visitors, 1)}</b></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            </div>

            <section className="a-card">
                <h2 className="a-h2">Последние действия</h2>
                {report.recent.length ? (
                    <table className="a-table">
                        <tbody>
                        {report.recent.map((r) => (
                            <tr key={`${r.ts}-${r.type}-${r.path}`}>
                                <td className="a-note">{new Date(r.ts).toLocaleString("ru-RU", {timeZone: "Europe/Minsk", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"})}</td>
                                <td>{CONVERSION_LABELS[r.type]}</td>
                                <td>{title(r.path)}</td>
                                <td className="a-note">{SOURCE_LABELS[r.source]} · {DEVICE_LABELS[r.device]}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p className="a-note">Пока пусто.</p>}
            </section>
        </>
    );
};

export default ConversionsPage;
