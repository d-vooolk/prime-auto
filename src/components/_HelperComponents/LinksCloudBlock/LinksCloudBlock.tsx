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
    /**
     * Ссылка на полный каталог. На страницах марок в облаке показываются не все
     * марки, а только те, у которых страница наполнена и открыта для индексации,
     * поэтому нужен выход на страницу услуги, где перечислены все.
     */
    allBrandsHref?: string;
}

/**
 * Блок перелинковки: страницы марок и смежные услуги.
 * Без него автоматически сгенерированные страницы остаются сиротами,
 * на которые нет ни одной внутренней ссылки, и робот их просто не находит.
 */
const LinksCloudBlock = ({
    upperTitle,
    title,
    links,
    description,
    tight = false,
    allBrandsHref,
}: LinksCloudBlockProps) => {
    if (!links.length) {
        return null;
    }

    return (
        <section className={`links-cloud-wrapper${tight ? ' links-cloud-wrapper-tight' : ''}`}>
            <div className="links-cloud-title-container">
                {/* Надпись над заголовком — декоративная. Раньше это был такой же
                      h2/h3, и в оглавлении страницы появлялся бессмысленный
                      обрывок: на главной 9 из 20 заголовков были такими. Класс
                      задаёт размер, вес и отступы сам, поэтому смена тега
                      внешний вид не меняет. */}
                <div className="links-cloud-upper-title">{upperTitle}</div>
                <h2 className="links-cloud-under-title">{title}</h2>
            </div>

            {description && <p className="links-cloud-description">{description}</p>}

            <ul className="links-cloud-list">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className="links-cloud-item">{link.title}</Link>
                    </li>
                ))}
                {allBrandsHref && (
                    <li>
                        <Link href={allBrandsHref} className="links-cloud-item">Все марки</Link>
                    </li>
                )}
            </ul>
        </section>
    );
};

export default LinksCloudBlock;
