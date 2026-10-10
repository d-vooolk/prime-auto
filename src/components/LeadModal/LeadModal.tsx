'use client'

import React, {useEffect, useRef, useState} from "react";
import './styles.css';
import '@/components/FormBlock/styles.css';
import Form from "@/components/_HelperComponents/Form/Form.jsx";
import {trackConversion} from "@/utils/conversions";

export const OPEN_LEAD_EVENT = 'prime:open-lead';

/**
 * Открыть попап заявки из любого места (кнопки на первом экране, в шапке услуги,
 * внизу на телефоне). message — готовый текст комментария (подбор «Что с фарой?»).
 */
export const openLeadModal = (message?: string) =>
    window.dispatchEvent(new CustomEvent(OPEN_LEAD_EVENT, {detail: {message: message ?? ""}}));

/**
 * Попап с формой заявки. Один на весь сайт — лежит в layout и открывается по
 * событию. Нативный <dialog>: Esc, фокус внутри окна и блокировка фона
 * работают без библиотек. Форма та же, что внизу страницы, и шлёт заявку тем
 * же путём, цель Метрики — та же.
 */
const LeadModal = () => {
    const ref = useRef<HTMLDialogElement>(null);
    // ключ пересоздаёт форму, чтобы подставить новый текст; без текста форма не сбрасывается
    const [prefill, setPrefill] = useState({key: 0, message: ""});

    useEffect(() => {
        const open = (event: Event) => {
            const message = (event as CustomEvent<{message?: string}>).detail?.message ?? "";
            if (message) setPrefill((current) => ({key: current.key + 1, message}));
            ref.current?.showModal();
            trackConversion("lead_open");
        };
        window.addEventListener(OPEN_LEAD_EVENT, open);
        return () => window.removeEventListener(OPEN_LEAD_EVENT, open);
    }, []);

    // клик по затемнению вокруг окна закрывает его
    const onClick = (event: React.MouseEvent<HTMLDialogElement>) => {
        if (event.target === ref.current) ref.current?.close();
    };

    return (
        <dialog ref={ref} className="lead-modal" onClick={onClick} aria-labelledby="lead-modal-title">
            <div className="lead-modal-inner">
                <button type="button" className="lead-modal-close" onClick={() => ref.current?.close()} aria-label="Закрыть">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>
                <div className="lead-modal-title" id="lead-modal-title">Оставить заявку</div>
                <p className="lead-modal-text">
                    Опишите, что с фарами, — перезвоним, подскажем по работе и цене и запишем на удобное время.
                </p>
                <Form key={prefill.key} initialMessage={prefill.message} />
            </div>
        </dialog>
    );
};

export default LeadModal;
