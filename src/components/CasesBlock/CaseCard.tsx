import React from "react";
import Image from "next/image";
import Link from "next/link";
import {SERVICE_TITLES, type WorkCase} from "@/constants/cases";
import {formatReviewDate} from "@/constants/yandexReviews";

/** Карточка кейса: фото, машина, что сделали, услуги ссылками, отзыв клиента */
const CaseCard = ({item, headingLevel = 3}: {item: WorkCase; headingLevel?: 2 | 3}) => {
    const Heading = headingLevel === 2 ? "h2" : "h3";
    const photo = item.photos[0];
    return (
        <article className="case-card" data-services={item.services.join(" ")}>
            {photo ? (
                <Image src={photo.src} alt={photo.alt} width={800} height={800} sizes="(max-width: 768px) 100vw, 400px" className="case-card-photo" />
            ) : (
                <div className="case-card-nophoto" aria-hidden="true">
                    <span>{item.car}</span>
                </div>
            )}
            <div className="case-card-body">
                <Heading className="case-card-car">{item.car}</Heading>
                <div className="case-card-title">{item.title}</div>
                <p className="case-card-text">{item.text}</p>
                <ul className="case-card-services">
                    {item.services.map((service) => (
                        <li key={service}><Link href={SERVICE_TITLES[service].href}>{SERVICE_TITLES[service].title}</Link></li>
                    ))}
                </ul>
                {item.quote && (
                    <blockquote className="case-card-quote">
                        <p>«{item.quote.text}»</p>
                        <div className="case-card-quote-author">{item.quote.name}, отзыв на Яндекс Картах, {formatReviewDate(item.quote.date)}</div>
                    </blockquote>
                )}
            </div>
        </article>
    );
};

export default CaseCard;
