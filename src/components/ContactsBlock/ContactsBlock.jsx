import React from "react";
import './styles.css';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import dynamic from "next/dynamic.js";
import {yandexApi} from "../../api/yandexApi.ts";
const DynamicYandexMap = dynamic(() => import("../../components/YandexMap/YandexMap.tsx"), {
    ssr: false,
});

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
    <div className="contacts-benefits-wrapper" id="contacts">
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
                <div className="contacts-title-upper">{contactsBlockText.title}</div>
                <div className="contacts-title-under">{contactsBlockText.description.toUpperCase()}</div>
            </div>

            <BenefitsDescription/>

            <DynamicYandexMap
                center={yandexApi.center}
                zoom={yandexApi.zoom}
            />
        </div>
    )
}

export default ContactsBlock;