import Image from "next/image";
import './styles.css';
import {Alts} from "@/meta/alts";
import Link from "next/link";
import React from "react";

const Footer = () => {
    return (
        <footer>
            <div className="footer-inform-wrapper">
                <Image
                    src="dark-logo.svg"
                    alt=""
                    width={132}
                    height={40}
                />
                <nav className="footer-nav">
                    <ul>
                        <li>Услуги</li>
                        <li>О компании</li>
                        <li>Отзывы</li>
                        <li>Работы</li>
                        <li>Контакты</li>
                    </ul>
                </nav>
                <div className="footer-contacts">
                    <Image
                        src="/icons/phone.svg"
                        width={40}
                        height={40}
                        alt={Alts.header.phone}
                    />
                    <div className="phones-wrapper">
                        <Link className="phone-link" href="tel:+375 (25) 733-22-29">+375 (25) 733-22-29</Link>
                        <Link className="phone-link" href="tel:+375 (29) 820-62-46">+375 (29) 820-62-46</Link>
                    </div>
                </div>
            </div>

            <hr className="footer-divider" />

            <div className="footer-copyright-wrapper">
                <span>© 2024 Prime auto. Все права защищены</span>
                <span>Политика конфиденциальности</span>
            </div>
        </footer>
    )
}

export default Footer;