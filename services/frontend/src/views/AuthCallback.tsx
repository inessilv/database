import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Props = {
    onMicrosoftCallback: (token: string, userInfo: any) => void;
};

export default function AuthCallback({ onMicrosoftCallback }: Props) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        const userParam = searchParams.get("user");

        if (token && userParam) {
            try {
                const userInfo = JSON.parse(decodeURIComponent(userParam));
                onMicrosoftCallback(token, userInfo);
                navigate("/demos", { replace: true });
            } catch (error) {
                console.error("Erro ao processar callback:", error);
                alert("Erro ao autenticar com Microsoft. Por favor, tente novamente.");
                navigate("/login", { replace: true });
            }
        } else {
            alert("Erro: Token ou informações do utilizador não encontradas.");
            navigate("/login", { replace: true });
        }
    }, [searchParams, navigate, onMicrosoftCallback]);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">A autenticar...</h1>
                <p>Por favor aguarde enquanto processamos o seu login.</p>
            </div>
        </div>
    );
}
