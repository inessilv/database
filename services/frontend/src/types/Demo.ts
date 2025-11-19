/**
 * Demo Types
 * 
 * Baseado no schema.sql atualizado
 */

/**
 * Demo (completo)
 */
export interface Demo {
  id: string;
  nome: string;
  descricao: string | null;
  url: string;
  estado: "ativa" | "inativa" | "manutenção";
  vertical: string | null;          // Ex: "Retail", "Manufacturing", "Finance"
  horizontal: string | null;        // Ex: "Supply Chain", "CRM", "Analytics"
  keywords: string | null;          // Comma-separated
  codigo_projeto: string | null;    // Ex: "LTP-001"          
  comercial_nome: string | null;
  comercial_contacto: string | null;
  comercial_foto_url: string | null;
  criado_por: string;               // ID do admin
  criado_em: string;                // ISO datetime
  atualizado_em: string;            // ISO datetime
}

/**
 * Demo Create (POST /api/demos/create)
 */
export interface DemoCreate {
  nome: string;
  descricao?: string;
  url?: string;
  estado: "ativa" | "inativa" | "manutenção";
  vertical?: string;
  horizontal?: string;
  keywords?: string;
  codigo_projeto?: string;
  comercial_nome?: string;
  comercial_contacto?: string;
  comercial_foto_url?: string;
  criado_por: string;  // ID do admin que está criando
}

/**
 * Demo Update (PUT /api/demos/{id}/update)
 * Todos os campos são opcionais (partial update)
 */
export interface DemoUpdate {
  nome?: string;
  descricao?: string;
  url?: string;
  estado?: "ativa" | "inativa" | "manutenção";
  vertical?: string;
  horizontal?: string;
  keywords?: string;
  codigo_projeto?: string;
  comercial_nome?: string;
  comercial_contacto?: string;
  comercial_foto_url?: string;
}

/**
 * Demo Response (alias para Demo)
 */
export type DemoResponse = Demo;