import { useNavigate } from 'react-router-dom';

/** Vista de Analytics - RF6, RU5 */
function Analytics() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/catalog')}>← Voltar</button>
      <h1 style={{ marginTop: '1rem' }}>Analytics</h1>
      <p>Dashboard de métricas de utilização das demos</p>
    </div>
  );
}

export default Analytics;
