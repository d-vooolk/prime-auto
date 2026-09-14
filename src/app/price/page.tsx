import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import PriceBlock from "@/components/_HelperComponents/PriceBlock/PriceBlock";
import InstallmentBlock from "@/components/InstallmentBlock/InstallmentBlock";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import LinksCloudBlock from "@/components/_HelperComponents/LinksCloudBlock/LinksCloudBlock";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {PAGE_TITLE_TEXT, priceDataSource} from "@/app/price/constants";
import {PRICE_FAQ} from "@/constants/faq";
import {BRAND_SERVICES} from "@/constants/brandServices";
import {NAVIGATION_URL} from "@/constants/navigation";
import {buildMetadata, serviceJsonLd} from "@/utils/seo";

export const metadata = buildMetadata({
    title: META.price.title,
    description: META.price.description,
    path: NAVIGATION_URL.price,
});

const serviceLinks = BRAND_SERVICES.map((service) => ({
    title: service.label,
    href: service.basePath,
}));

/*
  Прайс — самая коммерческая страница сайта, но разметки предложений на ней не
  было: только BreadcrumbList и FAQPage. Отдаём таблицу как OfferCatalog, чтобы
  поисковик видел не «текст с числами», а перечень работ с ценами.
  Цены вида «от 50» разбирает serviceJsonLd.
*/
const priceOffers = priceDataSource.map((item) => ({
    name: item.serviceName,
    price: item.price,
}));

const PricePage = () => (
    <main className="light-quality-page-wrapper">
        <JsonLd
            data={serviceJsonLd({
                name: 'Работы с автомобильной оптикой',
                description: META.price.description,
                path: NAVIGATION_URL.price,
                serviceType: 'Автосвет и ретрофит фар',
                offers: priceOffers,
            })}
        />

        <ServicePageTitleContainer
            headText={PAGE_TITLE_TEXT.title}
            description={PAGE_TITLE_TEXT.description}
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'Цены', path: NAVIGATION_URL.price},
            ]}
        />

        <PriceBlock
            title={PAGE_TITLE_TEXT.priceTitle}
            priceDataSource={priceDataSource}
            withoutHeader
        />

        <InstallmentBlock />

        <FaqBlock items={PRICE_FAQ} />

        <LinksCloudBlock
            upperTitle="Подробнее"
            title="Цены по направлениям"
            description="На страницах услуг цены разбиты по работам, а ещё есть отдельные страницы под марки автомобилей."
            links={serviceLinks}
        />

        <Portfolio/>
        <FormBlock/>
    </main>
);

export default PricePage;
