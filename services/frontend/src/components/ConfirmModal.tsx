/**
 * ConfirmModal Component
 * 
 * Modal genérico para confirmar ações com design moderno
 * Aparece SEMPRE centrado no viewport (não na página)
 * Alinhado com o styling das outras views (Clientes, Demos, etc.)
 */

import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger" | "success";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "primary",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // Handler para cancelar - usa onCancel se fornecido, senão onClose
  const handleCancel = onCancel || onClose || (() => {});

  /**
   * Estilos do botão de confirmação baseado na variante
   */
  const getConfirmButtonStyle = (): React.CSSProperties => {
    const variants = {
      primary: {
        backgroundColor: "var(--primary)",
        borderColor: "var(--primary)",
      },
      danger: {
        backgroundColor: "var(--danger)",
        borderColor: "var(--danger)",
      },
      success: {
        backgroundColor: "var(--success)",
        borderColor: "var(--success)",
      },
    };

    return variants[confirmVariant];
  };

  /**
   * Fechar ao clicar no backdrop
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      handleCancel();
    }
  };

  /**
   * Fechar ao pressionar ESC
   */
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll do body quando modal aberto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, loading]);

  return (
    <>
      {/* Backdrop - overlay de fundo escuro com blur */}
      <div
        style={{
          position: "fixed",
          inset: 0, // shorthand para top, right, bottom, left = 0
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)", // Safari support
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={handleBackdropClick}
      >
        {/* Modal - centralizado no viewport */}
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
            className="card"
            style={{
              margin: 0,
              padding: 0,
              backgroundColor: "var(--bg)",
              border: "1px solid var(--stroke)",
              borderRadius: "14px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px 28px 20px 28px",
                borderBottom: "1px solid var(--stroke)",
                backgroundColor: "var(--bg-2)",
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
                {title}
              </h3>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "28px",
              }}
            >
              <p
                style={{
                  fontSize: "0.95rem",
                  lineHeight: "1.65",
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                {message}
              </p>
            </div>

            {/* Footer com botões de ação */}
            <div
              style={{
                padding: "18px 28px 26px 28px",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "12px",
                borderTop: "1px solid var(--stroke)",
                backgroundColor: "var(--bg)",
              }}
            >
              {/* Botão Cancelar */}
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn-outline"
                style={{
                  padding: "11px 22px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  borderRadius: "10px",
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {cancelText}
              </button>

              {/* Botão Confirmar */}
              <button
                onClick={onConfirm}
                disabled={loading}
                className="button"
                style={{
                  padding: "11px 26px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  borderRadius: "10px",
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  ...getConfirmButtonStyle(),
                }}
              >
                {loading && (
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                )}
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS das animações - incluído inline no componente */}
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