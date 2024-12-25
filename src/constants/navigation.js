export const NAVIGATION_URL_ANCHORS = {
    services: '#services',
    about: '#about',
    reviews: '#reviews',
    portfolio: '#portfolio',
    contacts: '#contacts',
    leadForm: '#leadForm',
}

export const NAVIGATION_URL = {
    home: '/',
    newYearSale: '/new-year-sale',
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