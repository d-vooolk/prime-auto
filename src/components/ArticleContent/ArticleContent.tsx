import React from "react";
import Link from "next/link";
import {imageSize, parseArticleBody, parseInline} from "@/lib/article-body";

/**
 * Текст статьи из упрощённого Markdown (см. src/lib/article-body.ts).
 * Стили — в stati/styles.css.
 */

const Inline = ({text}: {text: string}) => (
    <>
        {parseInline(text).map((part, index) => {
            if (part.type === "bold") return <strong key={index}>{part.text}</strong>;
            if (part.type === "text") return <React.Fragment key={index}>{part.text}</React.Fragment>;
            if (part.href.startsWith("/")) return <Link key={index} href={part.href}>{part.text}</Link>;
            return <a key={index} href={part.href} target="_blank" rel="noopener">{part.text}</a>;
        })}
    </>
);

const ArticleContent = ({body}: {body: string}) => (
    <>
        {parseArticleBody(body).map((block, index) => {
            switch (block.type) {
                case "image": {
                    const size = imageSize(block.src);
                    return (
                        <figure key={index} className="article-figure">
                            {/* Фото уже пережаты при загрузке в WebP до 1600 px — оптимизатор next/image здесь лишний */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={block.src}
                                alt={block.alt}
                                width={size?.width}
                                height={size?.height}
                                loading="lazy"
                                decoding="async"
                            />
                            {block.caption && <figcaption>{block.caption}</figcaption>}
                        </figure>
                    );
                }
                case "h2":
                    return <h2 key={index} id={block.id} className="article-section-title"><Inline text={block.text} /></h2>;
                case "h3":
                    return <h3 key={index} id={block.id} className="article-subtitle"><Inline text={block.text} /></h3>;
                case "p":
                    return <p key={index} className="article-paragraph"><Inline text={block.text} /></p>;
                case "tip":
                    return <p key={index} className="article-tip"><Inline text={block.text} /></p>;
                case "ul":
                case "ol": {
                    const List = block.type;
                    return (
                        <List key={index} className="article-list">
                            {block.items.map((item, position) => <li key={position}><Inline text={item} /></li>)}
                        </List>
                    );
                }
                case "table":
                    return (
                        <div key={index} className="article-table-wrapper">
                            <table className="article-table">
                                <thead>
                                <tr>{block.head.map((cell, position) => <th key={position}><Inline text={cell} /></th>)}</tr>
                                </thead>
                                <tbody>
                                {block.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, position) => <td key={position}><Inline text={cell} /></td>)}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    );
            }
        })}
    </>
);

export default ArticleContent;
