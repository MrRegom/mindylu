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
      <div className="clientas-header">
        <div>
          <h1>Mis Clientas</h1>
          <p>Directorio y contactos</p>
        </div>
        <button className="btn btn-primary btn-icon" onClick={() => navigate('/clientas/nueva')}>
          <UserPlus size={20} />
          <span className="sr-only">Nueva</span>
        </button>
      </div>

      <div className="search-bar glass">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
              style={{ cursor: 'pointer' }}
            >
              <div className="clienta-avatar">
                {clienta.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="clienta-info">
                <h3>{clienta.nombre}</h3>
                
                {clienta.telefono && (
                  <div className="contact-row">
                    <Phone size={14} />
                    <span>{clienta.telefono}</span>
                  </div>
                )}
                
                <div className="social-links">
                  {clienta.perfil_instagram && <a href={clienta.perfil_instagram} target="_blank" rel="noreferrer"><Link size={16} /></a>}
                  {clienta.perfil_facebook && <a href={clienta.perfil_facebook} target="_blank" rel="noreferrer"><Link size={16} /></a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clientas;
