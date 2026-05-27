// ─────────────────────────────────────────────────────────────
// frontend/src/pages/Sincronizacion.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { RefreshCw, Check, X, AlertCircle, Sparkles, Image as ImageIcon, Link2, Search, ArrowLeft, Camera, Plus, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import './Sincronizacion.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const TALLAS_DISPONIBLES = ['S', 'M', 'L', 'XL', 'estándar', '34', '36', '38', '40', '42', '44', '34/36', '36/38', '38/40'];
const COLORES_DISPONIBLES = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Beige', 'Café', 'Rosado', 'Morado', 'Naranjo', 'Multicolor', 'Por defecto'];

/**
 * Componente Sincronizacion
 * 
 * Permite a la usuaria gestionar el "Auto-Catálogo IA". 
 * Flujo premium optimizado:
 * 1. Selección: Visualizar y escoger entre las últimas 5 publicaciones de Facebook.
 * 2. Procesamiento y Fusión: Analizar imágenes del post seleccionado usando OCR,
 *    con sugerencia automática inteligente de nombre (Caso 3 - Primera línea OCR) 
 *    y tabla dinámica para definir múltiples tallas y stock para cada producto antes de guardar.
 * 3. Fusión Avanzada (Caso 4): Permite asociar múltiples variantes de talla y stock (Ej: 5 de M, 3 de XL)
 *    de una sola vez a una prenda ya existente.
 */
