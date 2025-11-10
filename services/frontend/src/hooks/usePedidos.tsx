/**
 * usePedidos Hook
 * 
 * Custom hook para gestão de pedidos (renovação/revogação)
 * Fornece estado, loading, erros e métodos para interagir com pedidos
 */

import { useState, useEffect, useCallback } from "react";
import { pedidoService } from "../services/pedidoService";
import type { Pedido, PedidoComCliente } from "../types/Pedido";
import { useAuth } from "./useAuth";

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
  aprovarPedido: (id: string, novaDataExpiracao?: string) => Promise<void>;
  rejeitarPedido: (id: string) => Promise<void>;
  getPedidosPorEstado: (estado: "pendente" | "aprovado" | "rejeitado") => PedidoComCliente[];
}

export function usePedidos(): UsePedidosReturn {
  const { user } = useAuth();
  
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar todos os pedidos
   */
  const loadPedidos = useCallback(async () => {
    if (!user || user.role !== "admin") {
      return; // Apenas admins podem ver pedidos
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar apenas pedidos pendentes inicialmente
      const data = await pedidoService.getPending();
      setPedidos(data);
    } catch (err: any) {
      console.error("Erro ao carregar pedidos:", err);
      setError(err.message || "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Carregar todos os pedidos (incluindo histórico)
   */
  const loadAllPedidos = useCallback(async () => {
    if (!user || user.role !== "admin") {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const all = await pedidoService.getAll();
      
      // Como getAll retorna Pedido[], precisamos fazer cast
      // ou buscar informações do cliente separadamente
      // Por simplicidade, vamos usar apenas getPending que já retorna PedidoComCliente
      // e depois filtrar localmente para outros estados
      
      // Alternativa: buscar cada pedido individualmente (não ideal)
      // Por agora, vamos carregar pending e manter histórico local
      setPedidos(all as any); // Temporary cast
    } catch (err: any) {
      console.error("Erro ao carregar pedidos:", err);
      setError(err.message || "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    async (id: string, novaDataExpiracao?: string) => {
      if (!user) {
        throw new Error("Utilizador não autenticado");
      }

      setLoading(true);
      setError(null);

      try {
        // Se não foi fornecida data, calcular +30 dias
        let dataExpiracao = novaDataExpiracao;
        
        if (!dataExpiracao) {
          // Buscar pedido para obter data atual
          const pedido = pedidos.find((p) => p.id === id);
          
          if (pedido) {
            const dataAtual = new Date(pedido.data_expiracao_atual);
            const nova = new Date(dataAtual);
            nova.setDate(nova.getDate() + 30); // +30 dias
            dataExpiracao = nova.toISOString().split("T")[0]; // YYYY-MM-DD
          } else {
            // Fallback: +30 dias a partir de hoje
            const hoje = new Date();
            hoje.setDate(hoje.getDate() + 30);
            dataExpiracao = hoje.toISOString().split("T")[0];
          }
        }

        // Aprovar pedido
        await pedidoService.approve(id, user.id.toString(), dataExpiracao);

        // Atualizar lista local
        setPedidos((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, estado: "aprovado" as const, gerido_por: user.id.toString() }
              : p
          )
        );

        // Refresh completo para garantir sincronização
        await refreshPedidos();
      } catch (err: any) {
        console.error("Erro ao aprovar pedido:", err);
        setError(err.message || "Erro ao aprovar pedido");
        throw err; // Re-throw para componente tratar
      } finally {
        setLoading(false);
      }
    },
    [user, pedidos, refreshPedidos]
  );

  /**
   * Rejeitar pedido
   */
  const rejeitarPedido = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error("Utilizador não autenticado");
      }

      setLoading(true);
      setError(null);

      try {
        await pedidoService.reject(id, user.id.toString());

        // Atualizar lista local
        setPedidos((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, estado: "rejeitado" as const, gerido_por: user.id.toString() }
              : p
          )
        );

        // Refresh
        await refreshPedidos();
      } catch (err: any) {
        console.error("Erro ao rejeitar pedido:", err);
        setError(err.message || "Erro ao rejeitar pedido");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, refreshPedidos]
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
    if (user && user.role === "admin") {
      loadPedidos();
    }
  }, [user, loadPedidos]);

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
