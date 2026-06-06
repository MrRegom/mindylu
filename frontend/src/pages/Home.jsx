import { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Package, CreditCard, TrendingUp, RefreshCw, User, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import './Home.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};

const Home = () => {
  const [stats, setStats] = useState({
    ventas_hoy: 0,
    entregas_pendientes: 0,
    saldos_pendientes: 0,
    prendas_activas: 0,
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
    <div className="home-container animate-fade-in">
      <div className="home-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ¡Hola, {stats.usuario_nombre ? stats.usuario_nombre.split(' ')[0] : 'MindyLu'}! <span style={{ color: 'var(--color-warning)' }}>✨</span>
          </h1>
          <p>Aquí tienes el resumen de tu negocio</p>
        </div>
        <div className="header-avatar" style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', marginLeft: 'auto', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }}>
          <img src={stats.usuario_avatar ? (stats.usuario_avatar.startsWith('http') ? stats.usuario_avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/').replace('/api/v1/', '')}${stats.usuario_avatar}`) : "https://i.pravatar.cc/150?img=5"} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      
      {/* Ventas del día (Full width) */}
      <div className="card animate-slide-up" style={{ marginBottom: '20px', animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Ventas del día</h3>
          <span className="badge">Hoy ∨</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{isLoading ? '...' : formatCurrency(stats.ventas_hoy)}</h2>
          <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600, background: 'var(--color-success-bg)', padding: '2px 8px', borderRadius: '12px' }}>+12% <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>vs ayer</span></span>
        </div>
        <div style={{ height: '140px', marginTop: '24px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.ventas_semana || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                itemStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="ventas" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        {/* Tarjeta: Entregas */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.2s', padding: '16px' }}>
          <div style={{ color: 'var(--color-warning)', marginBottom: '12px' }}><Package size={24} /></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>Entregas pendientes</p>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{isLoading ? '...' : stats.entregas_pendientes}</h2>
        </div>

        {/* Tarjeta: Prendas */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.3s', padding: '16px' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '12px' }}><CreditCard size={24} /></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>Prendas activas</p>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{isLoading ? '...' : stats.prendas_activas}</h2>
        </div>

        {/* Tarjeta: Saldos */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.4s', padding: '16px' }}>
          <div style={{ color: 'var(--color-danger)', marginBottom: '12px' }}><DollarSign size={24} /></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>Saldos por cobrar</p>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{isLoading ? '...' : formatCurrency(stats.saldos_pendientes)}</h2>
        </div>

        {/* Tarjeta: Clientes */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.5s', padding: '16px' }}>
          <div style={{ color: 'var(--color-success)', marginBottom: '12px' }}><User size={24} /></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>Clientes</p>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>124</h2>
        </div>
      </div>

      {/* Banner Promocional */}
      <div className="card animate-slide-up promo-banner" style={{ animationDelay: '0.6s', padding: 0, position: 'relative', overflow: 'hidden', backgroundColor: 'var(--color-primary-light)' }}>
        <div style={{ padding: '24px', position: 'relative', zIndex: 2, width: '60%' }}>
          <p style={{ color: 'var(--color-primary-dark)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>✨ Bienvenido</p>
          <h2 style={{ fontSize: '1.6rem', margin: '0 0 16px 0', fontFamily: 'Playfair Display', lineHeight: 1.1 }}>Control total de tu boutique</h2>
          <button onClick={() => window.location.href='/catalogo'} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', width: 'auto' }}>Ver Catálogo</button>
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '50%', background: 'linear-gradient(45deg, var(--color-primary-light), var(--color-primary))', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)', opacity: 0.2 }}></div>
      </div>

      <div className="advanced-metrics-grid" style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Top Productos */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Top Prendas</h3>
          <div className="card" style={{ padding: '16px' }}>
            {stats.top_productos && stats.top_productos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.top_productos.map((prod, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{prod.nombre}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{prod.total_vendido} uds</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center' }}>Sin ventas registradas aún</p>
            )}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Últimos Pedidos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.pedidos_recientes && stats.pedidos_recientes.length > 0 ? (
              stats.pedidos_recientes.map((pedido) => (
                <div key={pedido.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                  <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{pedido.cliente}</p>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{pedido.estado}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: 'var(--color-text)', fontWeight: 600, fontSize: '0.95rem' }}>{formatCurrency(pedido.total)}</p>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{pedido.fecha}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center' }}>No hay pedidos recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
