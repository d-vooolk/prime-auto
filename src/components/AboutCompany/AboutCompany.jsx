import React from "react";
import './styles.css';
import Image from "next/image";
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";

const textAbout = {
    title: 'PRIME AUTO -',
    first: 'Компания профессионалов для тех, кто ценит свой автомобиль и хочет, чтобы он выглядел как новый. Мы гарантируем высокое качество материалов и долговечность нашей работы.',
    second: `Наша цель – обеспечить вашему автомобилю превосходный внешний вид, защиту от повреждений и сохранение его таковым на протяжении долгого времени. Гордимся своей репутацией и стремимся к безупречному сервису, чтобы каждый клиент остался доволен результатом. Приходите к нам, и ваш автомобиль будет в надежных руках экспертов.`,
}

const works = ['Замена линз фар', 'Оклейка и полировка фар', 'Восстановление и ремонт фар/фонарей', 'Тюнинг', 'Регулировка света'];

const benefitsItems = [
    {
        title: 'профессионализм',
        description: 'Мы — команда опытных специалистов, которые знают, как добиться идеального результата',
    },
    {
        title: 'Индивидуальный подход',
        description: 'Мы стремимся удовлетворить все ваши потребности и ожидания, предлагая персонализированные решения',
    },
    {
        title: 'качество и надёжность',
        description: 'Мы используем только высококачественные материалы и профессиональное оборудование для достижения оптимальных результатов',
    },
];

const worksTitle = 'Мы выполняем такие сложные работы как';
const imageAlt = 'Фоновое изображение авто Prime Auto Прайм Авто';


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
                    <ListComponent list={[item.title.toUpperCase()]} className="about-benefits-title"/>
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
        <div className="about-wrapper">
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

            <div className="about-car-image">
                <Image src="/images/about-car.jpg" alt={imageAlt} width={1920} height={575}/>
            </div>

            <div>
                <BenefitsDescription/>
            </div>
        </div>
    )
}

export default AboutCompany;