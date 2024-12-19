import {CardInfoInterface} from "@/components/Services/types";

export const SERVICE_TYPES = {
    IMPROVEMENT_LIGHT_QUALITY: 'IMPROVEMENT_LIGHT_QUALITY',
    POLISHING_POSTING: 'POLISHING_POSTING',
    HEADLIGHTS_PERSPIRATION: 'HEADLIGHTS_PERSPIRATION',
    HEADLIGHTS_REPAIR: 'HEADLIGHTS_REPAIR',
    MAINTENANCE: 'MAINTENANCE',
}

export const CARD_INFO: CardInfoInterface = {
    [SERVICE_TYPES.IMPROVEMENT_LIGHT_QUALITY]: {
        title: 'Улучшение качества света',
        list: [
            'Установка Bi-Led (билед) модулей',
            'Установка би-линз',
            'Установка диодных ламп'
        ],
    },
    [SERVICE_TYPES.POLISHING_POSTING]: {
        title: 'Полировка и оклейка (бронирование) фар',
        list: [
            'Полировка и шлифовка фар химическим методом',
            'Полировка и шлифовка фар мануальным методом',
            'Оклейка премиальной полиуретановой плёнкой (бронёй)',
        ]
    },
    [SERVICE_TYPES.HEADLIGHTS_REPAIR]: {
        title: 'Ремонт фар',
        list: [
            'Замена корпусов, стекол',
            'Ремонт корпусов',
            'Ремонт ДХО (дневных ходовых огней, глазок)',
            'Ремонт креплений'
        ],
    },
    [SERVICE_TYPES.HEADLIGHTS_PERSPIRATION]: {
        title: 'Устранение запотевания',
        list: [
            'Переуплотнение фар',
            'Проверка герметичности фар',
            'Пайка корпусов',
            'Очистка изнутри'
        ],
    },
    [SERVICE_TYPES.MAINTENANCE]: {
        title: 'Техническое обслуживание фар',
        list: [
            'Замена всех ламп',
            'Регулировка света фар по ГОСТ',
            'Замена блоков розжига ксенона',
        ]
    },
}