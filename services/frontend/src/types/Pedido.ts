/**
 * Pedido Types
 * 
 * Baseado no schema.sql e endpoints do Catalog Service
 * Pedidos de renovação ou revogação de acesso
 */

/**
 * Pedido (completo)
 */
export interface Pedido {
  id: string;
  cliente_id: string;
  estado: "pendente" | "aprovado" | "rejeitado";
  tipo_pedido: "renovação" | "revogação";
  criado_em: string;        // ISO datetime
  gerido_por: string | null; // ID do admin que aprovou/rejeitou
}

/**
 * Pedido Create (POST /api/pedidos/)
 */
export interface PedidoCreate {
  cliente_id: string;
  tipo_pedido: "renovação" | "revogação";
}

/**
 * Pedido Response (alias para Pedido)
 */
export type PedidoResponse = Pedido;

/**
 * Pedido com informações do cliente (para listagem)
 */
export interface PedidoComCliente extends Pedido {
  cliente_nome: string;
  cliente_email: string;
  data_expiracao_atual: string;
}

/**
 * Request para aprovar pedido
 */
export interface ApprovalRequest {
  admin_id: string;
  nova_data_expiracao?: string;  // Opcional, usado em renovações
}

/**
 * Request para rejeitar pedido
 */
export interface RejectionRequest {
  admin_id: string;
}
