/**
 * ClienteDetalhe View
 * 
 * Vista de detalhes de um cliente específico
 * Segue o padrão da Detalhe.tsx (demos)
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {clienteService} from "../services/clienteService";
import type { ClienteComStatus } from "../types/Cliente";

type User = { id: string; name: string; role: "admin" | "viewer" };

type Props = {
  user: User;
};

export default function ClienteDetalhe({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<ClienteComStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Redirecionar se não for admin
   */
  if (user.role !== "admin") {
    navigate("/demos");
    return null;
  }

  /**
   * Carregar dados do cliente
   */
  useEffect(() => {
    if (!id) {
      navigate("/clientes");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Carregar cliente
        const clienteData = await clienteService.getById(id);
        const clienteComStatus = clienteService.calcularStatus(clienteData);
        setCliente(clienteComStatus);
      } catch (err: any) {
        console.error("Erro ao carregar dados do cliente:", err);
        setError(err.message || "Erro ao carregar cliente");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  

  /**
   * Badge de estado
   */
  const getStatusBadge = () => {
    if (!cliente) return null;

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
        style={{
          ...style,
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: "999px",
          fontSize: "0.875rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          border: "1px solid",
        }}
      >
        {label}
      </span>
    );
  };

  /**
   * Formatar data
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Calcular dias restantes
   */
  const getDiasRestantesText = () => {
    if (!cliente) return "";

    const diasRestantes = cliente.dias_restantes ?? 0;

    if (diasRestantes < 0) {
      return `Expirado há ${Math.abs(diasRestantes)} dias`;
    } else if (diasRestantes === 0) {
      return "Expira hoje!";
    } else if (diasRestantes === 1) {
      return "Expira amanhã";
    } else if (diasRestantes <= 7) {
      return `Expira em ${diasRestantes} dias ⚠️`;
    } else {
      return `${diasRestantes} dias restantes`;
    }
  };

  /**
   * Loading skeleton
   */
  if (loading) {
    return (
      <div className="page">
        <div className="page-max">
          <div
            style={{
              height: "300px",
              backgroundColor: "var(--bg-2)",
              borderRadius: "12px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error || !cliente) {
    return (
      <div className="page">
        <div className="page-max">
          <button
            className="btn-ghost"
            onClick={() => navigate("/clientes")}
            style={{ marginBottom: "20px" }}
          >
            ← Voltar para Clientes
          </button>
          <div
            className="card"
            style={{
              padding: "48px 32px",
              textAlign: "center",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "#c00" }}>
              ❌ {error || "Cliente não encontrado"}
            </h2>
            <button
              onClick={() => navigate("/clientes")}
              className="button"
              style={{ marginTop: "16px" }}
            >
              Voltar para Clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-max">
        {/* Header com botão voltar */}
        <div className="topbar" style={{ marginBottom: "24px" }}>
          <button
            className="btn-ghost"
            onClick={() => navigate("/clientes")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Voltar
          </button>

          <div className="actions">
          </div>
        </div>

        {/* Card Principal - Informações do Cliente */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {/* Avatar */}
            <div
              className="avatar"
              style={{
                width: 112,
                height: 112,
                backgroundColor: "var(--primary, #1463c2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "3rem",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {cliente.nome.charAt(0).toUpperCase()}
            </div>

            {/* Info Principal */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "12px",
                }}
              >
                <h1
                  className="page-title"
                  style={{
                    margin: 0,
                    fontSize: "2rem",
                  }}
                >
                  {cliente.nome}
                </h1>
                {getStatusBadge()}
              </div>

              <div style={{ color: "var(--muted)", fontSize: "1.125rem" }}>
                {cliente.email}
              </div>
            </div>
          </div>

          {/* Grid de Detalhes */}
          <div className="detail-grid">
            {/* Data de Registo */}
            <div className="field">
              <label className="label">Data de Registo</label>
              <input
                type="text"
                className="input"
                value={formatDate(cliente.data_registo)}
                readOnly
              />
            </div>

            {/* Data de Expiração */}
            <div className="field">
              <label className="label">Data de Expiração</label>
              <input
                type="text"
                className="input"
                value={formatDate(cliente.data_expiracao)}
                readOnly
              />
            </div>

            {/* Dias Restantes */}
            <div className="field">
              <label className="label">Status de Expiração</label>
              <input
                type="text"
                className="input"
                value={getDiasRestantesText()}
                readOnly
                style={{
                  fontWeight: "600",
                  color:
                    cliente.status === "expirado"
                      ? "#ef4444"
                      : cliente.status === "expira_breve"
                      ? "#f59e0b"
                      : "#10b981",
                }}
              />
            </div>

            {/* Criado Por */}
            <div className="field">
              <label className="label">Criado Por (Admin ID)</label>
              <input
                type="text"
                className="input"
                value={cliente.criado_por}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* CSS da animação de pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
