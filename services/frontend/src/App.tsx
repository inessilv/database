import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getAuthToken, getAuthUser, setAuthToken, setAuthUser, clearAuth } from "./utils/cookies";

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
  id: string;
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

    // sessão - use cookies instead of localStorage
    const [user, setUser] = useState<User | null>(() => {
        return getAuthUser();
    });

    // Check for existing auth token on startup
    useEffect(() => {
        const token = getAuthToken();
        if (token && !user) {
            // Token exists but no user - might have refreshed after OAuth
            // Try to restore user
            const savedUser = getAuthUser();
            if (savedUser) {
                try {
                    setUser(savedUser);
                } catch (e) {
                    console.error("Failed to restore user session", e);
                    clearAuth();
                }
            }
        }
    }, []);

    const logged = !!user;
    const isAdmin = user?.role === "admin";

    const handleLogout = () => {
        setUser(null);
        clearAuth();
    };

    // Microsoft OAuth callback handler
    const handleMicrosoftCallback = (token: string, userInfo: any) => {
        const me: User = {
            id: userInfo.id || userInfo.email || "microsoft-user",
            name: userInfo.name || userInfo.email,
            role: userInfo.role || "viewer"
        };
        setUser(me);
        setAuthUser(me);
        setAuthToken(token);
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
                            <Analytics user={user!} />
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