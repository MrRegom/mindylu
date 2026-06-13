import { Outlet, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, Settings, LogOut, BarChart2, MessageCircle, Plus, ChevronRight } from 'lucide-react';
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
      <aside className="sidebar desktop-only">
        <div className="sidebar-logo">
          MindyLu<span style={{ color: 'var(--color-primary)' }}>.</span>
        </div>
        
        <div className="sidebar-new-btn-container">
          <button className="sidebar-new-btn" onClick={() => window.location.href='/panel/catalogo'}>
            <Plus size={18} /> Nueva prenda
          </button>
        </div>

        <nav className="sidebar-nav">
          <a href="/panel" className={`nav-item ${location.pathname === '/panel' ? 'active' : ''}`}>
            <Home size={20} />
            <span>Inicio</span>
          </a>
          <a href="/panel/catalogo" className={`nav-item ${location.pathname.includes('/panel/catalogo') ? 'active' : ''}`}>
            <ShoppingBag size={20} />
            <span>Catálogo</span>
          </a>
          <a href="/panel/whatsapp" className={`nav-item ${location.pathname.includes('/panel/whatsapp') ? 'active' : ''}`}>
            <MessageCircle size={20} />
            <span>Bandeja</span>
          </a>
          <a href="/panel/entregas" className={`nav-item ${location.pathname.includes('/panel/entregas') ? 'active' : ''}`}>
            <Home size={20} />
            <span>Pedidos</span>
          </a>
          <a href="/panel/clientas" className={`nav-item ${location.pathname.includes('/panel/clientas') ? 'active' : ''}`}>
            <User size={20} />
            <span>Clientes</span>
          </a>
          <a href="/panel/reportes" className={`nav-item ${location.pathname.includes('/panel/reportes') ? 'active' : ''}`}>
            <BarChart2 size={20} />
            <span>Reportes</span>
          </a>
          <a href="/panel/ajustes" className={`nav-item ${location.pathname.includes('/panel/ajustes') ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Ajustes</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-user-profile" onClick={() => window.location.href='/panel/perfil'}>
            <div className="sidebar-avatar">ML</div>
            <div className="sidebar-user-info">
              <strong>Mindy Lu</strong>
              <span>Ver perfil</span>
            </div>
            <div className="sidebar-chevron"><ChevronRight size={16} /></div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>

        {/* Bottom Nav para Móvil */}
        <nav className="bottom-nav mobile-only">
          <a href="/panel" className={`nav-item ${location.pathname === '/panel' ? 'active' : ''}`}>
            <Home size={22} />
            <span>Inicio</span>
          </a>
          <a href="/panel/catalogo" className={`nav-item ${location.pathname.includes('/panel/catalogo') ? 'active' : ''}`}>
            <ShoppingBag size={22} />
            <span>Catálogo</span>
          </a>
          
          <div className="nav-item-fab-container">
            <button className="nav-fab" onClick={() => window.location.href='/panel/catalogo'}>
              <Plus size={24} color="#fff" />
            </button>
          </div>

          <a href="/panel/entregas" className={`nav-item ${location.pathname.includes('/panel/entregas') ? 'active' : ''}`}>
            <Home size={22} />
            <span>Entregas</span>
          </a>
          <a href="/panel/clientas" className={`nav-item ${location.pathname.includes('/panel/clientas') ? 'active' : ''}`}>
            <User size={22} />
            <span>Clientes</span>
          </a>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
