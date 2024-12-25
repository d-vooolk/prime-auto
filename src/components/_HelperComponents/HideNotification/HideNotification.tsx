'use client'

import React, {SyntheticEvent, useState} from "react";
import {HideNotificationProps} from "@/components/_HelperComponents/HideNotification/types";
import './styles.css';
import {CloseOutlined} from "@ant-design/icons";
import Link from "next/link";

const HideNotification = ({ text, link, className }: HideNotificationProps) => {
    const [isVisibleNotification, setIsVisibleNotification] = useState(true);

    const closeHandler = (e: SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsVisibleNotification(false);
    }

    if (!isVisibleNotification) {
        return null;
    }

    return (
        <Link href={link} className={`hide-notification-wrapper ${className}`}>
            <span>
                {text}
            </span>

            <CloseOutlined onClick={(e) => closeHandler(e)} />
        </Link>
    )
}

export default HideNotification;