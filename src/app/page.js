import WelcomeBlock from "@/components/WelcomeBlock/WelcomeBlock";
import Services from "@/components/Services/Services.jsx";
import AboutCompany from "@/components/AboutCompany/AboutCompany.jsx";
import ReviewsBlock from "@/components/ReviewsBlock/ReviewsBlock.jsx";

export default function Home() {
  return (
    <main>
        <WelcomeBlock />
        <Services />
        <AboutCompany />
        <ReviewsBlock />
    </main>
  );
}
