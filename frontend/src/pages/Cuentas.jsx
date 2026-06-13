import { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowDownToLine, Copy } from 'lucide-react';
import api from '../services/api';
import './Cuentas.css';
import { showAlert, showConfirm, showToast, showPrompt } from '../utils/alerts';

const Cuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    banco: '', tipo_cuenta: 'Cuenta RUT', numero_cuenta: '',
    rut_titular: '', nombre_titular: '',
    limite_mensual_ingresos: 4000000, limite_mensual_transferencias: 50
  });

  const fetchCuentas = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/cuentas/bancos/');
      setCuentas(response.data.results || response.data);
    } catch (error) {
      console.error("Error cargando cuentas", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, []);

  const handleGuardarCuenta = async () => {
    if (!formData.banco || !formData.numero_cuenta || !formData.rut_titular || !formData.nombre_titular) {
      showAlert("Por favor, completa los campos obligatorios.");
      return;
    }
    
    try {
      await api.post('/cuentas/bancos/', formData);
      setIsModalOpen(false);
      fetchCuentas();
      showToast("Cuenta bancaria registrada");
    } catch (error) {
      showAlert("Error al crear la cuenta");
    }
  };

  const handleSimularAbono = async (cuentaId) => {
    const montoStr = await showPrompt("¿Cuánto deseas abonar a esta cuenta?", "Monto en pesos");
    if (!montoStr) return;
    const monto = parseInt(montoStr);
    if (!monto || isNaN(monto)) return;

    try {
      await api.post(`/cuentas/bancos/${cuentaId}/registrar-movimiento/`, {
        monto,
        descripcion: "Abono manual simulado"
      });
      fetchCuentas();
    } catch (error) {
      showAlert("Error registrando abono");
    }
  };

  const copiarDatos = (c) => {
    const texto = `${c.banco}\n${c.tipo_cuenta}\nNº ${c.numero_cuenta}\nNombre: ${c.nombre_titular}\nRUT: ${c.rut_titular}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(() => {
        showAlert("¡Datos bancarios copiados al portapapeles!");
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = texto;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showAlert("¡Datos bancarios copiados al portapapeles!");
      } catch (err) {
        showAlert("Error al copiar. Tu navegador bloquea esta acción en HTTP.");
      }
      document.body.removeChild(textArea);
    }
  };

  const getProgressColor = (estado) => {
    if (estado === 'verde') return 'var(--color-success)';
    if (estado === 'amarillo') return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="cuentas-container animate-fade-in">
      <div className="cuentas-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Playfair Display', margin: '0 0 2px 0' }}>Cuentas Bancarias</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Control de límites y abonos</p>
        </div>
        <button className="btn-icon-simple" onClick={() => setIsModalOpen(true)} title="Añadir Cuenta" style={{ background: 'var(--color-primary-gradient)', color: '#FFF', border: 'none', width: '40px', height: '40px' }}>
          <Plus size={20} />
        </button>
      </div>

      {isModalOpen && (
        <div className="card glass animate-slide-down" style={{ marginBottom: '24px', padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>Nueva Cuenta Bancaria</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Banco</label>
              <input type="text" placeholder="Ej: BancoEstado" value={formData.banco} onChange={e => setFormData({...formData, banco: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tipo de Cuenta</label>
              <input type="text" placeholder="Ej: Cuenta RUT" value={formData.tipo_cuenta} onChange={e => setFormData({...formData, tipo_cuenta: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Número de Cuenta</label>
              <input type="text" placeholder="Número" value={formData.numero_cuenta} onChange={e => setFormData({...formData, numero_cuenta: e.target.value})} />
            </div>
            <div className="form-group">
              <label>RUT del Titular</label>
              <input type="text" placeholder="Ej: 11.111.111-1" value={formData.rut_titular} onChange={e => setFormData({...formData, rut_titular: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Nombre del Titular</label>
              <input type="text" placeholder="Nombre completo" value={formData.nombre_titular} onChange={e => setFormData({...formData, nombre_titular: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Límite Mensual Abonos ($)</label>
              <input type="number" value={formData.limite_mensual_ingresos} onChange={e => setFormData({...formData, limite_mensual_ingresos: parseInt(e.target.value) || 0})} />
            </div>
            <div className="form-group">
              <label>Límite Transferencias Distintas (SII)</label>
              <input type="number" value={formData.limite_mensual_transferencias} onChange={e => setFormData({...formData, limite_mensual_transferencias: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleGuardarCuenta}>Guardar Cuenta</button>
          </div>
        </div>
      )}

      <div className="cuentas-list">
        {isLoading ? (
          <p>Cargando cuentas...</p>
        ) : cuentas.length === 0 ? (
          <div className="empty-state glass">
            <CreditCard size={48} color="var(--color-primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p>No tienes cuentas bancarias registradas.</p>
          </div>
        ) : (
          cuentas.map(c => {
            const porcentajePlata = Math.min((c.total_ingresos_mes_actual / c.limite_mensual_ingresos) * 100, 100);
            const porcentajeTransf = Math.min((c.total_transferencias_mes_actual / c.limite_mensual_transferencias) * 100, 100);
            
            return (
              <div key={c.id} className="cuenta-card glass animate-slide-up">
                <div className="cuenta-card-header">
                  <div className="banco-info">
                    <h3 style={{ color: 'var(--color-primary-dark)' }}>{c.banco}</h3>
                    <p className="tipo-cuenta">{c.tipo_cuenta} - {c.numero_cuenta}</p>
                  </div>
                  <button className="btn-icon-simple" onClick={() => copiarDatos(c)} title="Copiar datos">
                    <Copy size={20} />
                  </button>
                </div>
                
                <div className="titular-info">
                  <p>{c.nombre_titular} • {c.rut_titular}</p>
                </div>

                <div className="semaforo-container">
                  <div className="semaforo-labels">
                    <span>Monto ingresado: ${c.total_ingresos_mes_actual.toLocaleString('es-CL')}</span>
                    <span>Límite: ${c.limite_mensual_ingresos.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${porcentajePlata}%`, 
                        backgroundColor: getProgressColor(c.estado_semaforo),
                        boxShadow: `0 0 10px ${getProgressColor(c.estado_semaforo)}`
                      }} 
                    />
                  </div>

                  <div className="semaforo-labels" style={{ marginTop: '16px' }}>
                    <span>Nº Transferencias (SII): {c.total_transferencias_mes_actual}</span>
                    <span>Límite: {c.limite_mensual_transferencias} trans.</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${porcentajeTransf}%`, 
                        backgroundColor: getProgressColor(c.estado_semaforo_transferencias),
                        boxShadow: `0 0 10px ${getProgressColor(c.estado_semaforo_transferencias)}`
                      }} 
                    />
                  </div>
                </div>

                <div className="cuenta-actions">
                  <button className="btn btn-secondary" onClick={() => handleSimularAbono(c.id)}>
                    <ArrowDownToLine size={18} /> Registrar Abono
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Cuentas;
