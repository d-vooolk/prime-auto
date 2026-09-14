import type {Metadata} from "next";
import {CAR_BRANDS, getBrand} from "@/constants/carBrands";
import {BRAND_SERVICES, getBrandService} from "@/constants/brandServices";
import {buildMetadata} from "@/utils/seo";

export interface BrandRouteParams {
    brand: string;
}

/*
  Какие страницы марок остаются в индексе.

  Было 40 марок x 6 услуг = 240 страниц, у которых схожесть видимого текста
  92-95% (замерено по отрендеренному HTML: bmw vs audi 92.6%, bmw vs byd 95.1%),
  а от родительской страницы услуги каждая отличалась на 21%. Уникального
  содержимого на страницу приходилось 3-5% — название марки, список моделей и
  один абзац про особенности оптики. По определению Google это дорвеи, и риск
  не в том, что такие страницы не ранжируются (они и не ранжировались), а в том
  что при соотношении «95% сайта — шаблон» под переоценку качества попадает весь
  домен, включая коммерческие страницы услуг.

  Поэтому в индексе остаётся столько, сколько реально наполняется уникальным
  текстом и своими фотографиями. Остальные отдаются как noindex, follow:
  из выдачи уходят, для пользователя и для перелинковки остаются.

  Порядок CAR_BRANDS задан как приоритет по частотности в Минске — берём первые
  двенадцать. Услуги — только те две, где марка действительно меняет и смысл
  запроса, и содержание работы: на «устранение запотевания» марка не влияет,
  а на выбор Bi-Led модуля и на ремонт корпуса — влияет.
*/
export const INDEXED_BRAND_LIMIT = 12;
export const INDEXED_SERVICE_KEYS: readonly string[] = ['remont', 'biled'];

const indexedBrandSlugs = new Set(
    CAR_BRANDS.slice(0, INDEXED_BRAND_LIMIT).map((brand) => brand.slug),
);

export const isBrandPageIndexed = (serviceKey: string, brandSlug: string): boolean =>
    INDEXED_SERVICE_KEYS.includes(serviceKey) && indexedBrandSlugs.has(brandSlug);

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
        noIndex: !isBrandPageIndexed(serviceKey, brand.slug),
    });
};

/**
 * URL страниц марок для sitemap.xml — только индексируемые.
 * Страница с noindex в карте сайта — противоречивый сигнал: мы просим
 * её обойти и одновременно запрещаем показывать.
 */
export const allBrandPagePaths = (): string[] =>
    BRAND_SERVICES.filter((service) => INDEXED_SERVICE_KEYS.includes(service.key))
        .flatMap((service) =>
            CAR_BRANDS.filter((brand) => indexedBrandSlugs.has(brand.slug))
                .map((brand) => brandPagePath(service.basePath, brand.slug)),
        );
