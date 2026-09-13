import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import {PAGE_TITLE_TEXT} from "@/app/uslugi/constants";
import Services from "@/components/Services/Services";
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
    keywords: META.uslugi.keywords,
    path: NAVIGATION_URL.uslugi,
});

const UslugiPage = () => (
    <main className="light-quality-page-wrapper">
        <ServicePageTitleContainer
            headText={PAGE_TITLE_TEXT.title}
            description={PAGE_TITLE_TEXT.description}
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'Услуги по ретрофиту фар', path: NAVIGATION_URL.uslugi},
            ]}
        />

        <Services withoutHeader />

        <InstallmentBlock />

        <FaqBlock items={USLUGI_FAQ} />

        <Portfolio/>
        <FormBlock/>
    </main>
);

export default UslugiPage;
