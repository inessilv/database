import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function Login() {
    const [searchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const error = searchParams.get("error");
        if (error === "unauthorized_domain") {
            setErrorMessage("Acesso negado: apenas emails da Universidade do Minho (@alunos.uminho.pt) e LTPLabs (@ltplabs.com) são permitidos.");
        }
    }, [searchParams]);

    function handleMicrosoftLogin() {
        // Redirect to backend Microsoft OAuth endpoint via ingress
        const currentOrigin = window.location.origin;
        
        let authUrl;
        if (currentOrigin.includes('192.168') || currentOrigin.includes(':30300')) {
            // Accessing via Minikube NodePort - redirect to ingress
            authUrl = 'http://localhost:8080/api/auth/microsoft/login';
        } else {
            // Already using localhost:8080 - use relative URL
            authUrl = '/api/auth/microsoft/login';
        }
        
        window.location.href = authUrl;
    }

    return (
        <div className="auth-page">
            <div className="auth-card auth-form">
                <h1 className="auth-title">Login</h1>

                {errorMessage && (
                    <div style={{
                        padding: "12px",
                        marginBottom: "16px",
                        backgroundColor: "#fee",
                        border: "1px solid #fcc",
                        borderRadius: "4px",
                        color: "#c33",
                        fontSize: "14px"
                    }}>
                        {errorMessage}
                    </div>
                )}

                <p style={{ 
                    textAlign: "center", 
                    marginBottom: "24px",
                    color: "#666" 
                }}>
                    Faça login com sua conta Microsoft
                </p>

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
                            gap: "8px",
                            width: "100%"
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
            </div>
        </div>
    );
}
