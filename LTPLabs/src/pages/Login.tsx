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
            </form>
        </div>
    );
}
