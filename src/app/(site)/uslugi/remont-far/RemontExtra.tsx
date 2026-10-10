import React from "react";
import Link from "next/link";
import '@/components/_HelperComponents/ServiceExtra/styles.css';
import LeadButton from "@/components/LeadModal/LeadButton";
import {NAVIGATION_URL} from "@/constants/navigation";

/*
  Дополнительные разделы страницы «Ремонт фар» — под точку роста
  «ремонт фар в минске» (528 показов за 28 дней, 6-е место, CTR 0,2%) и
  кластер «восстановление фар» (~200 показов, 5–9 место), которого на
  странице почти не было. Цены и сроки — из прайса и «Фактов» в seo-plan.md:
  меняется прайс — правьте и таблицу.
*/

const DAMAGE: {problem: string; work: string; price: string; time: string; href?: string}[] = [
    {problem: "Мутное, жёлтое или сколотое стекло", work: "Замена стекла: разборка с прогревом, новое стекло, сборка на герметике", price: "работа 150–200 руб. + стекло", time: "1–2 дня", href: NAVIGATION_URL.zamenaStekla},
    {problem: "Разбито стекло после камня или ДТП", work: "Замена стекла, чистка фары изнутри от осколков", price: "работа 150–200 руб. + стекло", time: "1–2 дня", href: NAVIGATION_URL.zamenaStekla},
    {problem: "Трещина в корпусе", work: "Сварка ремонтными прутками, проверка герметичности", price: "4 руб. за 1 см шва + разборка", time: "1–2 дня"},
    {problem: "Сломаны крепления («уши»)", work: "Восстановление креплений пластиком, усиление", price: "4 руб. за 1 см шва", time: "обычно в день обращения"},
    {problem: "Не горит, мигает или пожелтел ДХО", work: "Диагностика, ремонт платы и светодиодов, световоды", price: "от 100 руб.", time: "обычно за день", href: NAVIGATION_URL.remontLed},
    {problem: "Конденсат или вода внутри", work: "Поиск причины, переуплотнение, проверка герметичности", price: "150–200 руб.", time: "1–2 дня", href: NAVIGATION_URL.zapotevaniye},
    {problem: "Не работает корректор, электрика внутри", work: "Ремонт проводки и электромонтаж внутри фары", price: "от 30 руб.", time: "по объёму работ"},
    {problem: "Тусклый свет, выгорел отражатель", work: "Замена модуля на Bi-Led — вместо восстановления отражателя", price: "от 50 руб. за установку", time: "1–2 дня", href: NAVIGATION_URL.biled},
];

const STEPS = [
    {title: "Осмотр и смета", text: "Смотрим фару, называем, что делать и сколько стоит — до начала работ. Если ремонт невыгоден, скажем сразу."},
    {title: "Снятие фары", text: "Без снятия бампера — от 10 руб. за сторону, с бампером — 100 руб., с колёсами и подкрылками — 200 руб."},
    {title: "Разборка с прогревом", text: "Фару вскрываем, прогревая герметик, — так не ломаются защёлки и стекло."},
    {title: "Ремонт", text: "Меняем стекло, завариваем трещины, восстанавливаем крепления, чиним ДХО и электрику."},
    {title: "Сборка и проверка", text: "Собираем на бутиловом или полиуретановом герметике и проверяем на герметичность."},
    {title: "Регулировка и выдача", text: "Ставим фару на место, регулируем свет на стене по ГОСТ и отдаём машину."},
];

const RemontExtra = () => (
    <>
        <section className="remont-extra remont-extra--light">
            <div className="remont-extra-inner">
                <h2 className="remont-extra-title">Сколько стоит ремонт фары: ориентиры по поломкам</h2>
                <p className="remont-extra-lead">
                    Точную смету называем после осмотра — по фото можно прикинуть заранее. Цены за работу на одну фару,
                    запчасти (стекло, модуль) — отдельно, подбираем под вашу машину.
                </p>
                <div className="remont-extra-table-wrap">
                    <table className="remont-extra-table">
                        <thead>
                        <tr><th>Что случилось</th><th>Что делаем</th><th>Цена</th><th>Срок</th></tr>
                        </thead>
                        <tbody>
                        {DAMAGE.map((row) => (
                            <tr key={row.problem}>
                                <td><b>{row.href ? <Link href={row.href}>{row.problem}</Link> : row.problem}</b></td>
                                <td>{row.work}</td>
                                <td className="remont-extra-nowrap">{row.price}</td>
                                <td className="remont-extra-nowrap">{row.time}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <LeadButton className="remont-extra-button" message="Хочу узнать цену ремонта фары, прикреплю фото.">
                    Прислать фото и узнать цену
                </LeadButton>
            </div>
        </section>

        <section className="remont-extra">
            <div className="remont-extra-inner">
                <h2 className="remont-extra-title">Как проходит ремонт фары</h2>
                <ol className="remont-extra-steps">
                    {STEPS.map((step, index) => (
                        <li key={step.title}>
                            <span className="remont-extra-step-number">{index + 1}</span>
                            <div>
                                <div className="remont-extra-step-title">{step.title}</div>
                                <p>{step.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>

        <section className="remont-extra remont-extra--light">
            <div className="remont-extra-inner remont-extra-columns">
                <div>
                    <h2 className="remont-extra-title">Ремонт или новая фара</h2>
                    <p>
                        Новая оригинальная фара на современную машину стоит сотни и тысячи рублей, особенно светодиодная
                        или адаптивная. Ремонт стекла, корпуса и креплений обходится в разы дешевле и сохраняет родную
                        оптику с правильной светотеневой границей. Аналоги и «китай» дешевле ремонта, но часто светят
                        хуже и не проходят техосмотр.
                    </p>
                    <p>
                        Новую фару советуем, когда разрушена силовая часть корпуса или посадочные места: тогда ремонт
                        не держит. Это видно на осмотре — скажем честно.{" "}
                        <Link href={`${NAVIGATION_URL.articles}/remont-fary-ili-novaya-detal-kak-poschitat-vygodu-na-svoey-mashine`}>
                            Как посчитать выгоду на своей машине →
                        </Link>
                    </p>
                </div>
                <div>
                    <h2 className="remont-extra-title">Восстановление фар: что это</h2>
                    <p>
                        «Восстановлением» называют две разные работы. Если фара просто помутнела и пожелтела —
                        достаточно <Link href={NAVIGATION_URL.polirovkaOkleyka}>полировки и оклейки плёнкой</Link>:
                        прозрачность возвращается за день. Если стекло сточено прошлыми полировками, в сколах или
                        разбито, сломаны крепления, не горит ДХО — это ремонт: меняем стекло, восстанавливаем корпус
                        и электронику.
                    </p>
                    <p>
                        Не знаете, что нужно вашей фаре, — пришлите фото: подскажем, хватит полировки или нужен ремонт.
                    </p>
                </div>
            </div>
        </section>
    </>
);

export default RemontExtra;
