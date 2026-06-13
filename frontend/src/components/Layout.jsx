import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, Settings, LogOut, BarChart2, MessageCircle, Plus, ChevronRight, Menu, X } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
      {/* Overlay para móvil */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar para Desktop y Móvil */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : 'desktop-only'}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>MindyLu<span style={{ color: 'var(--color-primary)' }}>.</span></div>
          <button className="mobile-close-btn mobile-only" onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#1a1a1a' }}>
            <X size={24} />
          </button>
        </div>
        
        <div className="sidebar-new-btn-container">
          <button className="sidebar-new-btn" onClick={() => window.location.href='/panel/catalogo'}>
            <Plus size={18} /> Nueva prenda
          </button>
        </div>

        <nav className="sidebar-nav">
          <a href="/panel" className={`nav-item ${location.pathname === '/panel' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Home size={20} />
            <span>Inicio</span>
          </a>
          <a href="/panel/catalogo" className={`nav-item ${location.pathname.includes('/panel/catalogo') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <ShoppingBag size={20} />
            <span>Catálogo</span>
          </a>
          <a href="/panel/whatsapp" className={`nav-item ${location.pathname.includes('/panel/whatsapp') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <MessageCircle size={20} />
            <span>Bandeja</span>
          </a>
          <a href="/panel/entregas" className={`nav-item ${location.pathname.includes('/panel/entregas') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Home size={20} />
            <span>Pedidos</span>
          </a>
          <a href="/panel/clientas" className={`nav-item ${location.pathname.includes('/panel/clientas') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <User size={20} />
            <span>Clientes</span>
          </a>
          <a href="/panel/reportes" className={`nav-item ${location.pathname.includes('/panel/reportes') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <BarChart2 size={20} />
            <span>Reportes</span>
          </a>
          <a href="/panel/ajustes" className={`nav-item ${location.pathname.includes('/panel/ajustes') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
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
          <a href="/panel/whatsapp" className={`nav-item ${location.pathname.includes('/panel/whatsapp') ? 'active' : ''}`}>
            <MessageCircle size={22} />
            <span>Bandeja</span>
          </a>
          
          <div className="nav-item-fab-container">
            <button className="nav-fab" onClick={() => window.location.href='/panel/catalogo'}>
              <Plus size={24} color="#fff" />
            </button>
          </div>

          <a href="/panel/entregas" className={`nav-item ${location.pathname.includes('/panel/entregas') ? 'active' : ''}`}>
            <ShoppingBag size={22} />
            <span>Pedidos</span>
          </a>
          <button className="nav-item" onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Menu size={22} />
            <span>Menú</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
