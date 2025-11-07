/**
 * Authentication Types
 * 
 * Baseado no Authentication Service e Catalog Service
 */

/**
 * User (Utilizador autenticado)
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "client";
}

export type Role = "admin" | "client";
/**
 * Login Request (POST /api/auth/login)
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Token Response (resposta do login)
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;      // "bearer"
  expires_in: number;      // segundos (18000 = 5 horas)
  user: User;
}

/**
 * Token Validation Request
 */
export interface TokenValidationRequest {
  token: string;
}

/**
 * Token Validation Response
 */
export interface TokenValidationResponse {
  valid: boolean;
  user_id?: number;
  email?: string;
  role?: string;
}
