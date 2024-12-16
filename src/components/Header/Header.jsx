import React from "react";
import Image from "next/image";
import './styles.css';
import {Alts} from "@/meta/alts";
import Link from "next/link";
import NavigateBar from "@/components/_HelperComponents/NavigateBar/NavigateBar.jsx";

const Header = () => {
    return (
        <header className="desktop-header">
            <Image
                src="/logo.svg"
                width={132}
                height={40}
                alt={Alts.header.logo}
            />
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
                    <Link className="phone-link" href="tel:+375 (25) 733-22-29">+375 (25) 733-22-29</Link>
                    <Link className="phone-link" href="tel:+375 (29) 820-62-46">+375 (29) 820-62-46</Link>
                </div>
                <Image
                    src="/icons/insta.svg"
                    width={40}
                    height={40}
                    alt={Alts.header.instagram}
                    className="instagram-icon"
                />
            </div>
        </header>
    )
}

export default Header;