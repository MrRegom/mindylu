import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import './CargaMasiva.css'; // Reutilizamos estilos

const LotesProgramados = () => {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLotes = async () => {
    try {
      const res = await api.get('/catalogo/ciclos/programados/');
      setLotes(res.data);
    } catch (error) {
      console.error("Error fetching lotes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
  };

  return (
    <div className="catalogo-container animate-fade-in" style={{ paddingBottom: 80 }}>
      <div className="catalogo-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-back" onClick={() => navigate('/catalogo')} type="button" style={{ background: 'none', border: 'none', padding: 0 }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1>Lotes en Espera 🕒</h1>
            <p>Se publicarán automáticamente en Facebook.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando lotes...</div>
      ) : lotes.length === 0 ? (
        <div className="empty-state glass">
          <Clock size={40} color="#ccc" style={{ marginBottom: 16 }} />
          <h3>No hay lotes programados</h3>
          <p>Usa la Carga Masiva (🚀) y elige una fecha futura para programar tus publicaciones.</p>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {lotes.map(lote => (
            <div key={lote.id} className="glass" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1877F2', fontWeight: 'bold' }}>
                  <Clock size={18} />
                  {formatDate(lote.fecha_programada)}
                </div>
                <button 
                  className="btn btn-secondary btn-icon"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', height: 'auto' }}
                  onClick={() => navigate(`/catalogo/lotes/${lote.id}/editar`)}
                >
                  <Plus size={16} /> Añadir Fotos
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {lote.prendas.map(p => (
                  <div key={p.id} style={{ minWidth: 60, width: 60, position: 'relative' }}>
                    <img 
                      src={p.imagenes && p.imagenes[0] ? p.imagenes[0].imagen : 'https://placehold.co/100x150'} 
                      alt={p.nombre} 
                      style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ fontSize: '0.6rem', textAlign: 'center', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      ${p.precio}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LotesProgramados;
