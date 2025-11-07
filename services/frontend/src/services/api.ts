/**
 * API Client
 * 
 * Cliente HTTP para comunicação com Catalog Service
 * Funcionalidades:
 * - JWT token automático
 * - Error handling com Bootstrap alerts
 * - Retry logic
 * - Timeout handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Token storage
 */
class TokenStorage {
  private static readonly TOKEN_KEY = "ecatalog_token";
  private static readonly USER_KEY = "ecatalog_user";

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getUser(): any | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static clear(): void {
    this.removeToken();
    this.removeUser();
  }
}

/**
 * Error Display usando Bootstrap Alerts
 */
class ErrorDisplay {
  private static containerId = "api-error-container";

  static showError(message: string, duration: number = 5000): void {
    // Criar container se não existir
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      container.style.position = "fixed";
      container.style.top = "20px";
      container.style.right = "20px";
      container.style.zIndex = "9999";
      container.style.maxWidth = "400px";
      document.body.appendChild(container);
    }

    // Criar alert
    const alert = document.createElement("div");
    alert.className = "alert alert-danger alert-dismissible fade show";
    alert.role = "alert";
    alert.innerHTML = `
      <strong>Erro!</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    container.appendChild(alert);

    // Auto-remover após duration
    setTimeout(() => {
      alert.remove();
    }, duration);
  }

  static showSuccess(message: string, duration: number = 3000): void {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      container.style.position = "fixed";
      container.style.top = "20px";
      container.style.right = "20px";
      container.style.zIndex = "9999";
      container.style.maxWidth = "400px";
      document.body.appendChild(container);
    }

    const alert = document.createElement("div");
    alert.className = "alert alert-success alert-dismissible fade show";
    alert.role = "alert";
    alert.innerHTML = `
      <strong>Sucesso!</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    container.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, duration);
  }
}

/**
 * API Client
 */
class ApiClient {
  private baseURL: string;
  private timeout: number = 30000; // 30 segundos
  private maxRetries: number = 2;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Request interno com retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Adicionar JWT token se existir
    const token = TokenStorage.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`🌐 API Request: ${options.method || "GET"} ${url}`);

    try {
      // Timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), this.timeout);
      });

      // Fetch promise
      const fetchPromise = fetch(url, {
        ...options,
        headers,
      });

      // Race entre fetch e timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Log response
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      // Token expirado ou inválido
      if (response.status === 401) {
        TokenStorage.clear();
        ErrorDisplay.showError("Sessão expirada. Por favor, faça login novamente.");
        // Redirecionar para login
        window.location.href = "/login";
        throw new Error("Token expirado");
      }

      // Erro HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || response.statusText || "Erro desconhecido";
        throw new Error(errorMessage);
      }

      // Sucesso
      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error: any) {
      console.error(`❌ API Error:`, error);

      // Retry logic (apenas para network errors, não para HTTP errors)
      if (
        retries < this.maxRetries &&
        (error.message === "Request timeout" ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.log(`🔄 Retry ${retries + 1}/${this.maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)));
        return this.request<T>(endpoint, options, retries + 1);
      }

      // Mostrar erro ao utilizador
      ErrorDisplay.showError(error.message);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * Upload de ficheiro (multipart/form-data)
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenStorage.getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro no upload");
      }

      return await response.json();
    } catch (error: any) {
      ErrorDisplay.showError(error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
export { TokenStorage, ErrorDisplay };
