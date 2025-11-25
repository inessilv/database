/**
 * Notificacoes View (Refactored)
 * 
 * Vista de gestão de pedidos de renovação
 * Styling alinhado com Clientes.tsx
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
   * Renderizar tabs (estilo Clientes.tsx)
   */
  const renderTabs = () => {
    const tabs: { key: TabType; label: string; count: number }[] = [
      { key: "pendentes", label: "Pendentes", count: countPendentes },
      { key: "aprovados", label: "Aprovados", count: countAprovados },
      { key: "rejeitados", label: "Rejeitados", count: countRejeitados },
      { key: "todos", label: "Todos", count: pedidos.length },
    ];

    return (
      <div
        className="tabs-nav"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          borderBottom: "2px solid var(--stroke)",
          paddingBottom: "0",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              background: "transparent",
              border: "none",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
              color: activeTab === tab.key ? "var(--primary)" : "var(--muted)",
              fontWeight: activeTab === tab.key ? "700" : "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: "-2px",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className="badge"
                style={{
                  backgroundColor:
                    activeTab === tab.key ? "var(--primary)" : "var(--stroke)",
                  color: activeTab === tab.key ? "white" : "var(--text)",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
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
   * Renderizar paginação (estilo Clientes.tsx)
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div
        className="pagination"
        style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="btn-ghost"
          style={{
            padding: "8px 12px",
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          ← Anterior
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={currentPage === page ? "button" : "btn-ghost"}
            style={{
              padding: "8px 12px",
              minWidth: "40px",
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="btn-ghost"
          style={{
            padding: "8px 12px",
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          Seguinte →
        </button>
      </div>
    );
  };

  /**
   * Loading skeleton (estilo Clientes.tsx)
   */
  if (loading && pedidos.length === 0) {
    return (
      <div className="page">
        <div className="page-max">
          <h1 className="page-title">Notificações</h1>
          <div style={{ marginTop: "24px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "120px",
                  backgroundColor: "var(--bg-2)",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error state (estilo Clientes.tsx)
   */
  if (error) {
    return (
      <div className="page">
        <div className="page-max">
          <h1 className="page-title">Notificações</h1>
          <div
            className="card"
            style={{
              marginTop: "24px",
              padding: "32px",
              textAlign: "center",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
            }}
          >
            <p style={{ color: "#c00", fontWeight: "600", marginBottom: "16px" }}>
              ❌ {error}
            </p>
            <button onClick={refreshPedidos} className="button">
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-max">
        {/* Header (estilo Clientes.tsx) */}
        <div className="list-header">
          <h1 className="page-title">Notificações</h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={refreshPedidos} disabled={loading} className="btn-ghost">
              {loading ? "A atualizar..." : "🔄 Atualizar"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        {renderTabs()}

        {/* Lista de pedidos */}
        {pedidosPaginados.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "64px 32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>
              {activeTab === "pendentes" ? "🎉" : "📭"}
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "8px",
                color: "var(--text)",
              }}
            >
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
            <ul className="list-reset">
              {pedidosPaginados.map((pedido) => (
                <li key={pedido.id}>
                  <PedidoCard
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
                </li>
              ))}
            </ul>

            {/* Paginação */}
            {renderPagination()}

            {/* Info de paginação */}
            <div
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "0.875rem",
                color: "var(--muted)",
              }}
            >
              A mostrar {startIndex + 1}-
              {Math.min(endIndex, pedidosFiltrados.length)} de{" "}
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
