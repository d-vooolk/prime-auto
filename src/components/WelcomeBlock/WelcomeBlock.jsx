import ListComponent from "@/components/ListComponent/ListComponent";
import Image from "next/image";
import {Alts} from "@/meta/alts";
import './styles.css';

const list = [
    'Полировка и оклейка защитной плёнкой',
    'Устранение запотевания',
    'Ремонт фар, фонарей',
    'Тюнинг фар',
];

const WelcomeBlock = () => {
    return (
        <div className="welcome-block-wrapper">
            <div className="welcome-car">
                <Image
                    src="/images/first-car.png"
                    alt={Alts.welcomeBlock.car}
                    width={1100}
                    height={632.3}
                />
            </div>
            <div className="welcome-block">
                <h1>МАСТЕРСКАЯ АВТОСВЕТА В МИНСКЕ</h1>

                <ListComponent
                    list={list}
                    className="list-element"
                />

                <button className="get-lead-button">
                    <span>Оставить заявку</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            <div className="statistic-wrapper">
                <div className="statistic-element">
                    <span className="big-numbers">500+</span>
                    <span>Выполненных работ</span>
                </div>

                <hr className="statistic-divider"/>

                <div className="statistic-element">
                    <span className="big-numbers">5 лет</span>
                    <span>Опыта в данной сфере</span>
                </div>

                <hr className="statistic-divider"/>

                <div className="statistic-element">
                    <span className="big-numbers">100%</span>
                    <span>Довольных клиентов</span>
                </div>

                <hr className="statistic-divider"/>

                <div className="statistic-element">
                    <span className="big-numbers">1 год</span>
                    <span>Гарантии на модули</span>
                </div>
            </div>
        </div>
    )
}

export default WelcomeBlock;