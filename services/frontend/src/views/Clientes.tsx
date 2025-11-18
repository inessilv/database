/**
 * Clientes View (Refactored)
 * 
 * Vista principal de gestão de clientes
 * Segue o padrão visual da Lista.tsx com funcionalidades das Notificações
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes } from "../hooks/useClientes";
import ClienteCard from "../components/ClienteCard";
import ClienteModal from "../components/ClienteModal";
import type { ClienteCreate, ClienteUpdate } from "../types/Cliente";

type User = { id: string; name: string; role: "admin" | "viewer" };
type FilterType = "todos" | "ativos" | "expira_breve" | "expirados";

const ITEMS_PER_PAGE = 15;

type Props = {
  user: User;
};

export default function Clientes({ user }: Props) {
  const navigate = useNavigate();
  const {
    clientes,
    loading,
    error,
    countAtivos,
    countExpiraBreve,
    countExpirados,
    refreshClientes,
    createCliente,
    updateCliente,
    getClientesByStatus,
  } = useClientes();

  // Estados locais
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    clienteId: string | null;
  }>({
    isOpen: false,
    mode: "create",
    clienteId: null,
  });

  /**
   * Redirecionar se não for admin
   */
  if (user.role !== "admin") {
    navigate("/demos");
    return null;
  }

  /**
   * Filtrar clientes por status
   */
  const clientesFiltrados = useMemo(() => {
    let filtered = clientes;

    // Filtro por status
    if (activeFilter !== "todos") {
      const statusMap = {
        ativos: "ativo",
        expira_breve: "expira_breve",
        expirados: "expirado",
      } as const;
      filtered = getClientesByStatus(statusMap[activeFilter]);
    }

    // Filtro de pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nome.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [clientes, activeFilter, searchQuery, getClientesByStatus]);

  /**
   * Paginação
   */
  const totalPages = Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex);

  /**
   * Mudar filtro (reset paginação)
   */
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  /**
   * Abrir modal de criação
   */
  const openCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: "create",
      clienteId: null,
    });
  };

  /**
   * Abrir modal de edição
   */
  const openEditModal = (clienteId: string) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      clienteId,
    });
  };

  /**
   * Fechar modal
   */
  const closeModal = () => {
    if (!modalLoading) {
      setModalState({
        isOpen: false,
        mode: "create",
        clienteId: null,
      });
    }
  };

  /**
   * Salvar cliente (criar ou editar)
   */
  const handleSaveCliente = async (
    data: ClienteCreate | ClienteUpdate
  ): Promise<void> => {
    setModalLoading(true);

    try {
      if (modalState.mode === "create") {
        await createCliente(data as ClienteCreate);
        alert("✅ Cliente criado com sucesso!");
      } else if (modalState.clienteId) {
        await updateCliente(modalState.clienteId, data as ClienteUpdate);
        alert("✅ Cliente atualizado com sucesso!");
      }

      closeModal();
    } catch (err: any) {
      throw err; // Deixar o modal lidar com o erro
    } finally {
      setModalLoading(false);
    }
  };

  /**
   * Ver detalhes do cliente
   */
  const handleViewDetails = (clienteId: string) => {
    navigate(`/clientes/${clienteId}`);
  };

  /**
   * Renderizar tabs de filtro
   */
  const renderTabs = () => {
    const tabs: { key: FilterType; label: string; count: number }[] = [
      { key: "todos", label: "Todos", count: clientes.length },
      { key: "ativos", label: "Ativos", count: countAtivos },
      { key: "expira_breve", label: "Expira Breve", count: countExpiraBreve },
      { key: "expirados", label: "Expirados", count: countExpirados },
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
            onClick={() => handleFilterChange(tab.key)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              background: "transparent",
              border: "none",
              borderBottom:
                activeFilter === tab.key
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
              color: activeFilter === tab.key ? "var(--primary)" : "var(--muted)",
              fontWeight: activeFilter === tab.key ? "700" : "600",
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
                    activeFilter === tab.key ? "var(--primary)" : "var(--stroke)",
                  color: activeFilter === tab.key ? "white" : "var(--text)",
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
   * Renderizar paginação
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
   * Loading skeleton
   */
  if (loading && clientes.length === 0) {
    return (
      <div className="page">
        <div className="page-max">
          <h1 className="page-title">Lista de Clientes</h1>
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
   * Error state
   */
  if (error) {
    return (
      <div className="page">
        <div className="page-max">
          <h1 className="page-title">Lista de Clientes</h1>
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
            <button onClick={refreshClientes} className="button">
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Obter cliente para edição
   */
  const clienteParaEditar =
    modalState.mode === "edit" && modalState.clienteId
      ? clientes.find((c) => c.id === modalState.clienteId)
      : undefined;

  return (
    <div className="page">
      <div className="page-max">
        {/* Header */}
        <div className="list-header">
          <h1 className="page-title">Lista de Clientes</h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={refreshClientes} disabled={loading} className="btn-ghost">
              {loading ? "A atualizar..." : "🔄 Atualizar"}
            </button>
            <button className="button" onClick={openCreateModal}>
              + Adicionar Cliente
            </button>
          </div>
        </div>

        {/* Tabs de Filtro */}
        {renderTabs()}

        {/* Barra de Pesquisa */}
        <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              className="input"
              placeholder="Procurar por nome ou email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset paginação ao pesquisar
              }}
              style={{
                paddingLeft: "40px",
                width: "100%",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                fontSize: "1.2rem",
              }}
            >
              🔍
            </span>
          </div>
        </div>

        {/* Lista de Clientes */}
        {clientesPaginados.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "64px 32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>
              {searchQuery ? "🔍" : "📭"}
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "8px",
                color: "var(--text)",
              }}
            >
              {searchQuery
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente nesta categoria"}
            </h3>
            <p style={{ color: "var(--muted)" }}>
              {searchQuery
                ? "Tente outro termo de pesquisa."
                : "Adicione um novo cliente para começar."}
            </p>
          </div>
        ) : (
          <>
            <ul className="list-reset">
              {clientesPaginados.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onEdit={openEditModal}
                  onViewDetails={handleViewDetails}
                />
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
              {Math.min(endIndex, clientesFiltrados.length)} de{" "}
              {clientesFiltrados.length} clientes
            </div>
          </>
        )}

        {/* Modal */}
        <ClienteModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          cliente={clienteParaEditar}
          onClose={closeModal}
          onSave={handleSaveCliente}
          loading={modalLoading}
          userId={user.id}
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
