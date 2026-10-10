'use client'

import React, {useEffect, useState} from "react";

/**
 * Фильтр кейсов по услуге на странице «Наши работы». Все карточки уже лежат
 * в HTML (поисковик видит всё), фильтр только скрывает лишние — атрибут
 * hidden по data-services карточки.
 */
const CasesFilter = ({options}: {options: {key: string; title: string; count: number}[]}) => {
    const [active, setActive] = useState<string>("all");

    useEffect(() => {
        document.querySelectorAll<HTMLElement>(".cases-page .case-card").forEach((card) => {
            card.hidden = active !== "all" && !(card.dataset.services ?? "").split(" ").includes(active);
        });
    }, [active]);

    return (
        <ul className="cases-filter" aria-label="Фильтр по услуге">
            {[{key: "all", title: "Все работы", count: 0}, ...options].map((option) => (
                <li key={option.key}>
                    <button type="button" aria-pressed={active === option.key} onClick={() => setActive(option.key)}>
                        {option.title}{option.count ? ` · ${option.count}` : ""}
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default CasesFilter;
