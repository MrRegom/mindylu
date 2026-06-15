import { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Package, CreditCard, TrendingUp, RefreshCw, User, ShoppingBag, ArrowRight, Activity, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="enterprise-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          <span className="tooltip-indicator"></span>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ventas_hoy: 0,
    entregas_pendientes: 0,
    saldos_pendientes: 0,
    prendas_activas: 0,
    clientes_activos: 0,
    usuario_nombre: '',
    usuario_avatar: null,
    ventas_semana: [],
    top_productos: [],
    pedidos_recientes: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/reportes/dashboard/');
      setStats(response.data);
    } catch (error) {
      console.error("Error al cargar el dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="enterprise-home animate-fade-in">
      <div className="home-header">
        <div className="header-greeting">
          <h1>
            ¡Hola, {stats.usuario_nombre ? stats.usuario_nombre.split(' ')[0] : 'Admin'}! <span className="greeting-emoji">✨</span>
          </h1>
          <p>Bienvenida a tu espacio de gestión exclusiva</p>
        </div>
        
        <div className="header-actions">
          <button onClick={fetchDashboard} className="btn-icon-circular" title="Actualizar datos">
            <RefreshCw size={20} className={isLoading ? "spin" : ""} strokeWidth={1.5} />
          </button>
          <div className="header-avatar">
            {stats.usuario_avatar ? (
              <img src={stats.usuario_avatar.startsWith('http') ? stats.usuario_avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/').replace('/api/v1/', '')}${stats.usuario_avatar}`} alt="Avatar" />
            ) : (
              "M"
            )}
          </div>
        </div>
      </div>
      
      {/* Ventas Hero Section */}
      <div className="hero-card glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">Ingresos del Día</div>
            <div className="hero-amount-wrapper">
              <h2 className="hero-amount">{isLoading ? '...' : formatCurrency(stats.ventas_hoy)}</h2>
              <div className="trend-badge positive">
                <TrendingUp size={16} strokeWidth={2.5} />
                <span>+12%</span>
              </div>
            </div>
            <p className="hero-subtitle">vs el día anterior</p>
          </div>
          
          <div className="hero-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.ventas_semana || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalesHero" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8a5b2" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#e8a5b2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(232,165,178,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="ventas" stroke="#d67a8b" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesHero)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Entregas */}
        <div className="metric-card glass-panel animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="metric-icon-wrapper warning">
            <Package size={22} strokeWidth={1.5} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Entregas Pendientes</p>
            <h3 className="metric-value">{isLoading ? '...' : stats.entregas_pendientes}</h3>
          </div>
          <div className="metric-decoration"></div>
        </div>

        {/* Prendas */}
        <div className="metric-card glass-panel animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="metric-icon-wrapper primary">
            <CreditCard size={22} strokeWidth={1.5} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Prendas Activas</p>
            <h3 className="metric-value">{isLoading ? '...' : stats.prendas_activas}</h3>
          </div>
          <div className="metric-decoration"></div>
        </div>

        {/* Saldos */}
        <div className="metric-card glass-panel animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="metric-icon-wrapper danger">
            <DollarSign size={22} strokeWidth={1.5} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Saldos por Cobrar</p>
            <h3 className="metric-value">{isLoading ? '...' : formatCurrency(stats.saldos_pendientes)}</h3>
          </div>
          <div className="metric-decoration"></div>
        </div>

        {/* Clientes */}
        <div className="metric-card glass-panel animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="metric-icon-wrapper success">
            <User size={22} strokeWidth={1.5} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Clientas Activas</p>
            <h3 className="metric-value">{isLoading ? '...' : stats.clientes_activos}</h3>
          </div>
          <div className="metric-decoration"></div>
        </div>
      </div>

      {/* Banner Promocional Boutique */}
      <div className="premium-banner animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <div className="premium-banner-content">
          <div className="premium-tag"><Sparkles size={14} /> Tu Colección</div>
          <h2>El alma de tu boutique</h2>
          <p>Organiza tus prendas, añade nuevas tendencias y enamora a tus clientas con cada detalle.</p>
          <button onClick={() => navigate('/panel/catalogo')} className="btn-premium">
            Ver Colección <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="premium-banner-bg"></div>
      </div>

      <div className="advanced-section">
        
        {/* Top Productos */}
        <div className="advanced-card glass-panel animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <div className="advanced-header">
            <h3><Activity size={22} className="icon-gradient" strokeWidth={1.5} /> Lo Más Deseado</h3>
          </div>
          <div className="advanced-body">
            {stats.top_productos && stats.top_productos.length > 0 ? (
              <div className="top-list">
                {stats.top_productos.map((prod, idx) => (
                  <div key={idx} className="top-item">
                    <div className="top-item-left">
                      <div className={`top-rank rank-${idx + 1}`}>{idx + 1}</div>
                      <span className="top-name">{prod.nombre}</span>
                    </div>
                    <div className="top-item-right">
                      <span className="top-count">{prod.total_vendido} unid.</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrapper"><Package size={36} strokeWidth={1} /></div>
                <p>Aún no hay favoritos</p>
                <span>Tus prendas más vendidas brillarán aquí</span>
              </div>
            )}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="advanced-card glass-panel animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="advanced-header">
            <h3><ShoppingBag size={22} className="icon-gradient" strokeWidth={1.5} /> Últimos Pedidos</h3>
          </div>
          <div className="advanced-body">
            {stats.pedidos_recientes && stats.pedidos_recientes.length > 0 ? (
              <div className="recent-orders-list">
                {stats.pedidos_recientes.map((pedido) => (
                  <div key={pedido.id} className="order-item">
                    <div className={`order-icon ${pedido.estado}`}>
                      <ShoppingBag size={20} strokeWidth={1.5} />
                    </div>
                    <div className="order-details">
                      <p className="order-client">{pedido.cliente}</p>
                      <span className={`order-status-badge ${pedido.estado}`}>{pedido.estado}</span>
                    </div>
                    <div className="order-amounts">
                      <p className="order-total">{formatCurrency(pedido.total)}</p>
                      <p className="order-date">{pedido.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrapper"><ShoppingBag size={36} strokeWidth={1} /></div>
                <p>Esperando el primer pedido</p>
                <span>Pronto tendrás clientas enamoradas de tu ropa</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
