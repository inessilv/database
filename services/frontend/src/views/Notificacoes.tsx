/**
 * Notificacoes View (Adaptado)
 * 
 * Gestão de pedidos de renovação/revogação
 * Apenas admins podem aceder
 * Versão adaptada sem useAuth hook
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePedidos } from "../hooks/usePedidos";
import PedidoCard from "../components/PedidoCard";
import ConfirmModal from "../components/ConfirmModal";
import type { PedidoComCliente } from "../types/Pedido";

// User type do App.tsx
type User = { name: string; role: "admin" | "viewer" };
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
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.key
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}
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
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Notificações</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-200 h-40 rounded-lg animate-pulse"
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Notificações</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-4">❌ {error}</p>
          <button
            onClick={refreshPedidos}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notificações</h1>
        <button
          onClick={refreshPedidos}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "A atualizar..." : "🔄 Atualizar"}
        </button>
      </div>

      {/* Tabs */}
      {renderTabs()}

      {/* Lista de pedidos */}
      {pedidosPaginados.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">
            {activeTab === "pendentes" ? "🎉" : "📭"}
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            {activeTab === "pendentes"
              ? "Nenhum pedido pendente!"
              : "Nenhum pedido encontrado"}
          </h3>
          <p className="text-gray-500">
            {activeTab === "pendentes"
              ? "Boa notícia - está tudo ok."
              : "Tente outro filtro ou atualize a página."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="mt-6 text-center text-sm text-gray-500">
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
