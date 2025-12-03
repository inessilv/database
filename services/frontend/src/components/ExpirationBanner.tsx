/**
 * ExpirationBanner Component
 * 
 * Banner global que alerta o cliente sobre expiração de acesso
 * Aparece quando dias_restantes ≤ 7 ou quando expirado
 */

import { useState } from "react";
import { useClienteAuth } from "../hooks/useClienteAuth";

export default function ExpirationBanner() {
  const {
    cliente,
    loading,
    diasRestantes,
    status,
    temPedidoPendente,
    criarPedidoRenovacao,
  } = useClienteAuth();

  // ✅ NOVO: Estado local para loading do botão
  const [isCreatingPedido, setIsCreatingPedido] = useState(false);

  /**
   * Não mostrar banner se:
   * - Ainda está carregando
   * - Cliente não existe
   * - Status é ativo ou futuro (>7 dias)
   */
  if (loading || !cliente || (status !== "expira_breve" && status !== "expirado")) {
    return null;
  }

  /**
   * Handler para criar pedido
   * ✅ MODIFICADO: Previne múltiplos cliques
   */
  const handleRenovar = async () => {
    // Prevenir se já está criando
    if (isCreatingPedido) return;

    setIsCreatingPedido(true);
    try {
      await criarPedidoRenovacao();
      alert("✅ Pedido de renovação enviado com sucesso! Aguarda aprovação do administrador.");
    } catch (err: any) {
      alert(`❌ Erro ao enviar pedido: ${err.message}`);
    } finally {
      setIsCreatingPedido(false);
    }
  };

  /**
   * Configuração do banner baseada no status
   */
  const getBannerConfig = () => {
    if (temPedidoPendente) {
      return {
        icon: "✓",
        message: "Pedido de renovação enviado",
        submessage: "Aguarda aprovação do administrador",
        bgColor: "rgba(59, 130, 246, 0.15)",
        borderColor: "var(--focus)",
        textColor: "var(--text)",
        showButton: false,
      };
    }

    if (status === "expirado") {
      return {
        icon: "🔴",
        message: "O teu acesso expirou",
        submessage: "Solicita renovação para voltar a aceder às demos",
        bgColor: "rgba(239, 68, 68, 0.15)",
        borderColor: "var(--danger)",
        textColor: "var(--text)",
        showButton: true,
        buttonText: "Solicitar Renovação",
      };
    }

    // expira_breve
    return {
      icon: "⚠️",
      message: `O teu acesso expira em ${diasRestantes} ${
        diasRestantes === 1 ? "dia" : "dias"
      }`,
      submessage: "Renova o teu acesso para continuar a usar as demos",
      bgColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "#f59e0b",
      textColor: "var(--text)",
      showButton: true,
      buttonText: "Renovar Acesso",
    };
  };

  const config = getBannerConfig();

  return (
    <div
      style={{
        backgroundColor: config.bgColor,
        border: `2px solid ${config.borderColor}`,
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Conteúdo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <span style={{ fontSize: "1.5rem" }}>{config.icon}</span>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: "700",
              color: config.textColor,
            }}
          >
            {config.message}
          </p>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "0.85rem",
              color: config.textColor,
              opacity: 0.85,
            }}
          >
            {config.submessage}
          </p>
        </div>
      </div>

      {/* Botão de ação */}
      {config.showButton && (
        <button
          onClick={handleRenovar}
          disabled={isCreatingPedido}
          style={{
            padding: "10px 20px",
            backgroundColor: config.borderColor,
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: isCreatingPedido ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
            opacity: isCreatingPedido ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isCreatingPedido) {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isCreatingPedido) {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {isCreatingPedido ? "A enviar..." : config.buttonText}
        </button>
      )}
    </div>
  );
}