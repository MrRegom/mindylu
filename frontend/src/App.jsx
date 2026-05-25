import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Sincronizacion from './pages/Sincronizacion';
import LotesProgramados from './pages/LotesProgramados';
import LoteAddFotos from './pages/LoteAddFotos';

function App() {
  // Leemos el token real para ver si está logueado
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        
        <Route element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo/nueva" element={<PrendaForm />} />
          <Route path="/catalogo/carga-masiva" element={<CargaMasiva />} />
          <Route path="/catalogo/lotes" element={<LotesProgramados />} />
          <Route path="/catalogo/lotes/:id/editar" element={<LoteAddFotos />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/entregas" element={<Entregas />} />
          <Route path="/clientas/nueva" element={<ClientaForm />} />
          <Route path="/clientas/:id/editar" element={<ClientaForm />} />
          <Route path="/clientas/:id" element={<ClientaDetail />} />
          <Route path="/clientas" element={<Clientas />} />
          <Route path="/cuentas" element={<Cuentas />} />
          <Route path="/sincronizacion" element={<Sincronizacion />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
