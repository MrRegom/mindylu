// ─────────────────────────────────────────────────────────────
// frontend/src/pages/Entregas.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, MessageCircle, Package, Clock, Edit2, Copy, XCircle, CheckCircle, RefreshCcw, Trash2 } from 'lucide-react';
import api from '../services/api';
import './Entregas.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

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
    if (await showConfirm("¿Seguro que deseas cancelar este pedido? Las prendas volverán automáticamente al catálogo.")) {
      try {
        await api.post(`/pedidos/pedidos/${pedidoId}/cancelar/`);
        showAlert("Pedido cancelado. El stock ha sido devuelto.");
        fetchEntregas();
      } catch (error) {
        console.error(error);
        showAlert(error.response?.data?.error || "Error al cancelar el pedido.");
      }
    }
  };

  const handleEntregarPedido = async (pedidoId) => {
    try {
      await api.post(`/pedidos/pedidos/${pedidoId}/entregar/`);
      showToast("¡Pedido marcado como entregado! ✅");
      fetchEntregas();
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.error || "Error al marcar como entregado.");
    }
  };

  const handleDesvincularPedido = async (pedidoId, rutaId) => {
    if (await showConfirm("¿Seguro que deseas reagendar? El pedido saldrá de esta ruta pero mantendrá las prendas apartadas.")) {
      try {
        await api.post(`/pedidos/pedidos/${pedidoId}/desvincular_ruta/`, { ruta_id: rutaId });
        showToast("Pedido reagendado.");
        fetchEntregas();
      } catch (error) {
        console.error(error);
        showAlert(error.response?.data?.error || "Error al reagendar.");
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
        showAlert("Hubo un error al guardar la hora.");
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
        showAlert("¡Mensaje copiado al portapapeles! Listo para pegar en WhatsApp.");
        return;
      } catch (err) {
        console.warn("Fallo Clipboard API, usando fallback...");
      }
    }

    const exito = copiarAlPortapapelesFallback(texto);
    if (exito) {
      showAlert("¡Mensaje copiado al portapapeles! Listo para pegar en WhatsApp.");
    } else {
      showAlert("No se pudo copiar el texto automáticamente. Intenta copiarlo manualmente.");
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
          showAlert("¡Itinerario del día copiado! Listo para compartir en WhatsApp.");
          return;
        } catch (err) {
          console.warn("Fallo Clipboard API, usando fallback...");
        }
      }

      const exito = copiarAlPortapapelesFallback(texto);
      if (exito) {
        showAlert("¡Itinerario del día copiado! Listo para compartir en WhatsApp.");
      } else {
        showAlert("No se pudo copiar el itinerario automáticamente.");
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
        showAlert("No se pudo editar el nombre del lugar.");
        console.error(error);
      }
    }
  };

  const handleEliminarLugar = async (puntoId, nombre) => {
    if (await showConfirm(`¿Seguro que deseas eliminar el lugar "${nombre}"? Las rutas que usen este lugar perderán la referencia.`)) {
      try {
        await api.delete(`/pedidos/puntos/${puntoId}/`);
        showToast(`Lugar "${nombre}" eliminado.`);
        await fetchPuntosEntrega();
        fetchEntregas();
      } catch (error) {
        showAlert("No se pudo eliminar el lugar. Es probable que esté siendo usado en entregas activas.");
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

  const handleEditarDia = async (fecha) => {
    await fetchPuntosEntrega();
    // entregas es el state global, entregasPorFecha se deriva de él.
    // Usaremos la lista de entregas filtrada por la fecha solicitada.
    const entregasDelDia = entregas.filter(e => e.fecha === fecha);
    const puntosSeleccionados = {};
    entregasDelDia.forEach(e => {
      puntosSeleccionados[e.punto_entrega] = e.hora_estimada || '';
    });
    setNuevaRutaData({
      fecha: fecha,
      puntosSeleccionados
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
      showAlert("Debes seleccionar al menos un lugar.");
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
      showAlert("Hubo un error al crear las rutas.");
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
        showAlert("No se pudo crear el lugar.");
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
        <button 
          className="btn btn-primary" 
          onClick={handleOpenCrearModal} 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: '40px', height: '40px', borderRadius: '50%', padding: 0, flexShrink: 0 
          }}
          title="Nueva Ruta"
        >
          <Plus size={24} />
        </button>
      </div>

      {isCrearModalOpen && (
        <div className="card glass animate-slide-down" style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <div>
            <div className="entregas-modal-header">
              <h3>Programar Viaje</h3>
              <button className="btn-icon-simple" onClick={() => setIsCrearModalOpen(false)}>
                <XCircle size={24} />
              </button>
            </div>
            <div className="entregas-modal-body">
              <div className="form-group">
                <label style={{ fontWeight: 600, color: '#333', marginBottom: '8px', display: 'block' }}>¿Qué día viajarás?</label>
                <input 
                  type="date" 
                  value={nuevaRutaData.fecha} 
                  onChange={e => setNuevaRutaData({...nuevaRutaData, fecha: e.target.value})} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eaeaea', backgroundColor: '#fafafa', color: '#333', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ margin: 0, fontWeight: 600, color: '#333' }}>¿Qué lugares visitarás ese día?</label>
                  <button onClick={handleCrearLugarRapido} className="btn-nuevo-lugar">
                    + Nuevo Lugar
                  </button>
                </div>
                <div className="puntos-list-container">
                  {puntosEntrega.map(punto => {
                    const isSelected = nuevaRutaData.puntosSeleccionados[punto.id] !== undefined;
                    return (
                      <div key={punto.id} className={`punto-item ${isSelected ? 'selected' : ''}`} onClick={() => togglePunto(punto.id)}>
                        <div className="punto-item-checkbox">
                          {isSelected && <CheckCircle size={14} />}
                        </div>
                        <div className="punto-item-nombre">
                          <span>{punto.nombre}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="btn-icon-simple" 
                              style={{ opacity: 0.5 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditarLugar(punto.id, punto.nombre);
                              }}
                              title="Editar nombre"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn-icon-simple" 
                              style={{ opacity: 0.5, color: 'var(--color-danger)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarLugar(punto.id, punto.nombre);
                              }}
                              title="Eliminar lugar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {puntosEntrega.length === 0 && <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No hay lugares guardados.</p>}
                </div>
              </div>
            </div>
            <div className="entregas-modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setIsCrearModalOpen(false)} style={{ borderRadius: '12px' }}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarNuevasRutas} style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 600 }}>Programar Rutas</button>
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
            <div key={fecha} className="dia-section animate-slide-up" style={{ marginBottom: '32px' }}>
              <div className="dia-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="dia-titulo" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                  <Calendar size={18} /> 
                  {formatDate(fecha)}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEditarDia(fecha)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-primary-dark)', border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer' }}
                    title="Editar lugares de este día"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => copiarItinerarioDia(fecha, entregasPorFecha[fecha])}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(239, 71, 111, 0.2)', cursor: 'pointer' }}
                    title="Copiar Itinerario"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="timeline-container" style={{ position: 'relative' }}>
                {entregasPorFecha[fecha].map((entrega, index) => {
                  const isActive = true; // Para simular el diseño, expandiremos todos los que tengan pedidos
                  return (
                    <div key={entrega.id} className="entrega-timeline-item" style={{ position: 'relative', zIndex: 1, marginBottom: '24px' }}>
                      <div className="entrega-card" style={{ background: 'transparent', padding: '0', boxShadow: 'none' }}>
                        <div className="entrega-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={18} color="var(--color-text)" />
                            {entrega.punto_entrega_detalle?.nombre || 'Punto sin nombre'}
                          </h3>
                          <div className="hora-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {entrega.hora_estimada ? (
                              <>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => handleSetHora(entrega.id, entrega.hora_estimada)}>
                                  <Clock size={14} /> {entrega.hora_estimada.substring(0, 5)}
                                  <Edit2 size={12} style={{marginLeft: '2px', opacity: 0.5}} />
                                </span>
                                <button 
                                  onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    const texto = `${entrega.punto_entrega_detalle?.nombre || 'Punto sin nombre'} - ${entrega.hora_estimada.substring(0, 5)} hrs`;
                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                      try {
                                        await navigator.clipboard.writeText(texto);
                                        showAlert(`¡Copiado!: ${texto}`);
                                        return;
                                      } catch (err) {
                                        console.warn("Fallo Clipboard API, usando fallback...");
                                      }
                                    }
                                    const exito = copiarAlPortapapelesFallback(texto);
                                    if (exito) {
                                      showAlert(`¡Copiado!: ${texto}`);
                                    } else {
                                      showAlert("No se pudo copiar automáticamente.");
                                    }
                                  }}
                                  style={{ background: 'rgba(239, 71, 111, 0.1)', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Copiar ruta y hora"
                                >
                                  <Copy size={14} />
                                </button>
                              </>
                            ) : (
                              <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => handleSetHora(entrega.id, null)}>
                                Fijar Hora
                              </button>
                            )}
                          </div>
                        </div>

                        {entrega.pedidos.length > 0 && (
                          <div className="pedidos-list card" style={{ background: 'rgba(0,0,0,0.02)', border: 'none', padding: '16px' }}>
                            {entrega.pedidos.map(pedido => (
                              <div key={pedido.id} className={`pedido-item ${pedido.estado === 'entregado' ? 'pedido-entregado' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="pedido-info">
                                  <div className="cliente-nombre" style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                                    {pedido.clienta_detalle?.nombre}
                                    {pedido.estado === 'entregado' && <span style={{ marginLeft: '8px', color: '#00a884', fontSize: '0.8rem' }}>✅ Entregado</span>}
                                  </div>
                                  <div className="pedido-resumen" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    {pedido.items.length} prenda(s) - ${pedido.total.toLocaleString('es-CL')}
                                  </div>
                                  {pedido.notas && (
                                    <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ transform: 'rotate(45deg)' }}>📌</span> {pedido.notas}
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '160px' }}>
                                  {pedido.estado !== 'entregado' && (
                                    <>
                                      <button 
                                        onClick={() => handleEntregarPedido(pedido.id)}
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 168, 132, 0.1)', color: '#00a884', border: '1px solid rgba(0,168,132,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        title="Marcar como entregado"
                                      >
                                        <CheckCircle size={18} />
                                      </button>
                                      <button 
                                        onClick={() => handleDesvincularPedido(pedido.id, entrega.id)}
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-primary-dark)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        title="Reagendar / Quitar de esta ruta"
                                      >
                                        <RefreshCcw size={18} />
                                      </button>
                                    </>
                                  )}
                                  <button 
                                    onClick={() => handleCancelarPedido(pedido.id)}
                                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    title="Cancelar pedido por completo"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                  {pedido.estado !== 'entregado' && (
                                    <button 
                                      onClick={() => copiarMensaje(pedido, entrega)}
                                      style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-success)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                      title="Copiar mensaje de WhatsApp"
                                    >
                                      <MessageCircle size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Entregas;
