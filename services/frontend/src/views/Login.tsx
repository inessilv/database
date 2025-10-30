import { useNavigate } from 'react-router-dom';

/**
 * Vista de Login
 * 
 * Estado: Esqueleto básico
 * Próximos passos: Integrar com Keycloak OAuth 2.0 (RNF5, RNF21, RNF22)
 */
function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // TODO: Implementar autenticação real com Keycloak
    navigate('/catalog');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>E-Catalog LTPLabs</h1>
      <h2>Login</h2>
      <div style={{ marginTop: '2rem' }}>
        <input 
          type="email" 
          placeholder="Email" 
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <button 
          onClick={handleLogin}
          style={{ width: '100%', padding: '0.75rem', cursor: 'pointer' }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

export default Login;
