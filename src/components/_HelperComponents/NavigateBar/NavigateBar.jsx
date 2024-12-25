'use client'

import React from "react";
import {NAVIGATION} from "../../../constants/navigation.js";
import Link from "next/link";

const NavigateBar = ({ closeMenu }) => {
    return (
        <ul>
            {
                NAVIGATION.map((navItem, index) => {
                    return (
                        <li key={`${navItem}${Math.random() * index}`} onClick={() => closeMenu && closeMenu()}>
                            <Link href={navItem.url}>
                                {navItem.title}
                            </Link>
                        </li>
                    )
                })
            }
        </ul>
    )
}

export default NavigateBar;