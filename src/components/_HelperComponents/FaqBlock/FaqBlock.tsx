import React from "react";
import './styles.css';
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {faqJsonLd, type FaqItem} from "@/utils/seo";

interface FaqBlockProps {
    items: FaqItem[];
    /** Подпись рукописным шрифтом над заголовком */
    upperTitle?: string;
    /** Основной заголовок блока */
    title?: string;
}

/**
 * Вопрос-ответ на <details>/<summary>: раскрытие работает без JavaScript,
 * поэтому блок ничего не добавляет к бандлу и не блокирует интерактивность.
 * Разметку FAQPage отдаём тут же, чтобы она не могла разойтись с текстом на странице.
 */
const FaqBlock = ({items, upperTitle = 'Отвечаем', title = 'Вопросы и ответы'}: FaqBlockProps) => {
    if (!items.length) {
        return null;
    }

    return (
        <section className="faq-block-wrapper" aria-labelledby="faq-block-title">
            <JsonLd data={faqJsonLd(items)} />

            <div className="faq-block-title-container">
                <h2 className="faq-block-upper-title">{upperTitle}</h2>
                <h2 className="faq-block-under-title" id="faq-block-title">{title.toUpperCase()}</h2>
            </div>

            <div className="faq-block-list">
                {items.map((item) => (
                    <details className="faq-item" key={item.question}>
                        <summary className="faq-item-question">
                            <span>{item.question}</span>
                            <span className="faq-item-icon" aria-hidden="true" />
                        </summary>
                        <div className="faq-item-answer">{item.answer}</div>
                    </details>
                ))}
            </div>
        </section>
    );
};

export default FaqBlock;
