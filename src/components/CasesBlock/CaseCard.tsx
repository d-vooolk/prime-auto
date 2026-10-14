import React from "react";
import Image from "next/image";
import Link from "next/link";
import {SERVICE_TITLES, type WorkCase} from "@/constants/cases";
import {formatReviewDate} from "@/constants/yandexReviews";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {absoluteUrl} from "@/utils/seo";
import CaseVideo from "./CaseVideo";

/* Микроразметка ролика: Яндекс и Google показывают видео в выдаче по ней */
const videoJsonLd = (item: WorkCase) => item.video && {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: item.video.name,
    description: `${item.text} Мастерская автосвета Prime Auto, Минск.`,
    thumbnailUrl: absoluteUrl(item.video.thumb),
    uploadDate: item.video.uploadDate,
    duration: `PT${item.video.seconds}S`,
    embedUrl: `https://www.youtube.com/embed/${item.video.id}`,
    url: `https://www.youtube.com/shorts/${item.video.id}`,
};

/** Карточка кейса: фото или видео, машина, что сделали, услуги ссылками, отзыв клиента */
const CaseCard = ({item, headingLevel = 3}: {item: WorkCase; headingLevel?: 2 | 3}) => {
    const Heading = headingLevel === 2 ? "h2" : "h3";
    const photo = item.photos[0];
    return (
        <article className="case-card" data-services={item.services.join(" ")}>
            {item.video ? (
                <div className="case-card-media">
                    <JsonLd data={videoJsonLd(item)!} />
                    <CaseVideo
                        id={item.video.id}
                        poster={photo?.src ?? item.video.thumb}
                        alt={photo?.alt ?? item.video.name}
                        seconds={item.video.seconds}
                        title={item.video.name}
                    />
                </div>
            ) : photo ? (
                <div className="case-card-media">
                    <Image src={photo.src} alt={photo.alt} width={800} height={1000} sizes="(max-width: 768px) 100vw, 400px" className="case-card-photo" />
                    {item.illustration && <span className="case-card-badge">Иллюстрация</span>}
                </div>
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
