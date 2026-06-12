import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, AlignLeft, Landmark } from 'lucide-react';
import api from '../services/api';
import './ClientaForm.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const ClientaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    notas: '',
    cuenta_asignada: ''
  });
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const res = await api.get('/cuentas/bancos/');
        setCuentas(res.data.results || res.data);
      } catch (error) {
        console.error("Error cargando cuentas", error);
      }
    };
    fetchCuentas();

    if (isEditing) {
      const fetchClienta = async () => {
        try {
          const res = await api.get(`/clientas/${id}/`);
          setFormData({
            nombre: res.data.nombre || '',
            telefono: res.data.telefono || '',
            notas: res.data.notas || '',
            cuenta_asignada: res.data.cuenta_asignada || ''
          });
        } catch (error) {
          console.error("Error cargando clienta:", error);
          showAlert("Error cargando datos.");
          navigate('/panel/clientas');
        }
      };
      fetchClienta();
    }
  }, [id, isEditing, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await api.put(`/clientas/${id}/`, formData);
        navigate(`/panel/clientas`);
      } else {
        await api.post('/clientas/', formData);
        navigate('/panel/clientas');
      }
    } catch (error) {
      console.error("Error guardando clienta:", error);
      if (error.response?.data?.non_field_errors) {
        showAlert("Ya existe una clienta con este número de teléfono en tu tienda.");
      } else {
        showAlert("Hubo un error al guardar. Revisa los datos.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clienta-form-container animate-fade-in">
      <div className="form-header glass">
        <button className="btn-back" onClick={() => navigate('/panel/clientas')} type="button">
          <ArrowLeft size={24} />
        </button>
        <h2>{isEditing ? 'Editar Clienta' : 'Nueva Clienta'}</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <form className="clienta-form" onSubmit={handleSubmit}>
        <div className="form-section glass">
          <div className="input-group">
            <label>Nombre Completo</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                name="nombre"
                placeholder="Ej: Carolina Méndez" 
                value={formData.nombre}
                onChange={handleInputChange}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Teléfono (WhatsApp)</label>
            <div className="input-with-icon">
              <Phone size={18} className="input-icon" />
              <input 
                type="tel" 
                name="telefono"
                placeholder="Ej: +56912345678" 
                value={formData.telefono}
                onChange={handleInputChange}
                required 
              />
            </div>
            <span className="input-help">Necesario para recordatorios automáticos</span>
          </div>

          <div className="input-group">
            <label>Notas o Preferencias (Opcional)</label>
            <div className="input-with-icon align-top">
              <AlignLeft size={18} className="input-icon" style={{ marginTop: '12px' }} />
              <textarea 
                name="notas"
                placeholder="Ej: Prefiere entregas los días viernes. Talla M." 
                value={formData.notas}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Cuenta Bancaria Asignada (Opcional)</label>
            <div className="input-with-icon">
              <Landmark size={18} className="input-icon" />
              <select 
                name="cuenta_asignada"
                value={formData.cuenta_asignada}
                onChange={handleInputChange}
                className="input-field"
                style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid #e9edef', fontSize: '1rem', background: '#fff' }}
              >
                <option value="">Ninguna - Usar cuenta por defecto</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.banco} - {c.tipo_cuenta} ({c.numero_cuenta})</option>
                ))}
              </select>
            </div>
            <span className="input-help">MindyBot enviará esta cuenta si la clienta pregunta por WhatsApp</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={20} />
            {isSubmitting ? 'Guardando...' : 'Guardar Clienta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientaForm;
