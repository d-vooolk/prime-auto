"use client";

import {useActionState} from "react";
import {loginAction} from "@/app/admin/actions";

export const LoginForm = () => {
    const [state, action, pending] = useActionState(loginAction, null);
    return (
        <form action={action} className="a-card">
            <h1 className="a-h1">Вход в админку</h1>
            <label className="a-field">
                <span className="a-label">Пароль</span>
                <input name="password" type="password" className="a-input" autoComplete="current-password" required autoFocus />
            </label>
            {state && !state.ok && <p className="a-error" role="alert">{state.error}</p>}
            <button className="a-btn a-btn-primary" disabled={pending}>
                {pending ? "Проверяем…" : "Войти"}
            </button>
        </form>
    );
};
