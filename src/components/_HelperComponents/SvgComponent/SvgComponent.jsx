import React from "react";
import {SVG_NAMES} from "./constants.js";
import {
    ArrowUpRight, FacebookIcon,
    InstagramIcon, TiktokIcon,
    YoutubeIcon,
} from "./utils/SvgCollection.jsx";

const SvgComponent = ({name, className}) => {
    const {
        arrowUpRight,
        instagram,
        facebook,
        tiktok,
        youTube,
    } = SVG_NAMES;

    const rest = {
        className
    }

    const svgNames = {
        [arrowUpRight]: <ArrowUpRight {...rest} />,
        [instagram]: <InstagramIcon {...rest} />,
        [facebook]: <FacebookIcon {...rest} />,
        [tiktok]: <TiktokIcon {...rest} />,
        [youTube]: <YoutubeIcon {...rest} />,
    }

    if (!name || !svgNames[name]) {
        throw new Error('Wrong name prop');
    }

    return svgNames[name];
}

export default SvgComponent;