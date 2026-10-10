import React from "react";
import './styles.css';

/**
 * Подробный текст об услуге. Раньше он целиком стоял на первом экране
 * абзацем на шесть строк; теперь там короткий лид, а полный текст — здесь:
 * для поисковика он на месте, человеку не мешает выбрать и записаться.
 */
const ServiceAbout = ({title = "Об услуге", text, list}: {title?: string; text?: string; list?: string[]}) => (
    <section className="service-about">
        <div className="service-about-inner">
            <h2 className="service-about-title">{title}</h2>
            <div>
                {text && <p className="service-about-text">{text}</p>}
                {list?.length ? (
                    <ul className="service-about-list">
                        {list.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                ) : null}
            </div>
        </div>
    </section>
);

export default ServiceAbout;
