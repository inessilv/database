/**
 * Log Types
 * 
 * Baseado no schema.sql e endpoints do Catalog Service
 * Logs de atividade e analytics
 */

/**
 * Tipo de evento de log
 */
export type LogTipo =
  | "login"
  | "logout"
  | "demo_aberta"
  | "demo_fechada"
  | "acesso_concedido"
  | "acesso_revogado"
  | "erro"
  | "aviso";

/**
 * Log (completo)
 */
export interface Log {
  id: string;
  cliente_id: string | null;  // Pode ser null para logs de admin
  demo_id: string | null;     // Pode ser null para eventos gerais
  tipo: LogTipo;
  mensagem: string | null;
  timestamp: string;          // ISO datetime
}

/**
 * Log Create (POST /api/logs/)
 */
export interface LogCreate {
  cliente_id?: string | null;
  demo_id?: string | null;
  tipo: LogTipo;
  mensagem?: string;
}

/**
 * Log Response (alias para Log)
 */
export type LogResponse = Log;

/**
 * Log Stats Summary (estatísticas globais)
 */
export interface LogStatsSummary {
  total_logs: number;
  total_logins: number;
  total_demos_abertas: number;
  total_demos_fechadas: number;
  total_erros: number;
  total_avisos: number;
  periodo_inicio: string;
  periodo_fim: string;
}

/**
 * Log Stats por Cliente
 */
export interface LogStatsCliente {
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string;
  total_eventos: number;
  total_logins: number;
  total_demos_abertas: number;
  demos_unicas: string[];     // Array de IDs de demos
  ultima_atividade: string | null;
}

/**
 * Log Stats por Demo
 */
export interface LogStatsDemo {
  demo_id: string;
  demo_nome: string;
  total_aberturas: number;
  total_fechamentos: number;
  clientes_unicos: number;
  tempo_medio_uso: number | null;  // Em minutos
  ultima_utilizacao: string | null;
}

/**
 * Timeline de atividade (para vista detalhada)
 */
export interface LogTimeline {
  timestamp: string;
  tipo: LogTipo;
  mensagem: string;
  cliente_nome?: string;
  demo_nome?: string;
}
