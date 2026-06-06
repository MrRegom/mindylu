import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicCatalog from './pages/PublicCatalog';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import PrendaForm from './pages/PrendaForm';
import CargaMasiva from './pages/CargaMasiva';
import Entregas from './pages/Entregas';
import Clientas from './pages/Clientas';
import ClientaForm from './pages/ClientaForm';
import ClientaDetail from './pages/ClientaDetail';
import Cuentas from './pages/Cuentas';
import Ajustes from './pages/Ajustes';
import Logs from './pages/Logs';
import Sincronizacion from './pages/Sincronizacion';
import LotesProgramados from './pages/LotesProgramados';
import LoteAddFotos from './pages/LoteAddFotos';
import Perfil from './pages/Perfil';
import SubidaMasiva from './pages/SubidaMasiva';
import { useEffect } from 'react';

// Componente auxiliar: aplica clase CSS al body según si estamos en el panel o no
function BodyClassManager() {
  const location = useLocation();
  useEffect(() => {
    const isAdmin = location.pathname.startsWith('/panel') || location.pathname.startsWith('/login');
    document.body.classList.toggle('page-admin', isAdmin);
    document.body.classList.toggle('page-public', !isAdmin);
  }, [location]);
  return null;
}

function App() {
  // Leemos el token real para ver si está logueado
  const isAuthenticated = !!localStorage.getItem('access_token');

  useEffect(() => {
    // Escuchar cambios de historial (flecha atrás) para evitar vistas cacheadas
    const handlePopState = () => {
      if (!localStorage.getItem('access_token') && window.location.pathname.startsWith('/panel') && window.location.pathname !== '/panel/login') {
        window.location.replace('/panel/login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <Router>
      <BodyClassManager />
      <Routes>
        <Route path="/panel/login" element={
          isAuthenticated ? <Navigate to="/panel" replace /> : <Login />
        } />
        {/* Compatibilidad con la ruta antigua /login */}
        <Route path="/login" element={<Navigate to="/panel/login" replace />} />
        
        {/* Catálogo Público (Sin Login) */}
        <Route path="/" element={<PublicCatalog />} />
        
        {/* Panel de Administración (Con Login) */}
        <Route path="/panel" element={
          isAuthenticated ? <Layout /> : <Navigate to="/panel/login" replace />
        }>
          <Route index element={<Home />} />
          <Route path="catalogo/nueva" element={<PrendaForm />} />
          <Route path="catalogo/subida-masiva" element={<SubidaMasiva />} />
          <Route path="catalogo/carga-masiva" element={<CargaMasiva />} />
          <Route path="catalogo/lotes" element={<LotesProgramados />} />
          <Route path="catalogo/lotes/:id/editar" element={<LoteAddFotos />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="entregas" element={<Entregas />} />
          <Route path="clientas/nueva" element={<ClientaForm />} />
          <Route path="clientas/:id/editar" element={<ClientaForm />} />
          <Route path="clientas/:id" element={<ClientaDetail />} />
          <Route path="clientas" element={<Clientas />} />
          <Route path="cuentas" element={<Cuentas />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="ajustes/logs" element={<Logs />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
