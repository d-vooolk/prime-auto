import Link from "next/link";
import './not-found.css';
import {NAVIGATION_URL} from "@/constants/navigation.js";
import {CONTACTS_DATA} from "@/constants/contactsData.js";

export const metadata = {
    title: 'Страница не найдена — Prime Auto',
    description: 'Такой страницы на сайте Prime Auto нет. Перейдите к услугам, ценам или свяжитесь с нами.',
    robots: {index: false, follow: true},
};

const LINKS_404 = [
    {title: 'Услуги', href: NAVIGATION_URL.uslugi},
    {title: 'Улучшение качества света', href: NAVIGATION_URL.uluchsheniyeKachestvaSveta},
    {title: 'Ремонт фар', href: NAVIGATION_URL.remont},
    {title: 'Полировка и оклейка', href: NAVIGATION_URL.polirovkaOkleyka},
    {title: 'Цены', href: NAVIGATION_URL.price},
    {title: 'Отзывы', href: NAVIGATION_URL.reviews},
    {title: 'Контакты', href: NAVIGATION_URL.contacts},
];

const Custom404 = () => (
    <main className="not-found-wrapper">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Такой страницы нет</h1>
        <p className="not-found-description">
            Возможно, страницу удалили или в адресе опечатка. Вот куда можно перейти:
        </p>

        <ul className="not-found-links">
            {LINKS_404.map((link) => (
                <li key={link.href}>
                    <Link href={link.href} className="not-found-link">{link.title}</Link>
                </li>
            ))}
        </ul>

        <p className="not-found-phone">
            Или просто позвоните:{' '}
            <Link href={`tel:${CONTACTS_DATA.phone1}`}>{CONTACTS_DATA.phone1}</Link>
        </p>
    </main>
);

export default Custom404;
