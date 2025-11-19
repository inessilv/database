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

    const logged = !!user;
    const isAdmin = user?.role === "admin";

    // login "local" (admin/admin, viewer/viewer)
    const handleLogin = (username: string, password: string) => {
        const u = username.trim().toLowerCase();
        const p = password.trim();
        
        if (u === "admin" && p === "admin") {
            const me: User = { 
                id: "admin001",  // ⬅️ ID MOCK
                name: "admin001", 
                role: "admin" 
            };
            setUser(me);
            localStorage.setItem("app_user", JSON.stringify(me));
            return true;
        }
        
        if (u === "viewer" && p === "viewer") {
            const me: User = { 
                id: "viewer-mock-id",  // ⬅️ ID MOCK
                name: "viewer", 
                role: "viewer" 
            };
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
                {/* Login */}
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
