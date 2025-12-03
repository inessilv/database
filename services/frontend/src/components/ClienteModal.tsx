/**
 * ClienteModal Component
 * 
 * Modal para criar ou editar cliente
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
  userId: string;
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

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    data_expiracao: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && mode === "edit" && cliente) {
      setFormData({
        nome: cliente.nome,
        email: cliente.email,
        data_expiracao: cliente.data_expiracao.split("T")[0],
      });
      setErrors({});
    } else if (isOpen && mode === "create") {
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + 30);
      
      setFormData({
        nome: "",
        email: "",
        data_expiracao: dataExpiracao.toISOString().split("T")[0],
      });
      setErrors({});
    }
  }, [isOpen, mode, cliente]);

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

    if (isCreate && !formData.data_expiracao) {
      newErrors.data_expiracao = "Data de expiração é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isCreate) {
        const dataRegisto = new Date().toISOString();
        const dataExpiracao = new Date(formData.data_expiracao).toISOString();

        const createData: ClienteCreate = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          data_registo: dataRegisto,
          data_expiracao: dataExpiracao,
          criado_por: userId,
        };

        await onSave(createData);
      } else {
        const updateData: ClienteUpdate = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
        };

        await onSave(updateData);
      }

      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar cliente:", err);
      alert(`Erro: ${err.message}`);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

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
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={handleBackdropClick}
      >
        <div
          style={{
            position: "relative",
            width: "90%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflowY: "auto",
            animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              backgroundColor: "var(--bg-2)",
              borderRadius: "14px",
              border: "1px solid var(--stroke)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                padding: "24px 28px 20px 28px",
                borderBottom: "1px solid var(--stroke)",
                backgroundColor: "var(--bg)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "700",
                  color: "var(--text)",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {isCreate ? "Adicionar Novo Cliente" : "Editar Cliente"}
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "var(--text)",
                    }}
                  >
                    Nome <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex.: João Silva"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: `1px solid ${errors.nome ? "#ef4444" : "var(--stroke)"}`,
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      if (!errors.nome) {
                        e.target.style.borderColor = "var(--primary)";
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.nome) {
                        e.target.style.borderColor = "var(--stroke)";
                      }
                    }}
                  />
                  {errors.nome && (
                    <span
                      style={{
                        display: "block",
                        marginTop: "6px",
                        fontSize: "0.75rem",
                        color: "#ef4444",
                      }}
                    >
                      {errors.nome}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "var(--text)",
                    }}
                  >
                    Email <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Ex.: joao.silva@empresa.pt"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: `1px solid ${errors.email ? "#ef4444" : "var(--stroke)"}`,
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      if (!errors.email) {
                        e.target.style.borderColor = "var(--primary)";
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.email) {
                        e.target.style.borderColor = "var(--stroke)";
                      }
                    }}
                  />
                  {errors.email && (
                    <span
                      style={{
                        display: "block",
                        marginTop: "6px",
                        fontSize: "0.75rem",
                        color: "#ef4444",
                      }}
                    >
                      {errors.email}
                    </span>
                  )}
                </div>

                {isCreate && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        marginBottom: "8px",
                        color: "var(--text)",
                      }}
                    >
                      Data de Expiração <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.data_expiracao}
                      onChange={(e) =>
                        setFormData({ ...formData, data_expiracao: e.target.value })
                      }
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        border: `1px solid ${
                          errors.data_expiracao ? "#ef4444" : "var(--stroke)"
                        }`,
                        borderRadius: "8px",
                        fontSize: "0.95rem",
                        backgroundColor: "var(--bg)",
                        color: "var(--text)",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => {
                        if (!errors.data_expiracao) {
                          e.target.style.borderColor = "var(--primary)";
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.data_expiracao) {
                          e.target.style.borderColor = "var(--stroke)";
                        }
                      }}
                    />
                    {errors.data_expiracao && (
                      <span
                        style={{
                          display: "block",
                          marginTop: "6px",
                          fontSize: "0.75rem",
                          color: "#ef4444",
                        }}
                      >
                        {errors.data_expiracao}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "18px 28px 26px 28px",
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
                    padding: "11px 22px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    borderRadius: "10px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "11px 26px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "10px",
                    backgroundColor: "var(--primary)",
                    color: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    minWidth: "140px",
                    opacity: loading ? 0.75 : 1,
                    boxShadow: loading ? "none" : "0 2px 8px rgba(0, 0, 0, 0.15)",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = "0.9";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <div
                        style={{
                          width: "17px",
                          height: "17px",
                          border: "2.5px solid white",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.65s linear infinite",
                        }}
                      />
                      A guardar...
                    </>
                  ) : isCreate ? (
                    "Criar Cliente"
                  ) : (
                    "Guardar Alterações"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}