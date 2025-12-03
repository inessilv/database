/**
 * Lista View (Refactored + Sistema de Renovação)
 * 
 * Vista principal do catálogo de demos
 * Com filtros por Vertical, Horizontal, pesquisa, paginação
 * + Banner de expiração e bloqueio para clientes
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDemos } from "../hooks/useDemos";
import { useClienteAuth } from "../hooks/useClienteAuth";
import ExpirationBanner from "../components/ExpirationBanner";
import type { Demo } from "../types/Demo";
import { getAuthUser } from "../utils/cookies";

type User = { id: string; name: string; role: "admin" | "viewer" };

const ITEMS_PER_PAGE = 15;

type Props = {
  user: User;
};

export default function Lista({ user }: Props) {
  const navigate = useNavigate();
  const {
    demos,
    loading,
    error,
    verticais,
    horizontais,
    deleteDemo,
    refreshDemos,
  } = useDemos();


  const clienteAuth = user.role === "viewer" ? useClienteAuth() : null;

  const isAdmin = user.role === "admin";
  const isViewer = user.role === "viewer";

  const clienteStatus = clienteAuth?.status || null;
  const clienteExpirado = clienteStatus === "expirado";

  // Estados de filtros
  const [selectedVertical, setSelectedVertical] = useState<string>("todas");
  const [selectedHorizontal, setSelectedHorizontal] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Abrir demo em nova aba
   * ✅ MODIFICADO: Bloqueia se cliente expirado
   */
  const handleOpenDemo = async (demo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!demo?.url) return;
    
    try {
      const user = getAuthUser();
      if (!user || !user.id) {
        alert("Erro: utilizador não autenticado");
        return;
      }
      
      const CATALOG_URL = window.location.origin.replace(':30300', ':30800');
      const response = await fetch(`${CATALOG_URL}/api/demos/${demo.id}/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: user.id
        })
      });
      
      if (!response.ok) {
        console.error("Erro ao registar abertura de demo:", await response.text());
      } else {
        console.log("Demo aberta registada com sucesso");
      }
      
      window.open(demo.url, "_blank");
      
    } catch (error) {
      console.error("Erro ao abrir demo:", error);
      window.open(demo.url, "_blank");
    }
  };

  /**
   * Apagar demo (Admin apenas)
   */
  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tens a certeza que queres apagar a demo "${nome}"?`)) {
      return;
    }

    try {
      await deleteDemo(id);
      alert("Demo apagada com sucesso!");
    } catch (err: any) {
      alert(`Erro ao apagar demo: ${err.message}`);
    }
  };

  /**
   * Filtrar e ordenar demos
   */
  const demosFiltradas = useMemo(() => {
    let filtered = [...demos];

    // Filtro por Vertical
    if (selectedVertical !== "todas") {
      filtered = filtered.filter((d) => d.vertical === selectedVertical);
    }

    // Filtro por Horizontal
    if (selectedHorizontal !== "todas") {
      filtered = filtered.filter((d) => d.horizontal === selectedHorizontal);
    }

    // Filtro por pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.nome.toLowerCase().includes(query) ||
          d.codigo_projeto?.toLowerCase().includes(query) ||
          d.vertical?.toLowerCase().includes(query) ||
          d.horizontal?.toLowerCase().includes(query) ||
          d.keywords?.toLowerCase().includes(query)
      );
    }

    // Ordenar por nome (A-Z)
    filtered.sort((a, b) => a.nome.localeCompare(b.nome, "pt-PT"));

    return filtered;
  }, [demos, selectedVertical, selectedHorizontal, searchQuery]);

  /**
   * Paginação
   */
  const totalPages = Math.ceil(demosFiltradas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const demosPaginadas = demosFiltradas.slice(startIndex, endIndex);

  /**
   * Mudar página
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Reset de filtros
   */
  const handleResetFilters = () => {
    setSelectedVertical("todas");
    setSelectedHorizontal("todas");
    setSearchQuery("");
    setCurrentPage(1);
  };

  /**
   * Badge de estado
   */
  const getEstadoBadge = (estado: Demo["estado"]) => {
    const badges = {
      ativa: { text: "Ativa", color: "#10b981" },
      inativa: { text: "Inativa", color: "#6b7280" },
      manutenção: { text: "Manutenção", color: "#f59e0b" },
    };

    const badge = badges[estado];

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 8px",
          fontSize: "0.75rem",
          fontWeight: "600",
          borderRadius: "4px",
          backgroundColor: `${badge.color}20`,
          color: badge.color,
        }}
      >
        {badge.text}
      </span>
    );
  };

  /**
   * Renderizar paginação
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginTop: "24px",
        }}
      >
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--stroke)",
            borderRadius: "6px",
            background: "var(--bg)",
            color: "var(--text)",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          ← Anterior
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--stroke)",
                borderRadius: "6px",
                background: "var(--bg)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              1
            </button>
            {startPage > 2 && <span>...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--stroke)",
              borderRadius: "6px",
              background: page === currentPage ? "var(--primary)" : "var(--bg)",
              color: page === currentPage ? "white" : "var(--text)",
              cursor: "pointer",
              fontWeight: page === currentPage ? "600" : "400",
            }}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span>...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--stroke)",
                borderRadius: "6px",
                background: "var(--bg)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--stroke)",
            borderRadius: "6px",
            background: "var(--bg)",
            color: "var(--text)",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
        >
          Seguinte →
        </button>
      </div>
    );
  };

  /**
   * Loading state
   */
  if (loading && demos.length === 0) {
    return (
      <div className="page-container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            fontSize: "1.25rem",
            color: "var(--muted)",
          }}
        >
          A carregar demos...
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="page-container">
        <div
          style={{
            padding: "24px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
          }}
        >
          <strong>Erro:</strong> {error}
          <button
            onClick={refreshDemos}
            style={{
              marginLeft: "16px",
              padding: "8px 16px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {}
      {isViewer && <ExpirationBanner />}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", marginBottom: "8px" }}>
            Catálogo de Demos
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            {demosFiltradas.length} {demosFiltradas.length === 1 ? "demo" : "demos"}{" "}
            {selectedVertical !== "todas" || selectedHorizontal !== "todas" || searchQuery
              ? "encontradas"
              : "disponíveis"}
          </p>
        </div>

        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => navigate("/demos/create")}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: "600",
            }}
          >
            <i className="bi bi-plus-circle" style={{ marginRight: "8px" }} />
            Adicionar Demo
          </button>
        )}
      </div>

      {/* Filtros */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* Filtro por Vertical */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--text)",
              }}
            >
              Vertical
            </label>
            <select
              value={selectedVertical}
              onChange={(e) => {
                setSelectedVertical(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--stroke)",
                borderRadius: "6px",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <option value="todas">Todas as verticais</option>
              {verticais.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Horizontal */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--text)",
              }}
            >
              Horizontal
            </label>
            <select
              value={selectedHorizontal}
              onChange={(e) => {
                setSelectedHorizontal(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--stroke)",
                borderRadius: "6px",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <option value="todas">Todas as horizontais</option>
              {horizontais.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Barra de pesquisa */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--text)",
              }}
            >
              Pesquisa
            </label>
            <input
              type="text"
              placeholder="Nome, código, vertical..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--stroke)",
                borderRadius: "6px",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.875rem",
              }}
            />
          </div>
        </div>

        {/* Botão Reset Filtros */}
        {(selectedVertical !== "todas" ||
          selectedHorizontal !== "todas" ||
          searchQuery) && (
          <button
            onClick={handleResetFilters}
            style={{
              padding: "8px 16px",
              border: "1px solid var(--stroke)",
              borderRadius: "6px",
              background: "transparent",
              color: "var(--muted)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Lista de demos */}
      {demosFiltradas.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
            {searchQuery || selectedVertical !== "todas" || selectedHorizontal !== "todas"
              ? "🔍"
              : "📭"}
          </div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            {searchQuery || selectedVertical !== "todas" || selectedHorizontal !== "todas"
              ? "Nenhuma demo encontrada"
              : "Nenhuma demo disponível"}
          </h3>
          <p style={{ color: "var(--muted)" }}>
            {searchQuery || selectedVertical !== "todas" || selectedHorizontal !== "todas"
              ? "Tenta ajustar os filtros ou termos de pesquisa."
              : isAdmin
              ? 'Clica em "Adicionar Demo" para criar a primeira demo.'
              : "Ainda não há demos disponíveis."}
          </p>
        </div>
      ) : (
        <>
          <div>
            {demosPaginadas.map((demo) => {
              const isViewerClickable = isViewer && demo.url && !clienteExpirado;
              const isDemoBlocked = isViewer && clienteExpirado;

              return (
                <div
                  key={demo.id}
                  className="card"
                  style={{
                    marginBottom: "16px",
                    padding: "20px",
                    cursor: isViewerClickable ? "pointer" : "default",
                    transition: "all 0.2s",
                    position: "relative",
                    opacity: isDemoBlocked ? 0.5 : 1,
                  }}
                  onClick={(e) => {
                    if (isViewerClickable) {
                      handleOpenDemo(demo, e);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (isViewerClickable) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isViewerClickable) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  {}
                  {isDemoBlocked && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 1,
                        borderRadius: "8px",
                      }}
                    >
                      <span
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          border: "1px solid #ef4444",
                        }}
                      >
                        Acesso Expirado
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                    }}
                  >
                    {/* Info da demo */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            margin: 0,
                            color: "var(--text)",
                          }}
                        >
                          {demo.nome}
                        </h3>
                        {getEstadoBadge(demo.estado)}
                      </div>

                      {demo.descricao && (
                        <p
                          style={{
                            color: "var(--muted)",
                            fontSize: "0.875rem",
                            marginBottom: "12px",
                            lineHeight: "1.5",
                          }}
                        >
                          {demo.descricao}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                          fontSize: "0.875rem",
                          color: "var(--muted)",
                        }}
                      >
                        {demo.codigo_projeto && (
                          <span>
                            <strong>Código:</strong> {demo.codigo_projeto}
                          </span>
                        )}
                        {demo.vertical && (
                          <span>
                            <strong>Vertical:</strong> {demo.vertical}
                          </span>
                        )}
                        {demo.horizontal && (
                          <span>
                            <strong>Horizontal:</strong> {demo.horizontal}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    {isAdmin && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexShrink: 0,
                        }}
                      >
                        {demo.url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDemo(demo, e);
                            }}
                            style={{
                              padding: "8px 12px",
                              background: "var(--primary)",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                            title="Abrir Demo"
                          >
                            <i className="bi bi-box-arrow-up-right" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/demos/${demo.id}/update`);
                          }}
                          style={{
                            padding: "8px 12px",
                            background: "transparent",
                            border: "1px solid var(--stroke)",
                            borderRadius: "6px",
                            color: "var(--text)",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                          }}
                          title="Editar"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(demo.id, demo.nome);
                          }}
                          style={{
                            padding: "8px 12px",
                            background: "transparent",
                            border: "1px solid #dc2626",
                            borderRadius: "6px",
                            color: "#dc2626",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                          }}
                          title="Apagar"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {renderPagination()}

          {/* Info de paginação */}
          <div
            style={{
              marginTop: "16px",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--muted)",
              paddingBottom: "16px",
            }}
          >
            A mostrar {startIndex + 1}-{Math.min(endIndex, demosFiltradas.length)} de{" "}
            {demosFiltradas.length} demos
          </div>
        </>
      )}
    </div>
  );
}