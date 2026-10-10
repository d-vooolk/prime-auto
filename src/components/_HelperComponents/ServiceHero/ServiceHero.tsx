import React from "react";
import Image from "next/image";
import Link from "next/link";
import './styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import YandexRatingBadge from "@/components/_HelperComponents/YandexRatingBadge/YandexRatingBadge";
import LeadButton from "@/components/LeadModal/LeadButton";
import {CONTACTS_DATA} from "@/constants/contactsData";
import {groupOf} from "@/constants/serviceGroups";
import type {ServiceFact} from "@/constants/serviceHero";
import {NAVIGATION_URL} from "@/constants/navigation";
import {breadcrumbJsonLd, type BreadcrumbItem} from "@/utils/seo";

interface ServiceHeroProps {
    title: string;
    lead: string;
    facts: ServiceFact[];
    image: string;
    imageAlt: string;
    /** Полная цепочка с главной и текущей страницей — для крошек и разметки */
    breadcrumbs: BreadcrumbItem[];
    /** Адрес услуги — по нему подсвечивается вкладка в группе */
    servicePath: string;
}

/**
 * Первый экран страницы услуги: крошки, заголовок, лид, три факта, кнопки
 * «Записаться» и «Позвонить», рейтинг с Яндекса и фото. Снизу — вкладки
 * услуг той же группы с текущей подсвеченной: сразу видно, где ты и что
 * рядом. Раньше здесь были заголовок и абзац на шесть строк на тёмном фоне.
 */
const ServiceHero = ({title, lead, facts, image, imageAlt, breadcrumbs, servicePath}: ServiceHeroProps) => {
    const group = groupOf(servicePath);

    return (
        <section className="service-hero">
            <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />

            <div className="service-hero-grid">
                <div className="service-hero-text">
                    <Breadcrumbs items={breadcrumbs.slice(1)} />
                    <h1 className="service-hero-title">{title}</h1>
                    <p className="service-hero-lead">{lead}</p>

                    <ul className="service-hero-facts">
                        {facts.map((fact) => (
                            <li key={fact.label} className="service-hero-fact">
                                <span className="service-hero-fact-value">{fact.value}</span>
                                <span className="service-hero-fact-label">{fact.label}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="service-hero-actions">
                        <LeadButton className="service-hero-button service-hero-button--primary">
                            Записаться
                        </LeadButton>
                        <a href={`tel:${CONTACTS_DATA.phone1}`} className="service-hero-button">
                            {CONTACTS_DATA.phone1}
                        </a>
                    </div>

                    <YandexRatingBadge variant="compact" theme="dark" />
                </div>

                <div className="service-hero-media">
                    <Image
                        src={image}
                        alt={imageAlt}
                        width={1200}
                        height={892}
                        sizes="(max-width: 1100px) 100vw, 560px"
                        className="service-hero-image"
                        priority
                    />
                </div>
            </div>

            {group && (
                <nav className="service-tabs" aria-label={`Услуги раздела «${group.title}»`}>
                    <span className="service-tabs-title">{group.title}:</span>
                    <ul>
                        {group.items.map((item) => (
                            <li key={item.href}>
                                {item.href === servicePath ? (
                                    <span className="service-tab service-tab--active" aria-current="page">{item.title}</span>
                                ) : (
                                    <Link href={item.href} className="service-tab">{item.title}</Link>
                                )}
                            </li>
                        ))}
                        <li>
                            <Link href={NAVIGATION_URL.uslugi} className="service-tab service-tab--all">Все услуги →</Link>
                        </li>
                    </ul>
                </nav>
            )}
        </section>
    );
};

export default ServiceHero;
