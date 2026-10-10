import React from "react";
import './styles.css';
import LeadButton from "@/components/LeadModal/LeadButton";
import TelegramIcon from "@/components/LeadModal/TelegramIcon";
import {CONTACTS_DATA} from "@/constants/contactsData";
import {LINKS} from "@/constants/links";

/**
 * Панель внизу экрана на телефоне: «Оставить заявку», звонок и Telegram —
 * всегда под пальцем, где бы человек ни читал страницу. На компьютере
 * не показывается: там есть телефон в шапке и кнопки на первом экране.
 */
const MobileCtaBar = () => (
    <div className="mobile-cta-bar">
        <LeadButton className="mobile-cta-main">Оставить заявку</LeadButton>
        <a href={`tel:${CONTACTS_DATA.phone1}`} className="mobile-cta-icon" aria-label={`Позвонить ${CONTACTS_DATA.phone1}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
        </a>
        <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer" className="mobile-cta-icon mobile-cta-icon--tg" aria-label="Написать в Telegram">
            <TelegramIcon />
        </a>
    </div>
);

export default MobileCtaBar;
