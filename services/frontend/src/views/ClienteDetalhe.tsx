/**
 * ClienteDetalhe View (Placeholder)
 * 
 * Será implementado na Fase 2
 */

type User = { id: string; name: string; role: "admin" | "viewer" };

type Props = {
  user: User;
};

export default function ClienteDetalhe({}: Props) {
    // TODO: Usar user.id quando implementar esta view
  return (
    <div className="page-container">
      <h1 className="page-title">Cliente Detalhes</h1>
      <p style={{ color: "var(--muted)" }}>
        Esta view será implementada na Fase 2.
      </p>
    </div>
  );
}
