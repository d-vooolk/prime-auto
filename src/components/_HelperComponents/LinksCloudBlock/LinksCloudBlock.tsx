import React from "react";
import Link from "next/link";
import './styles.css';

export interface CloudLink {
    title: string;
    href: string;
}

interface LinksCloudBlockProps {
    upperTitle: string;
    title: string;
    links: CloudLink[];
    description?: string;
    /** Убирает верхний отступ, когда блок идёт сразу за таким же */
    tight?: boolean;
}

/**
 * Блок перелинковки: страницы марок и смежные услуги.
 * Без него автоматически сгенерированные страницы остаются сиротами,
 * на которые нет ни одной внутренней ссылки, и робот их просто не находит.
 */
const LinksCloudBlock = ({upperTitle, title, links, description, tight = false}: LinksCloudBlockProps) => {
    if (!links.length) {
        return null;
    }

    return (
        <section className={`links-cloud-wrapper${tight ? ' links-cloud-wrapper-tight' : ''}`}>
            <div className="links-cloud-title-container">
                <h2 className="links-cloud-upper-title">{upperTitle}</h2>
                <h2 className="links-cloud-under-title">{title.toUpperCase()}</h2>
            </div>

            {description && <p className="links-cloud-description">{description}</p>}

            <ul className="links-cloud-list">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className="links-cloud-item">{link.title}</Link>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default LinksCloudBlock;
