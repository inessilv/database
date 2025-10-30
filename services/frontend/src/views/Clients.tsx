import { useNavigate } from 'react-router-dom';

/** Vista de Clientes - RU2, RU3, RU7 */
function Clients() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/catalog')}>← Voltar</button>
      <h1 style={{ marginTop: '1rem' }}>Gestão de Clientes</h1>
      <p>Administração de clientes e suas demos</p>
    </div>
  );
}

export default Clients;
