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
        navigate('/panel/clientas');
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
        <button className="btn-back" onClick={() => navigate('/panel/clientas')} type="button">
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
            onClick={() => navigate(`/panel/clientas/${id}/editar`)}
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

          {clienta.cuenta_asignada_detalle && (
            <div className="detail-row">
              <div className="detail-icon" style={{ color: '#d16b7e' }}><ShoppingBag size={18} /></div>
              <div className="detail-content">
                <span className="label">Cuenta de Depósito</span>
                <span className="value" style={{ fontSize: '0.9rem', color: '#d16b7e', fontWeight: 600 }}>{clienta.cuenta_asignada_detalle}</span>
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
        
        {clienta.historial_compras && clienta.historial_compras.length > 0 ? (
          <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clienta.historial_compras.map(pedido => (
              <div key={pedido.id} className="history-item glass" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0' }}>Pedido #{pedido.id}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{pedido.fecha}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>
                    ${pedido.total.toLocaleString('es-CL')}
                  </div>
                  <span className={`status-badge status-${pedido.estado}`} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-bg-alt)' }}>
                    {pedido.estado_display}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history glass">
            <p>Aún no hay compras registradas para esta clienta.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientaDetail;
