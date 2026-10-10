"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {breadcrumbLabels, NAVIGATION_URL} from "@/constants/navigation";
import './styles.css';

interface BreadcrumbsProps {
    /** Подпись текущей страницы, если её нет в breadcrumbLabels (например, страницы марок) */
    currentLabel?: string;
    /**
     * Цепочка целиком, когда она не совпадает с адресом: рубрики статей
     * (/stati/tema/… — «tema» не страница) и статья внутри рубрики.
     * Главная добавляется сама, последний пункт — текущая страница.
     */
    items?: {name: string; path: string}[];
}

const Breadcrumbs = ({currentLabel, items}: BreadcrumbsProps = {}) => {
    const pathname = usePathname();

    if (items) {
        return (
            <nav aria-label="breadcrumb" className="breadcrumbs">
                <ul>
                    <li>
                        <Link href={NAVIGATION_URL.home}>{breadcrumbLabels[NAVIGATION_URL.home]}</Link>
                    </li>
                    {items.map((item, index) => index === items.length - 1 ? (
                        <li key={item.path} className="current">{item.name}</li>
                    ) : (
                        <li key={item.path}>
                            <Link href={item.path}>{item.name}</Link>
                        </li>
                    ))}
                </ul>
            </nav>
        );
    }

    const pathnames = pathname
        .split("/")
        .filter((x) => x)
        .map((segment, index, array) => `/${array.slice(0, index + 1).join("/")}`);

    return (
        <nav aria-label="breadcrumb" className="breadcrumbs">
            <ul>
                <li>
                    <Link href={NAVIGATION_URL.home}>{breadcrumbLabels[NAVIGATION_URL.home]}</Link>
                </li>
                {pathnames.map((href, index) => {
                    const isLast = index === pathnames.length - 1;
                    const label = (isLast && currentLabel)
                        || breadcrumbLabels[href]
                        || decodeURIComponent(href);

                    return isLast ? (
                        <li key={href} className="current">
                            {label}
                        </li>
                    ) : (
                        <li key={href}>
                            <Link href={href}>{label}</Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Breadcrumbs;
