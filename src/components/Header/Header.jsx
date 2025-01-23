import React from "react";
import Image from "next/image";
import './styles.css';
import {Alts} from "../../meta/alts";
import Link from "next/link";
import NavigateBar from "../../components/_HelperComponents/NavigateBar/NavigateBar.jsx";
import {LINKS} from "../../constants/links.js";
import {NAVIGATION_URL} from "../../constants/navigation.js";
import { CONTACTS_DATA } from "../../constants/contactsData.js";

const Header = () => {
    return (
        <header className="desktop-header">
            <Link href={NAVIGATION_URL.home}>
                <Image
                    src="/logo.svg"
                    width={132}
                    height={40}
                    alt={Alts.header.logo}
                />
            </Link>
            <nav className="desktop-nav">
                <NavigateBar />
            </nav>
            <div className="desktop-header-contacts">
                <Image
                    src="/icons/phone.svg"
                    width={40}
                    height={40}
                    alt={Alts.header.phone}
                />
                <div className="phones-wrapper">
                    <Link className="phone-link" href={`tel:${CONTACTS_DATA.phone1}`}>{ CONTACTS_DATA.phone1 }</Link>
                </div>
                <Link href={LINKS.instagram} target="_blank noopener norefferer">
                    <Image
                        src="/icons/insta.svg"
                        width={40}
                        height={40}
                        alt={Alts.header.instagram}
                        className="instagram-icon"
                    />
                </Link>
            </div>
        </header>
    )
}

export default Header;