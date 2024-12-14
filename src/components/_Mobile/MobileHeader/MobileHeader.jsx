import React from "react";
import './styles.css';
import {Alts} from "@/meta/alts.js";
import Image from "next/image.js";
import Link from "next/link";
import {CONTACTS_DATA} from "@/constants/contactsData.js";

const MobileHeader = () => {
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

                <Image
                    src="/icons/burger.svg"
                    alt="Мобильное меню"
                    width={40}
                    height={40}
                />
            </div>
        </header>
    )
}

export default MobileHeader;