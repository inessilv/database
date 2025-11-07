/**
 * Demo Service
 * 
 * Serviço de gestão de demos
 * Endpoints: /api/demos/*
 */

import { api } from "./api";
import type { Demo, DemoCreate, DemoUpdate } from "../types/Demo.ts";

class DemoService {
  /**
   * Listar todas as demos
   * GET /api/demos/all
   */
  async getAll(): Promise<Demo[]> {
    return api.get<Demo[]>("/api/demos/all");
  }

  /**
   * Listar apenas demos ativas
   * GET /api/demos/active
   */
  async getActive(): Promise<Demo[]> {
    return api.get<Demo[]>("/api/demos/active");
  }

  /**
   * Obter demo por ID
   * GET /api/demos/{id}
   */
  async getById(id: string): Promise<Demo> {
    return api.get<Demo>(`/api/demos/${id}`);
  }

  /**
   * Listar demos por vertical
   * GET /api/demos/by-vertical/{vertical}
   */
  async getByVertical(vertical: string): Promise<Demo[]> {
    return api.get<Demo[]>(`/api/demos/by-vertical/${vertical}`);
  }

  /**
   * Listar demos por horizontal
   * GET /api/demos/by-horizontal/{horizontal}
   */
  async getByHorizontal(horizontal: string): Promise<Demo[]> {
    return api.get<Demo[]>(`/api/demos/by-horizontal/${horizontal}`);
  }

  /**
   * Criar nova demo
   * POST /api/demos/
   */
  async create(demo: DemoCreate): Promise<Demo> {
    return api.post<Demo>("/api/demos/", demo);
  }

  /**
   * Atualizar demo
   * PUT /api/demos/{id}
   */
  async update(id: string, demo: DemoUpdate): Promise<Demo> {
    return api.put<Demo>(`/api/demos/${id}`, demo);
  }

  /**
   * Apagar demo
   * DELETE /api/demos/{id}
   */
  async delete(id: string): Promise<void> {
    return api.delete<void>(`/api/demos/${id}`);
  }

  /**
   * Pesquisar demos por keywords
   * (implementação simples client-side)
   */
  async search(query: string): Promise<Demo[]> {
    const demos = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return demos.filter(
      (demo) =>
        demo.nome.toLowerCase().includes(lowerQuery) ||
        demo.descricao?.toLowerCase().includes(lowerQuery) ||
        demo.keywords?.toLowerCase().includes(lowerQuery) ||
        demo.vertical?.toLowerCase().includes(lowerQuery) ||
        demo.horizontal?.toLowerCase().includes(lowerQuery) ||
        demo.codigo_projeto?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Obter lista única de verticais
   */
  async getVerticais(): Promise<string[]> {
    const demos = await this.getAll();
    const verticais = demos
      .map((d) => d.vertical)
      .filter((v): v is string => v !== null && v !== undefined);
    return [...new Set(verticais)].sort();
  }

  /**
   * Obter lista única de horizontais
   */
  async getHorizontais(): Promise<string[]> {
    const demos = await this.getAll();
    const horizontais = demos
      .map((d) => d.horizontal)
      .filter((h): h is string => h !== null && h !== undefined);
    return [...new Set(horizontais)].sort();
  }
}

// Export singleton instance
export const demoService = new DemoService();
