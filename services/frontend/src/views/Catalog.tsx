import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Demo {
  id: number
  title: string
  description: string
  url: string
}

function Catalog() {
  const navigate = useNavigate()
  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDemos()
  }, [])

  const loadDemos = async () => {
    try {
      setLoading(true)
      setError(null)

      // 🔹 Dados estáticos simulando resposta do backend
      const mockData: Demo[] = [
        {
          id: 1,
          title: 'Integração com API Gateway',
          description: 'Demonstra a comunicação entre frontend e backend via API Gateway.',
          url: 'https://demo.api-gateway.example',
        },
        {
          id: 2,
          title: 'Autenticação com Keycloak',
          description: 'Exemplo de login e refresh token usando Keycloak.',
          url: 'https://demo.keycloak.example',
        },
        {
          id: 3,
          title: 'Dashboard Analytics',
          description: 'Visualização de métricas e gráficos em tempo real.',
          url: 'https://demo.analytics.example',
        },
        {
          id: 4,
          title: 'Gestão de Clientes',
          description: 'CRUD completo de clientes e permissões associadas.',
          url: 'https://demo.clients.example',
        },
      ]

      // Simula um pequeno delay de rede
      await new Promise((resolve) => setTimeout(resolve, 500))

      setDemos(mockData)
    } catch (err) {
      console.error('❌ Erro ao carregar demos:', err)
      setError('Falha ao carregar dados estáticos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>⏳ A carregar demos...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <h2>❌ Erro</h2>
        <p>{error}</p>
        <button onClick={loadDemos} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          🔄 Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>📚 Catálogo de Demonstrações</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/analytics')} style={{ padding: '0.5rem 1rem' }}>
            📊 Analytics
          </button>
          <button onClick={() => navigate('/requests/all')} style={{ padding: '0.5rem 1rem' }}>
            📝 Pedidos
          </button>
          <button onClick={() => navigate('/clients')} style={{ padding: '0.5rem 1rem' }}>
            👥 Clientes
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '0.5rem 1rem' }}>
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Indicador de comunicação (mock) */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#d4edda', 
        border: '2px solid #28a745',
        borderRadius: '8px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <strong>✅ Comunicação simulada com API Gateway</strong>
        <br />
        <small>Recebidas {demos.length} demos (mockadas)</small>
      </div>

      {/* Grid de demos */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {demos.map(demo => (
          <div 
            key={demo.id}
            onClick={() => navigate(`/demo/${demo.id}`)}
            style={{ 
              border: '2px solid #ddd', 
              padding: '1.5rem', 
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: '#f8f9fa',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginBottom: '0.5rem' }}>{demo.title}</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>{demo.description}</p>
            <small style={{ color: '#999', fontSize: '0.8rem' }}>🔗 {demo.url}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Catalog
