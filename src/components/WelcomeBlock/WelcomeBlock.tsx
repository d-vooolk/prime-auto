import Image from "next/image";
import Link from "next/link";
import './styles.css';
import {Alts} from "@/meta/alts";
import {NAVIGATION_URL} from "@/constants/navigation";
import {LINKS} from "@/constants/links";
import LeadButton from "@/components/LeadModal/LeadButton";
import TelegramIcon from "@/components/LeadModal/TelegramIcon";
import YandexRatingBadge from "@/components/_HelperComponents/YandexRatingBadge/YandexRatingBadge";

/* Услуги — ссылками: это и короткий путь для человека, и перелинковка с главной */
const SERVICES = [
    {title: 'Установка Bi-Led модулей', href: NAVIGATION_URL.biled},
    {title: 'Ремонт фар и замена стёкол', href: NAVIGATION_URL.remont},
    {title: 'Полировка и оклейка плёнкой', href: NAVIGATION_URL.polirovkaOkleyka},
    {title: 'Устранение запотевания', href: NAVIGATION_URL.zapotevaniye},
    {title: 'Регулировка фар', href: NAVIGATION_URL.regulirovka},
];

/*
  Первый экран главной. Раньше под ним шла отдельная тёмная полоса
  «1000+ работ / 4 года / 100% довольных / от 2 лет гарантии» на целый экран
  вниз — «100%» ничем не подтверждено, а настоящий рейтинг с Яндекса лежал
  в самом низу. Теперь доверие — одной строкой прямо под кнопками: рейтинг
  с Яндекс Карт, число работ и гарантия. Плюс адрес с графиком и второй
  способ связи — Telegram, «Оставить заявку» открывает попап, а не уводит
  к форме в конце страницы.
*/
const WelcomeBlock = () => (
    <section className="welcome-block-wrapper">
        <div className="welcome-block">
            <h1 className="desktop-h1">Мастерская автосвета в Минске</h1>

            <ul className="welcome-services">
                {SERVICES.map((service) => (
                    <li key={service.href}>
                        <Link href={service.href} className="welcome-service-link">
                            <Image src="/icons/plus.svg" alt="" aria-hidden="true" width={20.58} height={24.06} />
                            <span>{service.title}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="welcome-actions">
                <LeadButton className="get-lead-button">
                    <span>Оставить заявку</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </LeadButton>
                <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer" className="welcome-tg-button">
                    <span>Написать в Telegram</span>
                    <TelegramIcon />
                </a>
            </div>

            <div className="welcome-trust">
                <YandexRatingBadge variant="compact" theme="light" />
                <div className="welcome-trust-item">
                    <span className="welcome-trust-value">1000+</span>
                    <span className="welcome-trust-label">выполненных работ</span>
                </div>
                <div className="welcome-trust-item">
                    <span className="welcome-trust-value">от 2 лет</span>
                    <span className="welcome-trust-label">гарантия на модули</span>
                </div>
            </div>

            <address className="welcome-address">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>
                    Минск, Брилевский тупик, 5 · пн–пт 9:00–19:00 ·{' '}
                    <a href={LINKS.yandexMap} target="_blank" rel="noopener noreferrer">Как проехать</a>
                </span>
            </address>
        </div>

        <div className="welcome-car">
            {/*
              sizes: на телефоне картинка ограничена высотой (~490 px по ширине),
              на компьютере — до 1100 px. Без sizes мобильный брал вариант w=3840.
            */}
            <Image
                src="/images/first-car.webp"
                alt={Alts.welcomeBlock.car}
                width={1100}
                height={632.3}
                sizes="(max-width: 768px) 560px, 1100px"
                className="welcome-car-image"
                priority
                fetchPriority="high"
            />
        </div>
    </section>
);

export default WelcomeBlock;
