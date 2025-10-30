import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

interface Request {
  id: number
  client_id: number
  demo_id: number
  type: 'renewal' | 'extension'
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

function Requests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form para criar novo pedido
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    client_id: 1,
    demo_id: 1,
    type: 'renewal' as 'renewal' | 'extension',
    reason: ''
  })

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Chamar API Gateway
      const data = await api.get<Request[]>('/api/requests/all')
      setRequests(data)
      
      console.log('✅ Pedidos carregados:', data)
    } catch (err) {
      console.error('❌ Erro ao carregar pedidos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const newRequest = await api.post<Request>('/api/requests', formData)
      
      console.log('✅ Pedido criado:', newRequest)
      
      // Adicionar à lista
      setRequests([newRequest, ...requests])
      
      // Reset form
      setFormData({ client_id: 1, demo_id: 1, type: 'renewal', reason: '' })
      setShowForm(false)
      
      alert('✅ Pedido criado com sucesso!')
    } catch (err) {
      console.error('❌ Erro ao criar pedido:', err)
      alert('❌ Erro ao criar pedido')
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#ffc107'
      case 'approved': return '#28a745'
      case 'rejected': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return '⏳ Pendente'
      case 'approved': return '✅ Aprovado'
      case 'rejected': return '❌ Rejeitado'
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    return type === 'renewal' ? '🔄 Renovação' : '⏱️ Extensão'
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>⏳ A carregar pedidos...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <h2>❌ Erro ao conectar com Request Service</h2>
        <p>{error}</p>
        <button onClick={loadRequests} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          🔄 Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>📝 Gestão de Pedidos</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/catalog')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            📚 Catálogo
          </button>
          <button onClick={() => navigate('/analytics')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            📊 Analytics
          </button>
          <button onClick={() => navigate('/clients')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            👥 Clientes
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Banner de sucesso */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#d4edda', 
        border: '2px solid #28a745',
        borderRadius: '8px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <strong>✅ Comunicação Frontend → API Gateway → Request Service funciona!</strong>
        <br />
        <small>Recebidos {requests.length} pedidos do microsserviço</small>
      </div>

      {/* Botão criar pedido */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ 
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {showForm ? '❌ Cancelar' : '➕ Novo Pedido'}
        </button>
      </div>

      {/* Formulário criar pedido */}
      {showForm && (
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '2px solid #dee2e6'
        }}>
          <h3>➕ Criar Novo Pedido</h3>
          <form onSubmit={createRequest}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                Cliente ID:
              </label>
              <input 
                type="number"
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                required
                min="1"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                Demo ID:
              </label>
              <input 
                type="number"
                value={formData.demo_id}
                onChange={(e) => setFormData({...formData, demo_id: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                required
                min="1"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                Tipo:
              </label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as 'renewal' | 'extension'})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
              >
                <option value="renewal">🔄 Renovação</option>
                <option value="extension">⏱️ Extensão</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                Motivo:
              </label>
              <textarea 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  border: '1px solid #ced4da',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
                placeholder="Motivo do pedido..."
              />
            </div>
            
            <button 
              type="submit"
              style={{ 
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              ✅ Criar Pedido
            </button>
          </form>
        </div>
      )}

      {/* Lista de pedidos */}
      <div>
        <h2>Lista de Pedidos ({requests.length})</h2>
        {requests.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Sem pedidos registados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map(request => (
              <div 
                key={request.id}
                style={{ 
                  border: '2px solid #ddd', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>
                      Pedido #{request.id} - {getTypeLabel(request.type)}
                    </h3>
                    <p style={{ margin: '0.5rem 0', color: '#555' }}>
                      <strong>Cliente:</strong> {request.client_id} | <strong>Demo:</strong> {request.demo_id}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#555' }}>
                      <strong>Motivo:</strong> {request.reason || 'Sem motivo especificado'}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      📅 Criado: {new Date(request.created_at).toLocaleString('pt-PT')}
                    </p>
                  </div>
                  <div style={{ 
                    padding: '0.5rem 1rem',
                    backgroundColor: getStatusColor(request.status),
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    minWidth: '120px',
                    textAlign: 'center'
                  }}>
                    {getStatusLabel(request.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Requests