import { useEffect, useState } from "react";
import type { User } from "../App";
import { fetchDemos, removeDemo, type Demo } from "../data/demos";
import { useNavigate } from "react-router-dom";

type Props = { user: User };

function normalizeToUrl(raw?: string): string | null {
    if (!raw) return null;
    const s = raw.trim();
    try {
        const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
        const u = new URL(withProto);
        return u.toString();
    } catch {
        return null;
    }
}

export default function Lista({ user }: Props) {
    const [demos, setDemos] = useState<Demo[]>([]);
    const navigate = useNavigate();
    const isAdmin = user.role === "admin";

    useEffect(() => {
        fetchDemos().then(setDemos);
    }, []);

    const handleOpenForViewer = (demo: Demo) => {
        const url = normalizeToUrl(demo.nomeImagemDocker);
        if (!url) {
            alert("O campo 'Nome da Imagem Docker' não é um URL válido.");
            return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleRemove = async (id: number) => {
        if (!confirm("Tens a certeza que queres remover esta demo?")) return;
        await removeDemo(id);
        setDemos((curr) => curr.filter((d) => d.id !== id));
    };

    return (
        <div className="page">
            <div className="list-header">
                <h1 className="page-title">Lista de Demos</h1>

                {isAdmin && (
                    <button
                        className="button"
                        onClick={() => navigate("/demos/new")}
                    >
                        + Adicionar Demo
                    </button>
                )}
            </div>

            <ul className="list-reset">
                {demos.map((d) => {
                    const clickable = !isAdmin && !!d.nomeImagemDocker;
                    return (
                        <li key={d.id}>
                            <div
                                className={`demo-card ${
                                    clickable ? "clickable" : ""
                                }`}
                                onClick={() => {
                                    if (!isAdmin) handleOpenForViewer(d);
                                }}
                                role={clickable ? "button" : undefined}
                                tabIndex={clickable ? 0 : undefined}
                                onKeyDown={(e) => {
                                    if (
                                        !isAdmin &&
                                        (e.key === "Enter" || e.key === " ")
                                    ) {
                                        e.preventDefault();
                                        handleOpenForViewer(d);
                                    }
                                }}
                            >
                                <div
                                    className="demo-card__row"
                                    style={{ gap: 16 }}
                                >
                                    <div
                                        className="avatar"
                                        style={{
                                            width: 64,
                                            height: 64,
                                            backgroundImage: d.urlFotoComercial
                                                ? `url("${d.urlFotoComercial}")`
                                                : "none",
                                        }}
                                    />
                                    <div className="demo-content">
                                        <h3 className="demo-title">
                                            {d.nome || "—"}
                                        </h3>
                                        <div className="demo-meta">
                                            <div>
                                                <span className="muted">
                                                    Código:
                                                </span>{" "}
                                                <strong>
                                                    {d.codigoProjeto || "—"}
                                                </strong>
                                            </div>
                                            <div>
                                                <span className="muted">
                                                    Horizontal:
                                                </span>{" "}
                                                <strong>
                                                    {d.horizontal || "—"}
                                                </strong>
                                            </div>
                                            <div>
                                                <span className="muted">
                                                    Vertical:
                                                </span>{" "}
                                                <strong>
                                                    {d.vertical || "—"}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div
                                            className="card-actions"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="button"
                                                onClick={() =>
                                                    navigate(`/demos/${d.id}`)
                                                }
                                            >
                                                Ver detalhes
                                            </button>
                                            <button
                                                className="danger"
                                                onClick={() =>
                                                    handleRemove(d.id)
                                                }
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}

                {demos.length === 0 && (
                    <li className="empty">
                        <div className="card">
                            <p>Sem demos para apresentar.</p>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    );
}
