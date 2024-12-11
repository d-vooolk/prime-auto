import React from 'react';
import ListComponent from "@/components/HelperComponents/ListComponent/ListComponent.jsx";
import Link from "next/link";
import './styles.css';
import SvgComponent from "@/components/HelperComponents/SvgComponent/SvgComponent.jsx";
import {SVG_NAMES} from "@/components/HelperComponents/SvgComponent/constants.js";

const cardInfo = {
    servicesLists: {
        polirovka: ['Полировка фар', 'Химическая полировка фар', 'Оклейка фар защитной пленкой'],
        zapotevaniye: ['Поиск негерметичности', 'Герметизация', 'Проверка вентиляции', 'Установка силикагелевых поглотителей влаги'],
        remontFar: ['Замена корпусов, стекол', 'Очистка фар изнутри', 'Замена отражателей, светодиодов', 'Полировка', 'Ремонт внутренних деталей'],
        remontFonarey: ['Замена выгоревших светодиодов', 'Переделка с USA на EU (замена красных светодиодов на оранжевые)', 'Устранение запотевания фонарей', 'Очистка изнутри'],
        tuning: ['Установка светодиодных модулей (LED, BI-LED)', 'Установка галогенных модулей', 'Установка модулей для газоразрядных ламп (XENON, BI-XENON)', 'Замена отражателей, электронных компонентов', 'Установка светодиодных ламп'],
    },
    cardTitles: {
        polirovka: 'ПОЛИРОВКА И ОКЛЕЙКА ЗАЩИТНОЙ ПЛЁНКОЙ',
        zapotevaniye: 'УСТРАНЕНИЕ ЗАПОТЕВАНИЯ',
        remontFar: 'РЕМОНТ ФАР',
        remontFonarey: 'РЕМОНТ ФОНАРЕЙ',
        tuning: 'ТЮНИНГ ФАР',
    }
}

const Card3 = ({ svgName, svgClassName, cardCount = 3, title, list, href }) => {
    return (
        <div className={`card-${cardCount}`}>
            <Link href={href} className="card-3-link">
                <div className="card-text-info">
                    <SvgComponent name={svgName} className={svgClassName}/>
                    <h2 className="h2-services">{ title }</h2>

                    <ListComponent
                        list={list}
                        className="card-list-services"
                        wrapperClassname="wrapper-list-services"
                    />
                </div>

                <div className="card-3-footer">
                    <span className="services-more-text">Подробнее</span>
                    <SvgComponent name={SVG_NAMES.arrowUpRight}/>
                </div>
            </Link>
        </div>
    )
}

const Services = () => {
    const { servicesLists, cardTitles } = cardInfo;

    return (
        <div className="services-block">
            <div className="block-title-services">
                <h2 className="h2-styled-font-services">Наши</h2>
                <h2 className="h2-base-font-services">УСЛУГИ</h2>
            </div>

            <div className="card-3-wrapper">
                <Card3
                    svgName={SVG_NAMES.polirovka}
                    svgClassName="svg-card-services"
                    title={cardTitles.polirovka}
                    list={servicesLists.polirovka}
                    href="#"
                    cardCount={3}
                />
                <Card3
                    svgName={SVG_NAMES.zapotevaniye}
                    svgClassName="svg-card-services"
                    title={cardTitles.zapotevaniye}
                    list={servicesLists.zapotevaniye}
                    href="#"
                    cardCount={3}
                />
                <Card3
                    svgName={SVG_NAMES.remontFar}
                    svgClassName="svg-card-services"
                    title={cardTitles.remontFar}
                    list={servicesLists.remontFar}
                    href="#"
                    cardCount={3}
                />
            </div>
            <div className="card-2-wrapper">
                <Card3
                    svgName={SVG_NAMES.remontFonarey}
                    svgClassName="svg-card-services"
                    title={cardTitles.remontFonarey}
                    list={servicesLists.remontFonarey}
                    href="#"
                    cardCount={2}
                />
                <Card3
                    svgName={SVG_NAMES.tuning}
                    svgClassName="svg-card-services"
                    title={cardTitles.tuning}
                    list={servicesLists.tuning}
                    href="#"
                    cardCount={2}
                />
            </div>
        </div>
    )
}

export default Services;