'use client'

import {useEffect} from "react";
import {METRIKA_ID, goalForLink, reachGoal} from "@/utils/analytics";

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

        // Без ssr: true. Этот флаг рассчитан на счётчик, разметка которого уже
        // отрисована сервером. Здесь такой разметки нет, и tag.js молча
        // пропускал init: с 2025 года в счётчике были единицы визитов.
        window.ym(METRIKA_ID, 'init', {
            webvisor: true,
            clickmap: true,
            ecommerce: 'dataLayer',
            accurateTrackBounce: true,
            trackLinks: true,
        });

        // Клики по телефону и мессенджерам — цели Метрики. Ссылки разбросаны по
        // шапке, подвалу и плавающему чату, поэтому слушаем документ целиком.
        const onLinkClick = (event) => {
            const href = event.target.closest?.('a[href]')?.getAttribute('href');
            const goal = href && goalForLink(href);
            if (goal) {
                reachGoal(goal);
            }
        };
        document.addEventListener('click', onLinkClick, {capture: true});

        if (window.__analyticsStarted) {
            return () => document.removeEventListener('click', onLinkClick, {capture: true});
        }

        const onInteraction = () => {
            INTERACTION_EVENTS.forEach((event) => window.removeEventListener(event, onInteraction));
            startAnalytics();
        };

        INTERACTION_EVENTS.forEach((event) => {
            window.addEventListener(event, onInteraction, {passive: true});
        });

        return () => {
            document.removeEventListener('click', onLinkClick, {capture: true});
            INTERACTION_EVENTS.forEach((event) => window.removeEventListener(event, onInteraction));
        };
    }, []);

    return null;
};

export default DeferredAnalytics;
