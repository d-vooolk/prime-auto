import React from 'react';
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent";
import './styles.css';
import {OurProposalBlockProps} from "@/components/_HelperComponents/OurProposalBlock/types";
import Link from "next/link";

const BLOCK_TEXT = {
    title: "Что мы делаем",
    description: "Наши предложения",
}

const OurProposalBlock = ({list}: OurProposalBlockProps) => {
    return (
        <div className="our-proposal-block-wrapper">
            <div className="our-proposal-block-title-container">
                <h3 className="our-proposal-block-title">{BLOCK_TEXT.title}</h3>
                <h3 className="our-proposal-block-description">{BLOCK_TEXT.description.toUpperCase()}</h3>
            </div>

            <div className="our-proposal-wrapper">
                {
                    list.map((item, index) => (
                        <Link
                            key={`${item.title}${Math.random() * index}`}
                            className="our-proposal"
                            href={item.link || '#'}
                        >
                            <ListComponent
                                list={[item.title.toUpperCase()]}
                                className="our-proposal-title"
                                wrapperClassname="our-proposal-title-wrapper"
                            />
                            <div className="our-proposal-description">
                                <span>
                                    {item.description}
                                </span>
                            </div>
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default OurProposalBlock;