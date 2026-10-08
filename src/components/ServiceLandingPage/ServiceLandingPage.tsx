import React from "react";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import OurProposalBlock from "@/components/_HelperComponents/OurProposalBlock/OurProposalBlock";
import PriceBlock from "@/components/_HelperComponents/PriceBlock/PriceBlock";
import InstallmentBlock from "@/components/InstallmentBlock/InstallmentBlock";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import LinksCloudBlock from "@/components/_HelperComponents/LinksCloudBlock/LinksCloudBlock";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {getBrandService} from "@/constants/brandServices";
import {CAR_BRANDS} from "@/constants/carBrands";
import {brandPagePath, isBrandPageIndexed} from "@/utils/brandPages";
import {serviceJsonLd, type FaqItem} from "@/utils/seo";
import type {PriceDataSourceInterface} from "@/components/_HelperComponents/CustomTable/types";
import type {OurProposalBlockList} from "@/components/_HelperComponents/OurProposalBlock/types";

/** Услуга без страниц марок: всё, что для таких услуг берётся из BRAND_SERVICES */
export interface StandaloneService {
    label: string;
    basePath: string;
    trail: {name: string; path: string}[];
    faq: FaqItem[];
}

interface ServiceLandingPageProps {
    /** Ключ услуги из BRAND_SERVICES — у таких услуг есть страницы марок */
    serviceKey?: string;
    /** Услуга без страниц марок: облака марок на странице нет */
    service?: StandaloneService;
    headText: string;
    description: string;
    priceTitle: string;
    proposalList: OurProposalBlockList[];
    priceDataSource: PriceDataSourceInterface[];
    /** Описание для микроразметки Service (обычно meta description страницы) */
    metaDescription: string;
}

/**
 * Общая раскладка страницы услуги. Порядок блоков тот же, что был,
 * плюс рассрочка, вопрос-ответ и перелинковка на страницы марок.
 */
const ServiceLandingPage = ({
    serviceKey,
    service: standalone,
    headText,
    description,
    priceTitle,
    proposalList,
    priceDataSource,
    metaDescription,
}: ServiceLandingPageProps) => {
    const brandService = serviceKey ? getBrandService(serviceKey) : null;
    const service: StandaloneService = standalone ?? {
        label: brandService!.label,
        basePath: brandService!.basePath,
        trail: brandService!.trail,
        faq: brandService!.faq(),
    };

    /*
      Ссылки только на страницы марок, открытые для индексации. Раньше облако
      вело на все 40 марок на каждой из шести услуг — 216 из 240 таких страниц
      отдаются с noindex, и Яндекс тратил на них обход (86 исключил 5.10.2026).
      Сами страницы остаются для тех, кто попадёт на них по старым ссылкам.
    */
    const brandLinks = brandService
        ? CAR_BRANDS.filter((brand) => isBrandPageIndexed(brandService.key, brand.slug)).map((brand) => ({
            title: `${service.label} ${brand.name}`,
            href: brandPagePath(service.basePath, brand.slug),
        }))
        : [];

    return (
        <main className="light-quality-page-wrapper">
            <JsonLd
                data={serviceJsonLd({
                    name: headText,
                    description: metaDescription,
                    path: service.basePath,
                    serviceType: service.label,
                    offers: priceDataSource.map((row) => ({
                        name: row.serviceName,
                        price: row.price,
                    })),
                })}
            />

            <ServicePageTitleContainer
                headText={headText}
                description={description}
                breadcrumbs={[...service.trail, {name: service.label, path: service.basePath}]}
            />

            <OurProposalBlock list={proposalList} />

            <PriceBlock
                title={priceTitle}
                priceDataSource={priceDataSource}
            />

            <InstallmentBlock />

            <FaqBlock items={service.faq} />

            {brandLinks.length > 0 && (
                <LinksCloudBlock
                    upperTitle="Подберите свою марку"
                    title={`${service.label} по маркам авто`}
                    description="У каждой марки свои особенности оптики. Выберите свою — расскажем, что обычно приходится делать именно на ней, и покажем цены."
                    links={brandLinks}
                />
            )}

            <Portfolio />
            <FormBlock />
        </main>
    );
};

export default ServiceLandingPage;
