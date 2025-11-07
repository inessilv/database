/**
 * Cliente Types
 * 
 * Baseado no schema.sql e endpoints do Catalog Service
 */

/**
 * Cliente (completo)
 */
export interface Cliente {
  id: string;
  nome: string;
  email: string;
  data_registo: string;     // ISO datetime
  data_expiracao: string;   // ISO datetime
  criado_por: string;       // ID do admin
  criado_em: string;        // ISO datetime
  atualizado_em: string;    // ISO datetime
}

/**
 * Cliente Create (POST /api/clientes/)
 */
export interface ClienteCreate {
  nome: string;
  email: string;
  password: string;         // Será hashado no backend
  data_registo: string;     // ISO datetime
  data_expiracao: string;   // ISO datetime
  criado_por: string;       // ID do admin que está criando
}

/**
 * Cliente Update (PUT /api/clientes/{id})
 * Todos os campos são opcionais (partial update)
 */
export interface ClienteUpdate {
  nome?: string;
  email?: string;
  password?: string;
  data_registo?: string;
  data_expiracao?: string;
}

/**
 * Cliente Response (alias para Cliente)
 */
export type ClienteResponse = Cliente;

/**
 * Cliente com status calculado (para frontend)
 */
export interface ClienteComStatus extends Cliente {
  status: "ativo" | "expira_breve" | "expirado" | "futuro";
  dias_restantes?: number;
}

/**
 * Cliente Stats (para analytics)
 */
export interface ClienteStats {
  cliente_id: string;
  nome: string;
  email: string;
  total_logins: number;
  total_demos_abertas: number;
  demos_unicas: number;
  ultima_atividade: string | null;
}
