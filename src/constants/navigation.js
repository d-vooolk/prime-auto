export const NAVIGATION_URL = {
    home: '/',
    newYearSale: '/new-year-sale',
    price: '/price',
    contacts: '/contacts',
    uslugi: '/uslugi',
    polirovkaOkleyka: '/uslugi/polirovka-i-okleyka-far',
    remont: '/uslugi/remont-far',
    tehObsluzhivaniye: '/uslugi/tehnicheskoye-obsluzhivaniye-far',
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
    [NAVIGATION_URL.uluchsheniyeKachestvaSveta]: "Улучшение качества света",
    [NAVIGATION_URL.uslugi]: "Услуги по ретрофиту фар",
    [NAVIGATION_URL.zapotevaniye]: "Устранение запотевания фар",

    [NAVIGATION_URL.price]: "Цены",
    [NAVIGATION_URL.contacts]: "Контакты",
    [NAVIGATION_URL.biled]: "Установка Bi-Led модулей в фары",

    // for add
    [NAVIGATION_URL.works]: "Примеры работ",
    [NAVIGATION_URL.polirovka]: "Полировка фар",
    [NAVIGATION_URL.okleyka]: "Оклейка фар",
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
        url: NAVIGATION_URL_ANCHORS.reviews,
    },
    {
        title: 'Работы',
        url: NAVIGATION_URL_ANCHORS.portfolio,
    },
    {
        title: 'Контакты',
        url: NAVIGATION_URL.contacts,
    },
    {
        title: 'Акции',
        url: NAVIGATION_URL.newYearSale,
    }
];