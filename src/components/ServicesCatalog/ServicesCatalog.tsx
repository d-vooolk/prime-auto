import React from "react";
import Image from "next/image";
import Link from "next/link";
import './styles.css';
import {SERVICE_GROUPS} from "@/constants/serviceGroups";
import {SERVICE_HERO} from "@/constants/serviceHero";

/**
 * Каталог услуг для /uslugi: все услуги по группам, карточкой с фото,
 * коротким описанием и ценой «от». Раньше здесь стояли пять карточек с
 * главной — без замены стекла, LED и ДХО, регулировки и Bi-Led.
 */
const ServicesCatalog = () => (
    <section className="services-catalog">
        {SERVICE_GROUPS.map((group) => (
            <div key={group.title} className="services-catalog-group">
                <h2 className="services-catalog-title">{group.title}</h2>
                <ul className="services-catalog-grid">
                    {group.items.map((item) => {
                        const hero = SERVICE_HERO[item.href];
                        return (
                            <li key={item.href}>
                                <Link href={item.href} className="services-catalog-card">
                                    {hero && (
                                        <Image
                                            src={hero.image}
                                            alt=""
                                            width={1200}
                                            height={892}
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="services-catalog-image"
                                        />
                                    )}
                                    <span className="services-catalog-body">
                                        <span className="services-catalog-name">{item.title}</span>
                                        {hero && <span className="services-catalog-lead">{hero.lead}</span>}
                                        <span className="services-catalog-footer">
                                            {hero && (
                                                <span className="services-catalog-price">
                                                    {hero.facts[0].value} <small>{hero.facts[0].label}</small>
                                                </span>
                                            )}
                                            <span className="services-catalog-arrow" aria-hidden="true">→</span>
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        ))}
    </section>
);

export default ServicesCatalog;
