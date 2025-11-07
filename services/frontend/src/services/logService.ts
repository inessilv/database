/**
 * Log Service
 * 
 * Serviço de logs e analytics
 * Endpoints: /api/logs/*
 */

import { api } from "./api";
import type {
  Log,
  LogCreate,
  LogStatsSummary,
  LogStatsCliente,
  LogStatsDemo,
  LogTimeline,
} from "../types/Log.ts";

class LogService {
  /**
   * Listar todos os logs (limitado)
   * GET /api/logs/all?limit=100
   */
  async getAll(limit: number = 100): Promise<Log[]> {
    return api.get<Log[]>(`/api/logs/all?limit=${limit}`);
  }

  /**
   * Obter logs por cliente
   * GET /api/logs/by-cliente/{id}?limit=50
   */
  async getByCliente(clienteId: string, limit: number = 50): Promise<Log[]> {
    return api.get<Log[]>(`/api/logs/by-cliente/${clienteId}?limit=${limit}`);
  }

  /**
   * Obter logs por demo
   * GET /api/logs/by-demo/{id}?limit=50
   */
  async getByDemo(demoId: string, limit: number = 50): Promise<Log[]> {
    return api.get<Log[]>(`/api/logs/by-demo/${demoId}?limit=${limit}`);
  }

  /**
   * Criar novo log
   * POST /api/logs/
   */
  async create(log: LogCreate): Promise<Log> {
    return api.post<Log>("/api/logs/", log);
  }

  /**
   * Obter estatísticas globais
   * GET /api/logs/stats/summary
   */
  async getStatsSummary(): Promise<LogStatsSummary> {
    return api.get<LogStatsSummary>("/api/logs/stats/summary");
  }

  /**
   * Obter estatísticas por cliente
   * GET /api/logs/stats/by-cliente
   */
  async getStatsByCliente(): Promise<LogStatsCliente[]> {
    return api.get<LogStatsCliente[]>("/api/logs/stats/by-cliente");
  }

  /**
   * Obter estatísticas por demo
   * GET /api/logs/stats/by-demo
   */
  async getStatsByDemo(): Promise<LogStatsDemo[]> {
    return api.get<LogStatsDemo[]>("/api/logs/stats/by-demo");
  }

  /**
   * Obter estatísticas de um cliente específico
   */
  async getClienteStats(clienteId: string): Promise<{
    total_eventos: number;
    total_logins: number;
    total_demos_abertas: number;
    demos_mais_usadas: Array<{ demo_id: string; count: number }>;
    ultima_atividade: string | null;
    timeline: LogTimeline[];
  }> {
    const logs = await this.getByCliente(clienteId, 100);

    // Contar eventos
    const total_eventos = logs.length;
    const total_logins = logs.filter((l) => l.tipo === "login").length;
    const total_demos_abertas = logs.filter((l) => l.tipo === "demo_aberta").length;

    // Demos mais usadas
    const demoCounts = new Map<string, number>();
    logs
      .filter((l) => l.tipo === "demo_aberta" && l.demo_id)
      .forEach((l) => {
        const count = demoCounts.get(l.demo_id!) || 0;
        demoCounts.set(l.demo_id!, count + 1);
      });

    const demos_mais_usadas = Array.from(demoCounts.entries())
      .map(([demo_id, count]) => ({ demo_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Última atividade
    const ultima_atividade = logs.length > 0 ? logs[0].timestamp : null;

    // Timeline (últimos 10 eventos)
    const timeline: LogTimeline[] = logs.slice(0, 10).map((log) => ({
      timestamp: log.timestamp,
      tipo: log.tipo,
      mensagem: log.mensagem || "",
    }));

    return {
      total_eventos,
      total_logins,
      total_demos_abertas,
      demos_mais_usadas,
      ultima_atividade,
      timeline,
    };
  }

  /**
   * Registrar abertura de demo (helper)
   */
  async logDemoOpened(clienteId: string, demoId: string): Promise<void> {
    await this.create({
      cliente_id: clienteId,
      demo_id: demoId,
      tipo: "demo_aberta",
      mensagem: `Demo aberta`,
    });
  }

  /**
   * Registrar fechamento de demo (helper)
   */
  async logDemoClosed(clienteId: string, demoId: string): Promise<void> {
    await this.create({
      cliente_id: clienteId,
      demo_id: demoId,
      tipo: "demo_fechada",
      mensagem: `Demo fechada`,
    });
  }

  /**
   * Registrar login (helper)
   */
  async logLogin(clienteId: string): Promise<void> {
    await this.create({
      cliente_id: clienteId,
      tipo: "login",
      mensagem: `Login bem-sucedido`,
    });
  }

  /**
   * Registrar logout (helper)
   */
  async logLogout(clienteId: string): Promise<void> {
    await this.create({
      cliente_id: clienteId,
      tipo: "logout",
      mensagem: `Logout`,
    });
  }
}

// Export singleton instance
export const logService = new LogService();
