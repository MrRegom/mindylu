import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Link as LinkIcon, ShoppingBag, Edit, Calendar, Trash2 } from 'lucide-react';
import api from '../services/api';
import './ClientaDetail.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const ClientaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clienta, setClienta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchClienta = async () => {
      try {
        const response = await api.get(`/clientas/${id}/`);
        setClienta(response.data);
      } catch (error) {
        console.error("Error al cargar clienta:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClienta();
  }, [id]);

  const handleDelete = async () => {
    if (await showConfirm("¿Estás segura de que deseas eliminar esta clienta?")) {
      setIsDeleting(true);
      try {
        await api.delete(`/clientas/${id}/`);
        navigate('/clientas');
      } catch (error) {
        showAlert("Error al eliminar clienta.");
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) return <div className="loading-state">Cargando perfil...</div>;
  if (!clienta) return <div className="empty-state">Clienta no encontrada</div>;

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="clienta-detail-container animate-fade-in">
      <div className="form-header glass">
        <button className="btn-back" onClick={() => navigate('/clientas')} type="button">
          <ArrowLeft size={24} />
        </button>
        <h2>Perfil de Clienta</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-icon-simple" 
            style={{ color: 'var(--color-danger, #ef4444)' }}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={20} />
          </button>
          <button 
            className="btn-icon-simple" 
            style={{ color: 'var(--color-primary)' }}
            onClick={() => navigate(`/clientas/${id}/editar`)}
          >
            <Edit size={20} />
          </button>
        </div>
      </div>

      <div className="profile-card glass">
        <div className="profile-header">
          <div className="profile-avatar large">
            {getInitials(clienta.nombre)}
          </div>
          <h3>{clienta.nombre}</h3>
          <p className="joined-date">
            <Calendar size={14} /> Registrada en {new Date(clienta.fecha_registro).toLocaleDateString()}
          </p>
        </div>

        <div className="profile-details">
          {clienta.telefono && (
            <div className="detail-row">
              <div className="detail-icon"><Phone size={18} /></div>
              <div className="detail-content">
                <span className="label">Teléfono (WhatsApp)</span>
                <span className="value">{clienta.telefono}</span>
              </div>
            </div>
          )}

          {(clienta.perfil_facebook || clienta.perfil_instagram) && (
            <div className="detail-row">
              <div className="detail-icon"><LinkIcon size={18} /></div>
              <div className="detail-content">
                <span className="label">Redes Sociales</span>
                <div className="social-links-profile">
                  {clienta.perfil_instagram && <a href={clienta.perfil_instagram} target="_blank" rel="noreferrer">Instagram</a>}
                  {clienta.perfil_facebook && <a href={clienta.perfil_facebook} target="_blank" rel="noreferrer">Facebook</a>}
                </div>
              </div>
            </div>
          )}

          {clienta.notas && (
            <div className="notes-box">
              <span className="label">Notas y Preferencias</span>
              <p>{clienta.notas}</p>
            </div>
          )}
        </div>
      </div>

      <div className="history-section">
        <h3>
          <ShoppingBag size={20} />
          Historial de Compras
        </h3>
        
        <div className="empty-history glass">
          <p>Aún no hay compras registradas para esta clienta.</p>
          <span className="text-muted">El historial aparecerá aquí cuando activemos el módulo de entregas.</span>
        </div>
      </div>
    </div>
  );
};

export default ClientaDetail;
