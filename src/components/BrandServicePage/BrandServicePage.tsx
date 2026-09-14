import React from "react";
import {notFound} from "next/navigation";
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
import BrandDetailsBlock from "@/components/_HelperComponents/BrandDetailsBlock/BrandDetailsBlock";
import {BRAND_SERVICES, getBrandService} from "@/constants/brandServices";
import {CAR_BRANDS, getBrand} from "@/constants/carBrands";
import {serviceJsonLd} from "@/utils/seo";
import {getBrandServiceNote} from "@/constants/brandServiceNotes";
import {brandPagePath, isBrandPageIndexed} from "@/utils/brandPages";

interface BrandServicePageProps {
    serviceKey: string;
    brandSlug: string;
}

/**
 * Одна страница «услуга + марка». Все шесть маршрутов рендерятся отсюда,
 * поэтому правку структуры достаточно сделать в одном месте.
 */
const BrandServicePage = ({serviceKey, brandSlug}: BrandServicePageProps) => {
    const service = getBrandService(serviceKey);
    const brand = getBrand(brandSlug);

    if (!brand) {
        notFound();
    }

    const path = brandPagePath(service.basePath, brand.slug);

    /*
      Текст, который есть только на этой странице. Он заведён для тех пар
      «марка + услуга», что остаются в индексе; у остальных блока нет, и они
      отдаются с noindex — именно потому, что уникального содержимого у них нет.
    */
    const details = getBrandServiceNote(service.key, brand.slug);

    /*
      Перелинковка ведёт только на индексируемые страницы.

      Раньше с каждой страницы марки уходило 39 ссылок на страницы других марок
      и 5 на другие услуги той же марки — почти все на шаблонные страницы,
      которые сейчас отдаются с noindex. Это и размывало обход, и раздувало
      общую для всех страниц часть текста: одинаковое облако анкоров делало
      соседние страницы похожими само по себе.

      Полный каталог марок остался на родительской странице услуги — как
      справочник он там и уместен.
    */
    const otherServices = BRAND_SERVICES
        .filter((item) => item.key !== service.key && isBrandPageIndexed(item.key, brand.slug))
        .map((item) => ({
            title: `${item.label} ${brand.name}`,
            href: brandPagePath(item.basePath, brand.slug),
        }));

    const otherBrands = CAR_BRANDS
        .filter((item) => item.slug !== brand.slug && isBrandPageIndexed(service.key, item.slug))
        .map((item) => ({
            title: item.name,
            href: brandPagePath(service.basePath, item.slug),
        }));

    return (
        <main className="light-quality-page-wrapper">
            <JsonLd
                data={serviceJsonLd({
                    name: service.h1(brand),
                    description: service.description(brand),
                    path,
                    serviceType: service.label,
                    offers: service.priceDataSource.map((row) => ({
                        name: row.serviceName,
                        price: row.price,
                    })),
                })}
            />

            <ServicePageTitleContainer
                headText={service.h1(brand)}
                description={service.intro(brand)}
                list={service.bullets}
                currentLabel={brand.name}
                breadcrumbs={[
                    ...service.trail,
                    {name: service.label, path: service.basePath},
                    {name: brand.name, path},
                ]}
            />

            {details && (
                <BrandDetailsBlock
                    title={`${service.label} ${brand.name}: особенности`}
                    note={details}
                />
            )}

            <OurProposalBlock list={service.proposalList} />

            <PriceBlock
                title={service.priceTitle}
                priceDataSource={service.priceDataSource}
            />

            <InstallmentBlock />

            <FaqBlock items={service.faq(brand)} />

            {otherServices.length > 0 && (
                <LinksCloudBlock
                    upperTitle="Ещё для этой марки"
                    title={`Другие услуги для ${brand.name}`}
                    links={otherServices}
                />
            )}

            <LinksCloudBlock
                upperTitle="Работаем с любой маркой"
                title={`${service.label} — другие марки`}
                allBrandsHref={service.basePath}
                description={`Не нашли свою модель? Мы берёмся за ${service.label.toLowerCase()} практически на любом автомобиле — позвоните, и мы подскажем по вашему случаю.`}
                links={otherBrands}
                tight
            />

            <Portfolio />
            <FormBlock />
        </main>
    );
};

export default BrandServicePage;
