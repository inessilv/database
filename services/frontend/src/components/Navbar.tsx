/**
 * Navbar Component (Adaptado)
 * 
 * Navegação principal da aplicação
 * Inclui badge de pedidos pendentes para admins
 * Versão adaptada sem useAuth hook
 */

import { Link, useLocation } from "react-router-dom";
import { usePedidos } from "../hooks/usePedidos";

// User type do App.tsx
type User = { name: string; role: "admin" | "viewer" };

type Props = {
  user: User;
  onLogout: () => void;
  onToggleTheme: () => void;
};

export default function Navbar({ user, onLogout, onToggleTheme }: Props) {
  const { pathname } = useLocation();
  const { countPendentes } = usePedidos();

  const isActive = (p: string) =>
    pathname === p ? "nav-link active" : "nav-link";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="nav-left">
          <div className="brand">LTPLabs</div>
          <nav className="nav-links">
            <Link
              to="/demos"
              className={isActive("/demos") || isActive("/")}
            >
              Demos
            </Link>
            {user.role === "admin" && (
              <>
                <Link to="/clientes" className={isActive("/clientes")}>
                  Clientes
                </Link>
                <Link
                  to="/notificacoes"
                  className={isActive("/notificacoes")}
                  style={{ position: "relative" }}
                >
                  Notificações
                  {countPendentes > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: "9999px",
                        padding: "2px 6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        minWidth: "18px",
                        textAlign: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      {countPendentes}
                    </span>
                  )}
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="nav-right">
          <button className="btn-ghost" onClick={onToggleTheme}>
            Tema
          </button>
          <span className="user-label">{user.name}</span>
          <button
            className="pill"
            onClick={() => {
              if (confirm("Terminar sessão?")) onLogout();
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
