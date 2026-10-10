import Link from "next/link";
import React from "react";
import {requireAdmin} from "@/lib/auth";
import {logoutAction} from "@/app/admin/actions";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/* Админка: меню слева, на узком экране — сверху */
const PanelLayout = async ({children}: {children: React.ReactNode}) => {
    await requireAdmin();
    return (
        <div className="admin a-shell">
            <aside className="a-side">
                <Link href="/admin" className="a-side-brand">Prime Auto<small>админка</small></Link>
                <AdminNav />
                <div className="a-side-bottom">
                    <a href="/" target="_blank" rel="noreferrer" className="a-side-link">
                        <span className="a-side-icon" aria-hidden="true">↗</span>Сайт
                    </a>
                    <form action={logoutAction}>
                        <button className="a-btn a-side-logout">Выйти</button>
                    </form>
                </div>
            </aside>
            <main className="a-main">{children}</main>
        </div>
    );
};

export default PanelLayout;
