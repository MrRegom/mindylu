import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { showAlert, showConfirm } from '../utils/alerts';

const Logs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs/');
      setLogs(response.data);
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClear = () => {
    showConfirm(
      'Vaciar Registros',
      '¿Estás seguro de que deseas eliminar todos los registros de errores?',
      async () => {
        try {
          await api.delete('/logs/clear_all/');
          showAlert('Registros eliminados correctamente.');
          setLogs([]);
        } catch (error) {
          showAlert('No se pudieron eliminar los registros.');
        }
      }
    );
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', flex: 1, fontFamily: 'Playfair Display' }}>
          Registro de Errores
        </h1>
        <button 
          onClick={fetchLogs} 
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          title="Actualizar"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
        <button 
          onClick={handleClear} 
          style={{ background: '#ffeeef', border: 'none', color: '#ff4d4f', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 600 }}
          disabled={logs.length === 0}
        >
          <Trash2 size={16} /> Vaciar
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '40px' }}>Cargando registros...</p>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <CheckCircle2 size={40} color="var(--color-success)" style={{ marginBottom: 16 }} />
          <p style={{ margin: 0, fontWeight: 500 }}>No hay errores registrados.</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 8 }}>El sistema funciona correctamente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map((log) => (
            <div key={log.id} style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${log.tipo === 'FRONTEND' ? '#ff9c6e' : '#ff4d4f'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: log.tipo === 'FRONTEND' ? '#fff2e8' : '#fff1f0', color: log.tipo === 'FRONTEND' ? '#d4380d' : '#cf1322' }}>
                  {log.tipo}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date(log.fecha).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                {log.mensaje}
              </p>
              {log.stack_trace && (
                <details style={{ fontSize: '0.8rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }}>Ver detalles técnicos</summary>
                  <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '6px', overflowX: 'auto', marginTop: '8px', color: '#333', fontSize: '0.75rem' }}>
                    {log.stack_trace}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Se requiere el icono CheckCircle2 que olvidé importar arriba, lo meto inline para evitar error.
import { CheckCircle2 } from 'lucide-react';

export default Logs;