const Sincronizacion = () => {
  // --- ESTADOS PRINCIPALES ---
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [prendasDetectadas, setPrendasDetectadas] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // --- ESTADOS PARA FUSIÓN DE STOCK (BOTTOM SHEET) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catalogoPrendas, setCatalogoPrendas] = useState([]);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPrendaToFuse, setCurrentPrendaToFuse] = useState(null);
  const [selectedExistingPrenda, setSelectedExistingPrenda] = useState(null);
  const [isSubmittingFusion, setIsSubmittingFusion] = useState(false);

  // --- ESTADOS DE VARIANTES EN FUSIÓN ---
  const [fuseVariantes, setFuseVariantes] = useState([]);
  const [fuseColor, setFuseColor] = useState('Por defecto');

  // --- CARGA INICIAL DE PUBLICACIONES ---
  useEffect(() => {
    fetchRecientesPosts();
    fetchCatalogo();
  }, []);

  const fetchRecientesPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await api.get('/integraciones/publicaciones-recientes/');
      // Manejar el fallback de simulación de forma transparente
      if (Array.isArray(response.data)) {
        setPosts(response.data);
      } else if (response.data && Array.isArray(response.data.posts)) {
        setPosts(response.data.posts);
        console.warn(response.data.mensaje);
      }
    } catch (error) {
      console.error("Error al obtener publicaciones de Facebook:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // --- CARGA DEL CATÁLOGO PARA LA FUSIÓN ---
  const fetchCatalogo = async () => {
    setIsLoadingCatalogo(true);
    try {
      const response = await api.get('/catalogo/prendas/?incluir_archivadas=false');
      setCatalogoPrendas(response.data.results || response.data);
    } catch (error) {
      console.error("Error al cargar catálogo existente:", error);
    } finally {
      setIsLoadingCatalogo(false);
    }
  };

  // --- ACCIÓN: GATILLAR ESCANEO OCR ---
  const handleSincronizar = async (postId = null) => {
    setIsScanning(true);
    setSelectedPostId(postId);
    try {
      const response = await api.post('/integraciones/sincronizar-facebook/', {
        post_id: postId
      });
      
      // Alerta informativa si se gatilló el fallback automático por token expirado
      if (response.data.simulado && response.data.mensaje) {
        showAlert(response.data.mensaje);
      }

      // Función auxiliar para extraer la URL de Facebook sin los tokens de seguridad que cambian
      const getBaseUrl = (url) => {
        if (!url) return '';
        try {
          return new URL(url).origin + new URL(url).pathname;
        } catch (e) {
          return url.split('?')[0];
        }
      };

      // Inicializar el array de variantes para cada prenda detectada en el frontend (Caso 3)
      // y cruzar con catalogoPrendas para marcar las ya importadas
      const detectadasConVariantes = response.data.prendas_detectadas.map(p => ({
        ...p,
        ya_importada: catalogoPrendas.some(cp => getBaseUrl(cp.foto_url) === getBaseUrl(p.image_url)),
        variantes: p.variantes || [
          { color: 'Por defecto', talla: p.talla_sugerida || 'estándar', cantidad: 1 }
        ]
      }));

      setPrendasDetectadas(detectadasConVariantes);
      setHasScanned(true);
    } catch (error) {
      const msg = error.response?.data?.error || "Error al sincronizar con Facebook";
      showAlert(msg);
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  };

  // --- ACCIÓN: DESCARTAR PRENDA DE LA VISTA TEMPORAL ---
  const descartar = (id) => {
    setPrendasDetectadas(prev => prev.filter(p => p.facebook_post_id !== id));
  };

  // --- ACCIÓN: ACTUALIZAR CAMPOS REACTIVOS EN EL FORMULARIO DE LA CARD ---
  const handleFieldChange = (id, field, value) => {
    setPrendasDetectadas(prev => prev.map(p => {
      if (p.facebook_post_id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // --- ACCIÓN: MANEJO DINÁMICO DE VARIANTES (Caso 3 - Múltiples Tallas y Stock) ---
  const handleVariantChange = (id, varIdx, field, value) => {
    setPrendasDetectadas(prev => prev.map(p => {
      if (p.facebook_post_id === id) {
        const newVariants = [...p.variantes];
        newVariants[varIdx] = { ...newVariants[varIdx], [field]: value };
        return { ...p, variantes: newVariants };
      }
      return p;
    }));
  };

  const addVariant = (id) => {
    setPrendasDetectadas(prev => prev.map(p => {
      if (p.facebook_post_id === id) {
        return {
          ...p,
          variantes: [...(p.variantes || []), { color: 'Por defecto', talla: 'M', cantidad: 1 }]
        };
      }
      return p;
    }));
  };

  const removeVariant = (id, varIdx) => {
    setPrendasDetectadas(prev => prev.map(p => {
      if (p.facebook_post_id === id) {
        const newVariants = p.variantes.filter((_, idx) => idx !== varIdx);
        return { ...p, variantes: newVariants };
      }
      return p;
    }));
  };

  // --- ACCIÓN: MANEJO DINÁMICO DE VARIANTES EN FUSIÓN (Caso 4 - Separar tallas y stock en Fusión) ---
  const handleFuseVariantChange = (varIdx, field, value) => {
    setFuseVariantes(prev => {
      const newVariants = [...prev];
      newVariants[varIdx] = { ...newVariants[varIdx], [field]: value };
      return newVariants;
    });
  };

  const addFuseVariant = () => {
    setFuseVariantes(prev => [...prev, { color: 'Por defecto', talla: 'M', cantidad: 1 }]);
  };

  const removeFuseVariant = (varIdx) => {
    setFuseVariantes(prev => prev.filter((_, idx) => idx !== varIdx));
  };

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- ACCIÓN: GUARDAR COMO NUEVA PRENDA ---
  const guardarPrenda = async (prenda) => {
    try {
      await api.post('/catalogo/prendas/', {
        nombre: prenda.descripcion_sugerida,
        precio: prenda.precio_sugerido,
        foto_url: prenda.image_url,
        talla_tipo: 'por_talla',
        variantes: prenda.variantes
      });
      descartar(prenda.facebook_post_id);
      await fetchCatalogo();
      showToast("¡Prenda creada y guardada exitosamente en el catálogo!");
    } catch (error) {
      console.error("Error al guardar la prenda:", error);
      const details = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      showToast(`Error al guardar la prenda en el catálogo: ${details}`, 'error');
    }
  };

  // --- FLUIDEZ DE FUSIÓN (MODAL Y SELECCIÓN) ---
  const abrirFusionModal = (prendaDetectada) => {
    setCurrentPrendaToFuse(prendaDetectada);
    // Inicializar variantes en el modal con una copia profunda de las variantes de la tarjeta
    setFuseVariantes(prendaDetectada.variantes.map(v => ({ ...v })));
    setFuseColor(prendaDetectada.variantes?.[0]?.color || 'Por defecto');
    setSelectedExistingPrenda(null);
    setSearchQuery('');
    setIsModalOpen(true);
    fetchCatalogo();
  };

  const cerrarFusionModal = () => {
    setIsModalOpen(false);
    setCurrentPrendaToFuse(null);
    setSelectedExistingPrenda(null);
  };

  const seleccionarPrendaParaFusion = (prendaExistente) => {
    setSelectedExistingPrenda(prendaExistente);
  };

  const confirmarFusion = async () => {
    if (!selectedExistingPrenda || !currentPrendaToFuse) return;
    setIsSubmittingFusion(true);
    try {
      // Mapear el color de referencia seleccionado a cada una de las variantes
      const variantesConColor = fuseVariantes.map(v => ({
        ...v,
        color: fuseColor || 'Por defecto'
      }));
      
      await api.post('/catalogo/prendas/asociar_stock/', {
        prenda_id: selectedExistingPrenda.id,
        variantes: variantesConColor // Enviamos la lista de variantes múltiples con el color mapeado
      });
      descartar(currentPrendaToFuse.facebook_post_id);
      cerrarFusionModal();
      await fetchCatalogo();
      showAlert(`¡Stock fusionado correctamente en "${selectedExistingPrenda.nombre}"!`);
    } catch (error) {
      console.error("Error al asociar stock:", error);
      showAlert(error.response?.data?.error || "Error al fusionar stock con el catálogo.");
    } finally {
      setIsSubmittingFusion(false);
    }
  };

  const handleVolverASeleccion = () => {
    setHasScanned(false);
    setPrendasDetectadas([]);
    setSelectedPostId(null);
    fetchRecientesPosts();
  };

  // --- FORMATEO DE FECHAS ---
  const formatearFecha = (dateStr) => {
    try {
      const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateStr).toLocaleDateString('es-CL', options);
    } catch (e) {
      return dateStr;
    }
  };

  // --- FILTRADO DE PRENDAS DEL CATÁLOGO EN TIEMPO REAL ---
  const prendasFiltradas = catalogoPrendas.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sincro-container animate-fade-in">
      {/* Cabecera del Centro de Comando */}
      <div className="sincro-header">
        <div className="title-wrapper">
          <Camera color="#1877F2" size={32} />
          <h1>Auto-Catálogo Inteligente</h1>
        </div>
        <p>Importa prendas directamente de tus Lives de Facebook con escaneo OCR para descripciones y precios.</p>
      </div>

      {/* --- ESTADO 1: GRILLA DE SELECCIÓN DE POSTS (ANTES DE ESCANEAR) --- */}
      {!hasScanned && !isScanning && (
        <div className="sincro-flow-selection">
          <div className="section-intro glass" style={{ padding: 16, marginBottom: 24, borderRadius: 12 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="var(--color-secondary)" />
              Paso 1: Selecciona una publicación
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Elige el álbum o la publicación que deseas procesar. Típicamente corresponde a tu último Live o catálogo publicado.
            </p>
          </div>

          <h3 className="post-grid-title">Últimas Publicaciones en Facebook</h3>

          {isLoadingPosts ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="loader" style={{ margin: '0 auto 16px auto' }}></div>
              <p style={{ color: 'var(--color-text-muted)' }}>Obteniendo publicaciones recientes desde Meta...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state glass">
              <AlertCircle size={40} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
              <p>No se encontraron publicaciones en tu cuenta de Facebook conectada.</p>
              <button className="btn btn-secondary" onClick={fetchRecientesPosts} style={{ marginTop: 12 }}>
                <RefreshCw size={16} /> Reintentar
              </button>
            </div>
          ) : (
            <div className="post-grid">
              {posts.map(post => (
                <div key={post.id} className="post-card glass animate-slide-up">
                  <div className="post-card-image">
                    {post.full_picture ? (
                      <img src={post.full_picture} alt="Portada de publicación" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', color: 'var(--color-text-muted)' }}>
                        <Camera size={40} opacity={0.3} />
                      </div>
                    )}
                  </div>
                  <div className="post-card-content">
                    <div>
                      <div className="post-card-date">{formatearFecha(post.created_time)}</div>
                      <div className="post-card-text">{post.message || 'Sin descripción escrita.'}</div>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleSincronizar(post.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}
                    >
                      <Sparkles size={16} /> Procesar este Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón alternativo de bypass (Escanear último por defecto) */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => handleSincronizar(null)}>
              <Search size={16} /> Procesar Última Publicación Directamente
            </button>
          </div>
        </div>
      )}

      {/* --- ESTADO 2: CARGANDO / PROCESAMIENTO --- */}
      {isScanning && (
        <div className="sincro-loading glass">
          <div className="loader"></div>
          <h3>Descargando fotos de Facebook...</h3>
          <p style={{ maxWidth: '400px', margin: '8px auto 0 auto', color: 'var(--color-text-muted)' }}>
            Obteniendo las imágenes de la publicación seleccionada.
          </p>
        </div>
      )}

      {/* --- ESTADO 3: GRILLA DE RESULTADOS --- */}
      {hasScanned && !isScanning && (
        <div className="sincro-results animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Prendas Detectadas ({prendasDetectadas.length})</h3>
            <button className="btn btn-secondary" onClick={handleVolverASeleccion} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={16} /> Volver a Selección
            </button>
          </div>

          {prendasDetectadas.length === 0 ? (
            <div className="empty-state glass">
              <p>¡Excelente! Ya no quedan prendas pendientes en esta publicación.</p>
              <button className="btn btn-primary" onClick={handleVolverASeleccion} style={{ marginTop: 16 }}>
                Seleccionar otro post
              </button>
            </div>
          ) : (
            <div className="sincro-list">
              {prendasDetectadas.map(p => (
                <div key={p.facebook_post_id} className={`sincro-card glass animate-slide-up ${p.ya_importada ? 'duplicado' : ''}`} style={p.ya_importada ? { opacity: 0.6 } : {}}>
                  <div className="sincro-card-image">
                    <img src={p.image_url} alt="Extraída" />
                  </div>

                  <div className="sincro-card-content">
                    {p.texto_extraido && (
                      <div className="input-group">
                        <label>Texto de la Publicación</label>
                        <textarea 
                          value={p.texto_extraido} 
                          rows="2"
                          className="glass-input"
                          readOnly
                          style={{ background: 'rgba(0,0,0,0.03)', resize: 'none' }}
                        />
                      </div>
                    )}

                    <div className="input-group-row" style={{ marginTop: 12 }}>
                      <div className="input-group">
                        <label>Precio Sugerido ($)</label>
                        <input 
                          type="number" 
                          value={p.precio_sugerido} 
                          className="glass-input"
                          onChange={(e) => handleFieldChange(p.facebook_post_id, 'precio_sugerido', e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                        />
                      </div>
                    </div>

                    <div className="input-group" style={{ marginTop: 12 }}>
                      <label>Nombre del Producto</label>
                      <input 
                        type="text" 
                        value={p.descripcion_sugerida} 
                        className="glass-input"
                        onChange={(e) => handleFieldChange(p.facebook_post_id, 'descripcion_sugerida', e.target.value)}
                      />
                    </div>

                    {/* --- SECCIÓN NUEVA: TABLA DINÁMICA DE TALLAS Y STOCK --- */}
                    <div className="variants-editor-section" style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>Variantes de Talla y Stock</span>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => addVariant(p.facebook_post_id)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Plus size={12} /> + Talla
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {p.variantes.map((v, vIdx) => (
                          <div key={vIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ flex: 1.5 }}>
                              <select
                                value={v.color || ''}
                                onChange={(e) => handleVariantChange(p.facebook_post_id, vIdx, 'color', e.target.value)}
                                className="glass-input"
                                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%', WebkitAppearance: 'none' }}
                              >
                                {COLORES_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1.5 }}>
                              <select
                                value={v.talla || ''}
                                onChange={(e) => handleVariantChange(p.facebook_post_id, vIdx, 'talla', e.target.value)}
                                className="glass-input"
                                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%', WebkitAppearance: 'none' }}
                              >
                                {TALLAS_DISPONIBLES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <input
                                type="number"
                                min="1"
                                value={v.cantidad}
                                onChange={(e) => handleVariantChange(p.facebook_post_id, vIdx, 'cantidad', parseInt(e.target.value) || 1)}
                                className="glass-input"
                                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                placeholder="Stock"
                              />
                            </div>
                            {p.variantes.length > 1 && (
                              <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => removeVariant(p.facebook_post_id, vIdx)}
                                style={{ color: 'var(--color-error)', padding: '6px' }}
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {p.ya_importada ? (
                      <div className="sincro-actions" style={{ marginTop: 24, gap: 10, justifyContent: 'center' }}>
                        <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '10px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                          <Check size={18} /> ✓ En Catálogo
                        </div>
                      </div>
                    ) : (
                      <div className="sincro-actions" style={{ marginTop: 24, gap: 10 }}>
                        <button className="btn btn-icon-simple danger" onClick={() => descartar(p.facebook_post_id)} style={{ flex: 1 }}>
                          <X size={18} /> Descartar
                        </button>
                        
                        <button className="btn btn-secondary" onClick={() => abrirFusionModal(p)} style={{ flex: 1.2, gap: 4 }}>
                          <Link2 size={16} /> Sumar Stock
                        </button>
  
                        <button className="btn btn-primary" onClick={() => guardarPrenda(p)} style={{ flex: 1.5 }}>
                          <Check size={18} /> Crear Nuevo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL BOTTOM SHEET: FUSIÓN DE STOCK --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={cerrarFusionModal}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>Fusionar con Catálogo</h3>
              <button className="btn-close" onClick={cerrarFusionModal}>
                <X size={24} />
              </button>
            </div>

            {/* Paso 1 del Modal: Buscar y seleccionar prenda */}
            {!selectedExistingPrenda ? (
              <>
                <div className="sheet-search">
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar producto existente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: 40 }}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="sheet-list">
                  {isLoadingCatalogo ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div className="loader" style={{ width: 24, height: 24, margin: '0 auto' }}></div>
                      <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Cargando catálogo...</p>
                    </div>
                  ) : prendasFiltradas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 0', fontSize: '0.9rem' }}>
                      No se encontraron prendas con ese nombre.
                    </p>
                  ) : (
                    prendasFiltradas.map(prenda => (
                      <div 
                        key={prenda.id} 
                        className="sheet-item" 
                        onClick={() => seleccionarPrendaParaFusion(prenda)}
                      >
                        <img 
                          src={prenda.foto_url || 'https://placehold.co/100'} 
                          alt={prenda.nombre} 
                          className="sheet-item-img" 
                        />
                        <div className="sheet-item-info">
                          <span className="sheet-item-name">{prenda.nombre}</span>
                          <span className="sheet-item-price">${prenda.precio ? prenda.precio.toLocaleString('es-CL') : '0'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Paso 2 del Modal: Formulario de variantes a fusionar (Caso 4 - Separado por Tallas y Stocks en Fusión!) */
              <div className="fusion-form animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, background: 'rgba(24, 119, 242, 0.06)', border: '1px solid rgba(24, 119, 242, 0.15)' }}>
                  <img 
                    src={selectedExistingPrenda.foto_url || 'https://placehold.co/100'} 
                    alt={selectedExistingPrenda.nombre} 
                    style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} 
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>{selectedExistingPrenda.nombre}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Total Stock Actual: {selectedExistingPrenda.variantes?.reduce((acc, v) => acc + v.cantidad, 0) || 0} unidades
                    </p>
                  </div>
                </div>

                {/* Tabla Dinámica para Fusión de Variantes Múltiples */}
                <div className="variants-editor-section" style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>Definir Tallas y Cantidades a Agregar</span>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={addFuseVariant}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={12} /> + Talla
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {fuseVariantes.map((v, vIdx) => (
                      <div key={vIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ flex: 1.5 }}>
                          <input
                            type="text"
                            value={v.talla}
                            onChange={(e) => handleFuseVariantChange(vIdx, 'talla', e.target.value)}
                            className="glass-input"
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                            placeholder="Talla (S, M, L...)"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="number"
                            min="1"
                            value={v.cantidad}
                            onChange={(e) => handleFuseVariantChange(vIdx, 'cantidad', parseInt(e.target.value) || 1)}
                            className="glass-input"
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                            placeholder="Stock a sumar"
                          />
                        </div>
                        {fuseVariantes.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => removeFuseVariant(vIdx)}
                            style={{ color: 'var(--color-error)', padding: '6px' }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: 4 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>Color de Referencia</label>
                  <input
                    type="text"
                    value={fuseColor}
                    onChange={(e) => setFuseColor(e.target.value)}
                    className="glass-input"
                    placeholder="Ej: Beige, Negro, Blanco..."
                  />
                </div>

                <div className="sincro-actions" style={{ marginTop: 12, gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedExistingPrenda(null)} style={{ flex: 1 }}>
                    <ArrowLeft size={16} /> Volver
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={confirmarFusion} 
                    style={{ flex: 2 }} 
                    disabled={isSubmittingFusion}
                  >
                    {isSubmittingFusion ? 'Fusionando...' : 'Confirmar Fusión'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* TOAST DE NOTIFICACIÓN */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'max-content',
          maxWidth: '90%',
          background: toastMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 10000,
          fontWeight: 600,
          fontSize: '0.9rem',
          animation: 'slideDown 0.3s ease-out forwards',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '8px',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }}>
          {toastMessage.type === 'success' ? <Check size={18} style={{ flexShrink: 0 }} /> : <AlertTriangle size={18} style={{ flexShrink: 0 }} />}
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
};

export default Sincronizacion;
