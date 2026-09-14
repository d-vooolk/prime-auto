'use client'

import React, {useEffect, useState} from 'react';
import styles from './FastUp.module.css';

const FastUp = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        /*
          Раньше offsetHeight читался на каждом событии scroll: браузер был обязан
          пересчитать раскладку синхронно, и PageSpeed показывал это в «Принудительная
          компоновка». Высота блока не меняется при скролле, поэтому читаем её один раз
          и обновляем только на resize; сам обработчик скролла дросселируем через rAF.
        */
        let firstBlockHeight = 0;
        let frame = 0;

        const measure = () => {
            firstBlockHeight = document.getElementById("services")?.offsetHeight || 0;
        };

        const update = () => {
            frame = 0;
            setIsVisible(window.scrollY > firstBlockHeight);
        };

        const handleScroll = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(update);
            }
        };

        const handleResize = () => {
            measure();
            handleScroll();
        };

        measure();

        window.addEventListener("scroll", handleScroll, {passive: true});
        window.addEventListener("resize", handleResize);

        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            className={`${styles.scrollToTopBtn} ${isVisible ? styles.visible : ""}`}
            onClick={scrollToTop}
            aria-label="Scroll to top"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.icon}
            >
                <path d="M18 15l-6-6-6 6"/>
            </svg>
        </button>
    )
}

export default FastUp;