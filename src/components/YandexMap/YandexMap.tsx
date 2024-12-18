"use client";

import React, {useEffect, useRef} from "react";
import {yandexApi} from "@/app/api/yandex/yandexApi";
import {YandexMapProps} from "@/components/YandexMap/interface";

const YandexMap: React.FC<YandexMapProps> = ({center, zoom}) => {
    const mapContainer = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const loadYandexMap = () => {
            if (window.ymaps) {
                window.ymaps.ready(() => {
                    const map = new window.ymaps.Map(mapContainer.current, {
                        center,
                        zoom,
                        controls: ["zoomControl"],
                    });

                    const placemark = new window.ymaps.Placemark(center, {
                        hintContent: yandexApi.hintContent,
                        balloonContent: yandexApi.balloonContent,
                    });

                    const isMobile = window.matchMedia("(pointer: coarse)").matches;

                    if (isMobile) {
                        map.behaviors.disable("drag");
                        map.behaviors.enable("multiTouch");
                    } else {
                        map.behaviors.enable("drag");
                    }

                    map.behaviors.disable("scrollZoom");
                    map.options.set("scrollZoomSpeed", 0);

                    map.geoObjects.add(placemark);
                });
            }
        };

        const yandexUrl = yandexApi.getUrl(yandexApi.apiKey, yandexApi.localization);

        if (!document.querySelector("#yandex-map-script")) {
            const script = document.createElement("script");
            script.id = "yandex-map-script";
            script.src = yandexUrl;
            script.onload = loadYandexMap;
            document.body.appendChild(script);
        } else {
            loadYandexMap();
        }
    }, [center, zoom]);

    return (
        <div
            ref={mapContainer}
            style={{
                width: "100%",
                height: "500px", // Настраиваем размер карты
            }}
        ></div>
    );
};

export default YandexMap;
