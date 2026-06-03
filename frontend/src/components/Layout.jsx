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
          <a href="/admin" className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <Home size={22} />
            <span>Inicio</span>
          </a>
          <a href="/admin/catalogo" className={`nav-item ${location.pathname.includes('/admin/catalogo') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <Search size={22} />
            <span>Catálogo</span>
          </a>
          <a href="/admin/ajustes" className={`nav-item ${location.pathname.includes('/admin/ajustes') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <Settings size={22} />
            <span>Ajustes</span>
          </a>
          <a href="/admin/entregas" className={`nav-item ${location.pathname.includes('/admin/entregas') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <ShoppingBag size={22} />
            <span>Entregas</span>
          </a>
          <a href="/admin/clientas" className={`nav-item ${location.pathname.includes('/admin/clientas') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <User size={22} />
            <span>Clientes</span>
          </a>
          <a href="/admin/perfil" className={`nav-item ${location.pathname.includes('/admin/perfil') ? 'active' : ''}`} style={{ fontSize: '0.65rem' }}>
            <CreditCard size={22} />
            <span>Perfil</span>
          </a>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
