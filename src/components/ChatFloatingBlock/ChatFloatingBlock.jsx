"use client"

import React, {useState} from "react";
import './styles.css';
import Image from "next/image";
import {Tooltip} from "antd";
import {ChatConfig} from "./config.js";
import Link from "next/link";

const ChatFloatingBlock = () => {
    const [isBarVisible, setIsBarVisible] = useState([true]);

    return (
        <div className="chat-block-wrapper">
            {
                ChatConfig.map((item) => (
                    <div key={item.id} className={ isBarVisible ? "flex" : "none" }>

                        <Link href={item.link} target={item.target} rel="noopener noreferrer">
                            <Tooltip title={item.tooltip} placement="left">
                                <Image
                                    src={item.img}
                                    alt={item.tooltip}
                                    width={54}
                                    height={54}
                                    className="chat-img"
                                />
                            </Tooltip>
                        </Link>
                    </div>
                ))
            }

            <div onClick={() => {setIsBarVisible(!isBarVisible)}}>
                <Tooltip title={isBarVisible ? "Закрыть" : "Связаться"} placement="left">
                    <Image
                        src='/dark-logo.svg'
                        alt="logo"
                        width={54}
                        height={54}
                        className="chat-base-img"
                    />
                </Tooltip>
            </div>
        </div>
    )
}

export default ChatFloatingBlock;