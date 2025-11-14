/**
 * usePedidos Hook (Adaptado)
 * 
 * Custom hook para gestão de pedidos (renovação/revogação)
 * Versão adaptada para funcionar sem useAuth hook
 */

import { useState, useEffect, useCallback } from "react";
import { pedidoService } from "../services/pedidoService";
import type {PedidoComCliente } from "../types/Pedido";

// Adaptar para o User type atual do App.tsx

type User = { id: string, name: string; role: "admin" | "viewer" };

interface UsePedidosReturn {
  // Estado
  pedidos: PedidoComCliente[];
  loading: boolean;
  error: string | null;
  
  // Contadores
  countPendentes: number;
  countAprovados: number;
  countRejeitados: number;
  
  // Métodos
  refreshPedidos: () => Promise<void>;
  aprovarPedido: (id: string) => Promise<void>;
  rejeitarPedido: (id: string) => Promise<void>;
  getPedidosPorEstado: (estado: "pendente" | "aprovado" | "rejeitado") => PedidoComCliente[];
}

/**
 * Hook de gestão de pedidos
 * Lê user de localStorage
 */
export function usePedidos(): UsePedidosReturn {
  // Obter user de localStorage
  const getUser = (): User | null => {
    const raw = localStorage.getItem("app_user");
    return raw ? (JSON.parse(raw) as User) : null;
  };

  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar todos os pedidos
   */
  const loadPedidos = useCallback(async () => {
    const user = getUser();
    
    if (!user || user.role !== "admin") {
      return; // Apenas admins podem ver pedidos
    }

    setLoading(true);
    setError(null);

    try {
      const data = await pedidoService.getAll();
      setPedidos(data);
    } catch (err: any) {
      console.error("Erro ao carregar pedidos:", err);
      setError(err.message || "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh manual dos pedidos
   */
  const refreshPedidos = useCallback(async () => {
    await loadPedidos();
  }, [loadPedidos]);

  /**
   * Aprovar pedido de renovação
   * Default: adiciona 30 dias à data de expiração atual
   */
const aprovarPedido = useCallback(
  async (id: string) => {
    const user = getUser();
    if (!user) {
      throw new Error("Utilizador não autenticado");
    }

    setLoading(true);
    setError(null);

    try {
      const adminId = user.id;
      await pedidoService.approve(id, adminId);

      // Atualizar localmente
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, estado: "aprovado" as const, gerido_por: adminId }
            : p
        )
      );

        await refreshPedidos();
      } catch (err: any) {
        console.error("Erro ao aprovar pedido:", err);
        setError(err.message || "Erro ao aprovar pedido");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pedidos, refreshPedidos]
  );

  /**
   * Rejeitar pedido
   */
  const rejeitarPedido = useCallback(
    async (id: string) => {
      const user = getUser();
      
      if (!user) {
        throw new Error("Utilizador não autenticado");
      }

      setLoading(true);
      setError(null);

      try {
        const adminId = user.id;
        await pedidoService.reject(id, adminId);

        setPedidos((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, estado: "rejeitado" as const, gerido_por: adminId }
              : p
          )
        );

        await refreshPedidos();
      } catch (err: any) {
        console.error("Erro ao rejeitar pedido:", err);
        setError(err.message || "Erro ao rejeitar pedido");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshPedidos]
  );

  /**
   * Filtrar pedidos por estado
   */
  const getPedidosPorEstado = useCallback(
    (estado: "pendente" | "aprovado" | "rejeitado"): PedidoComCliente[] => {
      return pedidos.filter((p) => p.estado === estado);
    },
    [pedidos]
  );

  /**
   * Contadores
   */
  const countPendentes = pedidos.filter((p) => p.estado === "pendente").length;
  const countAprovados = pedidos.filter((p) => p.estado === "aprovado").length;
  const countRejeitados = pedidos.filter((p) => p.estado === "rejeitado").length;

  /**
   * Carregar pedidos ao montar
   */
  useEffect(() => {
    const user = getUser();
    if (user && user.role === "admin") {
      loadPedidos();
    }
  }, [loadPedidos]);

  return {
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
  };
}
