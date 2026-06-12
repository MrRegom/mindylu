import { Outlet, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, CreditCard, Settings, LogOut, BarChart2, MessageCircle } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  
  // No mostrar navegación en la pantalla de login
  if (location.pathname === '/panel/login' || location.pathname === '/login') {
    return <Outlet />;
  }

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.replace('/panel/login');
  };

  return (
    <div className="layout-container">
      {/* Sidebar para Desktop */}
      <aside className="sidebar desktop-only glass">
        <div className="sidebar-logo">
          MindyLu
        </div>
        <nav className="sidebar-nav">
          <a href="/panel" className={`nav-item ${location.pathname === '/panel' ? 'active' : ''}`}>
            <Home size={20} />
            <span>Inicio</span>
          </a>
          <a href="/panel/catalogo" className={`nav-item ${location.pathname.includes('/panel/catalogo') ? 'active' : ''}`}>
            <Search size={20} />
            <span>Catálogo</span>
          </a>
          <a href="/panel/ajustes" className={`nav-item ${location.pathname.includes('/panel/ajustes') ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Ajustes</span>
          </a>
          <a href="/panel/entregas" className={`nav-item ${location.pathname.includes('/panel/entregas') ? 'active' : ''}`}>
            <ShoppingBag size={20} />
            <span>Entregas</span>
          </a>
          <a href="/panel/clientas" className={`nav-item ${location.pathname.includes('/panel/clientas') ? 'active' : ''}`}>
            <User size={20} />
            <span>Clientes</span>
          </a>
          <a href="/panel/reportes" className={`nav-item ${location.pathname.includes('/panel/reportes') ? 'active' : ''}`}>
            <BarChart2 size={20} />
            <span>Reportes</span>
          </a>
          <a href="/panel/whatsapp" className={`nav-item ${location.pathname.includes('/panel/whatsapp') ? 'active' : ''}`}>
            <MessageCircle size={20} />
            <span>WhatsApp</span>
          </a>
          <a href="/panel/perfil" className={`nav-item ${location.pathname.includes('/panel/perfil') ? 'active' : ''}`}>
            <CreditCard size={20} />
            <span>Perfil</span>
          </a>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', color: 'var(--color-danger)', marginTop: 'auto', cursor: 'pointer' }}>
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>

        {/* Bottom Nav para Móvil */}
        <nav className="bottom-nav mobile-only glass">
          <a href="/panel" className={`nav-item ${location.pathname === '/panel' ? 'active' : ''}`}>
            <Home size={22} />
            <span>Inicio</span>
          </a>
          <a href="/panel/catalogo" className={`nav-item ${location.pathname.includes('/panel/catalogo') ? 'active' : ''}`}>
            <Search size={22} />
            <span>Catálogo</span>
          </a>
          <a href="/panel/ajustes" className={`nav-item ${location.pathname.includes('/panel/ajustes') ? 'active' : ''}`}>
            <Settings size={22} />
            <span>Ajustes</span>
          </a>
          <a href="/panel/entregas" className={`nav-item ${location.pathname.includes('/panel/entregas') ? 'active' : ''}`}>
            <ShoppingBag size={22} />
            <span>Entregas</span>
          </a>
          <a href="/panel/clientas" className={`nav-item ${location.pathname.includes('/panel/clientas') ? 'active' : ''}`}>
            <User size={22} />
            <span>Clientes</span>
          </a>
          <a href="/panel/reportes" className={`nav-item ${location.pathname.includes('/panel/reportes') ? 'active' : ''}`}>
            <BarChart2 size={22} />
            <span>Reportes</span>
          </a>
          <a href="/panel/whatsapp" className={`nav-item ${location.pathname.includes('/panel/whatsapp') ? 'active' : ''}`}>
            <MessageCircle size={22} />
            <span>WhatsApp</span>
          </a>
          <a href="/panel/perfil" className={`nav-item ${location.pathname.includes('/panel/perfil') ? 'active' : ''}`}>
            <CreditCard size={22} />
            <span>Perfil</span>
          </a>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', color: 'var(--color-danger)', padding: '8px', cursor: 'pointer' }}>
            <LogOut size={22} />
            <span>Salir</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
