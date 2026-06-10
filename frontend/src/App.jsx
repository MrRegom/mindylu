import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';

// Lazy loading de páginas para optimizar rendimiento (Code-Splitting)
const PublicCatalog = lazy(() => import('./pages/PublicCatalog'));
const Layout = lazy(() => import('./components/Layout'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Catalogo = lazy(() => import('./pages/Catalogo'));
const PrendaForm = lazy(() => import('./pages/PrendaForm'));
const CargaMasiva = lazy(() => import('./pages/CargaMasiva'));
const Entregas = lazy(() => import('./pages/Entregas'));
const Clientas = lazy(() => import('./pages/Clientas'));
const ClientaForm = lazy(() => import('./pages/ClientaForm'));
const ClientaDetail = lazy(() => import('./pages/ClientaDetail'));
const Cuentas = lazy(() => import('./pages/Cuentas'));
const Ajustes = lazy(() => import('./pages/Ajustes'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Logs = lazy(() => import('./pages/Logs'));
const Sincronizacion = lazy(() => import('./pages/Sincronizacion'));
const LotesProgramados = lazy(() => import('./pages/LotesProgramados'));
const LoteAddFotos = lazy(() => import('./pages/LoteAddFotos'));
const Perfil = lazy(() => import('./pages/Perfil'));
const SubidaMasiva = lazy(() => import('./pages/SubidaMasiva'));

// Pantalla de carga global ultraligera para las rutas
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
    <div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-pink)', borderRadius: '50%' }} />
  </div>
);

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
      <Suspense fallback={<PageLoader />}>
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
            <Route path="reportes" element={<Reportes />} />
            <Route path="ajustes/logs" element={<Logs />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
