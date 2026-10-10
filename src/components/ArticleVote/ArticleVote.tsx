'use client'

import React, {useEffect, useState} from "react";
import './styles.css';
import {LINKS} from "@/constants/links";

/**
 * «Статья была полезной?» под статьёй. Результаты видны только в админке
 * (раздел «Популярное») — это обратная связь для редактуры: какие статьи
 * переписать. Звёзд и рейтинга на сайте и в микроразметке нет: поисковики
 * их для статей не показывают, а пустой счётчик на свежей статье только
 * отпугивает. Голос помним в браузере, чтобы не спрашивать дважды.
 */
const ArticleVote = ({slug}: {slug: string}) => {
    const key = `prime-vote-${slug}`;
    const [vote, setVote] = useState<"yes" | "no" | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(key);
        if (saved === "yes" || saved === "no") setVote(saved);
    }, [key]);

    const send = (useful: boolean) => {
        const value = useful ? "yes" : "no";
        setVote(value);
        localStorage.setItem(key, value);
        fetch("/api/vote", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({slug, useful}),
        }).catch(() => {});
    };

    return (
        <aside className="article-vote" aria-live="polite">
            {vote === null && (
                <>
                    <span className="article-vote-question">Статья была полезной?</span>
                    <div className="article-vote-buttons">
                        <button type="button" className="article-vote-button" onClick={() => send(true)}>👍 Да</button>
                        <button type="button" className="article-vote-button" onClick={() => send(false)}>👎 Нет</button>
                    </div>
                </>
            )}
            {vote === "yes" && <span className="article-vote-thanks">Спасибо! Рады, что пригодилось.</span>}
            {vote === "no" && (
                <span className="article-vote-thanks">
                    Спасибо, что сказали. Чего не хватило?{" "}
                    <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer">Напишите нам в Telegram</a> —
                    ответим и допишем статью.
                </span>
            )}
        </aside>
    );
};

export default ArticleVote;
