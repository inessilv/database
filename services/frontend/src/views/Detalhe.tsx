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
 * Suporta URLs HTTPS/HTTP e Base64
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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    const v = (src ?? "").trim();
    
    // Se não há foto, usa placeholder
    if (!v) {
      setImageUrl(PLACEHOLDER);
      return;
    }

    // Aceita URLs HTTPS/HTTP ou Base64
    if (/^https?:\/\//i.test(v) || /^data:image\//i.test(v)) {
      setImageUrl(v);
    } else {
      // Qualquer outro formato inválido, usa placeholder
      setImageUrl(PLACEHOLDER);
    }
  }, [src]);

  const handleError = () => {
    // Só usa placeholder se houver erro ao carregar a imagem
    if (!imageError) {
      setImageError(true);
      setImageUrl(PLACEHOLDER);
    }
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
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "var(--muted)",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1rem",
          color: "var(--text)",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

/**
 * Formatar data ISO para pt-PT
 */
function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate);
    return d.toLocaleString("pt-PT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Normalizar URL (adicionar https:// se necessário)
 */
function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Componente principal
 */
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
      setError("ID da demo não fornecido.");
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
        setError(err.message || "Erro ao carregar demo.");
      } finally {
        setLoading(false);
      }
    };

    loadDemo();
  }, [id]);

  /**
   * Abrir URL da demo
   */
  const handleOpenDemo = () => {
    if (!demo) return;

    if (!demo.url) {
      alert("Esta demo não tem URL configurado.");
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
          <button className="btn-primary" onClick={() => navigate("/demos")}>
            <i className="bi bi-arrow-left" />
            <span>Voltar às Demos</span>
          </button>
        </div>
      </div>
    );
  }

  /**
   * Success state
   */
  return (
    <div className="page">
      <div className="page-max">
        {/* Header com ações */}
        <div className="list-header" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="btn-back-outline" onClick={() => navigate("/demos")}>
              <i className="bi bi-arrow-left" />
              <span>Voltar</span>
            </button>
            <h1 className="page-title" style={{ margin: 0 }}>
              {demo.nome}
            </h1>
            <EstadoBadge estado={demo.estado} />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            {demo.url && (
              <button className="btn-outline" onClick={handleOpenDemo}>
                <i className="bi bi-box-arrow-up-right" />
                <span>Abrir Demo</span>
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  className="btn-outline"
                  onClick={() => navigate(`/demos/${demo.id}/editar`)}
                >
                  <i className="bi bi-pencil" />
                  <span>Editar</span>
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  <i className="bi bi-trash" />
                  <span>Apagar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card principal com detalhes */}
        <div className="card" style={{ padding: "32px" }}>
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
              {/* Foto do Comercial - AGORA MOSTRA FOTO REAL */}
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
              <DetailField label="Criado Por" value={demo.criado_por} />
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