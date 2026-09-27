import type {Metadata} from "next";
import React from "react";
import "./admin.css";

/*
  Отдельный корневой layout админки: без шапки и подвала сайта, чата и
  аналитики — визиты владельца не должны попадать в Метрику и вебвизор.
*/

export const metadata: Metadata = {
    title: "Админка Prime Auto",
    robots: {index: false, follow: false},
};

const AdminRootLayout = ({children}: {children: React.ReactNode}) => (
    <html lang="ru">
    <body className="admin">{children}</body>
    </html>
);

export default AdminRootLayout;
