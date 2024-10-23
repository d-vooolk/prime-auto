import "./globals.css";
import {META} from "@/constants/metadata";


export const metadata = {...META.general, robots: String(META.general.robots)}

export default function RootLayout({ children }) {

  return (
    <html lang="ru">
      <body>
      <header>header</header>
        {children}
      <footer>footer</footer>
      </body>
    </html>
  );
}
