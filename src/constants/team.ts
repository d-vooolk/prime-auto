/**
 * Люди мастерской — для страницы «О мастерской», подписи эксперта в статьях
 * и микроразметки организации (employee). Со слов владельца 11.11.2026.
 *
 * Портретов нет (решение владельца 11.11) — у карточки сцена работы без лиц:
 * у мастеров — свои фото из библиотеки, у администратора — Leonardo. Лица
 * не генерируем: выдуманное лицо под настоящим именем подрывает доверие.
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
    /** Сцена работы для карточки, 800x500 */
    scene: {src: string; alt: string};
}

export const TEAM: TeamMember[] = [
    {
        slug: 'petkevich-artyom',
        name: 'Петкевич Артём',
        shortName: 'Артём Петкевич',
        role: 'Главный мастер',
        experience: 'опыт больше 5 лет',
        scene: {src: '/images/team/petkevich-artyom-razobrannaya-fara-800x500.webp', alt: 'Разобранная матричная фара на верстаке в мастерской'},
    },
    {
        slug: 'tomilin-ruslan',
        name: 'Томилин Руслан',
        shortName: 'Руслан Томилин',
        role: 'Мастер по ремонту фар',
        experience: 'опыт больше 5 лет',
        scene: {src: '/images/team/tomilin-ruslan-raskleyka-800x500.webp', alt: 'Расклейка стекла фары на бутиловом герметике'},
    },
    {
        slug: 'ivanov-dmitriy',
        name: 'Иванов Дмитрий',
        shortName: 'Дмитрий Иванов',
        role: 'Администратор-консультант',
        scene: {src: '/images/team/ivanov-dmitriy-priyom-800x500.webp', alt: 'Стойка приёма: телефон с фото фары от клиента и журнал записи'},
        text: 'Отвечает на звонки и сообщения, записывает на работы и подскажет, ' +
            'с чего начать, если непонятно, что с фарой.',
    },
];

/** Эксперт, который сверяет факты и цены в статьях */
export const ARTICLE_EXPERT = TEAM[0];
