export const NAVIGATION_URL_ANCHORS = {
    services: '#services',
    about: '#about',
    reviews: '#reviews',
    portfolio: '#portfolio',
    contacts: '#contacts',
    leadForm: '#leadForm',
}

export const NAVIGATION_URL = {
    // current (worked)
    home: '/',
    newYearSale: '/new-year-sale',
    polirovkaOkleyka: '/polirovka-i-okleyka-far',
    remont: '/remont-far',
    tehObsluzhivaniye: '/tehnicheskoye-obsluzhivaniye-far',
    uluchsheniyeKachestvaSveta: '/uluchshenie-kachestva-sveta',
    uslugi: '/uslugi',

    // add
    price: '/price',
    works: '/works',
    contacts: '/contacts',
    biLed: '/ustanovka-bi-led-moduley-v-faru',
    polirovka: '/polirovka-far',
    okleyka: '/okleyka-far',
};

export const NAVIGATION = [
    {
        title: 'Услуги',
        url: NAVIGATION_URL_ANCHORS.services,
    },
    {
        title: 'О компании',
        url: NAVIGATION_URL_ANCHORS.about,
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
        url: NAVIGATION_URL_ANCHORS.contacts,
    },
    {
        title: 'Акции',
        url: NAVIGATION_URL.newYearSale,
    }
];