import React from "react";
import Link from "next/link";
import '@/components/CasesBlock/styles.css';
import './styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import CaseCard from "@/components/CasesBlock/CaseCard";
import ClusterMore from "@/components/CasesBlock/ClusterMore";
import ReviewsBlock from "@/components/ReviewsBlock/ReviewsBlock";
import FormBlock from "@/components/FormBlock/FormBlock";
import LeadButton from "@/components/LeadModal/LeadButton";
import {CASES, CLUSTERS, clusterOf} from "@/constants/cases";
import {NAVIGATION_URL} from "@/constants/navigation";
import {plural} from "@/constants/yandexReviews";
import {absoluteUrl, breadcrumbJsonLd, buildMetadata} from "@/utils/seo";

export const metadata = buildMetadata({
    title: 'Наши работы: фары до и после — Prime Auto, Минск',
    description: 'Примеры работ мастерской автосвета: установка Bi-Led, ремонт и пересвет ДХО, запотевание, ' +
        'полировка и плёнка. Audi, BMW, Mercedes, Kia, Dodge и другие — фото и отзывы клиентов.',
    path: NAVIGATION_URL.raboty,
});

/*
  «Наши работы»: все кейсы (src/constants/cases.ts), разложенные по типам
  работ — у каждого раздела свой H2, якорь и ссылка на услугу. Раньше пункт
  меню «Работы» был якорем #portfolio на главной.
*/
const RabotyPage = () => {
    const groups = CLUSTERS
        .map((cluster) => ({...cluster, items: CASES.filter((item) => clusterOf(item) === cluster.key)}))
        .filter((group) => group.items.length);
    const brands = new Set(CASES.map((c) => c.car.split(" ")[0].toLowerCase())).size;

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
                        {plural(CASES.length, ['работа', 'работы', 'работ'])} на машинах {brands} марок — что было с фарами,
                        что сделали и что сказал владелец. Фото — из нашей мастерской, отзывы — с Яндекс Карт.
                        Нашли похожий случай? Пришлите фото своей фары — скажем, что можно сделать и сколько это будет стоить.
                    </p>
                    <LeadButton className="cases-page-cta">Прислать фото фары</LeadButton>

                    <ul className="cases-clusters-nav" aria-label="Типы работ">
                        {groups.map((group) => (
                            <li key={group.key}><a href={`#${group.key}`}>{group.title} · {group.items.length}</a></li>
                        ))}
                    </ul>

                    {groups.map((group) => (
                        <section key={group.key} id={group.key} className="cases-cluster">
                            <div className="cases-cluster-head">
                                <h2 className="cases-cluster-title">{group.title} <small>· {plural(group.items.length, ['работа', 'работы', 'работ'])}</small></h2>
                                <Link href={group.href} className="cases-cluster-link">Об услуге и цены →</Link>
                                <p className="cases-cluster-description">{group.description}</p>
                            </div>
                            {/* по 8 работ, остальные — по кнопке «Показать ещё» */}
                            <ClusterMore total={group.items.length} initial={8} step={8}>
                                {group.items.map((item) => <CaseCard key={item.id} item={item} />)}
                            </ClusterMore>
                        </section>
                    ))}
                </div>
            </div>

            <ReviewsBlock />
            <FormBlock />
        </main>
    );
};

export default RabotyPage;
