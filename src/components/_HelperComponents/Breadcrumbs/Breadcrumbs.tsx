"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {breadcrumbLabels, NAVIGATION_URL} from "@/constants/navigation";
import './styles.css';

const Breadcrumbs = () => {
    const pathname = usePathname();

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
                    const label = breadcrumbLabels[href] || decodeURIComponent(href);

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
