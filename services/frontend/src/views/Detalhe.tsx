import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { demoService } from "../services/demoService";
import type { Demo } from "../types/Demo";

type User = { id: string; name: string; role: "admin" | "viewer" };

type Props = {
  user: User;
};

/**
 * SVG Placeholder Inline (não precisa de ficheiro externo)
 */
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect fill='%23e5e7eb' width='120' height='120'/%3E%3Cpath fill='%239ca3af' d='M60 55c-8.3 0-15-6.7-15-15s6.7-15 15-15 15 6.7 15 15-6.7 15-15 15zm0 10c10 0 30 5 30 15v10H30V80c0-10 20-15 30-15z'/%3E%3C/svg%3E`;

/**
 * Componente de Avatar do Comercial
 * Suporta URLs HTTPS/HTTP e Base64
 * CORRIGIDO: Usa SVG inline como fallback
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
  const [imageUrl, setImageUrl] = useState<string>(PLACEHOLDER_SVG);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    const v = (src ?? "").trim();
    
    console.log("🖼️ ComercialAvatar Debug");
    console.log("1. src recebido:", src ? `${src.substring(0, 50)}...` : "null/empty");
    console.log("2. src length:", v.length);
    
    // Se não há foto, usa placeholder
    if (!v) {
      console.log("3. Sem foto → usando placeholder SVG");
      setImageUrl(PLACEHOLDER_SVG);
      return;
    }

    // Validar Base64
    if (v.startsWith("data:image/")) {
      console.log("3. Formato: Base64 detectado");
      
      // Extrair tipo de imagem (jpeg, png, etc)
      const match = v.match(/^data:image\/(\w+);base64,/);
      if (match) {
        const imageType = match[1];
        console.log("4. Tipo de imagem:", imageType);
        
        // Validar que tem conteúdo Base64
        const base64Content = v.split(",")[1];
        if (base64Content && base64Content.length > 0) {
          console.log("5. Base64 válido, usando imagem");
          setImageUrl(v);
        } else {
          console.log("5. ❌ Base64 inválido (sem conteúdo)");
          setImageUrl(PLACEHOLDER_SVG);
        }
      } else {
        console.log("4. ❌ Formato Base64 inválido");
        setImageUrl(PLACEHOLDER_SVG);
      }
      return;
    }

    // Aceita URLs HTTPS/HTTP
    if (/^https?:\/\//i.test(v)) {
      console.log("3. Formato: URL HTTP/HTTPS");
      console.log("4. URL:", v);
      setImageUrl(v);
      return;
    }

    // Qualquer outro formato inválido, usa placeholder
    console.log("3. ❌ Formato desconhecido, usando placeholder");
    setImageUrl(PLACEHOLDER_SVG);
  }, [src]);

  const handleError = () => {
    // Só usa placeholder se houver erro ao carregar a imagem
    if (!imageError) {
      console.error("❌ Erro ao carregar imagem!");
      console.error("URL que falhou:", imageUrl);
      setImageError(true);
      setImageUrl(PLACEHOLDER_SVG);
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
        backgroundColor: "#e5e7eb",
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
          fontSize: "0.75rem",
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
          fontSize: "0.95rem",
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
 * Formatar data ISO para formato legível
 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default function Detalhe({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!id) {
      navigate("/demos");
      return;
    }

    const loadDemo = async () => {
      setLoading(true);
      try {
        const data = await demoService.getById(id);
        console.log("📥 Demo carregada do backend");
        console.log("comercial_foto_url length:", data.comercial_foto_url?.length || 0);
        setDemo(data);
      } catch (err: any) {
        console.error("Erro ao carregar demo:", err);
        alert(`Erro ao carregar demo: ${err.message}`);
        navigate("/demos");
      } finally {
        setLoading(false);
      }
    };

    loadDemo();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!demo || !isAdmin) return;

    if (!confirm(`Tem certeza que deseja apagar a demo "${demo.nome}"?`)) {
      return;
    }

    try {
      await demoService.delete(demo.id);
      alert("Demo apagada com sucesso!");
      navigate("/demos");
    } catch (err: any) {
      console.error("Erro ao apagar demo:", err);
      alert(`Erro ao apagar demo: ${err.message}`);
    }
  };

  const handleEdit = () => {
    if (!demo || !isAdmin) return;
    navigate(`/demos/${demo.id}/edit`);
  };

  const handleOpenDemo = () => {
    if (!demo?.url) return;
    window.open(demo.url, "_blank");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "var(--muted)",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!demo) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "var(--muted)",
        }}
      >
        Demo não encontrada
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/demos")}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              marginBottom: "12px",
              padding: "0",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Voltar
          </button>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "var(--text)",
              margin: "0",
            }}
          >
            {demo.nome}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleOpenDemo}
            disabled={!demo.url}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: demo.url ? "pointer" : "not-allowed",
              opacity: demo.url ? 1 : 0.5,
            }}
          >
            Abrir Demo
          </button>

          {isAdmin && (
            <>
              <button
                onClick={handleEdit}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--stroke)",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Editar
              </button>

              <button
                onClick={handleDelete}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#fee",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Apagar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Card */}
      <div
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "12px",
          border: "1px solid var(--stroke)",
          padding: "32px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {/* Seção: Informação Geral */}
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
              <DetailField label="URL da Demo" value={demo.url} />
              <DetailField label="Descrição" value={demo.descricao} fullWidth />
              <DetailField label="Keywords" value={demo.keywords} fullWidth />

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "var(--muted)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Estado
                </div>
                <EstadoBadge estado={demo.estado} />
              </div>
            </div>
          </section>

          {/* Seção: Informação do Comercial */}
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
              {/* Foto do Comercial - AGORA COM PLACEHOLDER INLINE */}
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
              Metadados
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