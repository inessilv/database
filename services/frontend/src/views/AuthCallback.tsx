import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Props = {
    onMicrosoftCallback: (token: string, userInfo: any) => void;
};

export default function AuthCallback({ onMicrosoftCallback }: Props) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const processed = useRef(false);

    useEffect(() => {
        // Evitar processamento duplo
        if (processed.current) return;
        
        const token = searchParams.get("token");
        const userParam = searchParams.get("user");

        console.log("AuthCallback - token:", token ? "presente" : "ausente");
        console.log("AuthCallback - userParam:", userParam);

        if (token && userParam) {
            try {
                const userInfo = JSON.parse(decodeURIComponent(userParam));
                console.log("AuthCallback - userInfo parsed:", userInfo);
                
                // Marcar como processado antes de executar
                processed.current = true;
                
                onMicrosoftCallback(token, userInfo);
                console.log("AuthCallback - callback executado, navegando para /demos");
                
                // Usar setTimeout para garantir que o estado foi atualizado
                setTimeout(() => {
                    navigate("/demos", { replace: true });
                }, 100);
            } catch (error) {
                console.error("Erro ao processar callback:", error);
                console.error("userParam raw:", userParam);
                processed.current = true;
                navigate("/login", { replace: true });
            }
        } else {
            console.error("Token ou user ausente - token:", !!token, "user:", !!userParam);
            processed.current = true;
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
