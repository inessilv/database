/**
 * ClienteModal Component
 * 
 * Modal para criar ou editar cliente
 * Segue o padrão do ConfirmModal.tsx
 */

import React, { useState, useEffect } from "react";
import type { Cliente, ClienteCreate, ClienteUpdate } from "../types/Cliente";

interface ClienteModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  cliente?: Cliente;
  onClose: () => void;
  onSave: (data: ClienteCreate | ClienteUpdate) => Promise<void>;
  loading?: boolean;
  userId: string; // ID do admin criador
}

export default function ClienteModal({
  isOpen,
  mode,
  cliente,
  onClose,
  onSave,
  loading = false,
  userId,
}: ClienteModalProps) {
  const isCreate = mode === "create";

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    data_expiracao: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Preencher form ao abrir em modo edição
   */
  useEffect(() => {
    if (isOpen && mode === "edit" && cliente) {
      setFormData({
        nome: cliente.nome,
        email: cliente.email,
        password: "",
        data_expiracao: cliente.data_expiracao.split("T")[0], // Formato YYYY-MM-DD
      });
      setErrors({});
    } else if (isOpen && mode === "create") {
      // Data de expiração padrão: +30 dias
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + 30);
      
      setFormData({
        nome: "",
        email: "",
        password: "",
        data_expiracao: dataExpiracao.toISOString().split("T")[0],
      });
      setErrors({});
    }
  }, [isOpen, mode, cliente]);

  /**
   * Validação do formulário
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (isCreate && !formData.password.trim()) {
      newErrors.password = "Password é obrigatória na criação";
    }

    if (isCreate && !formData.data_expiracao) {
      newErrors.data_expiracao = "Data de expiração é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submit do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isCreate) {
        // Criar cliente
        const dataRegisto = new Date().toISOString();
        const dataExpiracao = new Date(formData.data_expiracao).toISOString();

        const createData: ClienteCreate = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          password: formData.password,
          data_registo: dataRegisto,
          data_expiracao: dataExpiracao,
          criado_por: userId,
        };

        await onSave(createData);
      } else {
        // Editar cliente
        const updateData: ClienteUpdate = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
        };

        // Apenas incluir password se foi preenchida
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }

        await onSave(updateData);
      }

      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar cliente:", err);
      alert(`Erro: ${err.message}`);
    }
  };

  /**
   * Fechar ao clicar no backdrop
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  /**
   * Fechar ao pressionar ESC
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--bg-2)",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          maxWidth: "500px",
          width: "100%",
          margin: "0 16px",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b"
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--stroke)",
          }}
        >
          <h3
            className="text-lg font-bold"
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "var(--text)",
            }}
          >
            {isCreate ? "Adicionar Novo Cliente" : "Editar Cliente"}
          </h3>
        </div>

        {/* Body - Formulário */}
        <form onSubmit={handleSubmit}>
          <div
            className="px-6 py-4"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Nome */}
            <div className="field">
              <label className="label">
                Nome <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex.: João Silva"
                disabled={loading}
              />
              {errors.nome && (
                <span
                  className="helper-error"
                  style={{ color: "#ef4444", fontSize: "0.875rem" }}
                >
                  {errors.nome}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="field">
              <label className="label">
                Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Ex.: joao.silva@empresa.pt"
                disabled={loading}
              />
              {errors.email && (
                <span
                  className="helper-error"
                  style={{ color: "#ef4444", fontSize: "0.875rem" }}
                >
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="field">
              <label className="label">
                Password{" "}
                {isCreate && <span style={{ color: "#ef4444" }}>*</span>}
                {!isCreate && (
                  <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                    (deixar em branco para não alterar)
                  </span>
                )}
              </label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={isCreate ? "Mínimo 6 caracteres" : "Nova password"}
                disabled={loading}
              />
              {errors.password && (
                <span
                  className="helper-error"
                  style={{ color: "#ef4444", fontSize: "0.875rem" }}
                >
                  {errors.password}
                </span>
              )}
            </div>

            {/* Data de Expiração (só na criação) */}
            {isCreate && (
              <div className="field">
                <label className="label">
                  Data de Expiração <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.data_expiracao}
                  onChange={(e) =>
                    setFormData({ ...formData, data_expiracao: e.target.value })
                  }
                  disabled={loading}
                />
                {errors.data_expiracao && (
                  <span
                    className="helper-error"
                    style={{ color: "#ef4444", fontSize: "0.875rem" }}
                  >
                    {errors.data_expiracao}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer com ações */}
          <div
            className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3"
            style={{
              padding: "16px 24px",
              backgroundColor: "var(--bg)",
              borderTop: "1px solid var(--stroke)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-ghost"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="button"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
              }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  A guardar...
                </div>
              ) : isCreate ? (
                "Criar Cliente"
              ) : (
                "Guardar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* CSS da animação de loading */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
