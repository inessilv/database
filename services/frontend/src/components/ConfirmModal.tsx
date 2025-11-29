/**
 * ConfirmModal Component
 * 
 * Modal genérico para confirmar ações com design moderno
 * Aparece centrado no ecrã com backdrop escurecido
 */

import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "green" | "red" | "blue";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "green",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  /**
   * Estilos do botão de confirmação baseado na cor
   */
  const getConfirmButtonStyle = (): React.CSSProperties => {
    const colors = {
      green: {
        backgroundColor: "#10b981",
        color: "white",
      },
      red: {
        backgroundColor: "#ef4444",
        color: "white",
      },
      blue: {
        backgroundColor: "var(--primary)",
        color: "white",
      },
    };

    return colors[confirmColor];
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
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll do body
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, loading]);

  return (
    <>
      {/* Backdrop com animação de fade-in */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={handleBackdropClick}
      />

      {/* Modal centrado com animação de scale */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "90%",
          maxWidth: "480px",
          animation: "scaleIn 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="card"
          style={{
            padding: 0,
            backgroundColor: "var(--bg)",
            border: "1px solid var(--stroke)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "24px 24px 20px 24px",
              borderBottom: "1px solid var(--stroke)",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "var(--text)",
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>

          {/* Body */}
          <div
            style={{
              padding: "24px",
            }}
          >
            <p
              style={{
                fontSize: "0.9375rem",
                lineHeight: "1.6",
                color: "var(--text)",
                margin: 0,
              }}
            >
              {message}
            </p>
          </div>

          {/* Footer com ações */}
          <div
            style={{
              padding: "16px 24px 24px 24px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-ghost"
              style={{
                padding: "10px 20px",
                fontSize: "0.9375rem",
                fontWeight: "600",
                opacity: loading ? 0.5 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: "10px 24px",
                fontSize: "0.9375rem",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
                ...getConfirmButtonStyle(),
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <>
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
                  A processar...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CSS das animações */}
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
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
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
