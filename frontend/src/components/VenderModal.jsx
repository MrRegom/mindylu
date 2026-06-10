// ─────────────────────────────────────────────────────────────
// frontend/src/components/VenderModal.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { X, Search, Calendar, UserPlus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import './VenderModal.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

/**
 * Componente VenderModal
 * 
 * Modal interactivo e inteligente para apartar prendas para una clienta.
 * Optimizado (Caso A):
 * 1. Funciona como un micro-carrito de compras dentro del mismo modal,
 *    permitiendo sumar MÚLTIPLES PRENDAS Y VARIANTES de una sola vez.
 * 2. Diseño premium de entradas de notas y elementos sin bordes retro "PHP 90".
 */
const VenderModal = ({ isOpen, onClose, ventaActiva, setVentaActiva, onSuccess }) => {
  const [clientas, setClientas] = useState([]);
  const [rutasProgramadas, setRutasProgramadas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- ENLACE REACTIVO DE ESTADO ATÓMICO (Caso A - Pocos Clics!) ---
  const { cart = [], clienta_id = '', entrega_diaria_id = '', notas = '', estado = 'apartado' } = ventaActiva || {};
  const formData = { clienta_id, entrega_diaria_id, notas, estado };
  const [catalogItems, setCatalogItems] = useState([]);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Emulación de setCart compatible con useState de React
  const setCart = (newCartOrFn) => {
    setVentaActiva(prev => {
      const nextCart = typeof newCartOrFn === 'function' ? newCartOrFn(prev.cart) : newCartOrFn;
      return { ...prev, cart: nextCart };
    });
  };

  // Emulación de setFormData compatible con useState de React
  const setFormData = (newFormDataOrFn) => {
    setVentaActiva(prev => {
      const currentFormData = { clienta_id: prev.clienta_id, entrega_diaria_id: prev.entrega_diaria_id, notas: prev.notas, estado: prev.estado || 'apartado' };
      const nextFormData = typeof newFormDataOrFn === 'function' ? newFormDataOrFn(currentFormData) : newFormDataOrFn;
      return {
        ...prev,
        ...nextFormData
      };
    });
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setAddSearchQuery('');
      setShowAddSelector(false);
      fetchClientas();
      fetchRutasProgramadas();
      fetchCatalogForSelector();
    }
  }, [isOpen]);

  const fetchClientas = async () => {
    try {
      const res = await api.get('/clientas/');
      setClientas(res.data.results || res.data);
    } catch (error) {
      console.error("Error cargando clientas:", error);
    }
  };

  const fetchRutasProgramadas = async () => {
    try {
      const res = await api.get('/pedidos/entregas/');
      setRutasProgramadas(res.data.results || res.data);
    } catch (error) {
      console.error("Error cargando rutas programadas:", error);
    }
  };

  const fetchCatalogForSelector = async () => {
    try {
      const res = await api.get('/catalogo/prendas/');
      setCatalogItems(res.data.results || res.data || []);
    } catch (e) {
      console.error("Error cargando catálogo:", e);
      setCatalogItems([]);
    }
  };

  const filteredClientas = Array.isArray(clientas) ? clientas.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const filteredCatalogItems = Array.isArray(catalogItems) ? catalogItems.filter(p =>
    p.nombre.toLowerCase().includes(addSearchQuery.toLowerCase())
  ) : [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- CARRITO LOGIC ---
  const handleUpdateQuantity = (varId, qty) => {
    setCart(prev => prev.map(item => {
      if (item.variante_id === varId) {
        const val = Math.min(item.maxCantidad, Math.max(1, qty));
        return { ...item, cantidad: val };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (varId) => {
    setCart(prev => prev.filter(item => item.variante_id !== varId));
  };

  const handleAddProductToCart = (prendaObj, varianteObj) => {
    const exists = cart.find(c => c.variante_id === varianteObj.id);
    if (exists) {
      showAlert("Este producto ya está en tu lista. Puedes aumentar su cantidad.");
      return;
    }
    
    setCart(prev => [...prev, {
      prenda_id: prendaObj.id,
      variante_id: varianteObj.id,
      nombre: prendaObj.nombre,
      foto_url: prendaObj.imagenes?.find(img => img.color && varianteObj.color && img.color.toLowerCase() === varianteObj.color.toLowerCase())?.imagen || prendaObj.imagenes?.[0]?.imagen || prendaObj.foto_url,
      color: varianteObj.color,
      talla: varianteObj.talla,
      cantidad: 1,
      maxCantidad: varianteObj.cantidad,
      precio: prendaObj.precio
    }]);
    setShowAddSelector(false);
    setAddSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clienta_id) {
      showAlert("Debes seleccionar una clienta.");
      return;
    }
    if (cart.length === 0) {
      showAlert("Debes agregar al menos una prenda al carrito.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Registrar consecutivamente los items en el backend.
      // Gracias a la lógica de "Agrupamiento Inteligente" que implementamos en el backend,
      // el primer POST creará el pedido y los siguientes POSTs sumarán los items al mismo pedido de forma transparente!
      for (const item of cart) {
        const payload = {
          clienta_id: parseInt(formData.clienta_id),
          variante_id: item.variante_id,
          cantidad: item.cantidad,
          entrega_diaria_id: formData.entrega_diaria_id ? parseInt(formData.entrega_diaria_id) : null,
          notas: formData.notas,
          estado: formData.estado
        };
        await api.post('/pedidos/crear-desde-catalogo/', payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Error al registrar pedido(s):", error);
      showAlert(error.response?.data?.error || "Error al registrar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalVenta = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-up">
        <div className="modal-header">
          <h3>Nueva Venta</h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="vender-form">
          {/* Campo 1: Seleccionar Clienta */}
          <div className="form-group">
            <label>¿A quién se lo apartas?</label>
            <div className="search-clienta-box">
              <Search size={18} className="icon-left" />
              <input 
                type="text" 
                placeholder="Buscar o crear clienta..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            
            <div className="clientas-dropdown">
              {filteredClientas.map(c => (
                <div 
                  key={c.id} 
                  className={`clienta-option ${formData.clienta_id === c.id.toString() ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, clienta_id: c.id.toString()})}
                >
                  <div className="clienta-avatar">{c.nombre.charAt(0).toUpperCase()}</div>
                  <div className="clienta-info">
                    <span className="clienta-name">{c.nombre}</span>
                    {c.telefono && <span className="clienta-phone">{c.telefono}</span>}
                  </div>
                </div>
              ))}

              {searchQuery.trim() !== '' && !clientas.some(c => c.nombre.toLowerCase() === searchQuery.toLowerCase()) && (
                <button 
                  type="button" 
                  className="btn-crear-clienta-rapido"
                  onClick={async () => {
                    try {
                      const res = await api.post('/clientas/', { nombre: searchQuery });
                      setFormData({...formData, clienta_id: res.data.id.toString()});
                      setSearchQuery('');
                      fetchClientas();
                    } catch(e) {
                      showAlert("Error creando clienta rápida.");
                    }
                  }}
                >
                  <UserPlus size={18} /> 
                  Añadir nueva clienta: "{searchQuery}"
                </button>
              )}
            </div>
          </div>

          {/* Campo 2: CARRITO DE PRENDAS SELECCIONADAS */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ margin: 0 }}>Prendas Seleccionadas</label>
              <button 
                type="button" 
                onClick={() => setShowAddSelector(!showAddSelector)}
                style={{ padding: '6px 12px', borderRadius: 20, background: 'var(--pk2-pink-light)', color: 'var(--pk2-pink-dark)', border: 'none', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <Plus size={14} /> Sumar Prenda
              </button>
            </div>

            {/* Selector de Producto Adicional */}
            {showAddSelector && (
              <div className="add-product-dropdown-selector animate-fade-in">
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar en catálogo..."
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    className="glass-input"
                    autoFocus
                  />
                </div>
                
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredCatalogItems.map(p => (
                    <div key={p.id} style={{ paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--pk2-dark)' }}>{p.nombre}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {p.variantes?.map(v => (
                          <button 
                            key={v.id}
                            type="button" 
                            onClick={() => handleAddProductToCart(p, v)}
                            style={{ padding: '6px 10px', borderRadius: 16, background: 'rgba(0,0,0,0.04)', border: 'none', fontSize: '0.8rem', fontWeight: 500, color: 'var(--pk2-dark)', cursor: v.cantidad > 0 ? 'pointer' : 'not-allowed', opacity: v.cantidad > 0 ? 1 : 0.5 }}
                            disabled={v.cantidad <= 0}
                          >
                            {v.color} - {v.talla} ({v.cantidad} ud)
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredCatalogItems.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center', padding: 12 }}>No se encontraron prendas.</p>
                  )}
                </div>
              </div>
            )}

            {/* Listado del Carrito */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cart.map(item => (
                <div key={item.variante_id} className="modal-prenda-info">
                  <img src={item.foto_url || 'https://via.placeholder.com/65'} alt="Prenda" />
                  
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div className="cart-item-details">
                      <h4 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</h4>
                    </div>
                    <div className="cart-item-meta">
                      {item.color} - {item.talla} (Dispo: {item.maxCantidad})
                    </div>
                    <div className="cart-item-price">
                      ${item.precio.toLocaleString('es-CL')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="qty-controls">
                      <button type="button" className="btn-qty" disabled={item.cantidad <= 1} onClick={() => handleUpdateQuantity(item.variante_id, item.cantidad - 1)}>-</button>
                      <span className="qty-display">{item.cantidad}</span>
                      <button type="button" className="btn-qty" disabled={item.cantidad >= item.maxCantidad} onClick={() => handleUpdateQuantity(item.variante_id, item.cantidad + 1)}>+</button>
                    </div>
                    <button type="button" className="btn-delete-item" onClick={() => handleRemoveFromCart(item.variante_id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campo 3: Ruta Programada */}
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Ruta de Entrega <span className="optional">(Opcional)</span></label>
            <div className="input-with-icon">
              <Calendar size={18} className="icon-left" />
              <select 
                name="entrega_diaria_id" 
                value={formData.entrega_diaria_id}
                onChange={handleInputChange}
              >
                <option value="">Separado (Retira luego o Sin ruta)</option>
                {rutasProgramadas.map(ruta => {
                  const date = new Date(ruta.fecha + 'T00:00:00');
                  const opciones = { weekday: 'long', day: 'numeric', month: 'short' };
                  const fechaFormat = date.toLocaleDateString('es-ES', opciones).replace(/^\w/, c => c.toUpperCase());
                  const hora = ruta.hora_estimada ? ` (${ruta.hora_estimada.substring(0, 5)})` : '';
                  return (
                    <option key={ruta.id} value={ruta.id}>
                      {fechaFormat} - {ruta.punto_entrega_detalle?.nombre} {hora}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Campo: Estado de Pago */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Estado de Pago</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--pk2-dark)' }}>
                <input 
                  type="radio" 
                  name="estado" 
                  value="apartado" 
                  checked={formData.estado === 'apartado'} 
                  onChange={handleInputChange} 
                  style={{ accentColor: 'var(--pk2-pink)' }}
                />
                Por Pagar (Apartado)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--pk2-dark)' }}>
                <input 
                  type="radio" 
                  name="estado" 
                  value="pagado" 
                  checked={formData.estado === 'pagado'} 
                  onChange={handleInputChange} 
                  style={{ accentColor: 'var(--pk2-pink)' }}
                />
                Pagado
              </label>
            </div>
          </div>

          {/* Campo 4: Notas del Pedido */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <label>Notas Adicionales <span className="optional">(Opcional)</span></label>
            <input 
              type="text" 
              placeholder="Ej: Le falta transferir $5000"
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              className="glass-input"
            />
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="modal-sticky-footer">
          <div className="total-row">
            <span>Total Compra</span>
            <span className="total-amount">${totalVenta.toLocaleString('es-CL')}</span>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel-sale" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn-confirm-sale" disabled={isSubmitting || !formData.clienta_id || cart.length === 0} onClick={handleSubmit}>
              {isSubmitting ? 'Registrando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VenderModal;
