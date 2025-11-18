/**
 * ClienteCard Component
 * 
 * Card para exibir informações de um cliente
 * Segue o padrão visual da Lista.tsx (demos)
 */

import type { ClienteComStatus } from "../types/Cliente";

interface ClienteCardProps {
  cliente: ClienteComStatus;
  onEdit: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export default function ClienteCard({
  cliente,
  onEdit,
  onViewDetails,
}: ClienteCardProps) {
  /**
   * Configuração dos badges de estado
   */
  const getStatusBadge = () => {
    const config = {
      ativo: {
        label: "🟢 Ativo",
        style: {
          backgroundColor: "#bbf7d0",
          borderColor: "#10b981",
          color: "#064e3b",
        },
      },
      expira_breve: {
        label: "🟡 Expira Breve",
        style: {
          backgroundColor: "#fde68a",
          borderColor: "#f59e0b",
          color: "#1f2937",
        },
      },
      expirado: {
        label: "🔴 Expirado",
        style: {
          backgroundColor: "#fecaca",
          borderColor: "#ef4444",
          color: "#7f1d1d",
        },
      },
      futuro: {
        label: "⏳ Agendado",
        style: {
          backgroundColor: "#ddd6fe",
          borderColor: "#8b5cf6",
          color: "#3730a3",
        },
      },
    };

    const { label, style } = config[cliente.status];

    return (
      <span
        className="badge"
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
   * Formatar data de expiração
   */
  const formatDataExpiracao = () => {
    const date = new Date(cliente.data_expiracao);
    const formatted = date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const diasRestantes = cliente.dias_restantes ?? 0;

    if (diasRestantes < 0) {
      return `${formatted} (expirado há ${Math.abs(diasRestantes)} dias)`;
    } else if (diasRestantes === 0) {
      return `${formatted} (expira hoje!)`;
    } else {
      return `${formatted} (${diasRestantes} dias restantes)`;
    }
  };

  return (
    <li>
      <div className="demo-card">
        <div className="demo-card__row" style={{ gap: 16 }}>
          {/* Avatar com iniciais */}
          <div
            className="avatar"
            style={{
              width: 64,
              height: 64,
              backgroundColor: "var(--primary, #1463c2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "700",
            }}
          >
            {cliente.nome.charAt(0).toUpperCase()}
          </div>

          {/* Conteúdo */}
          <div className="demo-content" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <h3 className="demo-title" style={{ margin: 0 }}>
                {cliente.nome}
              </h3>
              {getStatusBadge()}
            </div>

            <div className="demo-meta">
              <div>
                <span className="muted">Email:</span>{" "}
                <strong>{cliente.email}</strong>
              </div>
              <div>
                <span className="muted">Expiração:</span>{" "}
                <strong>{formatDataExpiracao()}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="card-actions" style={{ marginTop: 12 }}>
          <button
            className="btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(cliente.id);
            }}
          >
            Ver Detalhes
          </button>
          <button
            className="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(cliente.id);
            }}
          >
            Editar
          </button>
        </div>
      </div>
    </li>
  );
}
