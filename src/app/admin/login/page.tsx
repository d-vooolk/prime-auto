import {redirect} from "next/navigation";
import {getAdmin} from "@/lib/auth";
import {LoginForm} from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

const LoginPage = async () => {
    if (await getAdmin()) redirect("/admin");
    return (
        <main className="a-login">
            <LoginForm />
            <p className="a-note">
                Забыли пароль — сбросьте его на сервере: <code>npm run admin</code>
            </p>
        </main>
    );
};

export default LoginPage;
