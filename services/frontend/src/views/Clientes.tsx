import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";

type Cliente = {
    id: number;
    nome: string;
    empresa: string;
    contacto: string;
};

const LS_KEY = "clientes_db_v1";
const LS_SEQ = "clientes_seq_v1";

function readAll(): Cliente[] {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as Cliente[];
    } catch {
        return [];
    }
}
function writeAll(arr: Cliente[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
}
function nextId(): number {
    const raw = localStorage.getItem(LS_SEQ);
    const current = raw
        ? parseInt(raw, 10)
        : Math.max(0, ...readAll().map((c) => c.id));
    const nxt = current + 1;
    localStorage.setItem(LS_SEQ, String(nxt));
    return nxt;
}

export default function Clientes() {
    // const navigate = useNavigate();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [q, setQ] = useState("");
    const [showAdd, setShowAdd] = useState(false);

    const [form, setForm] = useState<Omit<Cliente, "id">>({
        nome: "",
        empresa: "",
        contacto: "",
    });

    useEffect(() => {
        const all = readAll();

        if (all.length === 0) {
            const seed: Cliente[] = [
                {
                    id: 1,
                    nome: "Ana Silva",
                    empresa: "Retalho",
                    contacto: "ana.silva@empresa.pt",
                },
                {
                    id: 2,
                    nome: "Carlos Santos",
                    empresa: "Tecnologia",
                    contacto: "carlos@techwave.com",
                },
                {
                    id: 3,
                    nome: "Maria Rocha",
                    empresa: "Saúde",
                    contacto: "maria.rocha@saude.pt",
                },
            ];
            writeAll(seed);
            localStorage.setItem(LS_SEQ, "3");
            setClientes(seed);
        } else {
            setClientes(all);
        }
    }, []);

    const filtrados = useMemo(() => {
        if (!q.trim()) return clientes;
        const s = q.toLowerCase();
        return clientes.filter(
            (c) =>
                c.nome.toLowerCase().includes(s) ||
                c.empresa.toLowerCase().includes(s) ||
                c.contacto.toLowerCase().includes(s)
        );
    }, [q, clientes]);

    function onChangeForm(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    function abrirAdd() {
        setForm({ nome: "", empresa: "", contacto: "" });
        setShowAdd(true);
    }
    function fecharAdd() {
        setShowAdd(false);
    }

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (
            !form.nome.trim() ||
            !form.empresa.trim() ||
            !form.contacto.trim()
        ) {
            alert("Preenche nome, empresa e contacto.");
            return;
        }
        const novo: Cliente = { id: nextId(), ...form };
        const all = readAll();
        const updated = [...all, novo];
        writeAll(updated);
        setClientes(updated);
        setShowAdd(false);
    }

    return (
        <div className="page-container">
            <div className="page-topbar">
                <h1 className="page-title">Lista de Clientes</h1>

                <div className="page-actions">
                    <button className="btn-primary" onClick={abrirAdd}>
                        + Adicionar Cliente
                    </button>
                </div>
            </div>
            <div className="card mt-16">
                <div className="card-body">
                    <div className="search-wrap">
                        <i className="bi bi-search" aria-hidden="true" />
                        <input
                            className="search-input"
                            placeholder="Procurar por nome, contacto ou empresa…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            aria-label="Pesquisar clientes"
                        />
                    </div>

                    <div className="list-stack">
                        {filtrados.length === 0 ? (
                            <div className="empty-state">Sem resultados.</div>
                        ) : (
                            filtrados.map((c) => (
                                <div key={c.id} className="list-item">
                                    <div className="list-item-title">
                                        {c.nome}
                                    </div>
                                    <div className="list-item-detail">
                                        <strong>Empresa:</strong>{" "}
                                        {c.empresa || "—"}
                                    </div>
                                    <div className="list-item-detail">
                                        <strong>Contacto:</strong>{" "}
                                        {c.contacto || "—"}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showAdd && (
                <div className="card mt-16">
                    <div className="card-header">
                        <h2 className="card-title">Adicionar Cliente</h2>
                    </div>
                    <div className="card-body">
                        <form className="form-grid" onSubmit={handleAdd}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nome *</label>
                                    <input
                                        name="nome"
                                        value={form.nome}
                                        onChange={onChangeForm}
                                        placeholder="Ex.: Ana Silva"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Empresa *</label>
                                    <input
                                        name="empresa"
                                        value={form.empresa}
                                        onChange={onChangeForm}
                                        placeholder="Ex.: Retalho"
                                        required
                                    />
                                </div>

                                <div className="form-group full">
                                    <label>Contacto *</label>
                                    <input
                                        name="contacto"
                                        value={form.contacto}
                                        onChange={onChangeForm}
                                        placeholder="Ex.: ana.silva@empresa.pt"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="card-footer-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={fecharAdd}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
