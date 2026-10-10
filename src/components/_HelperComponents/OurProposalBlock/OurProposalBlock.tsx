import React from 'react';
import Link from "next/link";
import './styles.css';
import {OurProposalBlockProps} from "@/components/_HelperComponents/OurProposalBlock/types";

const BLOCK_TEXT = {
    title: "Что мы делаем",
    description: "Наши предложения",
}

const ArrowIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

/*
  Карточки «что входит в услугу». Раньше это были белые плашки на белом фоне
  без рамки, шириной по 398 px — четыре в ряд вылезали за сетку страницы, а
  ссылка была у всех, даже где вести некуда (href="#"). Теперь карточка со
  ссылкой выглядит кликабельной и ведёт на подуслугу, без ссылки — просто текст.
*/
const OurProposalBlock = ({list}: OurProposalBlockProps) => (
    <section className="our-proposal-block-wrapper">
        <div className="our-proposal-block-title-container">
            {/* Надпись над заголовком — декоративная, не заголовок */}
            <div className="our-proposal-block-title">{BLOCK_TEXT.title}</div>
            <h2 className="our-proposal-block-description">{BLOCK_TEXT.description}</h2>
        </div>

        <ul className="our-proposal-wrapper">
            {list.map((item) => {
                const content = (
                    <>
                        <span className="our-proposal-marker" aria-hidden="true">+</span>
                        <h3 className="our-proposal-title">{item.title}</h3>
                        <p className="our-proposal-description">{item.description}</p>
                        {item.link && (
                            <span className="our-proposal-more">Подробнее <ArrowIcon /></span>
                        )}
                    </>
                );
                return (
                    <li key={item.title}>
                        {item.link ? (
                            <Link className="our-proposal our-proposal--link" href={item.link}>{content}</Link>
                        ) : (
                            <div className="our-proposal">{content}</div>
                        )}
                    </li>
                );
            })}
        </ul>
    </section>
);

export default OurProposalBlock;
