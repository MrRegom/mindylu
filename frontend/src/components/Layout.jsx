import { Outlet, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, CreditCard, Sparkles } from 'lucide-react';
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
        
        <nav className="bottom-nav glass">
          <a href="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Home size={24} />
            <span>Inicio</span>
          </a>
          <a href="/catalogo" className={`nav-item ${location.pathname.includes('/catalogo') ? 'active' : ''}`}>
            <Search size={24} />
            <span>Catálogo</span>
          </a>
          <a href="/sincronizacion" className={`nav-item ${location.pathname.includes('/sincronizacion') ? 'active' : ''}`}>
            <Sparkles size={24} />
            <span>Magia IA</span>
          </a>
          <a href="/entregas" className={`nav-item ${location.pathname.includes('/entregas') ? 'active' : ''}`}>
            <ShoppingBag size={24} />
            <span>Entregas</span>
          </a>
          <a href="/clientas" className={`nav-item ${location.pathname.includes('/clientas') || location.pathname.includes('/cuentas') ? 'active' : ''}`}>
            <User size={24} />
            <span>Más</span>
          </a>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
