import React from "react";
import {SVG_NAMES} from "./constants.js";
import {
    ArrowUpRight, FacebookIcon,
    InstagramIcon,
    PolirovkaSvg,
    RemontFar,
    RemontFonarey, TiktokIcon,
    Tuning, YoutubeIcon,
    Zapotevaniye
} from "./utils/SvgCollection.jsx";

const SvgComponent = ({name, className}) => {
    const {
        polirovka,
        zapotevaniye,
        remontFar,
        remontFonarey,
        tuning,
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
        [polirovka]: <PolirovkaSvg {...rest} />,
        [zapotevaniye]: <Zapotevaniye {...rest} />,
        [remontFar]: <RemontFar {...rest} />,
        [remontFonarey]: <RemontFonarey {...rest} />,
        [tuning]: <Tuning {...rest} />,
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