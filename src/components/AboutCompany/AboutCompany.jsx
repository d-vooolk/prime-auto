import React from "react";
import './styles.css';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import {benefitsItems, textAbout, works, worksTitle} from "./constants.ts";
import Link from "next/link";


const DescriptionButtons = () => {
    return (
        <div className="about-description-button-wrapper">
            {
                works.map((item, index) => (
                    <Link
                        key={`${item}${Math.random() * index}`}
                        className="about-description-button"
                        href={item.link}
                    >
                        {item.title}
                    </Link>
                ))
            }
        </div>
    )
}

const BenefitsDescription = () => (
    <div className="about-benefits-wrapper">
        {
            benefitsItems.map((item, index) => (
                <div
                    key={`${item.title}${Math.random() * index}`}
                    className="about-benefit"
                >
                    <ListComponent
                        list={[item.title.toUpperCase()]}
                        className="about-benefits-title"
                        wrapperClassname="about-benefits-title-wrapper"
                    />
                    <div className="about-benefits-description">
                        <span>
                            {item.description}
                        </span>
                    </div>
                </div>
            ))
        }
    </div>
);

const AboutCompany = () => {
    return (
        <div className="about-wrapper" id="about">
            <div className="block-title-about">
                {/* Надпись над заголовком — декоративная. Раньше это был такой же
                      h2/h3, и в оглавлении страницы появлялся бессмысленный
                      обрывок: на главной 9 из 20 заголовков были такими. Класс
                      задаёт размер, вес и отступы сам, поэтому смена тега
                      внешний вид не меняет. */}
                <div className="block-title-upper-about">О нас</div>
                <h2 className="block-title-under-about">О компании</h2>
            </div>

            <div className="about-section">
                {/* «PRIME AUTO —» — вводная строка к тексту ниже, а не заголовок раздела:
                      как h3 она попадала в оглавление обрывком. */}
                <div className="about-section-title">{textAbout.title}</div>
                <div className="about-section-description-wrapper">
                    <div className="about-section-first">{textAbout.first}</div>
                    <div className="about-section-second">{textAbout.second}</div>
                </div>
            </div>

            <div className="about-works-wrapper">
                <div className="about-works-title">{worksTitle.toUpperCase()}</div>
                <DescriptionButtons/>
            </div>

            <BenefitsDescription/>
        </div>
    )
}

export default AboutCompany;