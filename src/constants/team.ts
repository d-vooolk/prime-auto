/**
 * Люди мастерской — для страницы «О мастерской», подписи эксперта в статьях
 * и микроразметки организации (employee). Со слов владельца 11.11.2026.
 *
 * Фото — когда будут: положить в public/images/team/<slug>.webp и вписать
 * photo. Без фото карточка показывает инициалы.
 */
export interface TeamMember {
    /** Якорь на странице /o-nas и хвост @id в разметке */
    slug: string;
    name: string;
    /** Имя и фамилия в обычном порядке — для подписи */
    shortName: string;
    role: string;
    experience?: string;
    /** Чем занимается — только со слов мастерской, не дописывать */
    text?: string;
    photo?: string;
}

export const TEAM: TeamMember[] = [
    {
        slug: 'petkevich-artyom',
        name: 'Петкевич Артём',
        shortName: 'Артём Петкевич',
        role: 'Главный мастер',
        experience: 'опыт больше 5 лет',
    },
    {
        slug: 'tomilin-ruslan',
        name: 'Томилин Руслан',
        shortName: 'Руслан Томилин',
        role: 'Мастер по ремонту фар',
        experience: 'опыт больше 5 лет',
    },
    {
        slug: 'ivanov-dmitriy',
        name: 'Иванов Дмитрий',
        shortName: 'Дмитрий Иванов',
        role: 'Администратор-консультант',
        text: 'Отвечает на звонки и сообщения, записывает на работы и подскажет, ' +
            'с чего начать, если непонятно, что с фарой.',
    },
];

/** Эксперт, который сверяет факты и цены в статьях */
export const ARTICLE_EXPERT = TEAM[0];
