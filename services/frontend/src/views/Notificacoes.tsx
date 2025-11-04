import { useEffect, useMemo, useState } from "react";

type Estado = "pendente" | "aceite" | "rejeitado";

type PedidoRenovacao = {
    id: number;
    nomeCliente: string;
    demo: string;
    estado: Estado;
    ate: string;
    criado: string;
    atualizado: string;
};

const LS_KEY = "pedidos_db_v1";
const FALLBACK_KEYS = [
    "pedidos_db",
    "notifs_db_v1",
    "renovacoes_db",
    "notificacoes_db",
];

const seed: PedidoRenovacao[] = [
    {
        id: 1,
        nomeCliente: "Ana Silva",
        demo: "Demo 2",
        estado: "pendente",
        ate: "2025-11-30T00:00:00.000Z",
        criado: "2025-10-27T15:21:23.000Z",
        atualizado: "2025-10-27T15:21:23.000Z",
    },
    {
        id: 2,
        nomeCliente: "Carlos Santos",
        demo: "Demo 1",
        estado: "aceite",
        ate: "2025-12-15T00:00:00.000Z",
        criado: "2025-10-26T15:21:23.000Z",
        atualizado: "2025-10-27T15:33:13.000Z",
    },
    {
        id: 3,
        nomeCliente: "Maria Rocha",
        demo: "Demo Exemplo",
        estado: "rejeitado",
        ate: "2026-01-10T00:00:00.000Z",
        criado: "2025-10-25T17:21:23.000Z",
        atualizado: "2025-10-27T14:21:23.000Z",
    },
];

function fmt(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function isArrayOfPedidos(x: unknown): x is PedidoRenovacao[] {
    return (
        Array.isArray(x) &&
        x.every(
            (obj) =>
                obj &&
                typeof obj.id === "number" &&
                typeof obj.nomeCliente === "string" &&
                typeof obj.demo === "string" &&
                (obj.estado === "pendente" ||
                    obj.estado === "aceite" ||
                    obj.estado === "rejeitado")
        )
    );
}

export default function Notificacoes() {
    const [pedidos, setPedidos] = useState<PedidoRenovacao[]>([]);
    const [filtro, setFiltro] = useState<"todos" | Estado>("todos");

    useEffect(() => {
        let raw = localStorage.getItem(LS_KEY);

        if (!raw) {
            for (const k of FALLBACK_KEYS) {
                const r = localStorage.getItem(k);
                if (r) {
                    raw = r;
                    break;
                }
            }
        }

        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (isArrayOfPedidos(parsed) && parsed.length > 0) {
                    setPedidos(parsed);
                    localStorage.setItem(LS_KEY, JSON.stringify(parsed));
                    return;
                }
            } catch {
                // cai no seed
            }
        }

        localStorage.setItem(LS_KEY, JSON.stringify(seed));
        setPedidos(seed);
    }, []);

    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify(pedidos));
    }, [pedidos]);

    function setEstado(id: number, novo: Estado) {
        setPedidos((curr) =>
            curr.map((p) =>
                p.id === id
                    ? {
                          ...p,
                          estado: novo,
                          atualizado: new Date().toISOString(),
                      }
                    : p
            )
        );
    }

    const aceitar = (id: number) => setEstado(id, "aceite");
    const rejeitar = (id: number) => setEstado(id, "rejeitado");

    const aceitarPendentes = () =>
        setPedidos((curr) =>
            curr.map((p) =>
                p.estado === "pendente"
                    ? {
                          ...p,
                          estado: "aceite",
                          atualizado: new Date().toISOString(),
                      }
                    : p
            )
        );

    const rejeitarPendentes = () =>
        setPedidos((curr) =>
            curr.map((p) =>
                p.estado === "pendente"
                    ? {
                          ...p,
                          estado: "rejeitado",
                          atualizado: new Date().toISOString(),
                      }
                    : p
            )
        );

    const temPendentes = pedidos.some((p) => p.estado === "pendente");

    const pedidosFiltrados = useMemo(() => {
        if (filtro === "todos") return pedidos;
        return pedidos.filter((p) => p.estado === filtro);
    }, [pedidos, filtro]);

    return (
        <div className="page notifs">
            <h1 className="page-title">Pedidos de Renovação</h1>

            <div className="topbar">
                <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value as any)}
                >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendentes</option>
                    <option value="aceite">Aceites</option>
                    <option value="rejeitado">Rejeitados</option>
                </select>

                <div className="actions">
                    <button
                        className="button"
                        onClick={aceitarPendentes}
                        disabled={!temPendentes}
                    >
                        Aceitar pendentes
                    </button>
                    <button
                        className="danger"
                        onClick={rejeitarPendentes}
                        disabled={!temPendentes}
                    >
                        Rejeitar pendentes
                    </button>
                </div>
            </div>

            {pedidosFiltrados.length === 0 ? (
                <div className="empty-state">
                    <p>
                        Sem pedidos para mostrar com o filtro{" "}
                        <strong>{filtro}</strong>.
                    </p>
                </div>
            ) : (
                <div className="list-stack">
                    {pedidosFiltrados.map((p) => (
                        <div key={p.id} className="card">
                            <div className="list-item-title">
                                {p.nomeCliente} pediu renovar{" "}
                                <strong>{p.demo}</strong>
                            </div>

                            <div
                                className="badge-container"
                                style={{ marginTop: 8, marginBottom: 8 }}
                            >
                                {p.estado === "pendente" && (
                                    <span className="badge badge--yellow">
                                        Pendente
                                    </span>
                                )}
                                {p.estado === "aceite" && (
                                    <span className="badge badge--green">
                                        Aceite
                                    </span>
                                )}
                                {p.estado === "rejeitado" && (
                                    <span className="badge badge--red">
                                        Rejeitado
                                    </span>
                                )}
                            </div>

                            <div className="list-item-meta vertical">
                                <div className="meta">
                                    <strong>Até:</strong> {fmt(p.ate)}
                                </div>
                                <div className="meta">
                                    <strong>Criado:</strong> {fmt(p.criado)}
                                </div>
                                <div className="meta">
                                    <strong>Atualizado:</strong>{" "}
                                    {fmt(p.atualizado)}
                                </div>
                            </div>

                            {p.estado === "pendente" && (
                                <div className="card-footer-actions">
                                    <button
                                        className="button"
                                        onClick={() => aceitar(p.id)}
                                    >
                                        Aceitar
                                    </button>
                                    <button
                                        className="danger"
                                        onClick={() => rejeitar(p.id)}
                                    >
                                        Rejeitar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
