import type {Metadata} from "next";
import {CAR_BRANDS, getBrand} from "@/constants/carBrands";
import {BRAND_SERVICES, getBrandService} from "@/constants/brandServices";
import {buildMetadata} from "@/utils/seo";

export interface BrandRouteParams {
    brand: string;
}

export const brandPagePath = (basePath: string, brandSlug: string): string =>
    `${basePath}/${brandSlug}`;

/** Один и тот же набор марок для всех шести услуг */
export const brandStaticParams = (): BrandRouteParams[] =>
    CAR_BRANDS.map((brand) => ({brand: brand.slug}));

export const buildBrandPageMetadata = (serviceKey: string, brandSlug: string): Metadata => {
    const service = getBrandService(serviceKey);
    const brand = getBrand(brandSlug);

    if (!brand) {
        return {title: 'Страница не найдена'};
    }

    return buildMetadata({
        title: service.title(brand),
        description: service.description(brand),
        path: brandPagePath(service.basePath, brand.slug),
        keywords: [
            `${service.label.toLowerCase()} ${brand.name}`,
            `${service.label.toLowerCase()} ${brand.nameRu}`,
            `${service.label.toLowerCase()} ${brand.name} Минск`,
            `${service.label.toLowerCase()} ${brand.nameRu} Минск`,
            `автосвет ${brand.name} Минск`,
            'Prime Auto',
            'Прайм Авто',
        ],
    });
};

/** Все URL страниц марок — используется в sitemap.xml */
export const allBrandPagePaths = (): string[] =>
    BRAND_SERVICES.flatMap((service) =>
        CAR_BRANDS.map((brand) => brandPagePath(service.basePath, brand.slug)),
    );
