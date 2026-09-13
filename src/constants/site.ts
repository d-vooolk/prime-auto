/**
 * Единый источник правды по данным организации.
 * Используется в метаданных, robots.txt, sitemap.xml и микроразметке Schema.org.
 */
export const SITE_URL = 'https://prime-auto.by';

export const SITE = {
    url: SITE_URL,
    name: 'Prime Auto',
    alternateName: 'Прайм Авто',
    legalName: 'ООО «Первый Автосвет»',
    taxId: '193897412',
    email: 'info@prime-auto.by',
    phone: '+375336655449',
    phoneFormatted: '+375 (33) 66-55-44-9',
    city: 'Минск',
    street: 'Брилевский тупик, 5',
    country: 'BY',
    geo: {
        latitude: 53.871641,
        longitude: 27.523566,
    },
    openingHours: [
        {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '19:00',
        },
    ],
    openingHoursText: 'Пн–Пт 09:00–19:00, Сб–Вс — выходной',
} as const;
