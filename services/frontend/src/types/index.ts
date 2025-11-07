/**
 * Types Index
 * 
 * Exporta todos os types da aplicação
 * Uso: import { User, Demo, Cliente } from '@/types'
 */

// Auth
 export type {
  User,
  LoginRequest,
  TokenResponse,
  TokenValidationRequest,
  TokenValidationResponse,
} from "./Auth";

// Demo
export type{
  Demo,
  DemoCreate,
  DemoUpdate,
  DemoResponse,
} from "./Demo";

// Cliente
export type {
  Cliente,
  ClienteCreate,
  ClienteUpdate,
  ClienteResponse,
  ClienteComStatus,
  ClienteStats,
} from "./Cliente";

// Pedido
export type {
  Pedido,
  PedidoCreate,
  PedidoResponse,
  PedidoComCliente,
  ApprovalRequest,
  RejectionRequest,
} from "./Pedido";

// Log
export type{
  Log,
  LogCreate,
  LogResponse,
  LogTipo,
  LogStatsSummary,
  LogStatsCliente,
  LogStatsDemo,
  LogTimeline,
} from "./Log";
