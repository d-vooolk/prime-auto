"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const ITEMS = [
    {href: "/admin", label: "Статьи", icon: "📝", exact: true},
    {href: "/admin/new", label: "Написать статью", icon: "✨"},
    {href: "/admin/stats", label: "Статистика", icon: "📊"},
    {href: "/admin/settings", label: "Настройки", icon: "⚙️"},
];

/** Пункты бокового меню админки; текущий раздел подсвечен */
const AdminNav = () => {
    const pathname = usePathname() ?? "";
    const active = (href: string, exact?: boolean) =>
        exact ? pathname === href || pathname.startsWith("/admin/articles") || pathname.startsWith("/admin/jobs")
            : pathname.startsWith(href);

    return (
        <nav className="a-side-nav">
            {ITEMS.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`a-side-link${active(item.href, item.exact) ? " a-side-link-active" : ""}`}
                    aria-current={active(item.href, item.exact) ? "page" : undefined}
                >
                    <span className="a-side-icon" aria-hidden="true">{item.icon}</span>
                    {item.label}
                </Link>
            ))}
        </nav>
    );
};

export default AdminNav;
