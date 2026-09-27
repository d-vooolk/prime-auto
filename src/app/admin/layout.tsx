import type {Metadata} from "next";
import React from "react";
import "./admin.css";

/*
  Отдельный корневой layout админки: без шапки и подвала сайта, чата и
  аналитики — визиты владельца не должны попадать в Метрику и вебвизор.
  Класс .admin со стилями админки ставят сами страницы панели и входа, а не
  body: предпросмотр статьи живёт здесь же и должен выглядеть как сайт.
*/

export const metadata: Metadata = {
    title: "Админка Prime Auto",
    robots: {index: false, follow: false},
};

const AdminRootLayout = ({children}: {children: React.ReactNode}) => (
    <html lang="ru">
    <body>{children}</body>
    </html>
);

export default AdminRootLayout;
