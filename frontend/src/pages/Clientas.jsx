import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Phone, Link } from 'lucide-react';
import api from '../services/api';
import './Clientas.css';

const Clientas = () => {
  const navigate = useNavigate();
  const [clientas, setClientas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientas = async (query = '') => {
    setIsLoading(true);
    try {
      const url = query ? `/clientas/?search=${query}` : '/clientas/';
      const response = await api.get(url);
      setClientas(response.data.results || response.data);
    } catch (error) {
      console.error("Error al cargar clientas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce simple para la búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClientas(searchTerm);
    }, 500); // Espera medio segundo después de teclear para buscar

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="clientas-container animate-fade-in">
      <div className="clientas-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Playfair Display', margin: '0 0 2px 0' }}>Mis Clientes</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Directorio y contactos</p>
        </div>
        <button className="btn-icon-simple" onClick={() => navigate('/clientas/nueva')} title="Añadir" style={{ background: 'var(--color-primary-gradient)', color: '#FFF', border: 'none', width: '40px', height: '40px' }}>
          <UserPlus size={20} />
        </button>
      </div>

      <div className="search-bar glass" style={{ padding: '14px 20px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)' }}>
        <Search size={18} className="search-icon" style={{ color: 'var(--color-text-muted)', marginRight: '12px' }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ fontSize: '0.95rem' }}
        />
      </div>

      {isLoading ? (
        <div className="loading-state">Buscando...</div>
      ) : clientas.length === 0 ? (
        <div className="empty-state glass">
          <h3>No se encontraron clientas</h3>
          <p>Prueba con otra búsqueda o agrega una nueva clienta.</p>
        </div>
      ) : (
        <div className="clientas-list">
          {clientas.map(clienta => (
            <div 
              key={clienta.id} 
              className="clienta-card glass animate-slide-up"
              onClick={() => navigate(`/clientas/${clienta.id}`)}
              style={{ cursor: 'pointer', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', border: 'none' }}
            >
              <div className="clienta-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.3rem', fontWeight: 600, flexShrink: 0 }}>
                {clienta.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="clienta-info" style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', fontWeight: 600 }}>{clienta.nombre}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{clienta.email || (clienta.nombre.split(' ')[0].toLowerCase() + '@gmail.com')}</p>
                {clienta.telefono && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{clienta.telefono}</p>
                )}
              </div>
              <div style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 300 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clientas;
