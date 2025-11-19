/**
 * Detalhe View (Refactored)
 * 
 * Vista de detalhes completos de uma demo
 * Layout em grid com todos os campos da BD
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { demoService } from "../services/demoService";
import type { Demo } from "../types/Demo";

type User = { id: string; name: string; role: "admin" | "viewer" };

type Props = {
  user: User;
};

const PLACEHOLDER = "/placeholder-user.png";

/**
 * Componente de Avatar do Comercial
 */
function ComercialAvatar({
  src,
  alt,
  size = 112,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  const [imageUrl, setImageUrl] = useState<string>(PLACEHOLDER);

  useEffect(() => {
    const v = (src ?? "").trim();
    if (v && /^https?:\/\//i.test(v)) {
      setImageUrl(v);
    } else {
      setImageUrl(PLACEHOLDER);
    }
  }, [src]);

  const handleError = () => {
    setImageUrl(PLACEHOLDER);
  };

  return (
    <img
      src={imageUrl}
      alt={alt}
      onError={handleError}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: "12px",
        border: "2px solid var(--stroke)",
        backgroundColor: "#d8dadf",
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Badge de Estado
 */
function EstadoBadge({ estado }: { estado: Demo["estado"] }) {
  const badges = {
    ativa: { text: "Ativa", color: "#10b981", bg: "#10b98120" },
    inativa: { text: "Inativa", color: "#6b7280", bg: "#6b728020" },
    manutenção: { text: "Manutenção", color: "#f59e0b", bg: "#f59e0b20" },
  };

  const badge = badges[estado];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        fontSize: "0.875rem",
        fontWeight: "600",
        borderRadius: "6px",
        backgroundColor: badge.bg,
        color: badge.color,
        border: `1px solid ${badge.color}40`,
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: badge.color,
          marginRight: "8px",
        }}
      />
      {badge.text}
    </span>
  );
}

/**
 * Campo de Detalhe
 */
function DetailField({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: fullWidth ? "1 / -1" : "auto",
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: "600",
          color: "var(--muted)",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--text)",
          margin: 0,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

/**
 * Formatar data
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Normalizar URL
 */
function normalizeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    return u.toString();
  } catch {
    return null;
  }
}

export default function Detalhe({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user.role === "admin";

  /**
   * Carregar demo
   */
  useEffect(() => {
    if (!id) {
      setError("ID da demo não fornecido");
      setLoading(false);
      return;
    }

    const loadDemo = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await demoService.getById(id);
        setDemo(data);
      } catch (err: any) {
        console.error("Erro ao carregar demo:", err);
        setError(err.message || "Erro ao carregar demo");
      } finally {
        setLoading(false);
      }
    };

    loadDemo();
  }, [id]);

  /**
   * Abrir demo em nova aba
   */
  const handleOpenDemo = () => {
    if (!demo?.url) {
      alert("Esta demo não tem um URL configurado.");
      return;
    }

    const url = normalizeUrl(demo.url);
    if (!url) {
      alert("URL da demo inválido.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /**
   * Apagar demo
   */
  const handleDelete = async () => {
    if (!demo) return;

    if (!confirm(`Tens a certeza que queres apagar a demo "${demo.nome}"?`)) {
      return;
    }

    try {
      await demoService.delete(demo.id);
      alert("Demo apagada com sucesso!");
      navigate("/demos");
    } catch (err: any) {
      alert(`Erro ao apagar demo: ${err.message}`);
    }
  };

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="page-container">
        <button className="btn-back-outline" onClick={() => navigate("/demos")}>
          <i className="bi bi-arrow-left" />
          <span>Voltar</span>
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            fontSize: "1.125rem",
            color: "var(--muted)",
          }}
        >
          A carregar demo...
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error || !demo) {
    return (
      <div className="page-container">
        <button className="btn-back-outline" onClick={() => navigate("/demos")}>
          <i className="bi bi-arrow-left" />
          <span>Voltar</span>
        </button>
        <div
          className="card"
          style={{
            marginTop: "24px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            Demo não encontrada
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            {error || "A demo solicitada não existe ou foi removida."}
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate("/demos")}
            style={{ padding: "12px 24px" }}
          >
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Botão Voltar */}
      <button className="btn-back-outline" onClick={() => navigate("/demos")}>
        <i className="bi bi-arrow-left" />
        <span>Voltar</span>
      </button>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: "24px",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                margin: 0,
                color: "var(--text)",
              }}
            >
              {demo.nome}
            </h1>
            <EstadoBadge estado={demo.estado} />
          </div>
          {demo.codigo_projeto && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted)",
                margin: 0,
              }}
            >
              Código do Projeto: <strong>{demo.codigo_projeto}</strong>
            </p>
          )}
        </div>

        {/* Ações */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {demo.url && (
            <button
              className="btn-primary"
              onClick={handleOpenDemo}
              style={{
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="bi bi-box-arrow-up-right" />
              Abrir Demo
            </button>
          )}

          {isAdmin && (
            <>
              <button
                className="btn-secondary"
                onClick={() => navigate(`/demos/${demo.id}/edit`)}
                style={{
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="bi bi-pencil" />
                Editar
              </button>

              <button
                onClick={handleDelete}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  border: "2px solid #dc2626",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#dc2626";
                }}
              >
                <i className="bi bi-trash" />
                Apagar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="card">
        <div className="card-body">
          {/* Seção: Informação Geral */}
          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "20px",
                color: "var(--text)",
                borderBottom: "2px solid var(--stroke)",
                paddingBottom: "12px",
              }}
            >
              📋 Informação Geral
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              <DetailField label="Nome" value={demo.nome} />
              <DetailField label="Código do Projeto" value={demo.codigo_projeto} />
              <DetailField label="Vertical" value={demo.vertical} />
              <DetailField label="Horizontal" value={demo.horizontal} />
              <DetailField label="URL da Demo" value={demo.url} fullWidth />
              <DetailField label="Descrição" value={demo.descricao} fullWidth />
              <DetailField label="Keywords" value={demo.keywords} fullWidth />
            </div>
          </section>

          {/* Seção: Informação do Comercial */}
          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "20px",
                color: "var(--text)",
                borderBottom: "2px solid var(--stroke)",
                paddingBottom: "12px",
              }}
            >
              👤 Informação do Comercial
            </h2>

            <div
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {/* Foto do Comercial */}
              <ComercialAvatar
                src={demo.comercial_foto_url}
                alt={demo.comercial_nome || "Comercial"}
                size={120}
              />

              {/* Dados do Comercial */}
              <div
                style={{
                  flex: 1,
                  minWidth: "250px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                <DetailField label="Nome" value={demo.comercial_nome} />
                <DetailField label="Contacto" value={demo.comercial_contacto} />
                <DetailField
                  label="URL da Foto"
                  value={demo.comercial_foto_url}
                  fullWidth
                />
              </div>
            </div>
          </section>

          {/* Seção: Metadados */}
          <section>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "20px",
                color: "var(--text)",
                borderBottom: "2px solid var(--stroke)",
                paddingBottom: "12px",
              }}
            >
              📅 Metadados
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              <DetailField label="Delete DemoCriado Por" value={demo.criado_por} />
              <DetailField label="Data de Criação" value={formatDate(demo.criado_em)} />
              <DetailField
                label="Última Atualização"
                value={formatDate(demo.atualizado_em)}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}