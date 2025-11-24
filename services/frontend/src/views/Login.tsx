import { useState } from "react";

type Props = {
    onLogin: (username: string, password: string) => boolean;
};

export default function Login({ onLogin }: Props) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const ok = onLogin(username, password);
        if (!ok)
            alert("Credenciais inválidas (usa admin/admin ou viewer/viewer).");
    }

    function handleMicrosoftLogin() {
        // Redirect to backend Microsoft OAuth endpoint
        // Use same host as frontend but on authentication service port (30080)
        const hostname = window.location.hostname;
        const authUrl = `http://${hostname}:30080/api/auth/microsoft/login`;
        window.location.href = authUrl;
    }

    return (
        <div className="auth-page">
            <form className="auth-card auth-form" onSubmit={submit}>
                <h1 className="auth-title">Login</h1>

                <label className="label">Utilizador</label>
                <input
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin | viewer"
                />

                <label className="label">Palavra-passe</label>
                <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin | viewer"
                />

                <div className="auth-actions">
                    <button className="button" type="submit">
                        Entrar
                    </button>
                </div>

                <div style={{ margin: "20px 0", textAlign: "center", color: "#666" }}>
                    ou
                </div>

                <div className="auth-actions">
                    <button 
                        className="button" 
                        type="button"
                        onClick={handleMicrosoftLogin}
                        style={{
                            backgroundColor: "#0078d4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}
                    >
                        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="10" height="10" fill="#f25022"/>
                            <rect x="11" width="10" height="10" fill="#7fba00"/>
                            <rect y="11" width="10" height="10" fill="#00a4ef"/>
                            <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
                        </svg>
                        Entrar com Microsoft
                    </button>
                </div>
            </form>
        </div>
    );
}
