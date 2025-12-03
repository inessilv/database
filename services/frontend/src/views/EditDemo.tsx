/**
 * EditDemo View (Refactored)
 * 
 * Formulário de edição de demo existente
 * Com upload Base64 para foto do comercial
 * Estado visível para poder alterar
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { demoService } from "../services/demoService";
import type { Demo, DemoUpdate } from "../types/Demo";

type User = { id: string; name: string; role: "admin" | "viewer" };

type Props = {
  user: User;
};

interface FormData {
  nome: string;
  codigo_projeto: string;
  vertical: string;
  horizontal: string;
  url: string;
  descricao: string;
  keywords: string;
  estado: "ativa" | "inativa" | "manutenção";
  comercial_nome: string;
  comercial_contacto: string;
  comercial_foto_url: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function EditDemo({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /**
   * Verificar permissões (defesa em profundidade)
   */
  if (user.role !== "admin") {
    navigate("/demos");
    return null;
  }

  const [demo, setDemo] = useState<Demo | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    codigo_projeto: "",
    vertical: "",
    horizontal: "",
    url: "",
    descricao: "",
    keywords: "",
    estado: "ativa",
    comercial_nome: "",
    comercial_contacto: "",
    comercial_foto_url: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(true);

  /**
   * Carregar demo existente
   */
  useEffect(() => {
    if (!id) {
      navigate("/demos");
      return;
    }

    const loadDemo = async () => {
      setLoadingDemo(true);
      try {
        const data = await demoService.getById(id);
        setDemo(data);
        setFormData({
          nome: data.nome,
          codigo_projeto: data.codigo_projeto || "",
          vertical: data.vertical || "",
          horizontal: data.horizontal || "",
          url: data.url || "",
          descricao: data.descricao || "",
          keywords: data.keywords || "",
          estado: data.estado,
          comercial_nome: data.comercial_nome || "",
          comercial_contacto: data.comercial_contacto || "",
          comercial_foto_url: data.comercial_foto_url || "",
        });
      } catch (err: any) {
        console.error("Erro ao carregar demo:", err);
        alert(`Erro ao carregar demo: ${err.message}`);
        navigate("/demos");
      } finally {
        setLoadingDemo(false);
      }
    };

    loadDemo();
  }, [id, navigate]);

  /**
   * Validar email
   */

  /**
   * Validar URL
   */
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  /**
   * Validar formulário
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nome
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.length > 100) {
      newErrors.nome = "Nome não pode ter mais de 100 caracteres";
    }

    // Código do Projeto
    if (!formData.codigo_projeto.trim()) {
      newErrors.codigo_projeto = "Código do projeto é obrigatório";
    } else if (formData.codigo_projeto.length !== 6) {
      newErrors.codigo_projeto = "Código deve ter exatamente 6 caracteres (ex: LTP001)";
    }

    // Vertical
    if (!formData.vertical.trim()) {
      newErrors.vertical = "Vertical é obrigatória";
    } else if (formData.vertical.length > 50) {
      newErrors.vertical = "Vertical não pode ter mais de 50 caracteres";
    }

    // Horizontal
    if (!formData.horizontal.trim()) {
      newErrors.horizontal = "Horizontal é obrigatória";
    } else if (formData.horizontal.length > 50) {
      newErrors.horizontal = "Horizontal não pode ter mais de 50 caracteres";
    }

    // URL
    if (!formData.url.trim()) {
      newErrors.url = "URL da demo é obrigatória";
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = "URL inválida. Deve começar com http:// ou https://";
    }

    // Descrição
    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    } else if (formData.descricao.length < 10) {
      newErrors.descricao = "Descrição deve ter pelo menos 10 caracteres";
    }

    // Keywords
    if (!formData.keywords.trim()) {
      newErrors.keywords = "Keywords são obrigatórias";
    }

    // Comercial - Nome
    if (!formData.comercial_nome.trim()) {
      newErrors.comercial_nome = "Nome do comercial é obrigatório";
    } else if (formData.comercial_nome.length > 100) {
      newErrors.comercial_nome = "Nome não pode ter mais de 100 caracteres";
    }

    // Comercial - Contacto (validar como email)
    if (!formData.comercial_contacto.trim()) {
      newErrors.comercial_contacto = "Contacto do comercial é obrigatório";
    }

    // Comercial - Foto
    if (!formData.comercial_foto_url.trim()) {
      newErrors.comercial_foto_url = "Foto do comercial é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle file upload (convert to Base64)
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        comercial_foto_url: "Apenas imagens são permitidas",
      }));
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        comercial_foto_url: "Imagem não pode ter mais de 2MB",
      }));
      return;
    }

    // Converter para Base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, comercial_foto_url: base64 }));
      
      // Limpar erro
      if (errors.comercial_foto_url) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.comercial_foto_url;
          return newErrors;
        });
      }
    };
    reader.onerror = () => {
      setErrors((prev) => ({
        ...prev,
        comercial_foto_url: "Erro ao carregar imagem",
      }));
    };
    reader.readAsDataURL(file);
  };

  /**
   * Submit form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setLoading(true);

    try {
      const updateData: DemoUpdate = {
        nome: formData.nome.trim(),
        codigo_projeto: formData.codigo_projeto.trim().toUpperCase(),
        vertical: formData.vertical.trim(),
        horizontal: formData.horizontal.trim(),
        url: formData.url.trim(),
        descricao: formData.descricao.trim(),
        keywords: formData.keywords.trim(),
        estado: formData.estado,
        comercial_nome: formData.comercial_nome.trim(),
        comercial_contacto: formData.comercial_contacto.trim(),
        comercial_foto_url: formData.comercial_foto_url,
      };

      await demoService.update(id, updateData);
      alert("Demo atualizada com sucesso!");
      navigate(`/demos/${id}`);
    } catch (err: any) {
      console.error("Erro ao atualizar demo:", err);
      alert(`Erro ao atualizar demo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loading state
   */
  if (loadingDemo) {
    return (
      <div className="page-container">
        <button className="btn-back-outline" onClick={() => navigate("/demos")}>
          <i className="bi bi-arrow-left" />
          <span>Voltar</span>
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            fontSize: "1.125rem",
            color: "var(--muted)",
          }}
        >
          A carregar demo...
        </div>
      </div>
    );
  }

  /**
   * Demo not found
   */
  if (!demo) {
    return (
      <div className="page-container">
        <button className="btn-back-outline" onClick={() => navigate("/demos")}>
          <i className="bi bi-arrow-left" />
          <span>Voltar</span>
        </button>
        <div className="card" style={{ marginTop: "24px", padding: "48px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>Demo não encontrada</h2>
          <button className="btn-primary" onClick={() => navigate("/demos")}>
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Botão Voltar */}
      <button className="btn-back-outline" onClick={() => navigate("/demos")}>
        <i className="bi bi-arrow-left" />
        <span>Voltar</span>
      </button>

      {/* Card do Formulário */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <h2 className="card-title">Editar Demo</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            Atualiza os campos da demo "{demo.nome}"
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Seção: Informação Geral */}
            <section style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  marginBottom: "16px",
                  color: "var(--text)",
                  borderBottom: "1px solid var(--stroke)",
                  paddingBottom: "8px",
                }}
              >
                📋 Informação Geral
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* Nome */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: Demo CRM 360"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.nome ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.nome && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.nome}
                    </span>
                  )}
                </div>

                {/* Código do Projeto */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Código do Projeto *
                  </label>
                  <input
                    type="text"
                    name="codigo_projeto"
                    value={formData.codigo_projeto}
                    onChange={handleChange}
                    placeholder="Ex: LTP001"
                    maxLength={6}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.codigo_projeto ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                    }}
                  />
                  {errors.codigo_projeto && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.codigo_projeto}
                    </span>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Estado *
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid var(--stroke)",
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                    <option value="manutenção">Manutenção</option>
                  </select>
                </div>

                {/* Vertical */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Vertical *
                  </label>
                  <input
                    type="text"
                    name="vertical"
                    value={formData.vertical}
                    onChange={handleChange}
                    placeholder="Ex: Retail"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.vertical ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.vertical && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.vertical}
                    </span>
                  )}
                </div>

                {/* Horizontal */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Horizontal *
                  </label>
                  <input
                    type="text"
                    name="horizontal"
                    value={formData.horizontal}
                    onChange={handleChange}
                    placeholder="Ex: CRM"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.horizontal ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.horizontal && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.horizontal}
                    </span>
                  )}
                </div>

                {/* URL da Demo */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    URL da Demo *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://demo.exemplo.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.url ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.url && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.url}
                    </span>
                  )}
                </div>

                {/* Descrição */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Descrição *
                  </label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    placeholder="Descreve a demo..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.descricao ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                  {errors.descricao && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.descricao}
                    </span>
                  )}
                </div>

                {/* Keywords */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Keywords * <span style={{ fontWeight: "normal", color: "var(--muted)" }}>(separadas por vírgulas)</span>
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleChange}
                    placeholder="Ex: CRM, vendas, gestão, clientes"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.keywords ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.keywords && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.keywords}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Seção: Informação do Comercial */}
            <section style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  marginBottom: "16px",
                  color: "var(--text)",
                  borderBottom: "1px solid var(--stroke)",
                  paddingBottom: "8px",
                }}
              >
                👤 Informação do Comercial
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* Nome do Comercial */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="comercial_nome"
                    value={formData.comercial_nome}
                    onChange={handleChange}
                    placeholder="Ex: João Silva"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.comercial_nome ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.comercial_nome && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.comercial_nome}
                    </span>
                  )}
                </div>

                {/* Contacto do Comercial */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Contacto *
                  </label>
                  <input
                    type="text"
                    name="comercial_contacto"
                    value={formData.comercial_contacto}
                    onChange={handleChange}
                    placeholder="+351 932874102"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.comercial_contacto ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.comercial_contacto && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.comercial_contacto}
                    </span>
                  )}
                </div>

                {/* Foto do Comercial */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "var(--text)",
                    }}
                  >
                    Foto do Comercial * <span style={{ fontWeight: "normal", color: "var(--muted)" }}>(max 2MB, deixar vazio para manter atual)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${errors.comercial_foto_url ? "#dc2626" : "var(--stroke)"}`,
                      borderRadius: "6px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                    }}
                  />
                  {errors.comercial_foto_url && (
                    <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                      {errors.comercial_foto_url}
                    </span>
                  )}
                  {formData.comercial_foto_url && !errors.comercial_foto_url && (
                    <span style={{ color: "#10b981", fontSize: "0.75rem" }}>
                      ✓ Foto atual mantida
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Botões */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                paddingTop: "16px",
                borderTop: "1px solid var(--stroke)",
              }}
            >
              <button
                type="button"
                onClick={() => navigate(`/demos/${id}`)}
                className="btn-cancel"
                style={{
                  padding: "12px 24px",
                  border: "1px solid var(--stroke)",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--text)",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "A guardar..." : "Guardar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
