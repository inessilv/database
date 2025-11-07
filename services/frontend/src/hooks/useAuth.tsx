/**
 * useAuth Hook
 * 
 * Custom hook para gestão de autenticação
 * Fornece: user, login, logout, isAuthenticated, isAdmin, isClient
 */

import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService.ts";
import type { User, TokenResponse } from "../types/Auth.ts";

/**
 * Auth Context Type
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

/**
 * Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * 
 * Envolve a aplicação para fornecer contexto de autenticação
 * 
 * Uso:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização: verificar se já está autenticado
  useEffect(() => {
    const initAuth = () => {
      const storedUser = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();

      if (isAuth && storedUser) {
        setUser(storedUser);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login
   */
  const login = async (email: string, password: string): Promise<TokenResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user (útil após updates de perfil)
   */
  const refreshUser = () => {
    const storedUser = authService.getCurrentUser();
    setUser(storedUser);
  };

  // Computed values
  const isAuthenticated = user !== null;
  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "client";

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    isClient,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * 
 * Hook para aceder ao contexto de autenticação
 * 
 * Uso:
 * const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

/**
 * ProtectedRoute Component
 * 
 * Componente para proteger rotas que requerem autenticação
 * 
 * Uso:
 * <ProtectedRoute adminOnly>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Acesso Negado!</h4>
          <p>Apenas administradores podem aceder a esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
