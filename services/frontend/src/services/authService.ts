/**
 * Auth Service
 * 
 * Serviço de autenticação
 * Endpoints: /api/auth/*
 */

import { api, TokenStorage } from "./api";
import type {
  User,
  LoginRequest,
  TokenResponse,
  TokenValidationResponse,
} from "../types/Auth.ts";

class AuthService {
  /**
   * Login
   * POST /api/auth/login
   */
  async login(email: string, password: string): Promise<TokenResponse> {
    const credentials: LoginRequest = { email, password };

    const response = await api.post<TokenResponse>("/api/auth/login", credentials);

    // Guardar token e user no localStorage
    TokenStorage.setToken(response.access_token);
    TokenStorage.setUser(response.user);

    return response;
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await api.post("/api/auth/logout", {});
    } catch (error) {
      console.error("Erro ao fazer logout no backend:", error);
    } finally {
      // Sempre limpar localStorage, mesmo se o backend falhar
      TokenStorage.clear();
    }
  }

  /**
   * Validar token
   * POST /api/auth/validate
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    return api.post<TokenValidationResponse>("/api/auth/validate", { token });
  }

  /**
   * Obter utilizador atual
   * Retorna o user do localStorage (não faz request)
   */
  getCurrentUser(): User | null {
    return TokenStorage.getUser();
  }

  /**
   * Verificar se está autenticado
   */
  isAuthenticated(): boolean {
    return TokenStorage.getToken() !== null;
  }

  /**
   * Verificar se é admin
   */
  isAdmin(): boolean {
    const user = TokenStorage.getUser();
    return user?.role === "admin";
  }

  /**
   * Verificar se é cliente
   */
  isClient(): boolean {
    const user = TokenStorage.getUser();
    return user?.role === "client";
  }

  /**
   * Obter token
   */
  getToken(): string | null {
    return TokenStorage.getToken();
  }

  /**
   * Verificar status do Authentication Service
   * GET /api/auth/status
   */
  async checkAuthStatus(): Promise<any> {
    return api.get("/api/auth/status");
  }
}

// Export singleton instance
export const authService = new AuthService();
