'use client'

import React, {useState} from "react";
import {plural} from "@/utils/plural";

/**
 * Раздел «Наших работ» с кнопкой «Показать ещё». Все карточки уже в HTML
 * (их видит поисковик), лишние до нажатия скрыты стилем — список не тянется
 * на десятки экранов. Каждое нажатие открывает ещё порцию.
 */
const ClusterMore = ({total, initial, step, children}: {total: number; initial: number; step: number; children: React.ReactNode}) => {
    const [shown, setShown] = useState(initial);
    const rest = total - shown;

    return (
        <>
            <div className="cases-grid">
                {React.Children.toArray(children).map((child, index) =>
                    index < shown ? child : <div key={`hidden-${index}`} hidden>{child}</div>,
                )}
            </div>
            {rest > 0 && (
                <div className="cases-more">
                    <button type="button" className="cases-more-button" onClick={() => setShown((n) => n + step)}>
                        Показать ещё {plural(Math.min(step, rest), ["работу", "работы", "работ"])}
                        <span className="cases-more-rest"> · всего осталось {rest}</span>
                    </button>
                </div>
            )}
        </>
    );
};

export default ClusterMore;
