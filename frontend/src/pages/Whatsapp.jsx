import { useState, useEffect } from 'react';
import { MessageCircle, Smartphone, QrCode, LogOut, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { showAlert, showConfirm, showToast } from '../utils/alerts';
import './Ajustes.css'; // Podemos reusar la card glass de ajustes

const Whatsapp = () => {
  const [waConfig, setWaConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/integraciones/whatsapp/config/');
      setWaConfig(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await api.post('/integraciones/whatsapp/conectar/');
      await fetchConfig();
      showToast('success', 'Instancia de WhatsApp creada exitosamente');
    } catch (e) {
      showAlert('Error al conectar con WhatsApp API');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!await showConfirm('¿Seguro que deseas desconectar WhatsApp? Se dejarán de enviar recordatorios automáticos.')) return;
    setLoading(true);
    try {
      await api.post('/integraciones/whatsapp/desconectar/');
      await fetchConfig();
      showToast('success', 'Sesión de WhatsApp desconectada');
    } catch (e) {
      showAlert('Error al desconectar');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !waConfig) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1><MessageCircle size={28} /> WhatsApp</h1>
        </div>
        <div className="card glass">Cargando módulo de WhatsApp...</div>
      </div>
    );
  }

  const isConnected = waConfig?.status === 'QR_READY' || waConfig?.status === 'CONNECTED';

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1>
          <MessageCircle size={28} />
          WhatsApp Bot
        </h1>
        <p className="subtitle">Conecta tu número exclusivo y automatiza mensajes de recordatorio de entrega sin perder el control manual.</p>
      </div>

      <div className="card glass" style={{ marginBottom: '32px' }}>
        <div className="mantenedor-header" style={{ marginBottom: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--color-primary-dark)' }}>
            <MessageCircle size={24} style={{ color: '#00a884' }} />
            Estado de Conexión
          </h3>
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            background: isConnected ? 'rgba(0, 168, 132, 0.1)' : 'rgba(239, 71, 111, 0.1)',
            color: isConnected ? '#00a884' : 'var(--color-danger)'
          }}>
            {isConnected ? 'Activo / QR Listo' : 'Desconectado'}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 300px' }}>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              Al escanear este código QR con el celular de tu boutique, MindyLu podrá enviar recordatorios automáticos "por detrás". <b>Tú podrás seguir usando WhatsApp normalmente en ese teléfono</b> para chatear con las clientas de manera humana.
            </p>
            <div style={{ background: '#f5f6f6', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                <Smartphone size={18} /> Instrucciones para vincular:
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '0.95rem' }}>
                <li>Abre <b>WhatsApp Business</b> en el celular que tiene el chip nuevo.</li>
                <li>Toca los tres puntos (Menú) o Configuración en la esquina superior.</li>
                <li>Selecciona <b>Dispositivos Vinculados</b> y luego "Vincular dispositivo".</li>
                <li>Apunta la cámara al código QR de la derecha.</li>
              </ol>
            </div>
            {isConnected ? (
              <button onClick={handleDisconnect} className="btn btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                <LogOut size={16} style={{ marginRight: '6px' }} /> Desvincular Dispositivo
              </button>
            ) : (
              <button onClick={handleConnect} className="btn btn-primary" style={{ background: '#00a884', borderColor: '#00a884', color: 'white' }}>
                <QrCode size={16} style={{ marginRight: '6px' }} /> Generar Código QR
              </button>
            )}
          </div>
          
          <div style={{ width: '240px', height: '240px', background: '#fff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e9edef', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            {waConfig?.qr ? (
              <div style={{ textAlign: 'center' }}>
                <img src={`data:image/png;base64,${waConfig.qr}`} alt="QR Code" style={{ width: '200px', height: '200px', objectFit: 'contain' }} />
                <div style={{ fontSize: '0.8rem', color: '#00a884', marginTop: '8px', fontWeight: 'bold' }}>Escanea para vincular</div>
              </div>
            ) : (
              <div style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                <QrCode size={48} style={{ opacity: 0.5, marginBottom: '12px', margin: '0 auto' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Haz clic en Generar para ver el QR</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isConnected && (
        <div className="card glass animate-slide-up" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: 'var(--color-primary-dark)' }}>
            <CheckCircle size={20} style={{ color: '#00a884' }} />
            Automatizaciones Activas
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '16px' }}>
            Mientras el dispositivo esté vinculado, el sistema realizará las siguientes acciones automáticamente:
          </p>
          <ul style={{ color: '#555', fontSize: '0.95rem', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><b>Recordatorios de Entrega:</b> 12 horas antes de un viaje programado, se le enviará un resumen de su pedido a todas las clientas de esa ruta.</li>
            <li><b>Confirmación de Reserva:</b> Cuando cambies el estado de un pedido a "Pagado", la clienta recibirá un recibo de confirmación.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Whatsapp;
