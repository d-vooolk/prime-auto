'use client'

import React, {useEffect, useState} from 'react';
import styles from './FastUp.module.css';

const FastUp = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const firstBlockHeight = document.getElementById("services")?.offsetHeight || 0;
            if (window.scrollY > firstBlockHeight) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
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