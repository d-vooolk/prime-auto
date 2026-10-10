'use client'

import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {NAVIGATION, NAVIGATION_URL} from "../../../constants/navigation.js";
import {SERVICE_GROUPS} from "@/constants/serviceGroups";

/*
  Меню сайта. variant:
    desktop — в шапке; у «Услуг» выпадающая панель со всеми услугами по группам;
    mobile  — в бургер-меню; услуги списком под пунктом «Услуги»;
    plain   — в подвале, без вложенности.
  Пункт текущего раздела подсвечивается (aria-current), чтобы было видно, где ты.
  Вложенные ссылки рендерятся всегда, а не по наведению, — их видит и поисковик.
*/
const isActive = (pathname, url) =>
    url.startsWith('/') && url !== NAVIGATION_URL.home && (pathname === url || pathname.startsWith(`${url}/`));

const ServicesPanel = ({className, closeMenu}) => (
    <div className={className}>
        {SERVICE_GROUPS.map((group) => (
            <div key={group.title} className="nav-group">
                <div className="nav-group-title">{group.title}</div>
                <ul>
                    {group.items.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} onClick={() => closeMenu?.()}>{item.title}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        ))}
        <Link href={NAVIGATION_URL.uslugi} className="nav-group-all" onClick={() => closeMenu?.()}>
            Все услуги и цены →
        </Link>
    </div>
);

const NavigateBar = ({closeMenu, variant = 'plain'}) => {
    const pathname = usePathname() ?? '';

    return (
        <ul>
            {NAVIGATION.map((navItem) => {
                const active = isActive(pathname, navItem.url);
                const hasPanel = navItem.url === NAVIGATION_URL.uslugi && variant !== 'plain';
                return (
                    <li
                        key={navItem.url}
                        className={[hasPanel ? 'nav-has-dropdown' : '', active ? 'nav-active' : ''].join(' ').trim() || undefined}
                    >
                        <Link
                            href={navItem.url}
                            aria-current={pathname === navItem.url ? 'page' : undefined}
                            onClick={() => closeMenu?.()}
                        >
                            {navItem.title}
                            {hasPanel && variant === 'desktop' && (
                                <svg className="nav-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </Link>
                        {hasPanel && (
                            <ServicesPanel
                                className={variant === 'desktop' ? 'nav-dropdown' : 'mobile-subnav'}
                                closeMenu={closeMenu}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default NavigateBar;
