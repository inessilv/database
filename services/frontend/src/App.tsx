import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./views/Login";
import Lista from "./views/Lista";
import Detalhe from "./views/Detalhe";
import EditDemo from "./views/EditDemo";
import DemoPage from "./views/DemoPage";
import Notificacoes from "./views/Notificacoes";
import Clientes from "./views/Clientes";

export type Role = "admin" | "viewer";
export type User = { name: string; role: Role };

export default function App() {
    // tema
    const [theme, setTheme] = useState<"light" | "dark">(
        (localStorage.getItem("theme") as "light" | "dark") || "dark"
    );
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);
    const toggleTheme = () =>
        setTheme((t) => (t === "dark" ? "light" : "dark"));

    // sessão
    const [user, setUser] = useState<User | null>(() => {
        const raw = localStorage.getItem("app_user");
        return raw ? (JSON.parse(raw) as User) : null;
    });

    const logged = !!user;
    const isAdmin = user?.role === "admin";

    // login “local” (admin/admin, viewer/viewer)
    const handleLogin = (username: string, password: string) => {
        const u = username.trim().toLowerCase();
        const p = password.trim();
        if (u === "admin" && p === "admin") {
            const me: User = { name: "admin", role: "admin" };
            setUser(me);
            localStorage.setItem("app_user", JSON.stringify(me));
            return true;
        }
        if (u === "viewer" && p === "viewer") {
            const me: User = { name: "viewer", role: "viewer" };
            setUser(me);
            localStorage.setItem("app_user", JSON.stringify(me));
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("app_user");
    };

    return (
        <>
            {logged && (
                <Navbar
                    user={user!}
                    onLogout={handleLogout}
                    onToggleTheme={toggleTheme}
                />
            )}

            <Routes>
                <Route
                    path="/login"
                    element={
                        logged ? (
                            <Navigate to="/demos" replace />
                        ) : (
                            <Login onLogin={handleLogin} />
                        )
                    }
                />

                <Route
                    path="/"
                    element={
                        logged ? (
                            <Navigate to="/demos" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/demos"
                    element={
                        logged ? (
                            <Lista user={user!} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                <Route
                    path="/demos/new"
                    element={
                        logged && isAdmin ? (
                            <DemoPage />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/demos/:id"
                    element={
                        logged && isAdmin ? (
                            <Detalhe />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/demos/:id/edit"
                    element={
                        logged && isAdmin ? (
                            <EditDemo />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/notificacoes"
                    element={
                        logged && isAdmin ? (
                            <Notificacoes />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/clientes"
                    element={
                        logged && isAdmin ? (
                            <Clientes />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate to={logged ? "/demos" : "/login"} replace />
                    }
                />
            </Routes>
        </>
    );
}
