import WelcomeBlock from "@/components/WelcomeBlock/WelcomeBlock";
import Services from "@/components/Services/Services.jsx";
import AboutCompany from "@/components/AboutCompany/AboutCompany.jsx";

export default function Home() {
  return (
    <main>
        <WelcomeBlock />
        <Services />
        <AboutCompany />
    </main>
  );
}
