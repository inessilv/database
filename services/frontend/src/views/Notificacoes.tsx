/**
 * Notificacoes View (Refatorada)
 * 
 * Gestão de pedidos de renovação/revogação
 * Apenas admins podem aceder
 * Usa services + types + styles.css
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePedidos } from "../hooks/usePedidos";
import PedidoCard from "../components/PedidoCard";
import ConfirmModal from "../components/ConfirmModal";
import type { PedidoComCliente } from "../types/Pedido";

// User type do App.tsx
type User = { id: string; name: string; role: "admin" | "viewer" };
type TabType = "pendentes" | "aprovados" | "rejeitados" | "todos";

const ITEMS_PER_PAGE = 15;

type Props = {
  user: User;
};

export default function Notificacoes({ user }: Props) {
  const navigate = useNavigate();
  const {
    pedidos,
    loading,
    error,
    countPendentes,
    countAprovados,
    countRejeitados,
    refreshPedidos,
    aprovarPedido,
    rejeitarPedido,
    getPedidosPorEstado,
  } = usePedidos();

  const [activeTab, setActiveTab] = useState<TabType>("pendentes");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "aprovar" | "rejeitar" | null;
    pedidoId: string | null;
    pedido: PedidoComCliente | null;
  }>({
    isOpen: false,
    action: null,
    pedidoId: null,
    pedido: null,
  });

  /**
   * Redirecionar se não for admin
   */
  if (user.role !== "admin") {
    navigate("/demos");
    return null;
  }

  /**
   * Filtrar pedidos por tab ativa
   */
  const pedidosFiltrados = useMemo(() => {
    if (activeTab === "todos") {
      return pedidos;
    }
    const estado = activeTab.slice(0, -1) as "pendente" | "aprovado" | "rejeitado";
    return getPedidosPorEstado(estado);
  }, [activeTab, pedidos, getPedidosPorEstado]);

  /**
   * Paginação
   */
  const totalPages = Math.ceil(pedidosFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pedidosPaginados = pedidosFiltrados.slice(startIndex, endIndex);

  /**
   * Mudar de tab (reset paginação)
   */
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  /**
   * Abrir modal de confirmação
   */
  const openConfirmModal = (
    action: "aprovar" | "rejeitar",
    pedidoId: string
  ) => {
    const pedido = pedidos.find((p) => p.id === pedidoId) || null;
    setConfirmModal({
      isOpen: true,
      action,
      pedidoId,
      pedido,
    });
  };

  /**
   * Fechar modal
   */
  const closeConfirmModal = () => {
    if (!actionLoading) {
      setConfirmModal({
        isOpen: false,
        action: null,
        pedidoId: null,
        pedido: null,
      });
    }
  };

  /**
   * Confirmar ação
   */
  const handleConfirmAction = async () => {
    if (!confirmModal.pedidoId || !confirmModal.action) return;

    setActionLoading(true);

    try {
      if (confirmModal.action === "aprovar") {
        await aprovarPedido(confirmModal.pedidoId);
        alert("✅ Pedido aprovado com sucesso! Cliente renovado por +30 dias.");
      } else {
        await rejeitarPedido(confirmModal.pedidoId);
        alert("❌ Pedido rejeitado.");
      }

      closeConfirmModal();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Renderizar tabs
   */
  const renderTabs = () => {
    const tabs: { key: TabType; label: string; count: number }[] = [
      { key: "pendentes", label: "Pendentes", count: countPendentes },
      { key: "aprovados", label: "Aprovados", count: countAprovados },
      { key: "rejeitados", label: "Rejeitados", count: countRejeitados },
      { key: "todos", label: "Todos", count: pedidos.length },
    ];

    return (
      <div className="tabs-nav" style={{ marginBottom: "2rem" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={activeTab === tab.key ? "active" : ""}
            style={{ 
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className="badge"
                style={{
                  backgroundColor: activeTab === tab.key ? "var(--brand)" : "var(--muted-bg)",
                  color: activeTab === tab.key ? "white" : "var(--text)",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: "600"
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Renderizar paginação
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination" style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="btn-ghost"
          style={{ marginRight: "0.5rem" }}
        >
          ← Anterior
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={currentPage === page ? "btn-primary" : "btn-ghost"}
            style={{ 
              margin: "0 0.25rem",
              minWidth: "2.5rem"
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="btn-ghost"
          style={{ marginLeft: "0.5rem" }}
        >
          Seguinte →
        </button>
      </div>
    );
  };

  /**
   * Loading skeleton
   */
  if (loading && pedidos.length === 0) {
    return (
      <div className="page-container">
        <h1 className="page-title">Notificações</h1>
        <div className="loading-skeleton">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-item"
              style={{ 
                height: "10rem", 
                backgroundColor: "var(--card-bg)",
                borderRadius: "12px",
                marginBottom: "1rem",
                animation: "pulse 1.5s ease-in-out infinite"
              }}
            />
          ))}
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
        <h1 className="page-title">Notificações</h1>
        <div className="error-state" style={{
          backgroundColor: "var(--error-bg, #fee)",
          border: "1px solid var(--error-border, #fcc)",
          borderRadius: "12px",
          padding: "2rem",
          textAlign: "center"
        }}>
          <p style={{ color: "var(--error-text, #c00)", fontWeight: "600", marginBottom: "1rem" }}>
            ❌ {error}
          </p>
          <button
            onClick={refreshPedidos}
            className="btn-primary"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container notifs">
      {/* Header */}
      <div className="page-topbar">
        <h1 className="page-title">Notificações</h1>
        <div className="page-actions">
          <button
            onClick={refreshPedidos}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "A atualizar..." : "🔄 Atualizar"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      {renderTabs()}

      {/* Lista de pedidos */}
      {pedidosPaginados.length === 0 ? (
        <div className="empty-state" style={{ 
          textAlign: "center", 
          padding: "4rem 2rem" 
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
            {activeTab === "pendentes" ? "🎉" : "📭"}
          </div>
          <h3 style={{ 
            fontSize: "1.25rem", 
            fontWeight: "700", 
            marginBottom: "0.5rem",
            color: "var(--text)"
          }}>
            {activeTab === "pendentes"
              ? "Nenhum pedido pendente!"
              : "Nenhum pedido encontrado"}
          </h3>
          <p style={{ color: "var(--muted)" }}>
            {activeTab === "pendentes"
              ? "Boa notícia - está tudo ok."
              : "Tente outro filtro ou atualize a página."}
          </p>
        </div>
      ) : (
        <>
          <div className="list-stack">
            {pedidosPaginados.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAprovar={
                  pedido.estado === "pendente" &&
                  pedido.tipo_pedido === "renovação"
                    ? () => openConfirmModal("aprovar", pedido.id)
                    : undefined
                }
                onRejeitar={
                  pedido.estado === "pendente"
                    ? () => openConfirmModal("rejeitar", pedido.id)
                    : undefined
                }
                loading={false}
              />
            ))}
          </div>

          {/* Paginação */}
          {renderPagination()}

          {/* Info */}
          <div style={{ 
            marginTop: "1.5rem", 
            textAlign: "center", 
            fontSize: "0.875rem",
            color: "var(--muted)"
          }}>
            A mostrar {startIndex + 1}-{Math.min(endIndex, pedidosFiltrados.length)} de{" "}
            {pedidosFiltrados.length} pedidos
          </div>
        </>
      )}

      {/* Modal de confirmação */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.action === "aprovar"
            ? "Aprovar pedido de renovação?"
            : "Rejeitar pedido?"
        }
        message={
          confirmModal.action === "aprovar"
            ? `Tem a certeza que deseja aprovar o pedido de renovação de ${
                confirmModal.pedido?.cliente_nome || "este cliente"
              }? A data de expiração será estendida por +30 dias.`
            : `Tem a certeza que deseja rejeitar o pedido de ${
                confirmModal.pedido?.cliente_nome || "este cliente"
              }?`
        }
        confirmText={
          confirmModal.action === "aprovar" ? "Aprovar" : "Rejeitar"
        }
        confirmColor={confirmModal.action === "aprovar" ? "green" : "red"}
        loading={actionLoading}
      />
    </div>
  );
}
