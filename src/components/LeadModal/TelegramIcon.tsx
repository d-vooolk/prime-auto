/** Значок Telegram для кнопок. Цвет — currentColor */
const TelegramIcon = ({size = 22}: {size?: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.94 4.3a1.2 1.2 0 0 0-1.62-1.1L2.86 10.02c-.97.38-.95 1.76.03 2.1l4.36 1.5 1.67 5.25c.24.77 1.2 1.02 1.78.47l2.44-2.3 4.43 3.27c.67.5 1.63.13 1.8-.69l2.57-15.32zM9.8 14.24l-.6 3.1-1.06-3.6 9.68-6.2-8.02 6.7z"/>
    </svg>
);

export default TelegramIcon;
