import React from "react";
import './styles.css';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import FullWidthImage from "@/components/_HelperComponents/FullWidthImage/FullWidthImage.jsx";
import {benefitsItems, imageAlt, textAbout, works, worksTitle} from "./constants.ts";


const DescriptionButtons = () => {
    return (
        <div className="about-description-button-wrapper">
            {
                works.map((item, index) => (
                    <div
                        key={`${item}${Math.random() * index}`}
                        className="about-description-button"
                    >
                        {item}
                    </div>
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
                <h2 className="block-title-upper-about">О нас</h2>
                <h2 className="block-title-under-about">О КОМПАНИИ</h2>
            </div>

            <div className="about-section">
                <h3 className="about-section-title">{textAbout.title}</h3>
                <div className="about-section-description-wrapper">
                    <div className="about-section-first">{textAbout.first}</div>
                    <div className="about-section-second">{textAbout.second}</div>
                </div>
            </div>

            <div className="about-works-wrapper">
                <div className="about-works-title">{worksTitle.toUpperCase()}</div>
                <DescriptionButtons/>
            </div>

            <FullWidthImage
                src="/images/about-car.jpg"
                alt={imageAlt}
                height={575}
                className="about-car-image-wrapper"
                imageClassName="about-car-image"
            />

            <BenefitsDescription/>
        </div>
    )
}

export default AboutCompany;