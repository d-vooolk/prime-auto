export const NAVIGATION_URL = {
    home: '/',
    newYearSale: '/new-year-sale',
    price: '/price',
    contacts: '/contacts',
    reviews: '/otzyvy',
    uslugi: '/uslugi',
    articles: '/stati',
    polirovkaOkleyka: '/uslugi/polirovka-i-okleyka-far',
    remont: '/uslugi/remont-far',
    zamenaStekla: '/uslugi/remont-far/zamena-stekla-fary',
    remontLed: '/uslugi/remont-far/remont-led-far-i-dho',
    tehObsluzhivaniye: '/uslugi/tehnicheskoye-obsluzhivaniye-far',
    regulirovka: '/uslugi/regulirovka-far',
    zapotevaniye: '/uslugi/ustraneniye-zapotevaniya',
    uluchsheniyeKachestvaSveta: '/uslugi/uluchshenie-kachestva-sveta',
    biled: '/uslugi/uluchshenie-kachestva-sveta/ustanovka-biled-moduley-minsk',
    confidencePolicy: '/confidence-policy',
};

export const NAVIGATION_URL_ANCHORS = {
    about: '#about',
    reviews: '/#reviews',
    portfolio: '#portfolio',
    contacts: '#contacts',
    leadForm: '#leadForm',
}

export const breadcrumbLabels = {
    [NAVIGATION_URL.home]: "Главная",
    [NAVIGATION_URL.newYearSale]: "Новогодняя акция",
    [NAVIGATION_URL.polirovkaOkleyka]: "Полировка и оклейка",
    [NAVIGATION_URL.remont]: "Ремонт фар",
    [NAVIGATION_URL.tehObsluzhivaniye]: "Техническое обслуживание фар",
    [NAVIGATION_URL.regulirovka]: "Регулировка фар",
    [NAVIGATION_URL.zamenaStekla]: "Замена стекла фары",
    [NAVIGATION_URL.remontLed]: "Ремонт LED-фар и ДХО",
    [NAVIGATION_URL.uluchsheniyeKachestvaSveta]: "Улучшение качества света",
    [NAVIGATION_URL.uslugi]: "Услуги по ретрофиту фар",
    [NAVIGATION_URL.zapotevaniye]: "Устранение запотевания фар",

    [NAVIGATION_URL.price]: "Цены",
    [NAVIGATION_URL.contacts]: "Контакты",
    [NAVIGATION_URL.reviews]: "Отзывы",
    [NAVIGATION_URL.articles]: "Статьи",
    [NAVIGATION_URL.biled]: "Установка Bi-Led модулей в фары",
    [NAVIGATION_URL.confidencePolicy]: "Политика конфиденциальности",
};

export const NAVIGATION = [
    {
        title: 'Услуги',
        url: NAVIGATION_URL.uslugi,
    },
    {
        title: 'Цены',
        url: NAVIGATION_URL.price,
    },
    {
        title: 'Отзывы',
        url: NAVIGATION_URL.reviews,
    },
    {
        title: 'Статьи',
        url: NAVIGATION_URL.articles,
    },
    {
        title: 'Работы',
        url: NAVIGATION_URL_ANCHORS.portfolio,
    },
    {
        title: 'Контакты',
        url: NAVIGATION_URL.contacts,
    },
];
