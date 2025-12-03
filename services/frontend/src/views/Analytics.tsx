/**
 * Analytics View - Dashboard de Métricas
 * 
 * Página de analytics integrada no frontend
 * Consome dados do Metrics Exporter Service
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Types para as métricas
interface LogsOverview {
  total_logs: number;
  last_24h: {
    total: number;
    logins: number;
    demos_abertas: number;
    erros: number;
  };
  last_7d: {
    total: number;
    logins: number;
    demos_abertas: number;
    erros: number;
  };
  last_30d: {
    total: number;
    logins: number;
    demos_abertas: number;
    erros: number;
  };
}

interface ClientsOverview {
  total_clientes: number;
  ativos: number;
  expirados: number;
  expira_breve: number;
}

interface DemosOverview {
  total_demos: number;
  ativas: number;
  inativas: number;
  por_vertical: Record<string, number>;
}

interface TopClient {
  cliente_id: string;
  cliente_nome: string;  // ✅ Adicionar
  total_eventos: number;
  logins: number;
  demos_abertas: number;
}

interface TopDemo {
  demo_id: string;
  demo_nome: string;  // ✅ Adicionar
  aberturas: number;
}

interface DemoUsage {
  demo_id: string;
  demo_nome: string;
  aberturas: number;
}

interface ClienteDemos {
  cliente_id: string;
  cliente_nome: string;
  demos_list: DemoUsage[];
  total_aberturas: number;
}

type User = { id: string; name: string; role: "admin" | "viewer" };

interface Props {
  user: User;
}

export default function Analytics({ user }: Props) {
  const navigate = useNavigate();

  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Métricas
  const [logsOverview, setLogsOverview] = useState<LogsOverview | null>(null);
  const [clientsOverview, setClientsOverview] = useState<ClientsOverview | null>(null);
  const [demosOverview, setDemosOverview] = useState<DemosOverview | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [topDemos, setTopDemos] = useState<TopDemo[]>([]);
  const [demosPorCliente, setDemosPorCliente] = useState<ClienteDemos[]>([]);

  // Período selecionado para métricas
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");

  // Redirect se não for admin
  if (user.role !== "admin") {
    navigate("/demos");
    return null;
  }

  // Fetch métricas
  useEffect(() => {
    fetchAnalytics();
    // Refresh a cada 30 segundos
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // URL do Metrics Exporter (via Catalog ou direto)
      // IMPORTANTE: Ajustar conforme tua configuração
      const METRICS_URL = window.location.origin.replace(':30300', ':30800') + '/api/metrics'; // Ou "http://localhost:9090/metrics"

      // Fetch todas as métricas em paralelo
      const [logsRes, clientsRes, demosRes, topClientsRes, topDemosRes, demosPorClienteRes] = await Promise.all([
        fetch(`${METRICS_URL}/logs/overview`),
        fetch(`${METRICS_URL}/clients/overview`),
        fetch(`${METRICS_URL}/demos/overview`),
        fetch(`${METRICS_URL}/logs/top-clients?limit=5`),
        fetch(`${METRICS_URL}/demos/top-used?limit=5`),
        fetch(`${METRICS_URL}/logs/demos-per-client`),
      ]);

      if (!logsRes.ok || !clientsRes.ok || !demosRes.ok) {
        throw new Error("Erro ao carregar métricas");
      }

      const logs = await logsRes.json();
      const clients = await clientsRes.json();
      const demos = await demosRes.json();
      const topClientsData = await topClientsRes.json();
      const topDemosData = await topDemosRes.json();
      const demosPorClienteData = await demosPorClienteRes.json();

      setLogsOverview(logs);
      setClientsOverview(clients);
      setDemosOverview(demos);
      setTopClients(topClientsData.top_clients || []);
      setTopDemos(topDemosData.top_demos || []);
      setDemosPorCliente(demosPorClienteData.clientes_demos || []);
    } catch (err) {
      console.error("Erro ao carregar analytics:", err);
      setError("Não foi possível carregar as métricas. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Helper para obter métricas do período selecionado
  const getPeriodMetrics = () => {
    if (!logsOverview) return null;
    return logsOverview[`last_${period}`];
  };

  if (loading && !logsOverview) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">A carregar...</span>
          </div>
          <p className="mt-3">A carregar analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Erro!</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchAnalytics}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const periodMetrics = getPeriodMetrics();

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: "var(--text)" }}>📊 Analytics Dashboard</h2>
          <p className="mb-0" style={{ color: "var(--text)" }}>Visão geral das métricas do sistema</p>
        </div>

        <div className="d-flex gap-2 align-items-center">
          {/* Selector de período */}
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm ${period === "24h" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setPeriod("24h")}
            >
              24 Horas
            </button>
            <button
              className={`btn btn-sm ${period === "7d" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setPeriod("7d")}
            >
              7 Dias
            </button>
            <button
              className={`btn btn-sm ${period === "30d" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setPeriod("30d")}
            >
              30 Dias
            </button>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            {loading ? "🔄" : "↻"} Atualizar
          </button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="row g-3 mb-4">
        {/* Clientes */}
        <div className="col-md-3">
          <div className="card h-100" style={{ borderColor: '#3b82f6', borderWidth: '2px', borderStyle: 'solid' }}>
            <div className="card-body">
              <h6 className="mb-0" style={{ color: "var(--text)" }}>👥 Clientes</h6>
              <h2 className="card-title mb-1" style={{ color: "var(--text)" }}>{clientsOverview?.total_clientes || 0}</h2>
              <div className="small">
                <span className="badge bg-success me-1">{clientsOverview?.ativos || 0} Ativos</span>
                <span className="badge bg-warning me-1">{clientsOverview?.expira_breve || 0} A expirar</span>
                <span className="badge bg-danger">{clientsOverview?.expirados || 0} Expirados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demos */}
        <div className="col-md-3">
          <div className="card h-100" style={{ borderColor: '#22c55e', borderWidth: '2px', borderStyle: 'solid' }}>
            <div className="card-body">
              <h6 className="mb-0" style={{ color: "var(--text)" }}>🎯 Demos</h6>
              <h2 className="card-title mb-1" style={{ color: "var(--text)" }}>{demosOverview?.total_demos || 0}</h2>
              <div className="small">
                <span className="badge bg-success me-1">{demosOverview?.ativas || 0} Ativas</span>
                <span className="badge bg-secondary">{demosOverview?.inativas || 0} Inativas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eventos */}
        <div className="col-md-3">
          <div className="card h-100" style={{ borderColor: '#06b6d4', borderWidth: '2px', borderStyle: 'solid' }}>
            <div className="card-body">
              <h6 className="mb-0" style={{ color: "var(--text)" }}>📝 Eventos ({period})</h6>
              <h2 className="card-title mb-1" style={{ color: "var(--text)" }}>{periodMetrics?.total || 0}</h2>
              <div className="mb-0" style={{ color: "var(--text)" }}>
                {periodMetrics?.logins || 0} logins · {periodMetrics?.demos_abertas || 0} demos
              </div>
            </div>
          </div>
        </div>

        {/* Erros */}
        <div className="col-md-3">
          <div className="card h-100" style={{ borderColor: '#ef4444', borderWidth: '2px', borderStyle: 'solid' }}>
            <div className="card-body">
              <h6 className="mb-0" style={{ color: "var(--text)" }}>⚠️ Erros ({period})</h6>
              <h2 className="card-title mb-1" style={{ color: "var(--text)" }}>{periodMetrics?.erros || 0}</h2>
              <div className="mb-0" style={{ color: "var(--text)" }}>
                {periodMetrics?.erros === 0 ? "✅ Nenhum erro" : "❌ Verificar logs"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e tabelas */}
      <div className="row g-3">
        {/* Coluna esquerda */}
        <div className="col-lg-6">
          {/* Top Clientes Ativos */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0" style={{ color: "var(--text)" }}>🏆 Top 5 Clientes Ativos</h5>
            </div>
            <div className="card-body">
              {topClients.length === 0 ? (
                <p className="text-muted mb-0" style={{ color: "var(--muted)" }}>Nenhum dado disponível</p>
              ) : (
                <div style={{ overflow: "auto" }}>
                  <table 
                    style={{
                      width: "100%",
                      backgroundColor: "var(--bg-2)",
                      border: "1px solid var(--stroke)",
                      borderRadius: "8px",
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      overflow: "hidden"
                    }}
                  >
                    <thead style={{ backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>
                      <tr>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "left", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Cliente</th>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Eventos</th>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Logins</th>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Demos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClients.map((client, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--stroke)", backgroundColor: "var(--bg-2)" }}>
                          <td style={{ maxWidth: "150px", color: "var(--text)", padding: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", backgroundColor: "var(--bg-2)" }}>
                            {client.cliente_nome}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", backgroundColor: "var(--bg-2)" }}>
                            <span className="badge bg-primary">{client.total_eventos}</span>
                          </td>
                          <td style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg-2)" }}>{client.logins}</td>
                          <td style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg-2)" }}>{client.demos_abertas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Demos por Vertical */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0" style={{ color: "var(--text)" }}>📊 Demos por Vertical</h5>
            </div>
            <div className="card-body">
              {!demosOverview?.por_vertical || Object.keys(demosOverview.por_vertical).length === 0 ? (
                <p className="text-muted mb-0" style={{ color: "var(--muted)" }}>Nenhum dado disponível</p>
              ) : (
                <div className="row g-2">
                  {Object.entries(demosOverview.por_vertical).map(([vertical, count]) => (
                    <div key={vertical} className="col-6">
                      <div className="p-3 border rounded">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-truncate" style={{ color: "var(--text)" }}>{vertical}</span>
                          <span className="badge bg-secondary">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="col-lg-6">
          {/* Top Demos Utilizadas */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0" style={{ color: "var(--text)" }}>🎯 Top 5 Demos Mais Usadas</h5>
            </div>
            <div className="card-body">
              {topDemos.length === 0 ? (
                <p className="text-muted mb-0" style={{ color: "var(--muted)" }}>Nenhum dado disponível</p>
              ) : (
                <div style={{ overflow: "auto" }}>
                  <table 
                    style={{
                      width: "100%",
                      backgroundColor: "var(--bg-2)",
                      border: "1px solid var(--stroke)",
                      borderRadius: "8px",
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      overflow: "hidden"
                    }}
                  >
                    <thead style={{ backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>
                      <tr>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "left", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Demo</th>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Aberturas</th>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDemos.map((demo, idx) => {
                        const totalAberturas = topDemos.reduce((sum, d) => sum + d.aberturas, 0);
                        const percentage = ((demo.aberturas / totalAberturas) * 100).toFixed(1);
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--stroke)", backgroundColor: "var(--bg-2)" }}>
                            <td style={{ maxWidth: "200px", color: "var(--text)", padding: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", backgroundColor: "var(--bg-2)" }}>
                              {demo.demo_nome}
                            </td>
                            <td style={{ padding: "12px", textAlign: "right", backgroundColor: "var(--bg-2)" }}>
                              <span className="badge bg-success">{demo.aberturas}</span>
                            </td>
                            <td style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg-2)" }}>{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Resumo de atividade */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0" style={{ color: "var(--text)" }}>📈 Resumo de Atividade</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: "var(--text)" }}>Últimas 24h</span>
                  <span className="badge bg-info">{logsOverview?.last_24h.total || 0} eventos</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-info"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: "var(--text)" }}>Últimos 7 dias</span>
                  <span className="badge bg-primary">{logsOverview?.last_7d.total || 0} eventos</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{
                      width: `${Math.min(
                        ((logsOverview?.last_7d.total || 0) / (logsOverview?.last_30d.total || 1)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: "var(--text)" }}>Últimos 30 dias</span>
                  <span className="badge bg-secondary">{logsOverview?.last_30d.total || 0} eventos</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-secondary"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              <hr />

              <div className="mb-0" style={{ color: "var(--text)" }}>
                <p className="mb-1">
                  📊 <strong>Taxa de crescimento (7d vs 30d):</strong>{" "}
                  {logsOverview?.last_7d.total && logsOverview?.last_30d.total
                    ? `${(
                        ((logsOverview.last_7d.total * 4.3) / logsOverview.last_30d.total) *
                        100
                      ).toFixed(1)}%`
                    : "N/A"}
                </p>
                <p className="mb-0" style={{ color: "var(--text)" }}>
                  🔄 <strong>Última atualização:</strong> {new Date().toLocaleTimeString("pt-PT")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nova Secção: Demos por Cliente */}
      <div className="row g-3 mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0" style={{ color: "var(--text)" }}>📂 Demos Utilizadas por Cliente</h5>
            </div>
            <div className="card-body">
              {demosPorCliente.length === 0 ? (
                <p className="text-muted mb-0" style={{ color: "var(--muted)" }}>Nenhum dado disponível</p>
              ) : (
                <div style={{ overflow: "auto" }}>
                  <table 
                    style={{
                      width: "100%",
                      backgroundColor: "var(--bg-2)",
                      border: "1px solid var(--stroke)",
                      borderRadius: "8px",
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      overflow: "hidden"
                    }}
                  >
                    <thead style={{ backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>
                      <tr>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "left", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Cliente</th>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "left", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Demos Utilizadas</th>
                        <th style={{ color: "var(--text)", padding: "12px", textAlign: "right", backgroundColor: "var(--bg)", borderBottom: "2px solid var(--stroke)" }}>Total Aberturas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demosPorCliente.map((cliente, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--stroke)", backgroundColor: "var(--bg-2)" }}>
                          <td style={{ color: "var(--text)", padding: "12px", backgroundColor: "var(--bg-2)" }}>
                            <strong>{cliente.cliente_nome}</strong>
                          </td>
                          <td style={{ padding: "12px", backgroundColor: "var(--bg-2)" }}>
                            {cliente.demos_list.map((demo, demoIdx) => (
                              <div key={demoIdx} style={{ marginBottom: "4px" }}>
                                <span style={{ color: "var(--text)" }}>{demo.demo_nome}</span>
                                <span className="badge bg-primary" style={{ marginLeft: "8px" }}>{demo.aberturas}x</span>
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", backgroundColor: "var(--bg-2)" }}>
                            <span className="badge bg-success" style={{ fontSize: "1rem" }}>
                              {cliente.total_aberturas}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}