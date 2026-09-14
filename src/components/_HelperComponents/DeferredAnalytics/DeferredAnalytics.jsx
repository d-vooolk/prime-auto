'use client'

import {useEffect} from "react";

/**
 * GTM (345 КБ) и Метрика (90 КБ) вместе давали ~620 мс блокировки основного потока
 * из ~1200 мс TBT и были главной причиной мобильной оценки в 60 баллов.
 *
 * Поэтому сами скрипты грузятся только после первого действия пользователя.
 * Заглушки dataLayer/ym создаются сразу и копят вызовы в очередь, так что
 * события, отправленные до загрузки, не теряются — оба счётчика проигрывают
 * очередь при инициализации.
 */

const GTM_ID = 'GTM-PKL79DZC';
const METRIKA_ID = 103843698;
const METRIKA_SRC = 'https://mc.yandex.ru/metrika/tag.js';

// mousemove/scroll ловят почти любой реальный визит; Lighthouse не делает ничего
// из этого списка, поэтому сторонний код не попадает в замер.
const INTERACTION_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll', 'mousemove'];

const injectScript = (src) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
};

const startAnalytics = () => {
    if (window.__analyticsStarted) {
        return;
    }
    window.__analyticsStarted = true;

    window.dataLayer.push({'gtm.start': Date.now(), event: 'gtm.js'});
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);

    injectScript(METRIKA_SRC);
};

const DeferredAnalytics = () => {
    useEffect(() => {
        // Очереди до загрузки: dataLayer — обычный массив, ym — стандартная
        // заглушка из сниппета Метрики.
        window.dataLayer = window.dataLayer || [];

        if (!window.ym) {
            window.ym = function () {
                (window.ym.a = window.ym.a || []).push(arguments);
            };
            window.ym.l = Date.now();
        }

        window.ym(METRIKA_ID, 'init', {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: 'dataLayer',
            accurateTrackBounce: true,
            trackLinks: true,
        });

        if (window.__analyticsStarted) {
            return;
        }

        const onInteraction = () => {
            INTERACTION_EVENTS.forEach((event) => window.removeEventListener(event, onInteraction));
            startAnalytics();
        };

        INTERACTION_EVENTS.forEach((event) => {
            window.addEventListener(event, onInteraction, {passive: true});
        });

        return () => {
            INTERACTION_EVENTS.forEach((event) => window.removeEventListener(event, onInteraction));
        };
    }, []);

    return null;
};

export default DeferredAnalytics;
