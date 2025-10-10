import Image from "next/image";
import './styles.css';
import {Alts} from "@/meta/alts";
import Link from "next/link";
import React from "react";
import NavigateBar from "@/components/_HelperComponents/NavigateBar/NavigateBar.jsx";
import SvgComponent from "../_HelperComponents/SvgComponent/SvgComponent.jsx";
import {SVG_NAMES} from "../_HelperComponents/SvgComponent/constants.js";
import {LINKS} from "../../constants/links.js";
import {NAVIGATION_URL} from "../../constants/navigation.js";
import { CONTACTS_DATA } from "../../constants/contactsData.js";

const Footer = () => {
    return (
        <footer>
            <div className="footer-inform-wrapper">
                <Link href={NAVIGATION_URL.home}>
                    <Image
                        src="/dark-logo.svg"
                        alt=""
                        width={132}
                        height={40}
                    />
                </Link>
                <nav className="footer-nav">
                    <NavigateBar/>
                </nav>
                <div className="footer-contacts">
                    <Image
                        src="/icons/phone.svg"
                        width={40}
                        height={40}
                        alt={Alts.header.phone}
                    />
                    <div className="footer-phones-wrapper">
                        <Link className="footer-phone-link" href={`tel:${CONTACTS_DATA.phone1}`}>{ CONTACTS_DATA.phone1 }</Link>
                    </div>
                </div>
            </div>

            <hr className="footer-divider"/>

            <div className="footer-full-info-wrapper">
                <div className="footer-full-info-name">Prime Auto</div>
                <div className="footer-full-info-email">
                    <div>Email</div>
                    <div>
                        <Link href="mailto:info@prime-auto.by" target="_blank noopener norefferer">
                            info@prime-auto.by
                        </Link>
                    </div>
                </div>
                <div className="footer-full-info-unp">
                    <div>ООО &#34;Первый Автосвет&#34;</div>
                    <div>УНП 193897412</div>
                </div>
                <div className="footer-full-info-social">
                    <Link href={LINKS.instagram} target="_blank noopener norefferer">
                        <SvgComponent name={SVG_NAMES.instagram}/>
                    </Link>
                    <Link href={LINKS.tiktok} target="_blank noopener norefferer">
                        <SvgComponent name={SVG_NAMES.tiktok}/>
                    </Link>
                    <Link href={LINKS.youTube} target="_blank noopener norefferer">
                        <SvgComponent name={SVG_NAMES.youTube}/>
                    </Link>
                    <Link href={LINKS.facebook} target="_blank noopener norefferer">
                        <SvgComponent name={SVG_NAMES.facebook}/>
                    </Link>
                </div>
            </div>

            <div className="footer-copyright-wrapper">
                <span>© 2024 Prime auto. Все права защищены</span>
                <span>
                    <Link
                        className="conf-polic"
                        href={NAVIGATION_URL.confidencePolicy}
                        target="_blank"
                    >
                        Политика конфиденциальности
                    </Link>
                </span>
            </div>
        </footer>
    )
}

export default Footer;