'use client'

import React, {useState} from "react";
import './styles.css';
import {Alts} from "@/meta/alts.js";
import Image from "next/image.js";
import Link from "next/link";
import {CONTACTS_DATA, LINKS} from "@/constants/contactsData.js";
import NavigateBar from "@/components/_HelperComponents/NavigateBar/NavigateBar.jsx";

const MobileHeader = () => {
    const [isOpenMenu, setIsOpenMenu] = useState(false);

    const handleCloseMenu = () => {
        setIsOpenMenu(false)
    }

    return (
        <header className="mobile-header">
            <Image
                src="/logo.svg"
                width={132}
                height={40}
                alt={Alts.header.logo}
            />

            <div className="mobile-header-buttons-wrapper">
                <Link href={`tel:${CONTACTS_DATA.phone1}`}>
                    <Image
                        src="/icons/phone.svg"
                        alt="Номер телефона"
                        width={40}
                        height={40}
                    />
                </Link>

                {
                    isOpenMenu
                        ? (
                            <Image
                                src="/icons/burger-close.svg"
                                alt="Мобильное меню"
                                width={40}
                                height={40}
                                onClick={() => setIsOpenMenu(!isOpenMenu)}
                            />
                        )
                        : (
                            <Image
                                src="/icons/burger.svg"
                                alt="Мобильное меню"
                                width={40}
                                height={40}
                                onClick={() => setIsOpenMenu(!isOpenMenu)}
                            />
                        )
                }
            </div>

            {
                isOpenMenu && (
                    <div className="mobile-nav-wrapper">
                        <nav className="mobile-nav">
                            <NavigateBar closeMenu={handleCloseMenu} />
                        </nav>

                        <div className="mobile-header-contacts">
                            <Image
                                src="/icons/phone.svg"
                                width={40}
                                height={40}
                                alt={Alts.header.phone}
                            />
                            <div className="mobile-phones-wrapper">
                                <Link className="mobile-phone-link" href="tel:+375 (25) 733-22-29">+375 (25)
                                    733-22-29</Link>
                                <Link className="mobile-phone-link" href="tel:+375 (29) 820-62-46">+375 (29)
                                    820-62-46</Link>
                            </div>
                            <Link href={LINKS.instagram} target="_blank noopener norefferer">
                                <Image
                                    src="/icons/insta.svg"
                                    width={40}
                                    height={40}
                                    alt={Alts.header.instagram}
                                    className="mobile-instagram-icon"
                                />
                            </Link>
                        </div>
                    </div>
                )
            }
        </header>
    )
}

export default MobileHeader;