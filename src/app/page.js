import WelcomeBlock from "../components/WelcomeBlock/WelcomeBlock";
import Services from "../components/Services/Services.jsx";
import AboutCompany from "../components/AboutCompany/AboutCompany.jsx";
import ReviewsBlock from "../components/ReviewsBlock/ReviewsBlock.jsx";
import Portfolio from "../components/Portfolio/Portfolio.jsx";
import FormBlock from "../components/FormBlock/FormBlock.jsx";
import ContactsBlock from "../components/ContactsBlock/ContactsBlock.jsx";
import HideNotification from "../components/_HelperComponents/HideNotification/HideNotification";
import {HIDE_NOTIFICATION_TEXT} from "../constants/textConstants.js";
import {NAVIGATION_URL} from "../constants/navigation.js";
import {META} from "../constants/metadata.ts";

export const metadata = {...META.general, robots: String(META.general.robots)}

export default function Home() {
  return (
      <main>
          <WelcomeBlock/>
          <Services/>
          <AboutCompany/>
          <ReviewsBlock/>
          <Portfolio/>
          <FormBlock/>
          <ContactsBlock/>
          <HideNotification
              text={HIDE_NOTIFICATION_TEXT}
              link={NAVIGATION_URL.newYearSale}
          />
      </main>
  );
}
