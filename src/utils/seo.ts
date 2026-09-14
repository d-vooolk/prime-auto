import type {Metadata} from "next";
import {SITE, SITE_URL} from "@/constants/site";
import {LINKS} from "@/constants/links";

export const absoluteUrl = (path: string): string =>
    `${SITE_URL}${path === '/' ? '/' : path}`;

interface BuildMetadataArgs {
    title: string;
    description: string;
    /** Путь страницы без домена, начиная со слэша */
    path: string;
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
    noIndex = false,
    ogImage = DEFAULT_OG_IMAGE,
}: BuildMetadataArgs): Metadata => {
    const url = absoluteUrl(path);

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        /*
          noindex, но follow. Страница уходит из выдачи, а ссылки на ней
          продолжают работать: с неиндексируемых страниц марок стоят переходы
          на родительскую услугу и на индексируемые марки, и обрывать их
          через nofollow смысла нет.
        */
        robots: noIndex
            ? {index: false, follow: true}
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
    priceRange: SITE.priceRange,
    hasMap: LINKS.yandexMap,
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
    /*
      Карточки в картах стоят первыми не случайно: для локального бизнеса связь
      сайта с картографической сущностью весит больше соцсетей. Пустые значения
      отфильтровываются — пока не заполнен LINKS.googleBusiness, в разметку
      уходит только Яндекс.
    */
    sameAs: [
        LINKS.yandexMap,
        LINKS.googleBusiness,
        'https://www.instagram.com/prime_auto_minsk/',
        'https://www.tiktok.com/@prime_auto_minsk',
        'https://www.youtube.com/@prime-auto-minsk',
        'https://www.facebook.com/profile.php?id=61558468265260',
    ].filter(Boolean),
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
    /** Цены передаются как в прайсе — «150» или «от 50», разбор ниже */
    offers?: {name: string; price: string}[];
}

/**
 * В schema.org Offer.price обязано быть числом без валюты и слов: на странице
 * услуги в разметку уходило «от 50», то есть предложения были невалидными.
 * Разбираем строку прайса здесь, а не на вызывающей стороне, чтобы все три
 * места (прайс, страницы услуг, страницы марок) вели себя одинаково.
 *
 * «от N» отдаём через minPrice в PriceSpecification — это штатный способ
 * сказать «цена начинается от», не выдавая минимум за точную цену.
 */
const priceOffer = (offer: {name: string; price: string}) => {
    const amount = offer.price.replace(/[^\d]/g, '');
    const itemOffered = {'@type': 'Service', name: offer.name};

    if (!amount) {
        return {'@type': 'Offer', priceCurrency: 'BYN', itemOffered};
    }

    return /от/i.test(offer.price)
        ? {
            '@type': 'Offer',
            priceCurrency: 'BYN',
            priceSpecification: {
                '@type': 'PriceSpecification',
                priceCurrency: 'BYN',
                minPrice: amount,
            },
            itemOffered,
        }
        : {'@type': 'Offer', priceCurrency: 'BYN', price: amount, itemOffered};
};

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
                itemListElement: offers.map(priceOffer),
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

interface ArticleJsonLdArgs {
    title: string;
    description: string;
    path: string;
    published: string;
    updated: string;
}

/**
 * Разметка статьи. author и publisher ссылаются на ту же организацию через
 * @id — поисковик связывает материал с уже описанной сущностью, а не заводит
 * отдельного безымянного автора.
 */
export const articleJsonLd = ({title, description, path, published, updated}: ArticleJsonLdArgs) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${absoluteUrl(path)}#article`,
    headline: title,
    description,
    inLanguage: 'ru-RU',
    datePublished: published,
    dateModified: updated,
    mainEntityOfPage: {'@type': 'WebPage', '@id': absoluteUrl(path)},
    author: {'@id': ORGANIZATION_ID},
    publisher: {'@id': ORGANIZATION_ID},
    image: absoluteUrl('/images/first-car.webp'),
});
