import './styles.css';
import PortfolioImages from "@/components/_HelperComponents/PortfolioImages/PortfolioImages.jsx";
import Link from "next/link";
import Image from "next/image";
import {LINKS} from "../../constants/links.js";

const Portfolio = () => {
    return (
        <div className="portfolio-global-wrapper" id="portfolio">
            <div className="portfolio-wrapper">
                <div className="portfolio-title-wrapper">
                    <h2 className="portfolio-title-upper">Наши работы</h2>
                    <h2 className="portfolio-title-under">ПРИМЕРЫ РАБОТ</h2>
                </div>

                <PortfolioImages/>
            </div>
            <div className="portfolio-instagram-wrapper">
                <div className="portfolio-instagram-underwrapper">
                    <div className="portfolio-instagram-title-wrapper">
                        <div className="portfolio-instagram-upper-title">Инстаграм</div>
                        <div className="portfolio-instagram-under-title">ПОДПИСЫВАЙТЕСЬ НА НАШ ИНСТАГРАМ</div>
                    </div>

                    <div className="portfolio-instagram-description">В инстаграме вы увидите ещё больше наших работ, отзывов клиентов и новостей компании</div>

                    <Link
                        href={LINKS.instagram}
                        target="_blank noopener norefferer"
                        className="portfolio-get-instagram-button"
                    >
                        <span>Перейти в инстаграм</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                             xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    </Link>
                </div>
                <div className="portfolio-instagram-images-wrapper">
                    <Image
                        className="portfolio-instagram-image"
                        src="/images/instagram-gray-bg.webp"
                        alt="Инстаграм"
                        width={228}
                        height={172}
                    />
                    <Image
                        className="portfolio-dialog-image"
                        src="/images/dialog.webp"
                        alt="Инстаграм"
                        width={87}
                        height={56}
                    />
                    <Image
                        className="portfolio-heart-image"
                        src="/images/heart.webp"
                        alt="Инстаграм"
                        width={56}
                        height={45}
                    />
                </div>
            </div>
        </div>
    )
}

export default Portfolio;