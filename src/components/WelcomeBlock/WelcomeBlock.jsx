import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent";
import Image from "next/image";
import {Alts} from "@/meta/alts";
import './styles.css';
import Link from "next/link";
import {NAVIGATION_URL} from "../../constants/navigation.js";

const list = [
    'Установка Bi-Led модулей',
    'Полировка и оклейка защитной плёнкой',
    'Устранение запотевания',
    'Ремонт фар',
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
                    className="welcome-car-image"
                />
            </div>
            <div className="welcome-block">
                <h1 className="desktop-h1">МАСТЕРСКАЯ АВТОСВЕТА В МИНСКЕ</h1>

                <ListComponent
                    list={list}
                    className="list-element"
                    wrapperClassname="list-element-wrapper"
                />

                <Link href={NAVIGATION_URL.leadForm} className="get-lead-button">
                    <span>Оставить заявку</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </Link>
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
                    <span className="big-numbers">от 2 лет</span>
                    <span>Гарантии на модули</span>
                </div>
            </div>
        </div>
    )
}

export default WelcomeBlock;