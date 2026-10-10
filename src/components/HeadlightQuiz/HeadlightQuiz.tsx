'use client'

import React, {useState} from "react";
import Link from "next/link";
import './styles.css';
import {SERVICE_HERO} from "@/constants/serviceHero";
import {NAVIGATION_URL} from "@/constants/navigation";
import {openLeadModal} from "@/components/LeadModal/LeadModal";

interface Problem {
    id: string;
    icon: string;
    title: string;
    service: string;
    serviceTitle: string;
    /** Подсказка на случай, если основной услуги не хватит */
    note?: string;
}

const PROBLEMS: Problem[] = [
    {id: "mutnaya", icon: "🌫️", title: "Фара мутная или пожелтела", service: NAVIGATION_URL.polirovkaOkleyka, serviceTitle: "Полировка и оклейка плёнкой",
        note: "Если стекло уже сточено прошлыми полировками или в сколах — честнее заменить стекло, скажем на осмотре."},
    {id: "voda", icon: "💧", title: "Внутри конденсат или вода", service: NAVIGATION_URL.zapotevaniye, serviceTitle: "Устранение запотевания"},
    {id: "slepit", icon: "🔦", title: "Плохо светит или слепит встречных", service: NAVIGATION_URL.regulirovka, serviceTitle: "Регулировка фар",
        note: "Если после регулировки света всё равно мало — дело в оптике, тогда помогут Bi-Led модули."},
    {id: "yarche", icon: "✨", title: "Хочу яркий современный свет", service: NAVIGATION_URL.biled, serviceTitle: "Установка Bi-Led модулей"},
    {id: "razbita", icon: "🔨", title: "Разбита, трещина, сломаны крепления", service: NAVIGATION_URL.remont, serviceTitle: "Ремонт фар"},
    {id: "steklo", icon: "🪟", title: "Стекло в сколах или сточено", service: NAVIGATION_URL.zamenaStekla, serviceTitle: "Замена стекла фары"},
    {id: "dho", icon: "💡", title: "Не горит ДХО или светодиоды", service: NAVIGATION_URL.remontLed, serviceTitle: "Ремонт LED-фар и ДХО"},
];

/**
 * «Что с фарой?» — подбор услуги в два шага: проблема → машина (можно
 * пропустить) → услуга, цена «от», срок и запись. Запись открывает попап
 * с уже описанной проблемой — человеку не нужно ничего писать.
 */
const HeadlightQuiz = () => {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [car, setCar] = useState("");
    const [done, setDone] = useState(false);
    const hero = problem ? SERVICE_HERO[problem.service] : null;

    const reset = () => {
        setProblem(null);
        setCar("");
        setDone(false);
    };

    const message = problem
        ? `Подбор на сайте: ${problem.title.toLowerCase()} → ${problem.serviceTitle}.${car.trim() ? ` Машина: ${car.trim()}.` : ""}`
        : "";

    return (
        <section className="quiz" aria-labelledby="quiz-title">
            <div className="quiz-inner">
                <div className="quiz-head">
                    <div className="quiz-eyebrow">Подбор за 10 секунд</div>
                    <h2 className="quiz-title" id="quiz-title">Что с фарой?</h2>
                    <div className="quiz-steps" aria-hidden="true">
                        <span className={!problem ? "quiz-step quiz-step--active" : "quiz-step"}>1. Проблема</span>
                        <span className={problem && !done ? "quiz-step quiz-step--active" : "quiz-step"}>2. Машина</span>
                        <span className={done ? "quiz-step quiz-step--active" : "quiz-step"}>3. Решение</span>
                    </div>
                </div>

                {!problem && (
                    <ul className="quiz-options">
                        {PROBLEMS.map((item) => (
                            <li key={item.id}>
                                <button type="button" className="quiz-option" onClick={() => setProblem(item)}>
                                    <span className="quiz-option-icon" aria-hidden="true">{item.icon}</span>
                                    {item.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {problem && !done && (
                    <form className="quiz-car" onSubmit={(event) => { event.preventDefault(); setDone(true); }}>
                        <label htmlFor="quiz-car-input" className="quiz-label">Какая машина? Марка, модель, год — если помните</label>
                        <input
                            id="quiz-car-input"
                            className="quiz-input"
                            value={car}
                            onChange={(event) => setCar(event.target.value)}
                            placeholder="Например: Mazda 6 2015"
                            maxLength={80}
                            autoFocus
                        />
                        <div className="quiz-actions">
                            <button type="submit" className="quiz-button quiz-button--primary">Показать решение</button>
                            <button type="button" className="quiz-button" onClick={() => setDone(true)}>Пропустить</button>
                            <button type="button" className="quiz-link" onClick={reset}>← Назад</button>
                        </div>
                    </form>
                )}

                {problem && done && (
                    <div className="quiz-result">
                        <div className="quiz-result-label">Вам подойдёт</div>
                        <div className="quiz-result-title">{problem.serviceTitle}</div>
                        {hero && <p className="quiz-result-text">{hero.lead}</p>}
                        {hero && (
                            <ul className="quiz-result-facts">
                                {hero.facts.slice(0, 2).map((fact) => (
                                    <li key={fact.label}><b>{fact.value}</b> {fact.label}</li>
                                ))}
                            </ul>
                        )}
                        {problem.note && <p className="quiz-result-note">{problem.note}</p>}
                        <div className="quiz-actions">
                            <button type="button" className="quiz-button quiz-button--primary" onClick={() => openLeadModal(message)}>
                                Записаться — проблема уже описана
                            </button>
                            <Link href={problem.service} className="quiz-button">Подробнее об услуге</Link>
                            <button type="button" className="quiz-link" onClick={reset}>Начать заново</button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default HeadlightQuiz;
