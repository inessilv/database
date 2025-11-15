/**
 * Cliente Service
 * 
 * Serviço de gestão de clientes
 * Endpoints: /api/clientes/*
 */

import { api } from "./api";
import type { Cliente, ClienteCreate, ClienteUpdate, ClienteComStatus } from "../types/Cliente.ts";

class ClienteService {
  /**
   * Listar todos os clientes
   * GET /api/clientes/all
   */
  async getAll(): Promise<Cliente[]> {
    return api.get<Cliente[]>("/api/clientes/all");
  }

  /**
   * Listar apenas clientes ativos
   * GET /api/clientes/active
   */
  async getActive(): Promise<Cliente[]> {
    return api.get<Cliente[]>("/api/clientes/active");
  }

  /**
   * Obter cliente por ID
   * GET /api/clientes/{id}
   */
  async getById(id: string): Promise<Cliente> {
    return api.get<Cliente>(`/api/clientes/${id}`);
  }

  /**
   * Criar novo cliente
   * POST /api/clientes/
   */
  async create(cliente: ClienteCreate): Promise<Cliente> {
    return api.post<Cliente>("/api/clientes/", cliente);
  }

  /**
   * Atualizar cliente
   * PUT /api/clientes/{id}
   */
  async update(id: string, cliente: ClienteUpdate): Promise<Cliente> {
    return api.put<Cliente>(`/api/clientes/${id}`, cliente);
  }


  /**
   * Revogar acesso do cliente (apagar)
   * DELETE /api/clientes/{id}
   */
  async revokeAccess(id: string): Promise<void> {
    return api.delete<void>(`/api/clientes/${id}`);
  }

  /**
   * Calcular status do cliente (helper local)
   */
  calcularStatus(cliente: Cliente): ClienteComStatus {
    const agora = new Date();
    const dataExpiracao = new Date(cliente.data_expiracao);
    const dataRegisto = new Date(cliente.data_registo);

    const diasRestantes = Math.ceil(
      (dataExpiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    );

    let status: "ativo" | "expira_breve" | "expirado" | "futuro";

    if (dataRegisto > agora) {
      status = "futuro";
    } else if (dataExpiracao < agora) {
      status = "expirado";
    } else if (diasRestantes <= 7) {
      status = "expira_breve";
    } else {
      status = "ativo";
    }

    return {
      ...cliente,
      status,
      dias_restantes: diasRestantes > 0 ? diasRestantes : undefined,
    };
  }

  /**
   * Obter todos os clientes com status calculado
   */
  async getAllComStatus(): Promise<ClienteComStatus[]> {
    const clientes = await this.getAll();
    return clientes.map((c) => this.calcularStatus(c));
  }

  /**
   * Pesquisar clientes por nome ou email
   */
  async search(query: string): Promise<Cliente[]> {
    const clientes = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return clientes.filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(lowerQuery) ||
        cliente.email.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Obter clientes que expiram nos próximos N dias
   */
  async getExpiringIn(days: number): Promise<ClienteComStatus[]> {
    const clientes = await this.getAllComStatus();
    return clientes.filter(
      (c) =>
        c.status === "expira_breve" &&
        c.dias_restantes !== undefined &&
        c.dias_restantes <= days
    );
  }

  /**
   * Obter clientes expirados
   */
  async getExpired(): Promise<ClienteComStatus[]> {
    const clientes = await this.getAllComStatus();
    return clientes.filter((c) => c.status === "expirado");
  }
}

// Export singleton instance
export const clienteService = new ClienteService();
