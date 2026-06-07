import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { showToast } from '../utils/alerts';

const Reportes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportes();
  }, []);

  const fetchReportes = async () => {
    try {
      const res = await api.get('/reportes/avanzados/');
      setData(res.data);
    } catch (error) {
      console.error(error);
      showToast('Error al cargar reportes avanzados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1>
          <BarChart2 size={28} />
          Reportes y Estadísticas
        </h1>
        <p className="subtitle">Métricas avanzadas para la toma de decisiones.</p>
      </div>

      {/* Tarjetas KPI */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="kpi-card card glass">
          <div className="kpi-header">
            <span className="kpi-title">Ingresos del Mes</span>
            <div className="kpi-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="kpi-value">{formatCurrency(data?.ingresos_mes || 0)}</div>
          <div className="kpi-trend positive">Total cobrado (Pagado/Entregado)</div>
        </div>

        <div className="kpi-card card glass">
          <div className="kpi-header">
            <span className="kpi-title">Dinero en la Calle</span>
            <div className="kpi-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}><DollarSign size={20} /></div>
          </div>
          <div className="kpi-value">{formatCurrency(data?.dinero_en_calle || 0)}</div>
          <div className="kpi-trend neutral">Pendiente de cobro (Apartados)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Top Categorías */}
        <div className="card glass">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--color-primary)" /> Top Categorías Más Vendidas
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_categorias || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="nombre_cat" type="category" width={100} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="total_vendido" fill="var(--color-primary)" name="Unidades Vendidas" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clientas VIP */}
        <div className="card glass">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--color-primary)" /> Clientas VIP (Top Compras)
          </h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Clienta</th>
                  <th>Pedidos</th>
                  <th style={{ textAlign: 'right' }}>Total Gastado</th>
                </tr>
              </thead>
              <tbody>
                {data?.top_clientas?.map(cliente => (
                  <tr key={cliente.id}>
                    <td style={{ fontWeight: 500 }}>{cliente.nombre}</td>
                    <td>{cliente.total_pedidos}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {formatCurrency(cliente.total_comprado)}
                    </td>
                  </tr>
                ))}
                {data?.top_clientas?.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                      Aún no hay clientas con compras.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reportes;
