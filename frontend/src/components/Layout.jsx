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
      </main>

      <nav className="bottom-nav glass">
        <a href="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <Home size={22} />
          <span>Inicio</span>
        </a>
        <a href="/catalogo" className={`nav-item ${location.pathname.includes('/catalogo') ? 'active' : ''}`}>
          <Search size={22} />
          <span>Catálogo</span>
        </a>
        <a href="/sincronizacion" className={`nav-item ${location.pathname.includes('/sincronizacion') ? 'active' : ''}`}>
          <Sparkles size={22} />
          <span>Magia IA</span>
        </a>
        <a href="/entregas" className={`nav-item ${location.pathname.includes('/entregas') ? 'active' : ''}`}>
          <ShoppingBag size={22} />
          <span>Entregas</span>
        </a>
        <a href="/clientas" className={`nav-item ${location.pathname.includes('/clientas') ? 'active' : ''}`}>
          <User size={22} />
          <span>Clientas</span>
        </a>
        <a href="/cuentas" className={`nav-item ${location.pathname.includes('/cuentas') ? 'active' : ''}`}>
          <CreditCard size={22} />
          <span>Cuentas</span>
        </a>
      </nav>
    </div>
  );
};

export default Layout;
