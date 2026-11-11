import React from "react";
import './styles.css';

export interface InfoCard {
    title: string;
    body: React.ReactNode;
}

interface InfoCardsProps {
    id: string;
    title: string;
    lead?: React.ReactNode;
    items: InfoCard[];
    /** light — белый фон, иначе светло-серый */
    light?: boolean;
}

/** Раздел с заголовком и карточками «заголовок + абзац» — для страниц вне услуг (о мастерской, обучение, сертификат) */
const InfoCards = ({id, title, lead, items, light = false}: InfoCardsProps) => (
    <section className={`info-cards${light ? ' info-cards--light' : ''}`} aria-labelledby={id}>
        <h2 className="info-cards-title" id={id}>{title}</h2>
        {lead && <p className="info-cards-lead">{lead}</p>}
        <ul className="info-cards-list">
            {items.map((item) => (
                <li key={item.title}>
                    <h3 className="info-cards-name">{item.title}</h3>
                    <p>{item.body}</p>
                </li>
            ))}
        </ul>
    </section>
);

export default InfoCards;
