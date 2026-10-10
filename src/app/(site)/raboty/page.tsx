import React from "react";
import '@/components/CasesBlock/styles.css';
import './styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import CaseCard from "@/components/CasesBlock/CaseCard";
import CasesFilter from "@/components/CasesBlock/CasesFilter";
import ReviewsBlock from "@/components/ReviewsBlock/ReviewsBlock";
import FormBlock from "@/components/FormBlock/FormBlock";
import LeadButton from "@/components/LeadModal/LeadButton";
import {CASES, SERVICE_TITLES, type CaseService} from "@/constants/cases";
import {NAVIGATION_URL} from "@/constants/navigation";
import {plural} from "@/constants/yandexReviews";
import {absoluteUrl, breadcrumbJsonLd, buildMetadata} from "@/utils/seo";

export const metadata = buildMetadata({
    title: 'Наши работы: фары до и после — Prime Auto, Минск',
    description: 'Примеры работ мастерской автосвета: Bi-Led в BMW, Audi, Mercedes, ремонт ДХО, замена стёкол, ' +
        'полировка и плёнка. Машины, что сделали, фото и отзывы клиентов.',
    path: NAVIGATION_URL.raboty,
});

/*
  «Наши работы». Раньше пункт меню «Работы» был якорем #portfolio на главной —
  со страниц без этого блока (статьи, цены, контакты) он никуда не вёл.
  Здесь все кейсы (src/constants/cases.ts): машина, что сделали, фото, отзыв.
*/
const RabotyPage = () => {
    const counts = new Map<CaseService, number>();
    for (const item of CASES) for (const service of item.services) counts.set(service, (counts.get(service) ?? 0) + 1);
    const options = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({key, title: SERVICE_TITLES[key].title, count}));
    const cars = new Set(CASES.map((c) => c.car.split(" ")[0])).size;

    return (
        <main>
            <JsonLd
                data={[
                    breadcrumbJsonLd([
                        {name: 'Главная', path: NAVIGATION_URL.home},
                        {name: 'Наши работы', path: NAVIGATION_URL.raboty},
                    ]),
                    {
                        '@context': 'https://schema.org',
                        '@type': 'ItemList',
                        '@id': `${absoluteUrl(NAVIGATION_URL.raboty)}#cases`,
                        name: 'Примеры работ Prime Auto',
                        itemListElement: CASES.map((item, index) => ({
                            '@type': 'ListItem',
                            position: index + 1,
                            name: `${item.car}: ${item.title}`,
                        })),
                    },
                ]}
            />
            <div className="cases-page">
                <div className="cases-page-inner">
                    <Breadcrumbs />
                    <h1 className="cases-page-h1">Наши работы: фары до и после</h1>
                    <p className="cases-page-lead">
                        {plural(CASES.length, ['работа', 'работы', 'работ'])} на машинах {cars} марок — что было с фарами, что сделали и что сказал владелец.
                        Фото — наши, отзывы — с Яндекс Карт. Нашли похожий случай? Пришлите фото своей фары —
                        скажем, что можно сделать и сколько это будет стоить.
                    </p>
                    <LeadButton className="cases-page-cta">Прислать фото фары</LeadButton>

                    <CasesFilter options={options} />

                    <div className="cases-grid">
                        {CASES.map((item) => <CaseCard key={item.id} item={item} headingLevel={2} />)}
                    </div>
                </div>
            </div>

            <ReviewsBlock />
            <FormBlock />
        </main>
    );
};

export default RabotyPage;
