import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchDemoById, removeDemo, type Demo } from "../data/demos";

const PLACEHOLDER = "/placeholder-user.png";

function pickBestImage(d: any): string | undefined {
    const candidates = [
        d?.urlFotoComercial,
        d?.fotoComercialUrl,
        d?.fotoUrl,
        d?.imagem,
        d?.imageUrl,
        d?.foto,
    ].filter(Boolean) as string[];

    if (
        typeof d?.nomeImagemDocker === "string" &&
        /^https?:\/\//i.test(d.nomeImagemDocker)
    ) {
        candidates.unshift(d.nomeImagemDocker);
    }

    for (const c of candidates) {
        const v = String(c).trim();
        if (/^https?:\/\//i.test(v) || v.startsWith("data:image")) return v;
    }
    return undefined;
}

function ImgAvatar({
    src,
    alt,
    size = 112,
    rounded = 12,
}: {
    src?: string;
    alt: string;
    size?: number;
    rounded?: number;
}) {
    const [url, setUrl] = useState<string>(PLACEHOLDER);

    useEffect(() => {
        const v = (src ?? "").trim();
        setUrl(v || PLACEHOLDER);
    }, [src]);

    return (
        <img
            src={url}
            alt={alt}
            onError={() => setUrl(PLACEHOLDER)}
            style={{
                width: size,
                height: size,
                objectFit: "cover",
                borderRadius: rounded,
                border: "1px solid var(--stroke, #32373e)",
                backgroundColor: "#d8dadf",
                display: "block",
                flexShrink: 0,
            }}
        />
    );
}

export default function Detalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [demo, setDemo] = useState<Demo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            const d = await fetchDemoById(Number(id));
            setDemo(d);
            setLoading(false);
        })();
    }, [id]);

    async function handleRemove() {
        if (!demo) return;
        if (!confirm("Tens a certeza que queres remover esta demo?")) return;
        await removeDemo(demo.id);
        alert("Demo removida com sucesso.");
        navigate("/demos");
    }

    if (loading)
        return (
            <div className="page">
                <div className="page-topbar">
                    <button className="btn-ghost" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left" /> Voltar
                    </button>
                </div>
                <p style={{ padding: 16 }}>A carregar…</p>
            </div>
        );

    if (!demo)
        return (
            <div className="page">
                <div className="page-topbar">
                    <button className="btn-ghost" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left" /> Voltar
                    </button>
                </div>
                <h1 style={{ padding: "8px 16px" }}>Demo não encontrada</h1>
            </div>
        );

    const img = pickBestImage(demo);

    return (
        <div className="page">
            <div className="page-topbar">
                <button className="btn-ghost" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left" /> Voltar
                </button>

                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                    <button
                        className="button"
                        onClick={() => navigate(`/demos/${demo.id}/edit`)}
                    >
                        <i className="bi bi-pencil" /> Editar
                    </button>
                    <button className="danger" onClick={handleRemove}>
                        <i className="bi bi-trash" /> Remover
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
                <div
                    style={{
                        display: "flex",
                        gap: 20,
                        alignItems: "center",
                        marginBottom: 20,
                        flexWrap: "wrap",
                    }}
                >
                    <ImgAvatar
                        src={img}
                        alt={demo.nome || "Demo"}
                        size={112}
                        rounded={12}
                    />
                    <h1 style={{ margin: 0 }}>{demo.nome || "—"}</h1>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px 24px",
                    }}
                >
                    <Field
                        label="Código do Projeto"
                        value={demo.codigoProjeto}
                    />
                    <Field
                        label="Nome do Comercial"
                        value={demo.nomeComercial}
                    />
                    <Field label="Horizontal" value={demo.horizontal} />
                    <Field label="Vertical" value={demo.vertical} />
                    <Field
                        label="URL Foto do Comercial"
                        value={img || demo.urlFotoComercial || "—"}
                        full
                    />
                    <Field
                        label="Nome da Imagem Docker"
                        value={demo.nomeImagemDocker}
                        full
                    />
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    full = false,
}: {
    label: string;
    value?: string;
    full?: boolean;
}) {
    return (
        <label
            className="label"
            style={full ? { gridColumn: "1 / -1" } : undefined}
        >
            {label}
            <input className="input" value={value || "—"} readOnly />
        </label>
    );
}
