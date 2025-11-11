// // src/routes/index.tsx

// import { Routes, Route, Navigate } from 'react-router-dom'
// import Login from '../views/Login'
// import Catalog from '../views/Lista'
// import Demo from '../views/DemoPage'
// import Analytics from '../views/Analytics'
// import Requests from '../views/Requests'
// import Clients from '../views/Clients'

// /**
//  * Definição de todas as rotas da aplicação
//  * 
//  * Justificação arquitetural:
//  * - Separação de responsabilidades (routing vs app setup)
//  * - Facilita manutenção (todas as rotas num só lugar)
//  * - Escalabilidade (fácil adicionar/remover rotas)
//  */
// export function AppRoutes() {
//   return (
//     <Routes>
//       {/* Rota raiz - redireciona para login */}
//       <Route path="/" element={<Navigate to="/login" replace />} />
      
//       {/* Rotas públicas */}
//       <Route path="/login" element={<Login />} />
      
//       {/* Rotas protegidas (futuro: adicionar PrivateRoute wrapper) */}
//       <Route path="/catalog" element={<Catalog />} />
//       <Route path="/demo/:id" element={<Demo />} />
//       <Route path="/analytics" element={<Analytics />} />
//       <Route path="/requests/all" element={<Requests />} />
//       <Route path="/clients" element={<Clients />} />
      
//       {/* Rota 404 - página não encontrada (opcional) */}
//       <Route path="*" element={<Navigate to="/login" replace />} />
//     </Routes>
//   )
// }