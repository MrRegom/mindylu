// ─────────────────────────────────────────────────────────────
// frontend/src/pages/Catalogo.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Plus, Check, ImageIcon, Trash2, Search, Edit2, Rocket, X, Share2, Calendar, Star, Images } from 'lucide-react';
import GlobalSpinner from '../components/GlobalSpinner';
import api from '../services/api';
import VenderModal from '../components/VenderModal';
import EditarPrendaModal from '../components/EditarPrendaModal';
import './Catalogo.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const Catalogo = () => {
  const navigate = useNavigate();
  const [prendas, setPrendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null); // null = Todas
  const [soloHoy, setSoloHoy] = useState(false);

  // Modo publicación
  const [modoPublicar, setModoPublicar] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [publicarModal, setPublicarModal] = useState(false);
  const [mensajePublicar, setMensajePublicar] = useState('');
  const [fechaPublicar, setFechaPublicar] = useState('');
  const [publicando, setPublicando] = useState(false);

  // Modales existentes
  const [modalOpen, setModalOpen] = useState(false);
  const [ventaActiva, setVentaActiva] = useState({ cart: [], clienta_id: '', entrega_diaria_id: '', notas: '' });
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [prendaAEditar, setPrendaAEditar] = useState(null);

  const fetchCatalogo = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (categoriaActiva) params.categoria = categoriaActiva;
      if (soloHoy) params.solo_hoy = 'true';
      const rPrendas = await api.get('/catalogo/prendas/', { params });
      setPrendas(rPrendas.data.results || rPrendas.data);
    } catch (error) {
      console.error('Error al cargar prendas:', error);
      setPrendas([]);
    } finally {
      setIsLoading(false);
    }
    // Categorias en llamada separada — no bloquea el catalogo si falla
    try {
      const rCats = await api.get('/catalogo/categorias/');
      setCategorias(Array.isArray(rCats.data) ? rCats.data : (rCats.data.results || []));
    } catch (error) {
      console.error('Error al cargar categorias:', error);
    }
  };

  useEffect(() => {
    fetchCatalogo();
  }, [categoriaActiva, soloHoy]);

  const filteredPrendas = prendas.filter(p =>
    (p.nombre || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Venta / Apartado ──────────────────────────────────────────
  const openVenderModal = (prenda, variante) => {
    if (variante.cantidad === 0 || modoPublicar) return;
    setVentaActiva(prev => {
      const exists = prev.cart.find(c => c.variante_id === variante.id);
      const newCart = exists
        ? prev.cart.map(c => c.variante_id === variante.id ? { ...c, cantidad: Math.min(c.maxCantidad, c.cantidad + 1) } : c)
        : [...prev.cart, { prenda_id: prenda.id, variante_id: variante.id, nombre: prenda.nombre, foto_url: prenda.foto_url, color: variante.color, talla: variante.talla, cantidad: 1, maxCantidad: variante.cantidad, precio: prenda.precio }];
      return { ...prev, cart: newCart };
    });
    setModalOpen(true);
  };

  const handleVentaExitosa = () => {
    setModalOpen(false);
    setVentaActiva({ cart: [], clienta_id: '', entrega_diaria_id: '', notas: '' });
    fetchCatalogo();
  };

  const handleArchivarPrenda = async (prendaId, nombre) => {
    if (await showConfirm(`¿Deshabilitar "${nombre}" del catálogo?`)) {
      try {
        await api.delete(`/catalogo/prendas/${prendaId}/`);
        fetchCatalogo();
      } catch (error) {
        showAlert('No se pudo deshabilitar la prenda.');
      }
    }
  };

  const handleEditarPrenda = (prenda) => { setPrendaAEditar(prenda); setEditModalOpen(true); };
  const handleEdicionExitosa = () => { setEditModalOpen(false); setPrendaAEditar(null); fetchCatalogo(); };

  // ── Modo Publicar ─────────────────────────────────────────────
  const toggleSeleccion = (id) => {
    setSeleccionadas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const seleccionarTodasHoy = () => {
    // Prendas cargadas en las últimas 24 horas
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ids = filteredPrendas.filter(p => new Date(p.fecha_ultima_carga) >= hace24h).map(p => p.id);
    setSeleccionadas(new Set(ids));
    if (ids.length === 0) showAlert('No hay prendas cargadas en las últimas 24 horas.');
  };

  const handlePublicar = async () => {
    if (seleccionadas.size === 0) { showAlert('Selecciona al menos una prenda.'); return; }
    setPublicando(true);
    try {
      await api.post('/catalogo/prendas/publicar_seleccionadas/', {
        prenda_ids: Array.from(seleccionadas),
        mensaje: mensajePublicar,
        fecha_programada: fechaPublicar || null
      });
      showAlert(fechaPublicar ? `¡Lote programado para el ${new Date(fechaPublicar).toLocaleString()}!` : '¡Publicado en Facebook exitosamente!');
      setModoPublicar(false);
      setSeleccionadas(new Set());
      setPublicarModal(false);
      setMensajePublicar('');
      setFechaPublicar('');
      fetchCatalogo();
    } catch (e) {
      showAlert('Error al publicar: ' + (e.response?.data?.error || e.message));
    } finally {
      setPublicando(false);
    }
  };

  // Verificar si una prenda es "nueva de hoy" (últimas 24h)
  const esNuevaDeHoy = (prenda) => {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(prenda.fecha_ultima_carga) >= hace24h;
  };

  return (
    <div className="catalogo-container animate-fade-in">
      <GlobalSpinner isVisible={publicando} text="Publicando en Facebook..." />

      {/* Header */}
      <div className="catalogo-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display', margin: '0 0 4px 0' }}>Catálogo</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>{prendas.length} prendas activas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Botón Modo Publicar */}
          <button
            className="btn-icon-simple"
            onClick={() => { setModoPublicar(!modoPublicar); setSeleccionadas(new Set()); }}
            title={modoPublicar ? 'Cancelar selección' : 'Publicar en Facebook'}
            style={{ background: modoPublicar ? 'var(--color-primary-gradient)' : 'var(--color-surface)', color: modoPublicar ? '#FFF' : 'var(--color-text)', border: modoPublicar ? 'none' : '1px solid var(--color-border)' }}
          >
            <Share2 size={20} />
          </button>
          <button className="btn-icon-simple" onClick={() => navigate('/catalogo/nueva')} title="Añadir prenda manual" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            <Plus size={20} />
          </button>
          <button className="btn-icon-simple" onClick={() => navigate('/catalogo/subida-masiva')} title="Subida Masiva (Lote)" style={{ background: 'var(--color-primary-gradient)', color: '#FFF', border: 'none' }}>
            <Images size={20} />
          </button>
        </div>
      </div>

      {/* Banner modo publicar */}
      {modoPublicar && (
        <div style={{ background: 'rgba(var(--color-primary-rgb), 0.1)', border: '1.5px solid rgba(var(--color-primary-rgb), 0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, fontSize: '0.88rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={15} />
          Modo publicar activo — toca las prendas para seleccionarlas
          <button onClick={seleccionarTodasHoy} style={{ marginLeft: 'auto', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={12} /> Nuevas de hoy
          </button>
        </div>
      )}

      {/* Búsqueda */}
      <div className="catalogo-search" style={{ marginBottom: 16 }}>
        <div className="search-input-container" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar prenda por nombre, color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass"
            style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.95rem' }}
          />
        </div>
      </div>

      {/* Filtros por categoría + Hoy */}
      <div className="catalogo-pills" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 8, scrollbarWidth: 'none' }}>
        <button
          className="badge"
          onClick={() => { setCategoriaActiva(null); setSoloHoy(false); }}
          style={{ background: !categoriaActiva && !soloHoy ? 'var(--color-primary-gradient)' : 'var(--color-surface)', color: !categoriaActiva && !soloHoy ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
        >
          Todas
        </button>
        <button
          className="badge"
          onClick={() => { setSoloHoy(!soloHoy); setCategoriaActiva(null); }}
          style={{ background: soloHoy ? 'var(--color-primary-gradient)' : 'var(--color-surface)', color: soloHoy ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
        >
          🆕 Hoy
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id}
            className="badge"
            onClick={() => { setCategoriaActiva(cat.id); setSoloHoy(false); }}
            style={{ background: categoriaActiva === cat.id ? 'var(--color-primary-gradient)' : 'var(--color-surface)', color: categoriaActiva === cat.id ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Grid de prendas */}
      {isLoading ? (
        <div className="loading-state">Cargando catálogo...</div>
      ) : filteredPrendas.length === 0 ? (
        <div className="empty-state glass">
          <h3>No hay prendas</h3>
          <p>Sube fotos con el botón del cohete 🚀</p>
        </div>
      ) : (
        <div className="prendas-grid">
          {filteredPrendas.map((prenda) => {
            const estaSeleccionada = seleccionadas.has(prenda.id);
            const esNueva = esNuevaDeHoy(prenda);
            return (
              <div
                key={prenda.id}
                className="prenda-card glass animate-slide-up"
                onClick={() => modoPublicar && toggleSeleccion(prenda.id)}
                style={{ cursor: modoPublicar ? 'pointer' : 'default', outline: estaSeleccionada ? '2.5px solid var(--color-primary)' : 'none', position: 'relative' }}
              >
                {/* Badge nueva de hoy */}
                {esNueva && (
                  <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, background: 'var(--color-primary-gradient)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    🆕 HOY
                  </div>
                )}
                {/* Checkbox en modo publicar */}
                {modoPublicar && (
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 24, height: 24, borderRadius: '50%', background: estaSeleccionada ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)', border: `2px solid ${estaSeleccionada ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    {estaSeleccionada && <Check size={14} color="white" />}
                  </div>
                )}

                <div className="prenda-foto" onClick={() => {
                  if (modoPublicar) return;
                  const imgUrl = prenda.imagenes?.length > 0 ? prenda.imagenes[0].imagen : prenda.foto_url;
                  if (imgUrl) setFullscreenImage(imgUrl);
                }} style={{ cursor: modoPublicar ? 'pointer' : 'zoom-in' }}>
                  {prenda.imagenes?.length > 0 ? (
                    <img src={prenda.imagenes[0].imagen} alt={prenda.nombre} />
                  ) : prenda.foto_url ? (
                    <img src={prenda.foto_url} alt={prenda.nombre} />
                  ) : (
                    <div className="foto-placeholder"><ImageIcon size={32} /></div>
                  )}
                  {prenda.estado === 'agotada' && <div className="badge-agotado">Agotada</div>}
                </div>

                <div className="prenda-info" style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prenda.nombre}</h3>
                      {prenda.categoria_nombre && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.05)', padding: '1px 8px', borderRadius: 20 }}>{prenda.categoria_nombre}</span>
                      )}
                    </div>
                    {!modoPublicar && (
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button onClick={(e) => { e.stopPropagation(); handleEditarPrenda(prenda); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 4, display: 'inline-flex' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleArchivarPrenda(prenda.id, prenda.nombre); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, display: 'inline-flex' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="precio" style={{ marginTop: 4 }}>${Number(prenda.precio || 0).toLocaleString('es-CL')}</div>

                  {!modoPublicar && (
                    <div className="variantes-list" style={{ marginTop: 12 }}>
                      {prenda.variantes?.map((variante) => {
                        const agotado = variante.cantidad === 0;
                        return (
                          <div key={variante.id} className={`variante-item ${agotado ? 'agotada' : ''}`}>
                            <div className="variante-detalle">
                              <span className="variante-color">{variante.color || 'Único'}</span>
                              {variante.talla && <span className="variante-talla">{variante.talla}</span>}
                            </div>
                            <div className="variante-stock">
                              <span className="stock-num">{variante.cantidad} disp.</span>
                              <button
                                className="btn-vender"
                                disabled={agotado}
                                onClick={() => openVenderModal(prenda, variante)}
                                title={agotado ? 'Agotado' : 'Apartar'}
                              >
                                <Check size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra flotante de publicación */}
      {modoPublicar && seleccionadas.size > 0 && (
        <div className="venta-flotante-bar glass animate-slide-up" style={{ background: 'var(--color-primary-gradient)' }}>
          <div className="venta-flotante-info" style={{ color: 'white' }}>
            <span className="cart-badge" style={{ background: 'white', color: 'var(--color-primary)' }}>{seleccionadas.size}</span>
            <span>prendas seleccionadas</span>
          </div>
          <div className="venta-flotante-actions">
            <button className="btn btn-small" onClick={() => setSeleccionadas(new Set())} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
              Vaciar
            </button>
            <button className="btn btn-small" onClick={() => setPublicarModal(true)} style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 700, border: 'none' }}>
              Publicar
            </button>
          </div>
        </div>
      )}

      {/* Barra flotante de venta en curso */}
      {ventaActiva.cart.length > 0 && !modalOpen && !modoPublicar && (
        <div className="venta-flotante-bar glass animate-slide-up">
          <div className="venta-flotante-info">
            <span className="cart-badge">{ventaActiva.cart.reduce((sum, item) => sum + item.cantidad, 0)}</span>
            <span>Prendas en tu apartado actual</span>
          </div>
          <div className="venta-flotante-actions">
            <button className="btn btn-secondary btn-small" onClick={() => setVentaActiva({ cart: [], clienta_id: '', entrega_diaria_id: '', notas: '' })}>Vaciar</button>
            <button className="btn btn-primary btn-small" onClick={() => setModalOpen(true)}>Continuar</button>
          </div>
        </div>
      )}

      {/* Modal de publicación */}
      {publicarModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'flex-end' }} onClick={() => setPublicarModal(false)}>
          <div className="glass" onClick={e => e.stopPropagation()} style={{ width: '100%', borderRadius: '20px 20px 0 0', padding: 24, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Publicar {seleccionadas.size} prenda(s)</h3>
            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>Texto del post</label>
            <textarea
              value={mensajePublicar}
              onChange={e => setMensajePublicar(e.target.value)}
              placeholder="✨ Nuevas llegadas disponibles..."
              rows={3}
              style={{ width: '100%', borderRadius: 12, padding: 12, border: '1px solid rgba(0,0,0,0.1)', marginBottom: 16, resize: 'none', fontSize: '0.9rem' }}
            />
            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Programar para (opcional)
            </label>
            <input
              type="datetime-local"
              value={fechaPublicar}
              onChange={e => setFechaPublicar(e.target.value)}
              style={{ width: '100%', borderRadius: 12, padding: 12, border: '1px solid rgba(0,0,0,0.1)', marginBottom: 20, fontSize: '0.9rem' }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn" onClick={() => setPublicarModal(false)} style={{ flex: 1, background: 'var(--color-surface)' }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handlePublicar} disabled={publicando} style={{ flex: 2 }}>
                {publicando ? 'Publicando...' : fechaPublicar ? '📅 Programar' : '🚀 Publicar ahora'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modales */}
      <VenderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} ventaActiva={ventaActiva} setVentaActiva={setVentaActiva} onSuccess={handleVentaExitosa} />
      <EditarPrendaModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} prenda={prendaAEditar} onSuccess={handleEdicionExitosa} />

      {/* Fullscreen image */}
      {fullscreenImage && (
        <div onClick={() => setFullscreenImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
          <button style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 10 }} onClick={() => setFullscreenImage(null)}>
            <X size={32} />
          </button>
          <img src={fullscreenImage} alt="Fullscreen" style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default Catalogo;
