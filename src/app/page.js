import WelcomeBlock from "@/components/WelcomeBlock/WelcomeBlock";
import Services from "@/components/Services/Services.jsx";
import AboutCompany from "@/components/AboutCompany/AboutCompany.jsx";
import ReviewsBlock from "@/components/ReviewsBlock/ReviewsBlock.jsx";
import Portfolio from "@/components/Portfolio/Portfolio.jsx";
import FormBlock from "@/components/FormBlock/FormBlock.jsx";
import ContactsBlock from "@/components/ContactsBlock/ContactsBlock.jsx";

export default function Home() {
  return (
    <main>
        <WelcomeBlock />
        <Services />
        <AboutCompany />
        <ReviewsBlock />
        <Portfolio />
        <FormBlock />
        <ContactsBlock />
    </main>
  );
}
