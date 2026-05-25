// ─────────────────────────────────────────────────────────────
// frontend/src/pages/Entregas.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Calendar, MapPin, MessageCircle, Package, Clock, Edit2, Copy, XCircle } from 'lucide-react';
import api from '../services/api';
import './Entregas.css';

/**
 * Componente Entregas
 * 
 * Gestiona el Tablero del Día de entregas.
 * Optimizado (Caso B):
 * 1. Compacto: Reemplaza botones de texto redundantes por íconos estilizados de WhatsApp/Cancelar (XCircle/MessageCircle)
 *    y simplifica el botón "Copiar Itinerario" a un simple ícono de copia al lado de la fecha.
 * 2. Edición Relacional: Habilita la edición de nombres de estaciones en "Programar Viaje".
 *    Gracias a la ForeignKey, las actualizaciones impactan en cascada en toda la base de datos sin perder registros.
 */
const Entregas = () => {
  const [entregas, setEntregas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntregas = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/pedidos/entregas/');
      setEntregas(response.data.results || response.data);
    } catch (error) {
      console.error("Error al cargar entregas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelarPedido = async (pedidoId) => {
    if (window.confirm("¿Seguro que deseas cancelar este pedido? Las prendas volverán automáticamente al catálogo.")) {
      try {
        await api.post(`/pedidos/${pedidoId}/cancelar/`);
        alert("Pedido cancelado. El stock ha sido devuelto.");
        fetchEntregas();
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.error || "Error al cancelar el pedido.");
      }
    }
  };

  useEffect(() => {
    fetchEntregas();
  }, []);

  const handleSetHora = async (entregaId, horaActual) => {
    const hora = window.prompt("Ingresa la hora de entrega (ej: 15:30 o 18:00):", horaActual || "");
    if (hora !== null) {
      const horaLimpia = hora.trim();
      if (!horaLimpia) return;
      
      try {
        await api.patch(`/pedidos/entregas/${entregaId}/`, { hora_estimada: horaLimpia });
        fetchEntregas();
      } catch (error) {
        alert("Hubo un error al guardar la hora.");
        console.error(error);
      }
    }
  };

  // --- RECORDATORIO INDIVIDUAL DE WHATSAPP ---
  const generarMensajeWhatsApp = (pedido, entrega) => {
    const nombre = pedido.clienta_detalle?.nombre.split(' ')[0] || 'Linda';
    const punto = entrega.punto_entrega_detalle?.nombre || 'el punto acordado';
    const hora = entrega.hora_estimada ? ` a las ${entrega.hora_estimada.substring(0, 5)} hrs` : '';
    
    const fechaObj = new Date(entrega.fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    const diffTime = fechaObj - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let diaTexto = "hoy";
    if (diffDays === 1) diaTexto = "mañana";
    else if (diffDays > 1) {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      diaTexto = `el ${dias[fechaObj.getDay()]}`;
    } else if (diffDays < 0) {
      diaTexto = "el pasado " + fechaObj.toLocaleDateString();
    }

    const total = pedido.total;
    // Compila la lista de todas las prendas que tiene el pedido agrupado!
    const prendasNombres = pedido.items.map(i => `${i.cantidad}x ${i.variante_detalle.prenda_nombre} (${i.variante_detalle.talla})`).join(', ');

    return `¡Hola ${nombre}! 💛\nTe escribo para recordar nuestra entrega de ${diaTexto} en *${punto}*${hora}.\n\nLlevo tu pedido:\n🛍️ ${prendasNombres}\n💰 Total: $${total}\n\n¡Cualquier duda me avisas, nos vemos! 😊`;
  };

  // --- COPIAR AL PORTAPAPELES FALLBACK EN HTTP/IOS SAFARI ---
  const copiarAlPortapapelesFallback = (texto) => {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Fallo fallback copiar:", err);
      document.body.removeChild(textArea);
      return false;
    }
  };

  const copiarMensaje = async (pedido, entrega) => {
    const texto = generarMensajeWhatsApp(pedido, entrega);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(texto);
        alert("¡Mensaje copiado al portapapeles! Listo para pegar en WhatsApp.");
        return;
      } catch (err) {
        console.warn("Fallo Clipboard API, usando fallback...");
      }
    }

    const exito = copiarAlPortapapelesFallback(texto);
    if (exito) {
      alert("¡Mensaje copiado al portapapeles! Listo para pegar en WhatsApp.");
    } else {
      alert("No se pudo copiar el texto automáticamente. Intenta copiarlo manualmente.");
    }
  };

  // --- COPIAR RUTA COMPLETA DE PARADAS ---
  const copiarItinerarioDia = (fecha, entregasDelDia) => {
    const tituloFecha = formatDate(fecha);
    
    const ordenadas = [...entregasDelDia].sort((a, b) => {
      if (!a.hora_estimada) return 1;
      if (!b.hora_estimada) return -1;
      return a.hora_estimada.localeCompare(b.hora_estimada);
    });

    let texto = `📍 *Itinerario de Entregas - ${tituloFecha}*:\n`;
    ordenadas.forEach(entrega => {
      const hora = entrega.hora_estimada ? `${entrega.hora_estimada.substring(0, 5)} hrs` : 'Por acordar';
      const punto = entrega.punto_entrega_detalle?.nombre || 'Punto sin nombre';
      texto += `- *${hora}*: ${punto}\n`;
    });
    texto += `\n¡Cualquier consulta me avisas! 🛍️✨`;

    const realizarCopia = async () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(texto);
          alert("¡Itinerario del día copiado! Listo para compartir en WhatsApp.");
          return;
        } catch (err) {
          console.warn("Fallo Clipboard API, usando fallback...");
        }
      }

      const exito = copiarAlPortapapelesFallback(texto);
      if (exito) {
        alert("¡Itinerario del día copiado! Listo para compartir en WhatsApp.");
      } else {
        alert("No se pudo copiar el itinerario automáticamente.");
      }
    };

    realizarCopia();
  };

  // --- EDICIÓN RELACIONAL EN CASCADA DE PUNTOS (Caso B - Modificar nombre de estación) ---
  const handleEditarLugar = async (puntoId, nombreActual) => {
    const nuevoNombre = window.prompt("Editar nombre de la estación/lugar (afectará todos los pedidos en curso):", nombreActual);
    if (nuevoNombre && nuevoNombre.trim() && nuevoNombre.trim() !== nombreActual) {
      try {
        await api.patch(`/pedidos/puntos/${puntoId}/`, { nombre: nuevoNombre.trim() });
        await fetchPuntosEntrega(); // Refrescar modal
        fetchEntregas(); // Refrescar tablero para ver cambio instantáneo
      } catch (error) {
        alert("No se pudo editar el nombre del lugar.");
        console.error(error);
      }
    }
  };

  const entregasPorFecha = entregas.reduce((acc, entrega) => {
    if (!acc[entrega.fecha]) acc[entrega.fecha] = [];
    acc[entrega.fecha].push(entrega);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('es-ES', opciones).replace(/^\w/, (c) => c.toUpperCase());
  };

  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [puntosEntrega, setPuntosEntrega] = useState([]);
  const [nuevaRutaData, setNuevaRutaData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    puntosSeleccionados: {}
  });

  const fetchPuntosEntrega = async () => {
    try {
      const res = await api.get('/pedidos/puntos/');
      setPuntosEntrega(res.data.results || res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenCrearModal = () => {
    fetchPuntosEntrega();
    setNuevaRutaData({
      fecha: new Date().toISOString().split('T')[0],
      puntosSeleccionados: {}
    });
    setIsCrearModalOpen(true);
  };

  const togglePunto = (puntoId) => {
    setNuevaRutaData(prev => {
      const newPuntos = { ...prev.puntosSeleccionados };
      if (newPuntos[puntoId] !== undefined) {
        delete newPuntos[puntoId];
      } else {
        newPuntos[puntoId] = '';
      }
      return { ...prev, puntosSeleccionados: newPuntos };
    });
  };

  const handleHoraChange = (puntoId, hora) => {
    setNuevaRutaData(prev => ({
      ...prev,
      puntosSeleccionados: {
        ...prev.puntosSeleccionados,
        [puntoId]: hora
      }
    }));
  };

  const guardarNuevasRutas = async () => {
    const puntoIds = Object.keys(nuevaRutaData.puntosSeleccionados);
    if (puntoIds.length === 0) {
      alert("Debes seleccionar al menos un lugar.");
      return;
    }

    try {
      const promesas = puntoIds.map(puntoId => {
        const hora = nuevaRutaData.puntosSeleccionados[puntoId];
        return api.post('/pedidos/entregas/', {
          fecha: nuevaRutaData.fecha,
          punto_entrega: parseInt(puntoId),
          hora_estimada: hora || null
        });
      });

      await Promise.all(promesas);
      setIsCrearModalOpen(false);
      fetchEntregas();
    } catch (e) {
      console.error(e);
      alert("Hubo un error al crear las rutas.");
    }
  };

  const handleCrearLugarRapido = async () => {
    const nuevoNombre = window.prompt("Nombre del nuevo lugar:");
    if (nuevoNombre && nuevoNombre.trim()) {
      try {
        const res = await api.post('/pedidos/puntos/', { nombre: nuevoNombre.trim() });
        await fetchPuntosEntrega();
        setNuevaRutaData(prev => ({
          ...prev,
          puntosSeleccionados: {
            ...prev.puntosSeleccionados,
            [res.data.id]: ''
          }
        }));
      } catch (error) {
        alert("No se pudo crear el lugar.");
      }
    }
  };

  return (
    <div className="entregas-container animate-fade-in">
      <div className="entregas-header">
        <div>
          <h1>Rutas de Entrega</h1>
          <p>Organiza tus despachos diarios</p>
        </div>
        <button className="btn btn-primary btn-icon" onClick={handleOpenCrearModal} title="Programar nueva ruta">
          <Calendar size={20} />
          <span className="sr-only">Nueva Ruta</span>
        </button>
      </div>

      {isCrearModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-up glass" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Programar Viaje</h3>
              <button className="btn-icon-simple" onClick={() => setIsCrearModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 0' }}>
              <div className="form-group">
                <label>¿Qué día viajarás?</label>
                <input 
                  type="date" 
                  value={nuevaRutaData.fecha} 
                  onChange={e => setNuevaRutaData({...nuevaRutaData, fecha: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ margin: 0 }}>¿Qué lugares visitarás ese día?</label>
                  <button onClick={handleCrearLugarRapido} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>+ Nuevo Lugar</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {puntosEntrega.map(punto => {
                    const isSelected = nuevaRutaData.puntosSeleccionados[punto.id] !== undefined;
                    return (
                      <div key={punto.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.2)', borderRadius: '8px', border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => togglePunto(punto.id)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ flex: 1, fontWeight: isSelected ? 'bold' : 'normal', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {punto.nombre}
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); handleEditarLugar(punto.id, punto.nombre); }}
                            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--color-primary)' }}
                            title="Editar nombre de este lugar"
                          >
                            <Edit2 size={13} />
                          </button>
                        </span>
                        {isSelected && (
                          <input 
                            type="time" 
                            value={nuevaRutaData.puntosSeleccionados[punto.id]}
                            onChange={e => handleHoraChange(punto.id, e.target.value)}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                            title="Hora estimada (opcional)"
                          />
                        )}
                      </div>
                    );
                  })}
                  {puntosEntrega.length === 0 && <p className="text-muted" style={{ fontSize: '0.9rem' }}>No hay lugares guardados.</p>}
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setIsCrearModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarNuevasRutas}>Programar Rutas</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-state">Cargando rutas...</div>
      ) : entregas.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon"><Package size={48} /></div>
          <h3>No hay entregas pendientes</h3>
          <p>Los pedidos que marques con fecha de entrega aparecerán aquí ordenados por día.</p>
        </div>
      ) : (
        <div className="dias-list">
          {Object.keys(entregasPorFecha).sort().map(fecha => (
            <div key={fecha} className="dia-section animate-slide-up">
              {/* Cabecera del Día con Botón Compacto de Copiar Itinerario (Caso B - Ícono solamente) */}
              <div className="dia-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <h2 className="dia-titulo" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem' }}>
                  <Calendar size={20} className="icon-gold" /> 
                  {formatDate(fecha)}
                </h2>
                
                {/* Botón ultra-compacto tipo ícono */}
                <button 
                  className="btn-icon-simple" 
                  onClick={() => copiarItinerarioDia(fecha, entregasPorFecha[fecha])}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: 'rgba(212, 175, 55, 0.08)', color: 'var(--color-primary)' }}
                  title="Copiar itinerario completo del día"
                >
                  <Copy size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Copiar</span>
                </button>
              </div>
              
              {entregasPorFecha[fecha].map(entrega => (
                <div key={entrega.id} className="entrega-card glass">
                  <div className="entrega-card-header">
                    <h3>
                      <MapPin size={18} />
                      {entrega.punto_entrega_detalle?.nombre || 'Punto sin nombre'}
                    </h3>
                    <div className="hora-badge-container">
                      {entrega.hora_estimada ? (
                        <span className="hora-badge" onClick={() => handleSetHora(entrega.id, entrega.hora_estimada)} style={{cursor: 'pointer'}} title="Cambiar hora">
                          <Clock size={14} /> {entrega.hora_estimada.substring(0, 5)}
                          <Edit2 size={12} style={{marginLeft: '4px', opacity: 0.7}} />
                        </span>
                      ) : (
                        <button className="btn-set-hora" onClick={() => handleSetHora(entrega.id, null)}>
                          <Clock size={14} /> Fijar Hora
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pedidos-list">
                    {entrega.pedidos.map(pedido => (
                      <div key={pedido.id} className="pedido-item">
                        <div className="pedido-info" style={{ flex: 1.5 }}>
                          <div className="cliente-nombre">
                            <span className="dot"></span>
                            {pedido.clienta_detalle?.nombre}
                          </div>
                          <div className="pedido-resumen" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {pedido.items.length} prenda(s) - ${pedido.total.toLocaleString('es-CL')}
                            {pedido.notas && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-primary-dark)', fontStyle: 'italic', marginTop: 2 }}>📝 {pedido.notas}</span>}
                          </div>
                        </div>

                        {/* Botones de acción ultra-compactos con íconos solamente (Caso B) */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
                          <button 
                            className="btn-icon-simple danger"
                            onClick={() => handleCancelarPedido(pedido.id)}
                            title="Cancelar pedido y devolver stock"
                            style={{ padding: '6px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)', display: 'inline-flex' }}
                          >
                            <XCircle size={18} />
                          </button>
                          
                          <button 
                            className="btn-icon-simple"
                            onClick={() => copiarMensaje(pedido, entrega)}
                            title="Copiar recordatorio de WhatsApp"
                            style={{ padding: '6px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.08)', color: '#25D366', display: 'inline-flex' }}
                          >
                            <MessageCircle size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Entregas;
