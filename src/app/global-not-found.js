import "./(site)/globals.css";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header.jsx";
import MobileHeader from "@/components/_Mobile/MobileHeader/MobileHeader.jsx";
import Custom404 from "./(site)/not-found";

/*
  404 для адресов, которые не совпали ни с одним маршрутом.

  У сайта и админки теперь разные корневые layout — (site)/layout.js и
  admin/layout.tsx, — и общего, в котором Next рендерил бы 404, больше нет.
  Эта страница собирается без layout, поэтому шапку и подвал подключает сама.
  Внутри раздела сайта notFound() по-прежнему отдаёт (site)/not-found.js.
*/

export {metadata} from "./(site)/not-found";

const GlobalNotFound = () => (
    <html lang="ru">
    <body id="page-start">
    <Header/>
    <MobileHeader/>
    <Custom404/>
    <Footer/>
    </body>
    </html>
);

export default GlobalNotFound;
