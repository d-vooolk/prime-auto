import React from "react";

interface JsonLdProps {
    /** Один объект Schema.org или массив объектов */
    data: object | object[];
}

/**
 * Микроразметка JSON-LD. Экранируем `<`, чтобы содержимое отзыва или
 * описания не смогло закрыть тег script.
 */
const JsonLd = ({data}: JsonLdProps) => (
    <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, '\\u003c'),
        }}
    />
);

export default JsonLd;
