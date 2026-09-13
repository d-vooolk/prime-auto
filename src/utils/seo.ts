import type {Metadata} from "next";
import {SITE, SITE_URL} from "@/constants/site";

export const absoluteUrl = (path: string): string =>
    `${SITE_URL}${path === '/' ? '/' : path}`;

interface BuildMetadataArgs {
    title: string;
    description: string;
    /** Путь страницы без домена, начиная со слэша */
    path: string;
    keywords?: readonly string[];
    noIndex?: boolean;
    ogImage?: string;
}

const DEFAULT_OG_IMAGE = '/images/first-car.webp';

/**
 * Единая точка сборки метаданных: canonical, robots, Open Graph и Twitter.
 * До этого canonical и OG на сайте не было вообще — без них поисковики
 * сами выбирают «главную» версию URL, а соцсети показывают пустой сниппет.
 */
export const buildMetadata = ({
    title,
    description,
    path,
    keywords,
    noIndex = false,
    ogImage = DEFAULT_OG_IMAGE,
}: BuildMetadataArgs): Metadata => {
    const url = absoluteUrl(path);

    return {
        title,
        description,
        keywords: keywords ? [...keywords] : undefined,
        alternates: {
            canonical: url,
        },
        robots: noIndex
            ? {index: false, follow: false}
            : {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                    'max-video-preview': -1,
                },
            },
        openGraph: {
            type: 'website',
            locale: 'ru_RU',
            siteName: SITE.name,
            url,
            title,
            description,
            images: [
                {
                    url: absoluteUrl(ogImage),
                    width: 1100,
                    height: 632,
                    alt: `${SITE.name} — мастерская автосвета в Минске`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [absoluteUrl(ogImage)],
        },
    };
};

/* ------------------------------------------------------------------ */
/* Schema.org                                                          */
/* ------------------------------------------------------------------ */

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Карточка организации. AutoRepair — самый точный тип для мастерской,
 * он же наследует LocalBusiness, поэтому Яндекс и Google читают адрес,
 * телефон и часы работы из одного объекта.
 */
export const localBusinessJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': ORGANIZATION_ID,
    name: SITE.name,
    alternateName: SITE.alternateName,
    legalName: SITE.legalName,
    taxID: SITE.taxId,
    url: SITE_URL,
    email: SITE.email,
    telephone: SITE.phone,
    image: absoluteUrl('/images/first-car.webp'),
    logo: absoluteUrl('/logo.svg'),
    currenciesAccepted: 'BYN',
    paymentAccepted: 'Наличные, банковская карта, карта рассрочки',
    address: {
        '@type': 'PostalAddress',
        streetAddress: SITE.street,
        addressLocality: SITE.city,
        addressCountry: SITE.country,
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: SITE.geo.latitude,
        longitude: SITE.geo.longitude,
    },
    areaServed: {
        '@type': 'City',
        name: SITE.city,
    },
    openingHoursSpecification: SITE.openingHours.map((slot) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [...slot.days],
        opens: slot.opens,
        closes: slot.closes,
    })),
    sameAs: [
        'https://www.instagram.com/prime_auto_minsk/',
        'https://www.tiktok.com/@prime_auto_minsk',
        'https://www.youtube.com/@prime-auto-minsk',
        'https://www.facebook.com/profile.php?id=61558468265260',
    ],
});

export const webSiteJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE.name,
    inLanguage: 'ru-RU',
    publisher: {'@id': ORGANIZATION_ID},
});

export interface BreadcrumbItem {
    name: string;
    path: string;
}

export const breadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
    })),
});

interface ServiceJsonLdArgs {
    name: string;
    description: string;
    path: string;
    /** Название типа услуги, например «Ремонт фар» */
    serviceType?: string;
    offers?: {name: string; price: string}[];
}

export const serviceJsonLd = ({name, description, path, serviceType, offers}: ServiceJsonLdArgs) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${absoluteUrl(path)}#service`,
    name,
    description,
    serviceType: serviceType ?? name,
    url: absoluteUrl(path),
    provider: {'@id': ORGANIZATION_ID},
    areaServed: {
        '@type': 'City',
        name: SITE.city,
    },
    ...(offers?.length
        ? {
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name,
                itemListElement: offers.map((offer) => ({
                    '@type': 'Offer',
                    priceCurrency: 'BYN',
                    price: offer.price,
                    itemOffered: {
                        '@type': 'Service',
                        name: offer.name,
                    },
                })),
            },
        }
        : {}),
});

export interface FaqItem {
    question: string;
    answer: string;
}

export const faqJsonLd = (items: FaqItem[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
        },
    })),
});

/**
 * Отзывы отдаём без числовых оценок: реальных рейтингов у нас нет,
 * а размечать их «на глаз» — прямой путь к ручным санкциям за фейковые
 * rich-сниппеты. Текст и авторы поисковику всё равно полезны.
 */
export const reviewsJsonLd = (reviews: {name: string; review: string}[], path: string) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absoluteUrl(path)}#reviews`,
    name: `Отзывы клиентов ${SITE.name}`,
    itemListElement: reviews.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
            '@type': 'Review',
            author: {
                '@type': 'Person',
                name: item.name,
            },
            reviewBody: item.review,
            itemReviewed: {'@id': ORGANIZATION_ID},
        },
    })),
});
