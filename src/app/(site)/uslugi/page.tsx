import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServiceHero from "@/components/_HelperComponents/ServiceHero/ServiceHero";
import ServiceAbout from "@/components/_HelperComponents/ServiceAbout/ServiceAbout";
import ServicesCatalog from "@/components/ServicesCatalog/ServicesCatalog";
import HeadlightQuiz from "@/components/HeadlightQuiz/HeadlightQuiz";
import {PAGE_TITLE_TEXT} from "@/app/(site)/uslugi/constants";
import {USLUGI_HERO_IMAGE} from "@/constants/serviceHero";
import InstallmentBlock from "@/components/InstallmentBlock/InstallmentBlock";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import {USLUGI_FAQ} from "@/constants/faq";
import {NAVIGATION_URL} from "@/constants/navigation";
import {buildMetadata} from "@/utils/seo";

export const metadata = buildMetadata({
    title: META.uslugi.title,
    description: META.uslugi.description,
    path: NAVIGATION_URL.uslugi,
});

const UslugiPage = () => (
    <main className="light-quality-page-wrapper">
        <ServiceHero
            title={PAGE_TITLE_TEXT.title}
            lead="Ремонт, полировка, ретрофит и регулировка фар в одной мастерской. Выберите услугу — на её странице цены, сроки, фото работ и ответы на частые вопросы."
            facts={[
                {value: 'от 50 руб.', label: 'регулировка и замена ламп'},
                {value: '1–2 дня', label: 'работы с разборкой фары'},
                {value: 'от 2 лет', label: 'гарантия на модули'},
            ]}
            image={USLUGI_HERO_IMAGE}
            imageAlt="Мастерская автосвета: автомобиль с включёнными фарами"
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'Услуги', path: NAVIGATION_URL.uslugi},
            ]}
            servicePath={NAVIGATION_URL.uslugi}
        />

        <ServicesCatalog />

        <HeadlightQuiz />

        <ServiceAbout title="О мастерской" text={PAGE_TITLE_TEXT.description} />

        <InstallmentBlock />

        <FaqBlock items={USLUGI_FAQ} />

        <Portfolio/>
        <FormBlock/>
    </main>
);

export default UslugiPage;
