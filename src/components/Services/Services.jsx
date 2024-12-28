import React from 'react';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import Link from "next/link";
import './styles.css';
import SvgComponent from "@/components/_HelperComponents/SvgComponent/SvgComponent.jsx";
import {SVG_NAMES} from "@/components/_HelperComponents/SvgComponent/constants.js";
import {CARD_INFO, SERVICE_TYPES} from "./constants.ts";
import {NAVIGATION_URL} from "../../constants/navigation.js";

const Card3 = ({svgName, svgClassName, cardCount = 3, title, list, link}) => {
    return (
        <div className={`card-${cardCount}`}>
            <Link href={link} className="card-3-link">
                <div className="card-text-info">
                    <SvgComponent name={svgName} className={svgClassName}/>
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
                        <h2 className="h2-styled-font-services">Наши</h2>
                        <h2 className="h2-base-font-services">УСЛУГИ</h2>
                    </div>
                )
            }

            <div className="card-3-wrapper">
                <Card3
                    svgName={SVG_NAMES.tuning}
                    svgClassName="svg-card-services"
                    title={(CARD_INFO[SERVICE_TYPES.IMPROVEMENT_LIGHT_QUALITY].title).toUpperCase()}
                    list={CARD_INFO[SERVICE_TYPES.IMPROVEMENT_LIGHT_QUALITY].list}
                    link={NAVIGATION_URL.uluchsheniyeKachestvaSveta}
                    cardCount={3}
                />
                <Card3
                    svgName={SVG_NAMES.polirovka}
                    svgClassName="svg-card-services"
                    title={(CARD_INFO[SERVICE_TYPES.POLISHING_POSTING].title).toUpperCase()}
                    list={CARD_INFO[SERVICE_TYPES.POLISHING_POSTING].list}
                    link={NAVIGATION_URL.polirovkaOkleyka}
                    cardCount={3}
                />
                <Card3
                    svgName={SVG_NAMES.remontFar}
                    svgClassName="svg-card-services"
                    title={(CARD_INFO[SERVICE_TYPES.HEADLIGHTS_REPAIR].title).toUpperCase()}
                    list={CARD_INFO[SERVICE_TYPES.HEADLIGHTS_REPAIR].list}
                    link={NAVIGATION_URL.remont}
                    cardCount={3}
                />
            </div>
            <div className="card-2-wrapper">
                <Card3
                    svgName={SVG_NAMES.zapotevaniye}
                    svgClassName="svg-card-services"
                    title={(CARD_INFO[SERVICE_TYPES.HEADLIGHTS_PERSPIRATION].title).toUpperCase()}
                    list={CARD_INFO[SERVICE_TYPES.HEADLIGHTS_PERSPIRATION].list}
                    link={NAVIGATION_URL.zapotevaniye}
                    cardCount={2}
                />
                <Card3
                    svgName={SVG_NAMES.remontFonarey}
                    svgClassName="svg-card-services"
                    title={(CARD_INFO[SERVICE_TYPES.MAINTENANCE].title).toUpperCase()}
                    list={CARD_INFO[SERVICE_TYPES.MAINTENANCE].list}
                    link={NAVIGATION_URL.tehObsluzhivaniye}
                    cardCount={2}
                />
            </div>
        </div>
    )
}

export default Services;