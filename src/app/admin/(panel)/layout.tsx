import Link from "next/link";
import React from "react";
import {requireAdmin} from "@/lib/auth";
import {logoutAction} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const PanelLayout = async ({children}: {children: React.ReactNode}) => {
    await requireAdmin();
    return (
        <div className="admin">
            <header className="a-top">
                <Link href="/admin" className="a-top-brand">Prime Auto · статьи</Link>
                <Link href="/admin/new">Написать статью</Link>
                <Link href="/admin/settings">Настройки</Link>
                <span className="a-top-spacer" />
                <a href="/stati" target="_blank" rel="noreferrer">Раздел на сайте ↗</a>
                <form action={logoutAction}>
                    <button className="a-btn">Выйти</button>
                </form>
            </header>
            <main className="a-main">{children}</main>
        </div>
    );
};

export default PanelLayout;
