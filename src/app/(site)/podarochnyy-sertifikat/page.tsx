import React from "react";
import Link from "next/link";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import InfoCards, {type InfoCard} from "@/components/_HelperComponents/InfoCards/InfoCards";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import {SITE} from "@/constants/site";
import {NAVIGATION_URL} from "@/constants/navigation";
import {buildMetadata, type FaqItem} from "@/utils/seo";

/*
  Подарочный сертификат — со слов владельца 11.11.2026: бумажный, любого
  номинала, действует 1 год, покупается лично в мастерской. Подсказки по
  номиналу — цены из «Фактов» плана SEO.
*/

export const metadata = buildMetadata({
    title: 'Подарочный сертификат на ремонт и тюнинг фар | Prime Auto, Минск',
    description: 'Подарочный сертификат Prime Auto любого номинала на работы с фарами: ' +
        'полировка, Bi-Led, ремонт, тюнинг. Действует 1 год, покупается в мастерской в Минске.',
    path: NAVIGATION_URL.sertifikat,
});

const TERMS: InfoCard[] = [
    {title: 'Любой номинал', body: 'Сумму выбираете сами — под конкретную работу или просто «на фары».'},
    {title: 'Действует 1 год', body: 'Со дня покупки. Владелец сертификата записывается в удобное время.'},
    {title: 'Бумажный', body: 'Красивый подарок, который можно вручить в руки.'},
    {
        title: 'Покупка — в мастерской',
        body: <>{SITE.city}, {SITE.street}, {SITE.openingHoursText}. <Link href={NAVIGATION_URL.contacts}>Как доехать</Link></>,
    },
];

const IDEAS: InfoCard[] = [
    {title: 'Регулировка фар — 50 руб.', body: <>Свет на стене по ГОСТ, около 15 минут. <Link href={NAVIGATION_URL.regulirovka}>Подробнее</Link></>},
    {title: 'Тюнинг фар — от 100 руб.', body: <>Маски, антихром, ангельские глазки, пересвет ДХО. <Link href={NAVIGATION_URL.tyuning}>Подробнее</Link></>},
    {title: 'Полировка фар — от 150 руб.', body: <>Две фары снова прозрачные, можно с защитной плёнкой. <Link href={NAVIGATION_URL.polirovkaOkleyka}>Подробнее</Link></>},
    {title: 'Bi-Led под ключ — от 700 руб.', body: <>За две фары без учёта модулей. <Link href={NAVIGATION_URL.biled}>Подробнее</Link></>},
];

const FAQ: FaqItem[] = [
    {question: 'Какого номинала бывает сертификат?', answer: 'Любого — сумму выбираете сами.'},
    {question: 'Сколько действует сертификат?', answer: '1 год со дня покупки.'},
    {question: 'Есть ли электронный сертификат?', answer: 'Нет, сертификат бумажный.'},
    {
        question: 'Где купить сертификат?',
        answer: `Лично в мастерской: ${SITE.city}, ${SITE.street}, ${SITE.openingHoursText}. Телефон ${SITE.phoneFormatted}.`,
    },
];

const CertificatePage = () => (
    <main>
        <ServicePageTitleContainer
            headText="Подарочный сертификат Prime Auto"
            description={'Подарок для того, кто любит свою машину: сертификат на работы мастерской автосвета — ' +
                'полировку, ремонт, Bi-Led, тюнинг фар или регулировку. Любой номинал, действует 1 год, ' +
                'бумажный — покупается у нас в мастерской.'}
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'Подарочный сертификат', path: NAVIGATION_URL.sertifikat},
            ]}
        />
        <InfoCards id="certificate-terms" title="Условия" items={TERMS} light />
        <InfoCards
            id="certificate-ideas"
            title="На что хватит"
            lead={<>Чтобы выбрать сумму — цены на популярные работы. Все цены — в <Link href={NAVIGATION_URL.price}>прайсе</Link>.</>}
            items={IDEAS}
        />
        <FaqBlock items={FAQ} />
        <Portfolio />
        <FormBlock />
    </main>
);

export default CertificatePage;
