import React from "react";
import Image from "next/image";
import './styles.css';

export interface WorkPhoto {
    /** Путь в public: /images/works/… */
    src: string;
    width: number;
    height: number;
    /** Что на фото — уходит в alt и подпись */
    caption: string;
}

interface BeforeAfterBlockProps {
    title: string;
    photos: WorkPhoto[];
    /** Рукописная надпись над заголовком; для фото только «после» — «Результат» */
    eyebrow?: string;
}

/**
 * Фото «до и после» на странице услуги. Общий блок «Примеры работ» одинаков на
 * всех страницах, а этот — свой у каждой услуги: показывает результат именно
 * этой работы и даёт странице собственные картинки с подписями.
 */
const BeforeAfterBlock = ({title, photos, eyebrow = "До и после"}: BeforeAfterBlockProps) => (
    <section className="before-after-wrapper">
        <div className="before-after-inner">
            <div className="before-after-eyebrow">{eyebrow}</div>
            <h2 className="before-after-title">{title}</h2>

            <div className="before-after-list">
                {photos.map((photo) => (
                    <figure key={photo.src} className="before-after-figure">
                        <Image
                            src={photo.src}
                            width={photo.width}
                            height={photo.height}
                            alt={photo.caption}
                            sizes="(max-width: 768px) 100vw, 900px"
                            className="before-after-image"
                        />
                        <figcaption className="before-after-caption">{photo.caption}</figcaption>
                    </figure>
                ))}
            </div>
        </div>
    </section>
);

export default BeforeAfterBlock;
