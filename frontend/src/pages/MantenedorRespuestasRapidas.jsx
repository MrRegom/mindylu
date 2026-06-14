// frontend/src/pages/MantenedorRespuestasRapidas.jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { showAlert, showConfirm, showToast } from '../utils/alerts';
import GlobalSpinner from '../components/GlobalSpinner';

const MantenedorRespuestasRapidas = () => {
  const navigate = useNavigate();
  const [respuestas, setRespuestas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRespuesta, setCurrentRespuesta] = useState({ id: null, titulo: '', mensaje: '', orden: 0 });

  const fetchRespuestas = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/integraciones/whatsapp/respuestas-rapidas/');
      setRespuestas(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      showAlert("Error cargando respuestas rápidas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRespuestas();
  }, []);

  const handleOpenModal = (respuesta = null) => {
    if (respuesta) {
      setCurrentRespuesta(respuesta);
    } else {
      setCurrentRespuesta({ id: null, titulo: '', mensaje: '', orden: respuestas.length });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentRespuesta.titulo || !currentRespuesta.mensaje) {
      showAlert("El título y el mensaje son obligatorios");
      return;
    }

    try {
      if (currentRespuesta.id) {
        await api.put(`/integraciones/whatsapp/respuestas-rapidas/${currentRespuesta.id}/`, currentRespuesta);
        showToast("Respuesta rápida actualizada con éxito");
      } else {
        await api.post('/integraciones/whatsapp/respuestas-rapidas/', currentRespuesta);
        showToast("Respuesta rápida creada con éxito");
      }
      setIsModalOpen(false);
      fetchRespuestas();
    } catch (error) {
      showAlert("Error al guardar la respuesta rápida");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (await showConfirm("¿Estás seguro de eliminar esta respuesta rápida?")) {
      try {
        await api.delete(`/integraciones/whatsapp/respuestas-rapidas/${id}/`);
        showToast("Respuesta rápida eliminada");
        fetchRespuestas();
      } catch (error) {
        showAlert("Error al eliminar la respuesta rápida");
      }
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <GlobalSpinner isVisible={isLoading} />
      
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-back" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--pk2-dark)' }}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--pk2-dark)', fontFamily: "'Playfair Display', serif" }}>Chats Rápidos</h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Configura los botones de respuestas rápidas para WhatsApp</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          style={{ padding: '10px 16px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Plus size={18} /> Nueva Respuesta
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {respuestas.map(respuesta => (
          <div key={respuesta.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ background: 'var(--pk2-pink-light)', color: 'var(--pk2-pink-dark)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
                    {respuesta.titulo}
                  </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenModal(respuesta)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(respuesta.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', color: '#4b5563', display: 'flex', gap: '10px' }}>
              <MessageSquare size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{respuesta.mensaje}</div>
            </div>
          </div>
        ))}
        {respuestas.length === 0 && !isLoading && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', color: '#6b7280' }}>
            <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p>No has configurado botones rápidos todavía.</p>
            <p style={{ fontSize: '0.85rem' }}>Crea tu primer botón de respuesta para usarlo en el chat.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-slide-up" style={{ background: 'white', padding: '24px', borderRadius: '20px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: 'var(--pk2-dark)' }}>
              {currentRespuesta.id ? 'Editar Botón' : 'Nuevo Botón Rápido'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--pk2-dark)', marginBottom: '8px' }}>Título del botón</label>
              <input 
                type="text" 
                value={currentRespuesta.titulo} 
                onChange={(e) => setCurrentRespuesta({...currentRespuesta, titulo: e.target.value})}
                placeholder="Ej: 🏦 Datos Bancarios"
                maxLength={50}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '6px 0 0' }}>Puedes usar emojis para hacerlo más visual.</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--pk2-dark)', marginBottom: '8px' }}>Mensaje completo</label>
              <textarea 
                value={currentRespuesta.mensaje}
                onChange={(e) => setCurrentRespuesta({...currentRespuesta, mensaje: e.target.value})}
                placeholder="Banco Estado&#10;Cuenta Rut&#10;11.111.111-1"
                rows={5}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', fontWeight: 600, color: 'var(--pk2-dark)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--color-primary)', fontWeight: 600, color: 'white', cursor: 'pointer' }}
              >
                Guardar Botón
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MantenedorRespuestasRapidas;
