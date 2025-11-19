/**
 * PedidoCard Component (Refactored)
 * 
 * Card para exibir pedidos de renovação/revogação
 * Styling alinhado com demo-card
 */

import type { PedidoComCliente } from "../types/Pedido";

interface PedidoCardProps {
  pedido: PedidoComCliente;
  onAprovar?: (id: string) => void;
  onRejeitar?: (id: string) => void;
  loading?: boolean;
}

export default function PedidoCard({
  pedido,
  onAprovar,
  onRejeitar,
  loading = false,
}: PedidoCardProps) {
  /**
   * Badge de estado com cores
   */
  const getEstadoBadge = () => {
    const config = {
      pendente: {
        label: "🟡 Pendente",
        style: {
          backgroundColor: "#fde68a",
          borderColor: "#f59e0b",
          color: "#1f2937",
        },
      },
      aprovado: {
        label: "🟢 Aprovado",
        style: {
          backgroundColor: "#bbf7d0",
          borderColor: "#10b981",
          color: "#064e3b",
        },
      },
      rejeitado: {
        label: "🔴 Rejeitado",
        style: {
          backgroundColor: "#fecaca",
          borderColor: "#ef4444",
          color: "#7f1d1d",
        },
      },
    };

    const { label, style } = config[pedido.estado];

    return (
      <span
        style={{
          ...style,
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "0.78rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          border: "1px solid",
        }}
      >
        {label}
      </span>
    );
  };

  /**
   * Badge de tipo
   */
  const getTipoBadge = () => {
    const isRenovacao = pedido.tipo_pedido === "renovação";

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: "8px",
          fontSize: "0.75rem",
          fontWeight: "600",
          backgroundColor: isRenovacao ? "#dbeafe" : "#f3f4f6",
          color: isRenovacao ? "#1e40af" : "#374151",
        }}
      >
        {isRenovacao ? "📅 Renovação" : "🚫 Revogação"}
      </span>
    );
  };

  /**
   * Formatar data
   */
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return "Data não definida";
    }

    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }

    return date.toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Calcular dias até expiração
   */
  const getDiasRestantes = () => {
    if (!pedido.data_expiracao_atual) {
      return null;
    }

    const hoje = new Date();
    const expiracao = new Date(pedido.data_expiracao_atual);
    
    if (isNaN(expiracao.getTime())) {
      return null;
    }

    const diff = expiracao.getTime() - hoje.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dias;
  };

  const diasRestantes = getDiasRestantes();
  const expirado = diasRestantes !== null && diasRestantes < 0;
  const expirandoBreve = diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 7;

  return (
    <div className="demo-card">
      {/* Header com badges e data */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {getEstadoBadge()}
            {getTipoBadge()}
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
            }}
          >
            {formatDate(pedido.criado_em)}
          </span>
        </div>

        {/* Nome e Email do cliente */}
        <h3 className="demo-title" style={{ marginBottom: "4px" }}>
          {pedido.cliente_nome}
        </h3>
        <div className="demo-meta">
          <div>
            <span className="muted">Email:</span>{" "}
            <strong>{pedido.cliente_email}</strong>
          </div>
        </div>
      </div>

      {/* Data de expiração atual */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "var(--bg)",
          borderRadius: "8px",
          border: "1px solid var(--stroke)",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--muted)",
            marginBottom: "4px",
          }}
        >
          Data de expiração atual:
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: expirado
              ? "#ef4444"
              : expirandoBreve
              ? "#f59e0b"
              : "var(--text)",
          }}
        >
          {formatDate(pedido.data_expiracao_atual)}
          {diasRestantes !== null && (
            <span
              style={{
                marginLeft: "8px",
                fontSize: "0.75rem",
                fontWeight: "500",
              }}
            >
              {expirado
                ? `(expirado há ${Math.abs(diasRestantes)} dias)`
                : `(${diasRestantes} dias restantes)`}
            </span>
          )}
        </p>
      </div>

      {/* Ações */}
      {pedido.estado === "pendente" && (onAprovar || onRejeitar) && (
        <div className="card-actions">
          {onRejeitar && (
            <button
              onClick={() => onRejeitar(pedido.id)}
              disabled={loading}
              className="danger"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
              }}
            >
              ✖ Rejeitar
            </button>
          )}
          {onAprovar && (
            <button
              onClick={() => onAprovar(pedido.id)}
              disabled={loading}
              className="button"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
              }}
            >
              ✓ Aprovar (+30 dias)
            </button>
          )}
        </div>
      )}
    </div>
  );
}