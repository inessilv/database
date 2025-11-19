/**
 * useClientes Hook
 * 
 * Hook custom para gestão de clientes
 * Segue o padrão do usePedidos.ts
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Cliente, ClienteCreate, ClienteUpdate, ClienteComStatus } from "../types/Cliente.ts";
import {clienteService} from "../services/clienteService.ts";

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar clientes do backend
   */
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (err: any) {
      console.error("❌ Erro ao carregar clientes:", err);
      setError(err.message || "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh manual
   */
  const refreshClientes = useCallback(() => {
    fetchClientes();
  }, [fetchClientes]);

  /**
   * Criar novo cliente
   */
  const createCliente = useCallback(
    async (data: ClienteCreate): Promise<Cliente> => {
      try {
        const novoCliente = await clienteService.create(data);
        setClientes((prev) => [...prev, novoCliente]);
        return novoCliente;
      } catch (err: any) {
        console.error("❌ Erro ao criar cliente:", err);
        throw new Error(err.message || "Erro ao criar cliente");
      }
    },
    []
  );

  /**
   * Atualizar cliente existente
   */
  const updateCliente = useCallback(
    async (id: string, data: ClienteUpdate): Promise<Cliente> => {
      try {
        const clienteAtualizado = await clienteService.update(id, data);
        setClientes((prev) =>
          prev.map((c) => (c.id === id ? clienteAtualizado : c))
        );
        return clienteAtualizado;
      } catch (err: any) {
        console.error("❌ Erro ao atualizar cliente:", err);
        throw new Error(err.message || "Erro ao atualizar cliente");
      }
    },
    []
  );

  /**
   * Adicionar status calculado a cada cliente
   */
  const clientesComStatus = useMemo((): ClienteComStatus[] => {
    return clientes.map((cliente) => clienteService.calcularStatus(cliente));
  }, [clientes]);

  /**
   * Contadores por estado
   */
  const countAtivos = useMemo(
    () => clientesComStatus.filter((c) => c.status === "ativo").length,
    [clientesComStatus]
  );

  const countExpiraBreve = useMemo(
    () => clientesComStatus.filter((c) => c.status === "expira_breve").length,
    [clientesComStatus]
  );

  const countExpirados = useMemo(
    () => clientesComStatus.filter((c) => c.status === "expirado").length,
    [clientesComStatus]
  );

  /**
   * Filtrar clientes por status
   */
  const getClientesByStatus = useCallback(
    (status: "ativo" | "expira_breve" | "expirado"): ClienteComStatus[] => {
      return clientesComStatus.filter((c) => c.status === status);
    },
    [clientesComStatus]
  );

  /**
   * Carregar na montagem
   */
  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    clientes: clientesComStatus,
    loading,
    error,
    countAtivos,
    countExpiraBreve,
    countExpirados,
    refreshClientes,
    createCliente,
    updateCliente,
    getClientesByStatus,
  };
}
