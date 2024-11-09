import "./globals.css";
import {META} from "@/constants/metadata";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";


export const metadata = {...META.general, robots: String(META.general.robots)}

export default function RootLayout({ children }) {

  return (
    <html lang="ru">
      <body>
      <Header>header</Header>
        {children}
      <Footer>footer</Footer>
      </body>
    </html>
  );
}
