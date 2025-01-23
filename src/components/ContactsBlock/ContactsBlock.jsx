import React from "react";
import './styles.css';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import dynamic from "next/dynamic.js";
import {yandexApi} from "../../app/api/yandex/yandexApi.ts";
import { CONTACTS_DATA } from "@/constants/contactsData.js";
import Link from "next/link.js";
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
        description: 'г. Минск, Брилевский тупик 5',
    },
    {
        title: 'время работы',
        description: 'Будние 10:00 - 20:00 Суббота,воскресенье - выходной',
    },
    {
        title: 'номер телефона',
        description: (
            <div>
              <Link className="contacts-phone" href={`tel:${CONTACTS_DATA.phone1}`}>{ CONTACTS_DATA.phone1 }</Link>
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