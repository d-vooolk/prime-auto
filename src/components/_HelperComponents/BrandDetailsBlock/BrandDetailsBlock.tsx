import React from "react";
import './styles.css';
import type {BrandServiceNote} from "@/constants/brandServiceNotes";

interface BrandDetailsBlockProps {
    /** Заголовок с ключом: «Ремонт фар BMW: особенности» */
    title: string;
    note: BrandServiceNote;
}

/**
 * Блок с текстом, который есть только на этой странице.
 *
 * До него страница марки отличалась от соседних на 5–8%: совпадали все секции,
 * прайс, фотографии и четыре вопроса из пяти в FAQ. Этот блок — то место, где
 * страница про BMW перестаёт быть страницей про Audi с заменённым названием.
 */
const BrandDetailsBlock = ({title, note}: BrandDetailsBlockProps) => (
    <section className="brand-details-wrapper">
        <div className="brand-details-inner">
            <div className="brand-details-eyebrow">На практике</div>
            <h2 className="brand-details-title">{title}</h2>

            <p className="brand-details-lead">{note.lead}</p>

            <ul className="brand-details-cases">
                {note.cases.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    </section>
);

export default BrandDetailsBlock;
