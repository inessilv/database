import { useState, useEffect, useCallback } from "react";
import { demoService } from "../services/demoService";
import type { Demo, DemoCreate, DemoUpdate } from "../types/Demo";

type User = { id: string; name: string; role: "admin" | "viewer" };

interface UseDemosReturn {
  // Estado
  demos: Demo[];
  loading: boolean;
  error: string | null;

  // Contadores
  countTotal: number;
  countAtivas: number;
  countInativas: number;
  countManutencao: number;

  // Listas de filtros
  verticais: string[];
  horizontais: string[];

  // Métodos
  refreshDemos: () => Promise<void>;
  createDemo: (demo: Omit<DemoCreate, "criado_por">) => Promise<Demo>;
  updateDemo: (id: string, demo: DemoUpdate) => Promise<Demo>;
  deleteDemo: (id: string) => Promise<void>;
  getDemosByEstado: (estado: "ativa" | "inativa" | "manutenção") => Demo[];
  getDemosByVertical: (vertical: string) => Demo[];
  getDemosByHorizontal: (horizontal: string) => Demo[];
}

/**
 * Hook de gestão de demos
 * Lê user de localStorage
 */
export function useDemos(): UseDemosReturn {
  // Obter user de localStorage
  const getUser = (): User | null => {
    const raw = localStorage.getItem("app_user");
    return raw ? (JSON.parse(raw) as User) : null;
  };

  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar todas as demos
   */
  const loadDemos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await demoService.getAll();
      setDemos(data);
    } catch (err: any) {
      console.error("Erro ao carregar demos:", err);
      setError(err.message || "Erro ao carregar demos");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh manual das demos
   */
  const refreshDemos = useCallback(async () => {
    await loadDemos();
  }, [loadDemos]);

  /**
   * Criar nova demo
   */
  const createDemo = useCallback(
    async (demo: Omit<DemoCreate, "criado_por">): Promise<Demo> => {
      const user = getUser();
      if (!user) {
        throw new Error("Utilizador não autenticado");
      }

      setLoading(true);
      setError(null);

      try {
        const demoData: DemoCreate = {
          ...demo,
          criado_por: user.id,
        };

        const created = await demoService.create(demoData);

        // Atualizar localmente
        setDemos((prev) => [created, ...prev]);

        return created;
      } catch (err: any) {
        console.error("Erro ao criar demo:", err);
        setError(err.message || "Erro ao criar demo");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Atualizar demo
   */
  const updateDemo = useCallback(
    async (id: string, demo: DemoUpdate): Promise<Demo> => {
      const user = getUser();
      if (!user) {
        throw new Error("Utilizador não autenticado");
      }

      setLoading(true);
      setError(null);

      try {
        const updated = await demoService.update(id, demo);

        // Atualizar localmente
        setDemos((prev) => prev.map((d) => (d.id === id ? updated : d)));

        return updated;
      } catch (err: any) {
        console.error("Erro ao atualizar demo:", err);
        setError(err.message || "Erro ao atualizar demo");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Apagar demo
   */
  const deleteDemo = useCallback(async (id: string): Promise<void> => {
    const user = getUser();
    if (!user || user.role !== "admin") {
      throw new Error("Sem permissões para apagar demos");
    }

    setLoading(true);
    setError(null);

    try {
      await demoService.delete(id);

      // Remover localmente
      setDemos((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      console.error("Erro ao apagar demo:", err);
      setError(err.message || "Erro ao apagar demo");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filtrar demos por estado
   */
  const getDemosByEstado = useCallback(
    (estado: "ativa" | "inativa" | "manutenção"): Demo[] => {
      return demos.filter((d) => d.estado === estado);
    },
    [demos]
  );

  /**
   * Filtrar demos por vertical
   */
  const getDemosByVertical = useCallback(
    (vertical: string): Demo[] => {
      return demos.filter((d) => d.vertical === vertical);
    },
    [demos]
  );

  /**
   * Filtrar demos por horizontal
   */
  const getDemosByHorizontal = useCallback(
    (horizontal: string): Demo[] => {
      return demos.filter((d) => d.horizontal === horizontal);
    },
    [demos]
  );

  /**
   * Obter lista de verticais únicas
   */
  const verticais = useCallback((): string[] => {
    const uniqueVerticais = demos
      .map((d) => d.vertical)
      .filter((v): v is string => v !== null && v !== undefined && v.trim() !== "");
    return [...new Set(uniqueVerticais)].sort();
  }, [demos])();

  /**
   * Obter lista de horizontais únicas
   */
  const horizontais = useCallback((): string[] => {
    const uniqueHorizontais = demos
      .map((d) => d.horizontal)
      .filter((h): h is string => h !== null && h !== undefined && h.trim() !== "");
    return [...new Set(uniqueHorizontais)].sort();
  }, [demos])();

  /**
   * Contadores
   */
  const countTotal = demos.length;
  const countAtivas = demos.filter((d) => d.estado === "ativa").length;
  const countInativas = demos.filter((d) => d.estado === "inativa").length;
  const countManutencao = demos.filter((d) => d.estado === "manutenção").length;

  /**
   * Carregar demos ao montar componente
   */
  useEffect(() => {
    loadDemos();
  }, [loadDemos]);

  return {
    demos,
    loading,
    error,
    countTotal,
    countAtivas,
    countInativas,
    countManutencao,
    verticais,
    horizontais,
    refreshDemos,
    createDemo,
    updateDemo,
    deleteDemo,
    getDemosByEstado,
    getDemosByVertical,
    getDemosByHorizontal,
  };
}