import { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowDownToLine, Copy } from 'lucide-react';
import api from '../services/api';
import './Cuentas.css';

const Cuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCrearCuenta = async () => {
    const banco = window.prompt("Nombre del Banco (ej: BancoEstado):");
    if (!banco) return;
    const tipo = window.prompt("Tipo de Cuenta (ej: Cuenta RUT, Vista):", "Cuenta RUT");
    const numero = window.prompt("Número de Cuenta:");
    const rut = window.prompt("RUT del titular:");
    const nombre = window.prompt("Nombre del titular:");
    const limiteStr = window.prompt("Límite mensual de abonos en dinero (ej: 4000000):", "4000000");
    const limite = parseInt(limiteStr) || 4000000;
    const transfStr = window.prompt("Límite de transferencias distintas (Ley SII - ej: 50):", "50");
    const limiteTransf = parseInt(transfStr) || 50;

    try {
      await api.post('/cuentas/bancos/', {
        banco,
        tipo_cuenta: tipo,
        numero_cuenta: numero,
        rut_titular: rut,
        nombre_titular: nombre,
        limite_mensual_ingresos: limite,
        limite_mensual_transferencias: limiteTransf
      });
      fetchCuentas();
    } catch (error) {
      alert("Error al crear la cuenta");
    }
  };

  const handleSimularAbono = async (cuentaId) => {
    const montoStr = window.prompt("¿Cuánto deseas abonar a esta cuenta?");
    const monto = parseInt(montoStr);
    if (!monto || isNaN(monto)) return;

    try {
      await api.post(`/cuentas/bancos/${cuentaId}/registrar-movimiento/`, {
        monto,
        descripcion: "Abono manual simulado"
      });
      fetchCuentas();
    } catch (error) {
      alert("Error registrando abono");
    }
  };

  const copiarDatos = (c) => {
    const texto = `${c.banco}\n${c.tipo_cuenta}\nNº ${c.numero_cuenta}\nNombre: ${c.nombre_titular}\nRUT: ${c.rut_titular}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(() => {
        alert("¡Datos bancarios copiados al portapapeles!");
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
        alert("¡Datos bancarios copiados al portapapeles!");
      } catch (err) {
        alert("Error al copiar. Tu navegador bloquea esta acción en HTTP.");
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
        <button className="btn-icon-simple" onClick={handleCrearCuenta} title="Añadir Cuenta" style={{ background: 'var(--color-primary-gradient)', color: '#FFF', border: 'none', width: '40px', height: '40px' }}>
          <Plus size={20} />
        </button>
      </div>

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
