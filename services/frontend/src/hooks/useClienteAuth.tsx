/**
 * useClienteAuth Hook
 * 
 * Hook para gerir o estado de autenticação e expiração do cliente
 * Verifica dias restantes, status e pedidos pendentes
 * 
 * ✅ Alinhado com arquitetura: Frontend → Catalog Service → Database
 */

import { useState, useEffect, useCallback } from "react";
import { clienteService } from "../services/clienteService";
import { pedidoService } from "../services/pedidoService";
import { getAuthUser } from "../utils/cookies";
import type { Cliente } from "../types/Cliente";
import type { Pedido } from "../types/Pedido";

interface UseClienteAuthReturn {
  cliente: Cliente | null;
  loading: boolean;
  error: string | null;
  diasRestantes: number | null;
  status: "ativo" | "expira_breve" | "expirado" | "futuro";
  temPedidoPendente: boolean;
  temPedidoRejeitado: boolean;
  criarPedidoRenovacao: () => Promise<void>;
  refreshCliente: () => Promise<void>;
}

/**
 * Hook de autenticação do cliente
 * Calcula automaticamente status e dias restantes
 */
export function useClienteAuth(): UseClienteAuthReturn {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcular dias restantes até expiração
   */
  const calcularDiasRestantes = useCallback((dataExpiracao: string): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normalizar para meia-noite
    
    const expiracao = new Date(dataExpiracao);
    expiracao.setHours(0, 0, 0, 0); // Normalizar para meia-noite
    
    const diff = expiracao.getTime() - hoje.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return dias;
  }, []);

  /**
   * Calcular status do cliente
   */
  const calcularStatus = useCallback(
    (cli: Cliente): "ativo" | "expira_breve" | "expirado" | "futuro" => {
      const agora = new Date();
      agora.setHours(0, 0, 0, 0);
      
      const dataExpiracao = new Date(cli.data_expiracao);
      dataExpiracao.setHours(0, 0, 0, 0);
      
      const dataRegisto = new Date(cli.data_registo);
      dataRegisto.setHours(0, 0, 0, 0);

      // Cliente ainda não começou (data de registo no futuro)
      if (dataRegisto > agora) {
        return "futuro";
      }

      const dias = calcularDiasRestantes(cli.data_expiracao);

      // Expirado (dias <= 0 significa hoje ou já passou)
      if (dias <= 0) {
        return "expirado";
      }

      // Expira em breve (≤7 dias)
      if (dias <= 7) {
        return "expira_breve";
      }

      // Ativo (>7 dias)
      return "ativo";
    },
    [calcularDiasRestantes]
  );

  /**
   * Carregar dados do cliente e verificar pedidos pendentes
   * ✅ SEMPRE verifica no backend se tem pedido pendente
   */
  const loadClienteData = useCallback(async () => {
    const user = getAuthUser();

    // Só carregar se for viewer (cliente)
    if (!user || user.role !== "viewer") {
      setCliente(null);
      setPedidos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Buscar dados do cliente via Catalog Service
      const clienteData = await clienteService.getById(user.id);
      setCliente(clienteData);

      // ✅ CRÍTICO: Buscar TODOS os pedidos pendentes do sistema
      const pedidosPendentes = await pedidoService.getPending();
      
      // ✅ Filtrar apenas os pedidos deste cliente
      const pedidosDoCliente = pedidosPendentes.filter(
        (p) => p.cliente_id === user.id
      );
      
      setPedidos(pedidosDoCliente);
    } catch (err: any) {
      console.error("Erro ao carregar dados do cliente:", err);
      setError(err.message || "Erro ao carregar dados");
      
      // Se erro 404, cliente não existe (caso raro mas possível)
      if (err.message?.includes("404") || err.message?.includes("não encontrado")) {
        setCliente(null);
        setPedidos([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Criar pedido de renovação
   * ✅ Após criar, recarrega dados do backend (sem estado local)
   */
  const criarPedidoRenovacao = useCallback(async () => {
    if (!cliente) {
      throw new Error("Cliente não autenticado");
    }

    // Verificar se já tem pedido pendente ANTES de criar
    const pedidoPendente = pedidos.find((p) => p.estado === "pendente");
    if (pedidoPendente) {
      throw new Error("Já existe um pedido de renovação pendente");
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Criar pedido via Catalog Service
      await pedidoService.create({
        cliente_id: cliente.id,
        tipo_pedido: "renovação",
      });

      // ✅ Recarregar dados do backend (vai buscar pedidos pendentes de novo)
      await loadClienteData();
    } catch (err: any) {
      console.error("Erro ao criar pedido:", err);
      setError(err.message || "Erro ao criar pedido");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cliente, pedidos, loadClienteData]);

  /**
   * Refresh manual dos dados
   */
  const refreshCliente = useCallback(async () => {
    await loadClienteData();
  }, [loadClienteData]);

  /**
   * Carregar dados ao montar componente
   */
  useEffect(() => {
    loadClienteData();
  }, [loadClienteData]);

  /**
   * Calcular valores derivados
   */
  const diasRestantes = cliente
    ? calcularDiasRestantes(cliente.data_expiracao)
    : null;

  const status = cliente ? calcularStatus(cliente) : "ativo";

  const temPedidoPendente = pedidos.some((p) => p.estado === "pendente");

  return {
    cliente,
    loading,
    error,
    diasRestantes,
    status,
    temPedidoPendente,
    criarPedidoRenovacao,
    refreshCliente,
  };
}