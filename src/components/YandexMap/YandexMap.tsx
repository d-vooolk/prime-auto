"use client";

import React, {useEffect, useRef, useState} from "react";
import {yandexApi} from "@/app/api/yandex/yandexApi";
import {YandexMapProps} from "@/components/YandexMap/interface";

const SCRIPT_ID = "yandex-map-script";

/**
 * Загрузчик api-maps.yandex.ru кэшируется на уровне модуля: у карты один экземпляр
 * на страницу, но эффект может перезапуститься (StrictMode, смена пропсов) —
 * второй <script> нам не нужен.
 */
let scriptPromise: Promise<void> | null = null;

const loadScript = (): Promise<void> => {
    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

        if (existing) {
            if (window.ymaps) {
                resolve();
            } else {
                existing.addEventListener("load", () => resolve(), {once: true});
                existing.addEventListener("error", () => reject(new Error("ymaps")), {once: true});
            }
            return;
        }

        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.async = true;
        script.src = yandexApi.getUrl(yandexApi.apiKey, yandexApi.localization);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("ymaps"));
        document.body.appendChild(script);
    });

    return scriptPromise;
};

const YandexMap: React.FC<YandexMapProps> = ({center, zoom}) => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const [isNearViewport, setIsNearViewport] = useState(false);

    /*
      Скрипт карт — 690 КБ и ~450 мс работы в основном потоке; это была главная
      причина высокого TBT. Контакты лежат в самом низу страницы, поэтому карту
      поднимаем только когда блок подъезжает к экрану. Место под неё зарезервировано
      высотой контейнера, так что отложенная загрузка не двигает вёрстку.
    */
    useEffect(() => {
        const node = mapContainer.current;

        if (!node) {
            return;
        }

        if (typeof IntersectionObserver === "undefined") {
            setIsNearViewport(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setIsNearViewport(true);
                    observer.disconnect();
                }
            },
            {rootMargin: "400px 0px"},
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isNearViewport) {
            return;
        }

        const node = mapContainer.current;
        let map: any = null;
        let cancelled = false;

        loadScript()
            .then(() => new Promise<void>((resolve) => window.ymaps.ready(resolve)))
            .then(() => {
                if (cancelled || !node) {
                    return;
                }

                map = new window.ymaps.Map(node, {
                    center,
                    zoom,
                    controls: ["zoomControl"],
                });

                const placemark = new window.ymaps.Placemark(center, {
                    hintContent: yandexApi.hintContent,
                    balloonContent: yandexApi.balloonContent,
                });

                const isMobile = window.innerWidth <= 768;

                if (isMobile) {
                    map.behaviors.disable("drag");
                    map.behaviors.enable("multiTouch");
                } else {
                    map.behaviors.enable("drag");
                }

                map.behaviors.disable("scrollZoom");
                map.options.set("scrollZoomSpeed", 0);

                map.geoObjects.add(placemark);
            })
            .catch(() => {
                /* карта не критична для страницы — молча остаёмся с пустым блоком */
            });

        return () => {
            cancelled = true;
            map?.destroy();
        };
    }, [isNearViewport, center, zoom]);

    return (
        <div
            ref={mapContainer}
            className="yandex-map-container"
        ></div>
    );
};

export default YandexMap;
