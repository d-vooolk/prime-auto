import WelcomeBlock from "../components/WelcomeBlock/WelcomeBlock";
import Services from "../components/Services/Services.jsx";
import AboutCompany from "../components/AboutCompany/AboutCompany.jsx";
import ReviewsBlock from "../components/ReviewsBlock/ReviewsBlock.jsx";
import Portfolio from "../components/Portfolio/Portfolio.jsx";
import InstallmentBlock from "../components/InstallmentBlock/InstallmentBlock.tsx";
import FaqBlock from "../components/_HelperComponents/FaqBlock/FaqBlock.tsx";
import FormBlock from "../components/FormBlock/FormBlock.jsx";
import ContactsBlock from "../components/ContactsBlock/ContactsBlock.jsx";
import {META} from "../constants/metadata.ts";
import {HOME_FAQ} from "../constants/faq.ts";
import {NAVIGATION_URL} from "../constants/navigation.js";
import {buildMetadata} from "../utils/seo.ts";

export const metadata = buildMetadata({
    title: META.general.title,
    description: META.general.description,
    keywords: META.general.keywords,
    path: NAVIGATION_URL.home,
})

export default function Home() {
  return (
      <main>
          <WelcomeBlock/>
          <Services/>
          <AboutCompany/>
          <ReviewsBlock/>
          <Portfolio/>
          <InstallmentBlock/>
          <FaqBlock items={HOME_FAQ}/>
          <FormBlock/>
          <ContactsBlock/>
      </main>
  );
}
