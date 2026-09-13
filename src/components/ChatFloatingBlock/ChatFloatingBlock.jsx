"use client"

import React, {useState} from "react";
import './styles.css';
import Image from "next/image";
import Link from "next/link";
import {ChatConfig} from "./config.js";

/**
 * Иконка «закрыть» — тот же close-circle из набора Ant Design, но инлайном.
 * Вместе с CSS-подсказками это убирает antd и @ant-design/icons из клиентского
 * бандла: раньше ради шести всплывающих подсказок они грузились на каждой странице.
 */
const CloseCircleIcon = () => (
    <svg
        width="54"
        height="54"
        viewBox="64 64 896 896"
        fill="#a2db00"
        fillRule="evenodd"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z" />
    </svg>
);

const ChatFloatingBlock = () => {
    const [isBarVisible, setIsBarVisible] = useState(true);

    return (
        <div className="chat-block-wrapper">
            {
                ChatConfig.map((item) => (
                    <div key={item.id} className={isBarVisible ? "flex" : "none"}>
                        <Link
                            href={item.link}
                            target={item.target}
                            rel="noopener noreferrer"
                            className="chat-tooltip"
                            data-tooltip={item.tooltip}
                            aria-label={item.tooltip}
                        >
                            <Image
                                src={item.img}
                                alt={item.tooltip}
                                width={54}
                                height={54}
                                className="chat-img"
                            />
                        </Link>
                    </div>
                ))
            }

            <button
                type="button"
                className="chat-tooltip chat-toggle-button"
                data-tooltip={isBarVisible ? "Закрыть" : "Связаться"}
                aria-label={isBarVisible ? "Закрыть" : "Связаться"}
                aria-expanded={isBarVisible}
                onClick={() => setIsBarVisible(!isBarVisible)}
            >
                {
                    isBarVisible
                        ? <CloseCircleIcon />
                        : (
                            <Image
                                src='/chatIcons/phone.svg'
                                alt=""
                                width={54}
                                height={54}
                                className="chat-base-img"
                            />
                        )
                }
            </button>
        </div>
    )
}

export default ChatFloatingBlock;
