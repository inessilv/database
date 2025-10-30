import { useParams, useNavigate } from 'react-router-dom';

/**
 * Vista de Demonstração Individual
 * 
 * Requisitos: RF7 (reencaminhar para web apps), RU6 (abrir web app)
 * Decisão: Iframe para isolamento (RNF1 - containerização, RNF20 - isolamento de dados)
 */
function Demo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/catalog')}>← Voltar ao Catálogo</button>
        <h2>Demo #{id}</h2>
      </div>
      
      <iframe 
        src={`http://localhost:3000/demo-${id}`}
        style={{ flex: 1, border: 'none', width: '100%' }}
        title={`Demo ${id}`}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

export default Demo;
