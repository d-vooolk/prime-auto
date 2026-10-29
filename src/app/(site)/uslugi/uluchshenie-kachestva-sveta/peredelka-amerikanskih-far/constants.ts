import {OurProposalBlockList} from "@/components/_HelperComponents/OurProposalBlock/types";
import {NAVIGATION_URL} from "@/constants/navigation";
import type {StandaloneService} from "@/components/ServiceLandingPage/ServiceLandingPage";

/*
  Подуслуга ретрофита под машины из США. Цена «от 200» — со слов мастерской 30.10.2026. Машины — из своих кейсов (src/constants/cases-recent.json): Dodge Challenger, Caravan, Journey, Chevrolet Camaro, Equinox, Honda Crosstour.
  Первый экран и блок «Коротко» — src/constants/serviceHero.ts.
*/

export const PAGE_TITLE_TEXT = {
    title: "Переделка американских фар под Европу в Минске",
    description:
        "Машины из США приходят с фарами, рассчитанными на американские правила: передние поворотники часто горят постоянно как габариты и мигают поверх них, а у ближнего света другая светотеневая граница — более размытая, с другим наклоном. На дороге и на техосмотре это вопросы: мигающий «габарит» путает других водителей, а размытый пучок слепит встречных. Переделываем фары под европейские требования: разводим функции габарита и поворотника, ставим модули с европейской светотеневой границей — чаще всего Bi-Led, — и регулируем свет на стене. Делали это на Dodge Challenger, Chevrolet Camaro и Equinox, Dodge Journey и Caravan, Honda Crosstour. Переделка — от 200 руб., установка Bi-Led под ключ — от 700 руб. за две фары без учёта модулей. Что именно нужно вашей машине, скажем после осмотра.",
    priceTitle: "Цены на переделку американских фар",
};

export const proposalList: OurProposalBlockList[] = [
    {
        title: "Поворотники и габариты",
        description:
            "Разводим функции: габарит горит постоянно, поворотник мигает отдельно, как положено в Европе.",
    },
    {
        title: "Европейская светотеневая граница",
        description:
            "Ставим в фары модули с европейской границей — чаще Bi-Led: чёткий пучок, который не слепит встречных.",
        link: NAVIGATION_URL.biled,
    },
    {
        title: "Задние фонари",
        description:
            "Переделка и ремонт задних фонарей машин из США — отдельно или вместе с фарами.",
        link: NAVIGATION_URL.zadnieFonari,
    },
    {
        title: "Регулировка",
        description:
            "После переделки выставляем свет на настроечной стене по ГОСТ.",
        link: NAVIGATION_URL.regulirovka,
    },
];

export const priceDataSource = [
    {
        serviceName: "Переделка американских фар под европейские требования",
        price: "от 200",
    },
    {
        serviceName: "Установка Bi-Led модулей под ключ (две фары, без учёта модулей)",
        price: "от 700",
    },
    {
        serviceName: "Электро-монтажные работы внутри фары",
        price: "от 30",
    },
    {
        serviceName: "Регулировка света фар",
        price: "50",
    },
];

export const SERVICE: StandaloneService = {
    label: "Переделка американских фар",
    basePath: NAVIGATION_URL.amerikanskie,
    trail: [
        {name: "Главная", path: NAVIGATION_URL.home},
        {name: "Услуги", path: NAVIGATION_URL.uslugi},
        {name: "Ретрофит фар", path: NAVIGATION_URL.uluchsheniyeKachestvaSveta},
    ],
    faq: [
        {
            question: "Сколько стоит переделка американских фар?",
            answer:
                "Переделка — от 200 руб.; если ставим Bi-Led модули с европейской границей — установка под ключ от 700 руб. за две фары без учёта модулей. Точную смету называем после осмотра.",
        },
        {
            question: "Что меняется в фарах при переделке?",
            answer:
                "Разводим габарит и поворотник, при необходимости меняем источник света на модуль с европейской светотеневой границей и регулируем свет. Внешне фара остаётся родной.",
        },
        {
            question: "Почему американские фары слепят встречных?",
            answer:
                "У американского ближнего света другая светотеневая граница — более размытая, с большим количеством света выше линии. На наших дорогах это ощущается как ослепление.",
        },
        {
            question: "На каких машинах вы это делали?",
            answer:
                "Dodge Challenger, Caravan и Journey, Chevrolet Camaro и Equinox, Honda Crosstour — фото работ есть в разделе «Наши работы».",
        },
        {
            question: "Сохранится ли американский внешний вид?",
            answer:
                "Да. Работа идёт внутри фары и в проводке, корпус и стекло остаются родными.",
        },
    ],
};
