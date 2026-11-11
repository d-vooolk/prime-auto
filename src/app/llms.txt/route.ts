import {SITE, SITE_URL} from "@/constants/site";
import {SERVICE_HERO} from "@/constants/serviceHero";
import {breadcrumbLabels, NAVIGATION_URL} from "@/constants/navigation";
import {TEAM} from "@/constants/team";
import {getPublishedArticles} from "@/lib/articles";
import {articleViewCounts} from "@/lib/stats";

/*
  /llms.txt (llmstxt.org) — короткая справка о мастерской для нейросетей:
  что делаем, цены «от», адрес, люди и главные страницы. Собирается из тех же
  констант, что и сайт («Коротко» услуг — serviceHero.ts), поэтому цены не
  расходятся с прайсом. Статьи — самые читаемые по своему счётчику.
*/
export const revalidate = 86400;

const url = (path: string) => `${SITE_URL}${path}`;

export const GET = () => {
    const views = articleViewCounts();
    const articles = getPublishedArticles()
        .sort((a, b) => (views.get(b.slug) ?? 0) - (views.get(a.slug) ?? 0))
        .slice(0, 20);

    const lines = [
        `# ${SITE.name} (${SITE.alternateName}) — мастерская автосвета в Минске`,
        '',
        `> Ремонт и восстановление фар, установка Bi-Led модулей, полировка и оклейка фар плёнкой, ` +
        `устранение запотевания, регулировка света. Адрес: ${SITE.city}, ${SITE.street}. ` +
        `Телефон ${SITE.phoneFormatted}. ${SITE.openingHoursText}. ${SITE.legalName}, УНП ${SITE.taxId}.`,
        '',
        'Цены в белорусских рублях (BYN). Установка Bi-Led — под ключ от 700 руб. за две фары без учёта ' +
        'модулей; «от 50 руб.» в прайсе — только монтаж модуля в уже разобранную фару, это не цена Bi-Led.',
        '',
        '## Услуги',
        '',
        ...Object.entries(SERVICE_HERO).map(([path, hero]) =>
            `- [${breadcrumbLabels[path] ?? path}](${url(path)}): ${hero.short}`),
        '',
        '## О мастерской',
        '',
        `- [О мастерской и мастерах](${url(NAVIGATION_URL.about)}): ` +
        TEAM.map((member) => `${member.shortName} — ${member.role.toLowerCase()}` +
            (member.experience ? ` (${member.experience})` : '')).join('; ') + '.',
        `- [Цены](${url(NAVIGATION_URL.price)})`,
        `- [Наши работы с фото](${url(NAVIGATION_URL.raboty)})`,
        `- [Отзывы с Яндекс Карт](${url(NAVIGATION_URL.reviews)})`,
        `- [Контакты и схема проезда](${url(NAVIGATION_URL.contacts)})`,
        `- [Подарочный сертификат](${url(NAVIGATION_URL.sertifikat)}): бумажный, любого номинала, действует 1 год, покупается в мастерской.`,
        `- [Обучение ремонту фар](${url(NAVIGATION_URL.obuchenie)}): только индивидуально, от 1 месяца, программа под задачи ученика — от рекламы до сдачи машины; цена обсуждается лично.`,
        '',
        '## Статьи',
        '',
        ...articles.map((article) =>
            `- [${article.title}](${url(`${NAVIGATION_URL.articles}/${article.slug}`)})` +
            (article.excerpt ? `: ${article.excerpt.replace(/\s+/g, ' ').trim()}` : '')),
        '',
    ];

    return new Response(lines.join('\n'), {
        headers: {'Content-Type': 'text/plain; charset=utf-8'},
    });
};
