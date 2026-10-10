'use client'

import {useEffect, useRef} from "react";
import {usePathname} from "next/navigation";

const ENTRY_KEY = 'prime-pv-entry';

/**
 * Отправляет просмотр страницы в свой счётчик (src/app/api/pv, src/lib/stats.ts).
 * Первый просмотр во вкладке — «вход на сайт»: с ним уходят адрес, откуда
 * пришли, и utm-метки. Дальше при переходах по сайту источник — предыдущая
 * страница. sendBeacon не задерживает переход и доходит даже при закрытии вкладки.
 */
const PageViewTracker = () => {
    const pathname = usePathname();
    const previous = useRef<string | null>(null);

    useEffect(() => {
        if (!pathname) return;
        const entry = !sessionStorage.getItem(ENTRY_KEY);
        const params = new URLSearchParams(window.location.search);
        const payload = {
            path: pathname,
            referrer: entry ? document.referrer : previous.current ? `${window.location.origin}${previous.current}` : document.referrer,
            width: window.innerWidth,
            touch: navigator.maxTouchPoints > 1,
            entry,
            ...(entry ? {
                utmSource: params.get('utm_source') ?? '',
                utmMedium: params.get('utm_medium') ?? '',
                utmCampaign: params.get('utm_campaign') ?? '',
            } : {}),
        };
        sessionStorage.setItem(ENTRY_KEY, '1');
        previous.current = pathname;

        const body = JSON.stringify(payload);
        if (!navigator.sendBeacon?.('/api/pv', new Blob([body], {type: 'application/json'}))) {
            fetch('/api/pv', {method: 'POST', body, keepalive: true, headers: {'Content-Type': 'application/json'}}).catch(() => {});
        }
    }, [pathname]);

    return null;
};

export default PageViewTracker;
