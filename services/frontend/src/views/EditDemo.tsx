import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchDemoById, updateDemo, type Demo } from "../data/demos";

export default function EditDemo() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [demo, setDemo] = useState<Demo | null>(null);
    const [form, setForm] = useState<Omit<Demo, "id">>({
        nome: "",
        codigoProjeto: "",
        horizontal: "",
        nomeComercial: "",
        vertical: "",
        urlFotoComercial: "",
        nomeImagemDocker: "",
    });

    useEffect(() => {
        if (!id) return;
        fetchDemoById(Number(id)).then((d) => {
            if (!d) {
                return;
            }
            setDemo(d);
            setForm({
                nome: d.nome,
                codigoProjeto: d.codigoProjeto,
                horizontal: d.horizontal,
                nomeComercial: d.nomeComercial,
                vertical: d.vertical,
                urlFotoComercial: d.urlFotoComercial,
                nomeImagemDocker: d.nomeImagemDocker,
            });
        });
    }, [id]);

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!demo) return;
        await updateDemo(demo.id, form);
        navigate("/demos");
    }

    if (!demo) {
        return (
            <div className="page-container">
                <button
                    className="btn-back-outline"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left" />
                    <span>Voltar</span>
                </button>
                <h2 style={{ marginTop: "1rem" }}>Demo não encontrada</h2>
            </div>
        );
    }

    return (
        <div className="page-container">
            <button className="btn-back-outline" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left" />
                <span>Voltar</span>
            </button>

            <div className="card mt-16">
                <div className="card-header">
                    <h2 className="card-title">Editar Demo</h2>
                </div>

                <div className="card-body">
                    <form className="form-grid" onSubmit={onSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nome</label>
                                <input
                                    name="nome"
                                    value={form.nome}
                                    onChange={onChange}
                                    placeholder="Ex.: Demo 360"
                                />
                            </div>

                            <div className="form-group">
                                <label>Código do Projeto</label>
                                <input
                                    name="codigoProjeto"
                                    value={form.codigoProjeto}
                                    onChange={onChange}
                                    placeholder="Ex.: LTP-001"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Horizontal</label>
                                <input
                                    name="horizontal"
                                    value={form.horizontal}
                                    onChange={onChange}
                                    placeholder="Ex.: Marketing"
                                />
                            </div>

                            <div className="form-group">
                                <label>Nome do Comercial</label>
                                <input
                                    name="nomeComercial"
                                    value={form.nomeComercial}
                                    onChange={onChange}
                                    placeholder="Ex.: Ana Silva"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Vertical</label>
                                <input
                                    name="vertical"
                                    value={form.vertical}
                                    onChange={onChange}
                                    placeholder="Ex.: Retalho"
                                />
                            </div>

                            <div className="form-group">
                                <label>URL Foto Comercial</label>
                                <input
                                    name="urlFotoComercial"
                                    value={form.urlFotoComercial}
                                    onChange={onChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nome da Imagem Docker</label>
                            <input
                                name="nomeImagemDocker"
                                value={form.nomeImagemDocker}
                                onChange={onChange}
                                placeholder="Ex.: myorg/minha-demo:latest"
                            />
                        </div>

                        <div className="card-footer-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => navigate(-1)}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary">
                                Guardar alterações
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
