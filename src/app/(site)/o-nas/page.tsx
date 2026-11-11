import React from "react";
import Link from "next/link";
import './styles.css';
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import YandexRatingBadge from "@/components/_HelperComponents/YandexRatingBadge/YandexRatingBadge";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import {TEAM} from "@/constants/team";
import {CASES} from "@/constants/cases";
import {NAVIGATION_URL} from "@/constants/navigation";
import {absoluteUrl, buildMetadata, ORGANIZATION_ID, personJsonLd} from "@/utils/seo";
import {ABOUT_LINKS, ABOUT_PAGE_TEXT, ABOUT_PRINCIPLES} from "@/app/(site)/o-nas/constants";

export const metadata = buildMetadata({
    title: 'О мастерской Prime Auto — мастера и как мы работаем | Минск',
    description: 'Кто ремонтирует фары в Prime Auto: главный мастер Артём Петкевич и мастер ' +
        'Руслан Томилин, опыт больше 5 лет. Как работаем: сварка полимером, регулировка по ГОСТ.',
    path: NAVIGATION_URL.about,
});

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('');

const AboutPage = () => (
    <main className="about-page-wrapper">
        <JsonLd
            data={[
                {
                    '@context': 'https://schema.org',
                    '@type': 'AboutPage',
                    '@id': `${absoluteUrl(NAVIGATION_URL.about)}#webpage`,
                    url: absoluteUrl(NAVIGATION_URL.about),
                    name: ABOUT_PAGE_TEXT.title,
                    inLanguage: 'ru-RU',
                    about: {'@id': ORGANIZATION_ID},
                },
                ...TEAM.map(personJsonLd),
            ]}
        />

        <ServicePageTitleContainer
            headText={ABOUT_PAGE_TEXT.title}
            description={ABOUT_PAGE_TEXT.description}
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'О мастерской', path: NAVIGATION_URL.about},
            ]}
        />

        <section className="about-team" aria-labelledby="about-team-title">
            <h2 className="about-team-title" id="about-team-title">Кто делает работу</h2>
            <ul className="about-team-list">
                {TEAM.map((member) => (
                    <li className="about-team-card" id={member.slug} key={member.slug}>
                        {member.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="about-team-photo" src={member.photo} alt={member.shortName}
                                 width={160} height={160} loading="lazy" />
                        ) : (
                            <div className="about-team-photo about-team-initials" aria-hidden="true">
                                {initials(member.shortName)}
                            </div>
                        )}
                        <div className="about-team-name">{member.shortName}</div>
                        <div className="about-team-role">{member.role}</div>
                        {member.experience && <div className="about-team-experience">{member.experience}</div>}
                        {member.text && <p className="about-team-text">{member.text}</p>}
                    </li>
                ))}
            </ul>

            <div className="about-team-facts">
                <YandexRatingBadge theme="light" />
                <Link href={NAVIGATION_URL.raboty} className="about-team-cases">
                    <b>{CASES.length}</b> работ с фото и видео →
                </Link>
            </div>
        </section>

        <section className="about-principles" aria-labelledby="about-principles-title">
            <h2 className="about-team-title" id="about-principles-title">Как мы работаем</h2>
            <ul className="about-principles-list">
                {ABOUT_PRINCIPLES.map((item) => (
                    <li key={item.title}>
                        <h3 className="about-principles-name">{item.title}</h3>
                        <p>{item.body}</p>
                    </li>
                ))}
            </ul>
        </section>

        <nav className="about-links" aria-label="Дальше">
            {ABOUT_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="about-links-item">{link.title} →</Link>
            ))}
        </nav>

        <Portfolio />
        <FormBlock />
    </main>
);

export default AboutPage;
