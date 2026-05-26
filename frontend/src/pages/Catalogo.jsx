// ─────────────────────────────────────────────────────────────
// frontend/src/pages/Catalogo.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, ImageIcon, Trash2, Search, Edit2, Rocket } from 'lucide-react';
import api from '../services/api';
import VenderModal from '../components/VenderModal';
import EditarPrendaModal from '../components/EditarPrendaModal';
import './Catalogo.css';

/**
 * Componente Catalogo
 * 
 * Despliega el catálogo de prendas activas (disponibles o agotadas).
 * Optimizado:
 * 1. Habilita una opción de "deshabilitar/eliminar" prenda (soft-delete).
 *    Cambia el estado de la prenda a 'archivada' en la base de datos para conservarla
 *    para reconocimientos futuros de OCR pero removerla de la vista activa.
 */
const Catalogo = () => {
  const navigate = useNavigate();
  const [prendas, setPrendas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado unificado para la Venta/Apartado en curso
  const [modalOpen, setModalOpen] = useState(false);
  const [ventaActiva, setVentaActiva] = useState({
    cart: [],
    clienta_id: '',
    entrega_diaria_id: '',
    notas: ''
  });

  const fetchCatalogo = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/catalogo/prendas/');
      setPrendas(response.data.results || response.data);
    } catch (error) {
      console.error("Error al cargar el catálogo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogo();
  }, []);

  const filteredPrendas = prendas && prendas.length > 0 ? prendas.filter(prenda => 
    (prenda.nombre || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const openVenderModal = (prenda, variante) => {
    if (variante.cantidad === 0) return;
    
    setVentaActiva(prev => {
      const exists = prev.cart.find(c => c.variante_id === variante.id);
      let newCart = [];
      if (exists) {
        // Si ya está en el carrito, sumamos 1 unidad respetando el stock disponible
        newCart = prev.cart.map(c => 
          c.variante_id === variante.id 
            ? { ...c, cantidad: Math.min(c.maxCantidad, c.cantidad + 1) } 
            : c
        );
      } else {
        // Si no está, lo agregamos
        newCart = [...prev.cart, {
          prenda_id: prenda.id,
          variante_id: variante.id,
          nombre: prenda.nombre,
          foto_url: prenda.foto_url,
          color: variante.color,
          talla: variante.talla,
          cantidad: 1,
          maxCantidad: variante.cantidad,
          precio: prenda.precio
        }];
      }
      return {
        ...prev,
        cart: newCart
      };
    });
    
    setModalOpen(true);
  };

  const handleVentaExitosa = () => {
    setModalOpen(false);
    setVentaActiva({
      cart: [],
      clienta_id: '',
      entrega_diaria_id: '',
      notes: '',
      notas: ''
    });
    fetchCatalogo(); // Recargar para actualizar el stock visible
  };

  // --- ACCIÓN: SOFT-DELETE (Archivar/Deshabilitar prenda) ---
  const handleArchivarPrenda = async (prendaId, nombre) => {
    const msj = `¿Seguro que deseas deshabilitar "${nombre}" del catálogo?\n\nEl producto dejará de mostrarse en esta lista, pero se mantendrá guardado de forma segura en la base de datos para que la IA lo reconozca en futuras importaciones sin perder ningún dato.`;
    if (window.confirm(msj)) {
      try {
        await api.delete(`/catalogo/prendas/${prendaId}/`);
        alert("Prenda deshabilitada exitosamente del catálogo.");
        fetchCatalogo();
      } catch (error) {
        console.error("Error al deshabilitar prenda:", error);
        alert("No se pudo deshabilitar la prenda.");
      }
    }
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [prendaAEditar, setPrendaAEditar] = useState(null);

  const handleEditarPrenda = (prenda) => {
    setPrendaAEditar(prenda);
    setEditModalOpen(true);
  };

  const handleEdicionExitosa = () => {
    setEditModalOpen(false);
    setPrendaAEditar(null);
    fetchCatalogo();
  };

  return (
    <div className="catalogo-container animate-fade-in">
      <div className="catalogo-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display', margin: '0 0 4px 0' }}>Catálogo</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>{prendas.length} prendas activas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-icon-simple" title="Buscar" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}><Search size={20} /></button>
          <button className="btn-icon-simple" onClick={() => navigate('/catalogo/nueva')} title="Añadir una prenda manual" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}><Plus size={20} /></button>
          <button className="btn-icon-simple" onClick={() => navigate('/catalogo/carga-masiva')} title="Carga Masiva con Magia" style={{ background: 'var(--color-primary-gradient)', color: '#FFF', border: 'none' }}><Rocket size={20} /></button>
        </div>
      </div>

      <div className="catalogo-search" style={{ marginBottom: '16px' }}>
        <div className="search-input-container" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar prenda por nombre, color..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass"
            style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.95rem', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)' }}
          />
        </div>
      </div>

      <div className="catalogo-pills" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '8px', scrollbarWidth: 'none' }}>
        <button className="badge" style={{ background: 'var(--color-primary-gradient)', color: 'white', padding: '6px 16px', fontSize: '0.85rem' }}>Todas</button>
        <button className="badge" style={{ background: 'var(--color-surface)', padding: '6px 16px', fontSize: '0.85rem', border: '1px solid var(--color-border)' }}>Suéteres</button>
        <button className="badge" style={{ background: 'var(--color-surface)', padding: '6px 16px', fontSize: '0.85rem', border: '1px solid var(--color-border)' }}>Blusas</button>
        <button className="badge" style={{ background: 'var(--color-surface)', padding: '6px 16px', fontSize: '0.85rem', border: '1px solid var(--color-border)' }}>Vestidos</button>
        <button className="badge" style={{ background: 'var(--color-surface)', padding: '6px 16px', fontSize: '0.85rem', border: '1px solid var(--color-border)' }}>Pantalones</button>
      </div>

      {isLoading ? (
        <div className="loading-state">Cargando catálogo...</div>
      ) : filteredPrendas.length === 0 ? (
        <div className="empty-state glass">
          <h3>No hay prendas</h3>
          <p>Sube prendas manualmente o cambia tu búsqueda.</p>
        </div>
      ) : (
        <div className="prendas-grid">
          {filteredPrendas.map((prenda) => (
            <div key={prenda.id} className="prenda-card glass animate-slide-up">
              <div className="prenda-foto">
                {prenda.imagenes && prenda.imagenes.length > 0 ? (
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
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>{prenda.nombre}</h3>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button 
                      onClick={() => handleEditarPrenda(prenda)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 4, display: 'inline-flex' }}
                      title="Editar prenda"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleArchivarPrenda(prenda.id, prenda.nombre)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, display: 'inline-flex' }}
                      title="Archivar/Deshabilitar prenda"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="precio" style={{ marginTop: 4 }}>${prenda.precio.toLocaleString('es-CL')}</div>
                
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
                            title={agotado ? "Agotado" : "Apartar"}
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE VENTA */}
      <VenderModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        ventaActiva={ventaActiva}
        setVentaActiva={setVentaActiva}
        onSuccess={handleVentaExitosa}
      />

      {/* BARRA FLOTANTE DE VENTA EN CURSO (Caso A - Pocos Clics!) */}
      {ventaActiva.cart.length > 0 && !modalOpen && (
        <div className="venta-flotante-bar glass animate-slide-up">
          <div className="venta-flotante-info">
            <span className="cart-badge">{ventaActiva.cart.reduce((sum, item) => sum + item.cantidad, 0)}</span>
            <span>Prendas en tu apartado actual</span>
          </div>
          <div className="venta-flotante-actions">
            <button className="btn btn-secondary btn-small" onClick={() => setVentaActiva({ cart: [], clienta_id: '', entrega_diaria_id: '', notas: '' })}>
              Vaciar
            </button>
            <button className="btn btn-primary btn-small" onClick={() => setModalOpen(true)}>
              Continuar
            </button>
          </div>
        </div>
      )}
      {/* MODAL DE EDICIÓN */}
      <EditarPrendaModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        prenda={prendaAEditar}
        onSuccess={handleEdicionExitosa}
      />
    </div>
  );
};

export default Catalogo;
