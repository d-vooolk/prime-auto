import React from "react";
import './styles.css';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import Image from "next/image";
import FullWidthImage from "@/components/_HelperComponents/FullWidthImage/FullWidthImage.jsx";

const contactsBlockText = {
    title: 'Мы находимся',
    description: 'Контакты',
}

const contactsItems = [
    {
        title: 'адрес мастерской',
        description: 'г. Минск, ул. Автомобилистов 12/3',
    },
    {
        title: 'время работы',
        description: 'Ежедневно 10:00 - 20:00 Воскресенье выходной',
    },
    {
        title: 'номера телефонов',
        description: (
            <div>
                <div>+375 (25) 733-22-29</div>
                <div>+375 (29) 820-62-46</div>
            </div>
        )
    },
];

const BenefitsDescription = () => (
    <div className="contacts-benefits-wrapper">
        {
            contactsItems.map((item, index) => (
                <div
                    key={`${item.title}${Math.random() * index}`}
                    className="contacts-card"
                >
                    <ListComponent
                        list={[item.title.toUpperCase()]}
                        className="contacts-card-title"
                        wrapperClassname="contacts-list-wrapper"
                    />
                    <div className="contacts-card-description">
                        <span>
                            {item.description}
                        </span>
                    </div>
                </div>
            ))
        }
    </div>
);

const ContactsBlock = () => {
    return (
        <div className="contacts-block-wrapper">
            <div className="contacts-title-wrapper">
                <div className="contacts-title-upper">{ contactsBlockText.title }</div>
                <div className="contacts-title-under">{ contactsBlockText.description.toUpperCase() }</div>
            </div>

            <BenefitsDescription />

            <FullWidthImage
                src="/images/map.png"
                alt="карта"
                className="contacts-map"
                height={600}
            />
        </div>
    )
}

export default ContactsBlock;