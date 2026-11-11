import React from "react";
import Link from "next/link";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import InfoCards from "@/components/_HelperComponents/InfoCards/InfoCards";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import LeadButton from "@/components/LeadModal/LeadButton";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import {NAVIGATION_URL} from "@/constants/navigation";
import {buildMetadata, serviceJsonLd} from "@/utils/seo";
import {TRAINING_FAQ, TRAINING_FORMAT, TRAINING_PROGRAM, TRAINING_TEXT} from "./constants";
import '../o-nas/styles.css';

/*
  Обучение ремонту фар — со слов владельца 11.11.2026: только индивидуально,
  от 1 месяца, программа под задачи ученика, цена — лично, ведут ведущие
  мастера, учим всему циклу — от рекламы до сдачи машины. Про свидетельство
  не писать.
*/

export const metadata = buildMetadata({
    title: 'Обучение ремонту фар в Минске — индивидуально | Prime Auto',
    description: 'Индивидуальное обучение ремонту фар и установке Bi-Led у мастеров Prime Auto: ' +
        'от 1 месяца, программа под ваши задачи — от рекламы и приёма машины до сдачи клиенту.',
    path: NAVIGATION_URL.obuchenie,
});

const TrainingPage = () => (
    <main>
        <JsonLd data={serviceJsonLd({
            name: 'Обучение ремонту фар',
            description: TRAINING_TEXT.description,
            path: NAVIGATION_URL.obuchenie,
            serviceType: 'Обучение ремонту и доработке автомобильных фар',
        })} />

        <ServicePageTitleContainer
            headText={TRAINING_TEXT.title}
            description={TRAINING_TEXT.description}
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'Обучение ремонту фар', path: NAVIGATION_URL.obuchenie},
            ]}
        />

        <InfoCards id="training-format" title="Как проходит обучение" items={TRAINING_FORMAT} light />
        <InfoCards
            id="training-program"
            title="Чему учим"
            lead="Программу собираем под ваши задачи: можно пройти весь цикл или только то, что нужно вам."
            items={TRAINING_PROGRAM}
        />

        <nav className="about-links" aria-label="Записаться на обучение">
            <LeadButton className="about-links-item training-cta" message="Хочу на обучение ремонту фар.">
                Обсудить обучение →
            </LeadButton>
            <Link href={NAVIGATION_URL.about} className="about-links-item">Кто ведёт обучение →</Link>
            <Link href={NAVIGATION_URL.raboty} className="about-links-item">Наши работы →</Link>
        </nav>

        <FaqBlock items={TRAINING_FAQ} />
        <Portfolio />
        <FormBlock />
    </main>
);

export default TrainingPage;
