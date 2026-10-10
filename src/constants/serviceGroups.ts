/**
 * Структура услуг: группы для выпадающего меню «Услуги» в шапке и для вкладок
 * под первым экраном страницы услуги. Вкладки показывают группу, в которой
 * находится страница, — человек видит, где он и что есть рядом.
 */
import {NAVIGATION_URL} from "./navigation";

export interface ServiceLink {
    title: string;
    href: string;
}

export interface ServiceGroup {
    title: string;
    items: ServiceLink[];
}

export const SERVICE_GROUPS: ServiceGroup[] = [
    {
        title: 'Ремонт фар',
        items: [
            {title: 'Ремонт фар', href: NAVIGATION_URL.remont},
            {title: 'Замена стекла фары', href: NAVIGATION_URL.zamenaStekla},
            {title: 'Ремонт LED-фар и ДХО', href: NAVIGATION_URL.remontLed},
            {title: 'Устранение запотевания', href: NAVIGATION_URL.zapotevaniye},
        ],
    },
    {
        title: 'Улучшение света',
        items: [
            {title: 'Ретрофит фар', href: NAVIGATION_URL.uluchsheniyeKachestvaSveta},
            {title: 'Установка Bi-Led модулей', href: NAVIGATION_URL.biled},
            {title: 'Регулировка фар', href: NAVIGATION_URL.regulirovka},
        ],
    },
    {
        title: 'Уход за фарами',
        items: [
            {title: 'Полировка и оклейка плёнкой', href: NAVIGATION_URL.polirovkaOkleyka},
            {title: 'Техническое обслуживание', href: NAVIGATION_URL.tehObsluzhivaniye},
        ],
    },
];

/** Группа, в которую входит страница (по адресу услуги) */
export const groupOf = (path: string): ServiceGroup | undefined =>
    SERVICE_GROUPS.find((group) => group.items.some((item) => item.href === path));
