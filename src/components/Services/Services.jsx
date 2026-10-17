import React from 'react';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import Link from "next/link";
import './styles.css';
import SvgComponent from "@/components/_HelperComponents/SvgComponent/SvgComponent.jsx";
import {SVG_NAMES} from "@/components/_HelperComponents/SvgComponent/constants.js";
import {CARD_INFO, SERVICE_TYPES} from "./constants.ts";
import {NAVIGATION_URL} from "../../constants/navigation.js";

/*
  Иллюстрации карточек — отдельные файлы в public/images/services/card-*.svg,
  а не JSX: встроенными они весили ~40 КБ на каждой странице с этим блоком и
  ещё раз столько же в данных React. Файлом браузер скачивает их один раз и
  берёт из кеша на всех страницах.
*/
const Card3 = ({illustration, cardCount = 3, title, list, link}) => {
    return (
        <div className={`card-${cardCount}`}>
            <Link href={link} className="card-3-link">
                <div className="card-text-info">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`/images/services/card-${illustration}.svg`}
                        className="svg-card-services"
                        width={260}
                        height={170}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                    <h3 className="h2-services">{title}</h3>

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

const Services = ({withoutHeader = false}) => {
    return (
        <div className="services-block" id="services">
            {
                !withoutHeader && (
                    <div className="block-title-services">
                        {/* Надпись над заголовком — декоративная. Раньше это был такой же
                      h2/h3, и в оглавлении страницы появлялся бессмысленный
                      обрывок: на главной 9 из 20 заголовков были такими. Класс
                      задаёт размер, вес и отступы сам, поэтому смена тега
                      внешний вид не меняет. */}
                        <div className="h2-styled-font-services">Наши</div>
                        <h2 className="h2-base-font-services">Услуги</h2>
                    </div>
                )
            }

            <div className="card-3-wrapper">
                <Card3
                    illustration="tuning"
                    title={CARD_INFO[SERVICE_TYPES.IMPROVEMENT_LIGHT_QUALITY].title}
                    list={CARD_INFO[SERVICE_TYPES.IMPROVEMENT_LIGHT_QUALITY].list}
                    link={NAVIGATION_URL.uluchsheniyeKachestvaSveta}
                    cardCount={3}
                />
                <Card3
                    illustration="polirovka"
                    title={CARD_INFO[SERVICE_TYPES.POLISHING_POSTING].title}
                    list={CARD_INFO[SERVICE_TYPES.POLISHING_POSTING].list}
                    link={NAVIGATION_URL.polirovkaOkleyka}
                    cardCount={3}
                />
                <Card3
                    illustration="remont-far"
                    title={CARD_INFO[SERVICE_TYPES.HEADLIGHTS_REPAIR].title}
                    list={CARD_INFO[SERVICE_TYPES.HEADLIGHTS_REPAIR].list}
                    link={NAVIGATION_URL.remont}
                    cardCount={3}
                />
            </div>
            <div className="card-2-wrapper">
                <Card3
                    illustration="zapotevaniye"
                    title={CARD_INFO[SERVICE_TYPES.HEADLIGHTS_PERSPIRATION].title}
                    list={CARD_INFO[SERVICE_TYPES.HEADLIGHTS_PERSPIRATION].list}
                    link={NAVIGATION_URL.zapotevaniye}
                    cardCount={2}
                />
                <Card3
                    illustration="remont-fonarey"
                    title={CARD_INFO[SERVICE_TYPES.MAINTENANCE].title}
                    list={CARD_INFO[SERVICE_TYPES.MAINTENANCE].list}
                    link={NAVIGATION_URL.tehObsluzhivaniye}
                    cardCount={2}
                />
            </div>
        </div>
    )
}

export default Services;