/**
 * TimeAnalytics Component
 * Componente para visualizar métricas de tempo de utilização de demos
 * Adicionar ao Analytics.tsx
 */

import { useState, useEffect } from "react";

interface TimeOverview {
  total_sessoes: number;
  tempo_total_minutos: number;
  tempo_total_horas: number;
  duracao_media_minutos: number;
  sessoes_hoje: number;
  tempo_hoje_minutos: number;
}

interface TopClientTime {
  cliente_id: string;
  total_sessoes: number;
  tempo_total_minutos: number;
  duracao_media_segundos: number;
}

interface TopDemoTime {
  demo_id: string;
  total_sessoes: number;
  usuarios_unicos: number;
  tempo_total_minutos: number;
  duracao_media_segundos: number;
}

interface TimeByPeriod {
  data: string;
  sessoes: number;
  tempo_total_minutos: number;
  duracao_media_minutos: number;
}

// Função auxiliar para formatar tempo
const formatarTempo = (minutos: number): string => {
  if (minutos < 60) {
    return `${Math.round(minutos)}min`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  return `${horas}h ${mins}min`;
};

// Componente Principal
export function TimeAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [timeOverview, setTimeOverview] = useState<TimeOverview | null>(null);
  const [topClients, setTopClients] = useState<TopClientTime[]>([]);
  const [topDemos, setTopDemos] = useState<TopDemoTime[]>([]);
  const [timeByPeriod, setTimeByPeriod] = useState<TimeByPeriod[]>([]);

  const METRICS_URL = window.location.origin.replace(':30300', ':30800') + '/api/metrics';

  useEffect(() => {
    fetchTimeMetrics();
    const interval = setInterval(fetchTimeMetrics, 60000); // Refresh cada minuto
    return () => clearInterval(interval);
  }, []);

  const fetchTimeMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, clientsRes, demosRes, periodRes] = await Promise.all([
        fetch(`${METRICS_URL}/time/overview`),
        fetch(`${METRICS_URL}/time/top-clients?limit=10`),
        fetch(`${METRICS_URL}/time/top-demos?limit=10`),
        fetch(`${METRICS_URL}/time/by-period?days=7`),
      ]);

      if (!overviewRes.ok) throw new Error("Erro ao carregar métricas de tempo");

      const overview = await overviewRes.json();
      const clients = await clientsRes.json();
      const demos = await demosRes.json();
      const period = await periodRes.json();

      setTimeOverview(overview);
      setTopClients(clients.top_clientes || []);
      setTopDemos(demos.top_demos || []);
      setTimeByPeriod(period.dados_por_dia || []);
    } catch (err) {
      console.error("Erro ao carregar métricas de tempo:", err);
      setError("Não foi possível carregar as métricas de tempo");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !timeOverview) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">A carregar...</span>
        </div>
        <p className="mt-3">A carregar métricas de tempo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning" role="alert">
        {error}
      </div>
    );
  }

  if (!timeOverview) return null;

  return (
    <div className="time-analytics">
      {/* Cards Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-info h-100">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">⏱️ Tempo Total</h6>
              <h2 className="card-title mb-1">{formatarTempo(timeOverview.tempo_total_minutos)}</h2>
              <div className="small text-muted">
                {timeOverview.tempo_total_horas.toFixed(1)}h de utilização
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-success h-100">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">📊 Total Sessões</h6>
              <h2 className="card-title mb-1">{timeOverview.total_sessoes}</h2>
              <div className="small text-muted">
                Hoje: {timeOverview.sessoes_hoje} sessões
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-warning h-100">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">⌛ Duração Média</h6>
              <h2 className="card-title mb-1">{formatarTempo(timeOverview.duracao_media_minutos)}</h2>
              <div className="small text-muted">
                por sessão
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-primary h-100">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">🕐 Hoje</h6>
              <h2 className="card-title mb-1">{formatarTempo(timeOverview.tempo_hoje_minutos)}</h2>
              <div className="small text-muted">
                {timeOverview.sessoes_hoje} sessões
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas e Gráficos */}
      <div className="row g-3">
        {/* Top Clientes por Tempo */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">👥 Top 10 Clientes por Tempo de Utilização</h5>
            </div>
            <div className="card-body">
              {topClients.length === 0 ? (
                <p className="text-muted mb-0">Nenhum dado disponível</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th className="text-end">Sessões</th>
                        <th className="text-end">Tempo Total</th>
                        <th className="text-end">Média/Sessão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClients.map((client, idx) => (
                        <tr key={idx}>
                          <td className="text-truncate" style={{ maxWidth: "150px" }}>
                            {client.cliente_id}
                          </td>
                          <td className="text-end">
                            <span className="badge bg-secondary">{client.total_sessoes}</span>
                          </td>
                          <td className="text-end">
                            <strong>{formatarTempo(client.tempo_total_minutos)}</strong>
                          </td>
                          <td className="text-end text-muted">
                            {formatarTempo(client.duracao_media_segundos / 60)}
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

        {/* Top Demos por Tempo */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">🎯 Top 10 Demos por Tempo de Utilização</h5>
            </div>
            <div className="card-body">
              {topDemos.length === 0 ? (
                <p className="text-muted mb-0">Nenhum dado disponível</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Demo</th>
                        <th className="text-end">Usuários</th>
                        <th className="text-end">Tempo Total</th>
                        <th className="text-end">Média/Sessão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDemos.map((demo, idx) => (
                        <tr key={idx}>
                          <td className="text-truncate" style={{ maxWidth: "150px" }}>
                            {demo.demo_id}
                          </td>
                          <td className="text-end">
                            <span className="badge bg-info">{demo.usuarios_unicos}</span>
                          </td>
                          <td className="text-end">
                            <strong>{formatarTempo(demo.tempo_total_minutos)}</strong>
                          </td>
                          <td className="text-end text-muted">
                            {formatarTempo(demo.duracao_media_segundos / 60)}
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

        {/* Tempo por Período (7 dias) */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">📈 Utilização nos Últimos 7 Dias</h5>
            </div>
            <div className="card-body">
              {timeByPeriod.length === 0 ? (
                <p className="text-muted mb-0">Nenhum dado disponível</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped mb-0">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th className="text-end">Sessões</th>
                        <th className="text-end">Tempo Total</th>
                        <th className="text-end">Duração Média</th>
                        <th>Barra Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeByPeriod.map((day, idx) => {
                        const maxTempo = Math.max(...timeByPeriod.map(d => d.tempo_total_minutos));
                        const percentage = (day.tempo_total_minutos / maxTempo) * 100;
                        
                        return (
                          <tr key={idx}>
                            <td>
                              <strong>{new Date(day.data).toLocaleDateString('pt-PT')}</strong>
                            </td>
                            <td className="text-end">
                              <span className="badge bg-secondary">{day.sessoes}</span>
                            </td>
                            <td className="text-end">
                              <strong>{formatarTempo(day.tempo_total_minutos)}</strong>
                            </td>
                            <td className="text-end text-muted">
                              {formatarTempo(day.duracao_media_minutos)}
                            </td>
                            <td>
                              <div className="progress" style={{ height: "20px" }}>
                                <div
                                  className="progress-bar bg-success"
                                  style={{ width: `${percentage}%` }}
                                  role="progressbar"
                                >
                                  {percentage > 20 && `${percentage.toFixed(0)}%`}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-3">
        <div className="alert alert-info" role="alert">
          <strong>💡 Nota:</strong> As métricas de tempo são baseadas em sessões de demos 
          completadas. Sessões ativas (ainda abertas) não são contabilizadas até serem fechadas.
        </div>
      </div>
    </div>
  );
}

export default TimeAnalytics;