import React from "react";
import Link from "next/link";
import './styles.css';
import {INSTALLMENT_CARDS, INSTALLMENT_TEXT} from "@/components/InstallmentBlock/constants";
import {NAVIGATION_URL_ANCHORS} from "@/constants/navigation";

/**
 * Блок оплаты частями. Логотипов банков намеренно нет: это чужие товарные знаки,
 * а ещё три дополнительные картинки на каждой коммерческой странице.
 */
const InstallmentBlock = () => (
    <section className="installment-block-wrapper" aria-labelledby="installment-title">
        <div className="installment-title-container">
            <h2 className="installment-upper-title">{INSTALLMENT_TEXT.upperTitle}</h2>
            <h2 className="installment-under-title" id="installment-title">
                {INSTALLMENT_TEXT.title.toUpperCase()}
            </h2>
        </div>

        <p className="installment-description">{INSTALLMENT_TEXT.description}</p>

        <div className="installment-cards-wrapper">
            {INSTALLMENT_CARDS.map((card) => (
                <div className="installment-card" key={card.name}>
                    <div className="installment-card-head">
                        <span className="installment-card-name">{card.name}</span>
                        <span className="installment-card-bank">{card.bank}</span>
                    </div>
                    <p className="installment-card-description">{card.description}</p>
                    <span className="installment-card-badge">0% переплаты</span>
                </div>
            ))}
        </div>

        <p className="installment-note">{INSTALLMENT_TEXT.note}</p>

        <Link href={NAVIGATION_URL_ANCHORS.leadForm} className="installment-button">
            <span>{INSTALLMENT_TEXT.buttonText}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </Link>
    </section>
);

export default InstallmentBlock;
