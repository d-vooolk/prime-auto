'use client'

import React, {useState} from "react";
import Image from "next/image";

const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Шортс в карточке кейса. До нажатия — обложка с кнопкой (плеер YouTube
 * весит под мегабайт скриптов, на странице с десятком роликов он убил бы
 * скорость), по нажатию — встроенный плеер youtube-nocookie без cookies
 * до запуска.
 */
const CaseVideo = ({id, poster, alt, seconds, title}: {id: string; poster: string; alt: string; seconds: number; title: string}) => {
    const [playing, setPlaying] = useState(false);

    if (playing) {
        return (
            <div className="case-card-video">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`}
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <button type="button" className="case-card-play" onClick={() => setPlaying(true)} aria-label={`Смотреть видео: ${title}`}>
            <Image src={poster} alt={alt} width={800} height={1000} sizes="(max-width: 768px) 100vw, 400px" className="case-card-photo" />
            <span className="case-card-play-icon" aria-hidden="true" />
            <span className="case-card-badge">Видео · {duration(seconds)}</span>
        </button>
    );
};

export default CaseVideo;
