import React from "react";
import Link from "next/link";
import './styles.css';
import CaseCard from "./CaseCard";
import type {WorkCase} from "@/constants/cases";
import {NAVIGATION_URL} from "@/constants/navigation";

interface CasesBlockProps {
    cases: WorkCase[];
    eyebrow?: string;
    title: string;
    description?: string;
    /** Ссылка «Все работы» под блоком */
    showAllLink?: boolean;
}

/** Блок кейсов на страницах услуг и марок */
const CasesBlock = ({cases, eyebrow = "Примеры", title, description, showAllLink = true}: CasesBlockProps) => {
    if (!cases.length) return null;
    return (
        <section className="cases-block">
            <div className="cases-block-head">
                <div className="cases-block-eyebrow">{eyebrow}</div>
                <h2 className="cases-block-title">{title}</h2>
                {description && <p className="cases-block-description">{description}</p>}
            </div>
            <div className="cases-grid">
                {cases.map((item) => <CaseCard key={item.id} item={item} />)}
            </div>
            {showAllLink && (
                <div className="cases-block-more">
                    <Link href={NAVIGATION_URL.raboty} className="cases-block-button">Все наши работы →</Link>
                </div>
            )}
        </section>
    );
};

export default CasesBlock;
