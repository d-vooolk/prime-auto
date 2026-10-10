import React from "react";
import Link from "next/link";
import './styles.css';
import LeadButton from "@/components/LeadModal/LeadButton";

/*
  Дополнительные разделы страницы услуги — общий каркас для дописанных под
  точки роста страниц (ремонт, полировка, Bi-Led, регулировка): таблица
  «ситуация → что делаем → цена → срок», шаги работы и два текстовых блока.
  Тексты и цифры — в файле extra.tsx у каждой услуги.
*/

export interface ExtraTableRow {
    cells: React.ReactNode[];
    href?: string;
}

export interface ServiceExtraProps {
    table?: {
        title: string;
        lead?: React.ReactNode;
        head: string[];
        rows: ExtraTableRow[];
        cta?: {label: string; message: string};
    };
    steps?: {title: string; items: {title: string; text: string}[]};
    columns?: {title: string; body: React.ReactNode}[];
}

const ServiceExtra = ({table, steps, columns}: ServiceExtraProps) => (
    <>
        {table && (
            <section className="remont-extra remont-extra--light">
                <div className="remont-extra-inner">
                    <h2 className="remont-extra-title">{table.title}</h2>
                    {table.lead && <p className="remont-extra-lead">{table.lead}</p>}
                    <div className="remont-extra-table-wrap">
                        <table className="remont-extra-table">
                            <thead><tr>{table.head.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
                            <tbody>
                            {table.rows.map((row, index) => (
                                <tr key={index}>
                                    {row.cells.map((cell, cellIndex) => (
                                        <td key={cellIndex} className={cellIndex >= 2 ? "remont-extra-nowrap" : undefined}>
                                            {cellIndex === 0 ? <b>{row.href ? <Link href={row.href}>{cell}</Link> : cell}</b> : cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {table.cta && (
                        <LeadButton className="remont-extra-button" message={table.cta.message}>{table.cta.label}</LeadButton>
                    )}
                </div>
            </section>
        )}

        {steps && (
            <section className="remont-extra">
                <div className="remont-extra-inner">
                    <h2 className="remont-extra-title">{steps.title}</h2>
                    <ol className="remont-extra-steps">
                        {steps.items.map((step, index) => (
                            <li key={step.title}>
                                <span className="remont-extra-step-number">{index + 1}</span>
                                <div>
                                    <div className="remont-extra-step-title">{step.title}</div>
                                    <p>{step.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        )}

        {columns?.length ? (
            <section className="remont-extra remont-extra--light">
                <div className="remont-extra-inner remont-extra-columns">
                    {columns.map((column) => (
                        <div key={column.title}>
                            <h2 className="remont-extra-title">{column.title}</h2>
                            {column.body}
                        </div>
                    ))}
                </div>
            </section>
        ) : null}
    </>
);

export default ServiceExtra;
