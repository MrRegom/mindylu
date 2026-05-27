import { Outlet, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, CreditCard, Settings } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  
  // No mostrar navegación en la pantalla de login
  if (location.pathname === '/login') {
    return <Outlet />;
  }

  return (
    <div className="layout-container">
      <main className="main-content">
        <Outlet />
        <nav className="bottom-nav glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, padding: '8px 4px' }}>
          <a href="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <Home size={22} />
            <span>Inicio</span>
          </a>
          <a href="/catalogo" className={`nav-item ${location.pathname.includes('/catalogo') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <Search size={22} />
            <span>Catálogo</span>
          </a>
          <a href="/ajustes" className={`nav-item ${location.pathname.includes('/ajustes') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <Settings size={22} />
            <span>Ajustes</span>
          </a>
          <a href="/entregas" className={`nav-item ${location.pathname.includes('/entregas') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <ShoppingBag size={22} />
            <span>Entregas</span>
          </a>
          <a href="/clientas" className={`nav-item ${location.pathname.includes('/clientas') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <User size={22} />
            <span>Clientes</span>
          </a>
          <a href="/perfil" className={`nav-item ${location.pathname.includes('/perfil') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <CreditCard size={22} />
            <span>Perfil</span>
          </a>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
