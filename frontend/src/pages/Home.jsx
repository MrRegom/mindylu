import { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Package, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';
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
    prendas_activas: 0
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
      <div className="home-header">
        <div className="header-icon-wrapper">
          <Sparkles className="header-icon" />
        </div>
        <div>
          <h1>¡Hola, MindyLu!</h1>
          <p>Aquí tienes el resumen de tu negocio hoy.</p>
        </div>
        <button className="btn-refresh" onClick={fetchDashboard} title="Actualizar datos">
          <RefreshCw size={20} className={isLoading ? "spin" : ""} />
        </button>
      </div>
      
      <div className="dashboard-grid">
        {/* Tarjeta 1: Ventas Hoy */}
        <div className="dash-card glass animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="card-icon success-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Ventas de Hoy</p>
            <h2 className="card-value">{isLoading ? '...' : formatCurrency(stats.ventas_hoy)}</h2>
          </div>
        </div>

        {/* Tarjeta 2: Entregas Pendientes */}
        <div className="dash-card glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="card-icon warning-icon">
            <Package size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Entregas Pend.</p>
            <h2 className="card-value">{isLoading ? '...' : stats.entregas_pendientes}</h2>
          </div>
        </div>

        {/* Tarjeta 3: Saldos por Cobrar */}
        <div className="dash-card glass animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="card-icon danger-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Saldos por Cobrar</p>
            <h2 className="card-value">{isLoading ? '...' : formatCurrency(stats.saldos_pendientes)}</h2>
          </div>
        </div>

        {/* Tarjeta 4: Catálogo */}
        <div className="dash-card glass animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="card-icon primary-icon">
            <CreditCard size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Prendas Activas</p>
            <h2 className="card-value">{isLoading ? '...' : stats.prendas_activas}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
