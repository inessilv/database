import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import './App.css'

/**
 * Componente raiz da aplicação
 * 
 * Responsabilidades:
 * - Setup do Router (BrowserRouter)
 * - Providers globais (Auth, Theme, etc.)
 * - Layout wrapper (futuro)
 * 
 * NÃO tem lógica de routing - isso está em src/routes/
 */
function App() {
  return (
    <BrowserRouter>
      {/* Futuro: Adicionar providers aqui */}
      {/* <AuthProvider> */}
      {/*   <ThemeProvider> */}
      
      <AppRoutes />
      
      {/*   </ThemeProvider> */}
      {/* </AuthProvider> */}
    </BrowserRouter>
  )
}

export default App