import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./views/Login";
import AuthCallback from "./views/AuthCallback";
import Lista from "./views/Lista";
import Detalhe from "./views/Detalhe";
import EditDemo from "./views/EditDemo";
import DemoPage from "./views/DemoPage";
import Notificacoes from "./views/Notificacoes";
import Clientes from "./views/Clientes";
import ClienteDetalhe from "./views/ClienteDetalhe.tsx";
import Analytics from "./views/Analytics";

export type Role = "admin" | "viewer";
export type User = { 
  id: string;      // ⬅️ ADICIONADO
  name: string; 
  role: Role 
};

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

    // Check for existing auth token on startup
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (token && !user) {
            // Token exists but no user - might have refreshed after OAuth
            // Try to restore user from localStorage
            const savedUser = localStorage.getItem("app_user");
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch (e) {
                    console.error("Failed to restore user session", e);
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("app_user");
                }
            }
        }
    }, []);

    const logged = !!user;
    const isAdmin = user?.role === "admin";

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("app_user");
        localStorage.removeItem("auth_token");
    };

    // Microsoft OAuth callback handler
    const handleMicrosoftCallback = (token: string, userInfo: any) => {
        const me: User = {
            id: userInfo.email || "microsoft-user",
            name: userInfo.name || userInfo.email,
            role: userInfo.role || "viewer"
        };
        setUser(me);
        localStorage.setItem("app_user", JSON.stringify(me));
        localStorage.setItem("auth_token", token);
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
                {/* Login */}
                <Route
                    path="/login"
                    element={
                        logged ? (
                            <Navigate to="/demos" replace />
                        ) : (
                            <Login />
                        )
                    }
                />

                {/* Microsoft OAuth Callback */}
                <Route
                    path="/auth/callback"
                    element={<AuthCallback onMicrosoftCallback={handleMicrosoftCallback} />}
                />

                {/* Root */}
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

                {/* Demos - Lista (todos podem ver) */}
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

                {/* Demos - Criar (só admin) */}
                <Route
                    path="/demos/create"
                    element={
                        logged && isAdmin ? (
                            <DemoPage user={user!} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Demos - Ver Detalhes (só admin) */}
                <Route
                    path="/demos/:id"
                    element={
                        logged && isAdmin ? (
                            <Detalhe user={user!} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Demos - Editar (só admin) */}
                <Route
                    path="/demos/:id/update"
                    element={
                        logged && isAdmin ? (
                            <EditDemo user={user!} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Notificações (só admin) */}
                <Route
                    path="/notificacoes"
                    element={
                        logged && isAdmin ? (
                            <Notificacoes user={user!} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Clientes - Lista (só admin) */}
                <Route
                    path="/clientes"
                    element={
                        logged && isAdmin ? (
                            <Clientes user={user!} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Clientes - Ver Detalhes (só admin) */}
                <Route
                    path="/clientes/:id"
                    element={
                        logged && isAdmin ? (
                            <ClienteDetalhe user={user!} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Analytics (só admin) */}
                <Route
                    path="/analytics"
                    element={
                        logged && isAdmin ? (
                            <Analytics />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* 404 */}
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
