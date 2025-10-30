import { Link, useLocation } from "react-router-dom";
import type { User } from "../App";

type Props = {
    user: User;
    onLogout: () => void;
    onToggleTheme: () => void;
};

export default function Navbar({ user, onLogout, onToggleTheme }: Props) {
    const { pathname } = useLocation();
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
                                <Link
                                    to="/clientes"
                                    className={isActive("/clientes")}
                                >
                                    Clientes
                                </Link>
                                <Link
                                    to="/notificacoes"
                                    className={isActive("/notificacoes")}
                                >
                                    Notificações
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
