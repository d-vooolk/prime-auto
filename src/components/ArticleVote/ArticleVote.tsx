'use client'

import React, {useEffect, useState} from "react";
import './styles.css';
import {LINKS} from "@/constants/links";

/**
 * «Статья была полезной?» под статьёй. Результаты и комментарии видны только
 * в админке (раздел «Популярное») — это обратная связь для редактуры: какие
 * статьи переписать и чего в них не хватает. Звёзд и рейтинга на сайте и в
 * микроразметке нет: поисковики их для статей не показывают, а пустой счётчик
 * на свежей статье только отпугивает. Голос помним в браузере.
 */
const send = (slug: string, useful: boolean, comment = "") =>
    fetch("/api/vote", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({slug, useful, comment}),
    }).catch(() => {});

const ArticleVote = ({slug}: {slug: string}) => {
    const key = `prime-vote-${slug}`;
    const [vote, setVote] = useState<"yes" | "no" | "no-sent" | null>(null);
    const [comment, setComment] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem(key);
        if (saved === "yes" || saved === "no-sent") setVote(saved);
    }, [key]);

    const answer = (useful: boolean) => {
        const value = useful ? "yes" : "no";
        setVote(value);
        localStorage.setItem(key, useful ? "yes" : "no-sent");
        send(slug, useful);
    };

    const sendComment = (event: React.FormEvent) => {
        event.preventDefault();
        if (comment.trim()) send(slug, false, comment);
        setVote("no-sent");
    };

    return (
        <aside className="article-vote" aria-live="polite">
            {vote === null && (
                <>
                    <span className="article-vote-question">Статья была полезной?</span>
                    <div className="article-vote-buttons">
                        <button type="button" className="article-vote-button" onClick={() => answer(true)}>👍 Да</button>
                        <button type="button" className="article-vote-button" onClick={() => answer(false)}>👎 Нет</button>
                    </div>
                </>
            )}

            {vote === "yes" && <span className="article-vote-thanks">Спасибо! Рады, что пригодилось.</span>}

            {vote === "no" && (
                <form className="article-vote-form" onSubmit={sendComment}>
                    <label className="article-vote-question" htmlFor={`vote-comment-${slug}`}>
                        Чего не хватило? Напишите — допишем статью.
                    </label>
                    <textarea
                        id={`vote-comment-${slug}`}
                        className="article-vote-textarea"
                        rows={3}
                        maxLength={1000}
                        placeholder="Например: не нашёл ответа про мою машину, непонятно, сколько стоит…"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        autoFocus
                    />
                    <div className="article-vote-buttons">
                        <button type="submit" className="article-vote-button article-vote-button--primary" disabled={!comment.trim()}>
                            Отправить
                        </button>
                        <button type="button" className="article-vote-button" onClick={() => setVote("no-sent")}>
                            Пропустить
                        </button>
                    </div>
                </form>
            )}

            {vote === "no-sent" && (
                <span className="article-vote-thanks">
                    Спасибо, что сказали. Если вопрос срочный —{" "}
                    <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer">напишите нам в Telegram</a>, ответим.
                </span>
            )}
        </aside>
    );
};

export default ArticleVote;
