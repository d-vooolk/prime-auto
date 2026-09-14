import React from "react";
import './styles.css';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent.jsx";
import {yandexApi} from "@/app/api/yandex/yandexApi";
import { CONTACTS_DATA } from "@/constants/contactsData.js";
import Link from "next/link";
/*
  Раньше карта подключалась через dynamic(..., {ssr: false}) — в Server Component
  Next 16 такое запрещает, и работало это только потому, что импорт был записан как
  "next/dynamic.js" и проверку не проходил. Обычный импорт здесь и правильнее:
  YandexMap — клиентский компонент, на сервере он отдаёт пустой div, зато с высотой
  из CSS, то есть место под карту зарезервировано в самом HTML. Тяжёлый скрипт ymaps
  всё так же грузится лениво, по IntersectionObserver внутри самого компонента.
*/
import YandexMap from "@/components/YandexMap/YandexMap";

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
        description: 'Будние 09:00 - 19:00 Суббота,воскресенье - выходной',
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

            <YandexMap
                center={yandexApi.center}
                zoom={yandexApi.zoom}
            />
        </div>
    )
}

export default ContactsBlock;