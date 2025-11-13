/**
 * Pedido Service
 * 
 * Serviço de gestão de pedidos (renovação/revogação)
 * Endpoints: /api/pedidos/*
 */

import { api } from "./api";
import type {
  Pedido,
  PedidoCreate,
  PedidoComCliente,
  ApprovalRequest,
  RejectionRequest,
} from "../types/Pedido.ts";

class PedidoService {
  /**
   * Listar todos os pedidos
   * GET /api/pedidos/all
   */
  async getAll(): Promise<Pedido[]> {
    return api.get<Pedido[]>("/api/pedidos/all");
  }

  /**
   * Listar apenas pedidos pendentes
   * GET /api/pedidos/pending
   */
  async getPending(): Promise<PedidoComCliente[]> {
    return api.get<PedidoComCliente[]>("/api/pedidos/pending");
  }



  /**
   * Obter pedido por ID
   * GET /api/pedidos/{id}
   */
  async getById(id: string): Promise<Pedido> {
    return api.get<Pedido>(`/api/pedidos/${id}`);
  }

  /**
   * Criar novo pedido
   * POST /api/pedidos/
   */
  async create(pedido: PedidoCreate): Promise<Pedido> {
    return api.post<Pedido>("/api/pedidos/create", pedido);
  }

  /**
   * Aprovar pedido
   * PUT /api/pedidos/{id}/approve
   * 
   * TRANSACTION: Atualiza estado do pedido E data_expiracao do cliente
   */
  async approve(
    id: string,
    adminId: string,
    novaDataExpiracao?: string
  ): Promise<Pedido> {
    const request: ApprovalRequest = {
      admin_id: adminId,
      nova_data_expiracao: novaDataExpiracao,
    };

    return api.post<Pedido>(`/api/pedidos/${id}/approve`, request);
  }

  /**
   * Rejeitar pedido
   * PUT /api/pedidos/{id}/reject
   */
  async reject(id: string, adminId: string): Promise<Pedido> {
    const request: RejectionRequest = {
      admin_id: adminId,
    };

    return api.post<Pedido>(`/api/pedidos/${id}/reject`, request);
  }

  /**
   * Apagar pedido
   * DELETE /api/pedidos/{id}
   */
  async delete(id: string): Promise<void> {
    return api.delete<void>(`/api/pedidos/${id}`);
  }

  /**
   * Obter pedidos por cliente
   */
  async getByClienteId(clienteId: string): Promise<Pedido[]> {
    const pedidos = await this.getAll();
    return pedidos.filter((p) => p.cliente_id === clienteId);
  }

  /**
   * Obter pedidos aprovados
   */
  async getApproved(): Promise<Pedido[]> {
    const pedidos = await this.getAll();
    return pedidos.filter((p) => p.estado === "aprovado");
  }

  /**
   * Obter pedidos rejeitados
   */
  async getRejected(): Promise<Pedido[]> {
    const pedidos = await this.getAll();
    return pedidos.filter((p) => p.estado === "rejeitado");
  }

  /**
   * Obter estatísticas de pedidos
   */
  async getStats(): Promise<{
    total: number;
    pendentes: number;
    aprovados: number;
    rejeitados: number;
  }> {
    const pedidos = await this.getAll();

    return {
      total: pedidos.length,
      pendentes: pedidos.filter((p) => p.estado === "pendente").length,
      aprovados: pedidos.filter((p) => p.estado === "aprovado").length,
      rejeitados: pedidos.filter((p) => p.estado === "rejeitado").length,
    };
  }
}

// Export singleton instance
export const pedidoService = new PedidoService();
