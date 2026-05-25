// ─────────────────────────────────────────────────────────────
// frontend/src/components/VenderModal.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { X, Search, Calendar, UserPlus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import './VenderModal.css';

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
  const { cart = [], clienta_id = '', entrega_diaria_id = '', notas = '' } = ventaActiva || {};
  const formData = { clienta_id, entrega_diaria_id, notas };
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
      const currentFormData = { clienta_id: prev.clienta_id, entrega_diaria_id: prev.entrega_diaria_id, notas: prev.notas };
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
      alert("Este producto ya está en tu lista. Puedes aumentar su cantidad.");
      return;
    }
    
    setCart(prev => [...prev, {
      prenda_id: prendaObj.id,
      variante_id: varianteObj.id,
      nombre: prendaObj.nombre,
      foto_url: prendaObj.foto_url,
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
      alert("Debes seleccionar una clienta.");
      return;
    }
    if (cart.length === 0) {
      alert("Debes agregar al menos una prenda al carrito.");
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
          notas: formData.notas
        };
        await api.post('/pedidos/crear-desde-catalogo/', payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Error al registrar pedido(s):", error);
      alert(error.response?.data?.error || "Error al registrar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalVenta = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-up glass" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3>Apartar Prenda</h3>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="vender-form" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flexGrow: 1, paddingBottom: 12 }}>
          
          {/* Campo 1: Seleccionar Clienta */}
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>¿A quién se lo apartas?</label>
            <div className="search-clienta-box">
              <Search size={16} className="icon-left" />
              <input 
                type="text" 
                placeholder="Buscar o crear clienta rápida..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                className="glass-input"
                style={{ paddingLeft: 40 }}
              />
            </div>
            
            <div className="clientas-dropdown" style={{ maxHeight: 110 }}>
              {filteredClientas.map(c => (
                <label key={c.id} className={`clienta-option ${formData.clienta_id === c.id.toString() ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="clienta_id" 
                    value={c.id} 
                    checked={formData.clienta_id === c.id.toString()}
                    onChange={(e) => setFormData({...formData, clienta_id: e.target.value})}
                  />
                  <span>{c.nombre} {c.telefono ? `(${c.telefono})` : ''}</span>
                </label>
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
                      alert("Error creando clienta rápida.");
                    }
                  }}
                >
                  <UserPlus size={16} /> 
                  Crear y seleccionar "{searchQuery}"
                </button>
              )}
            </div>
          </div>

          {/* Campo 2: CARRITO DE PRENDAS SELECCIONADAS (Caso A - Multiproducto) */}
          <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Prendas a Apartar</label>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddSelector(!showAddSelector)}
                style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={12} /> Otra Prenda
              </button>
            </div>

            {/* Selector de Producto Adicional */}
            {showAddSelector && (
              <div className="add-product-dropdown-selector glass animate-fade-in" style={{ padding: 12, borderRadius: 12, marginBottom: 12, background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar otra prenda en catálogo..."
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    className="glass-input"
                    style={{ padding: '6px 10px 6px 30px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                </div>
                
                <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredCatalogItems.map(p => (
                    <div key={p.id} style={{ padding: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>{p.nombre}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {p.variantes?.map(v => (
                          <button 
                            key={v.id}
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => handleAddProductToCart(p, v)}
                            style={{ padding: '2px 6px', fontSize: '0.75rem', height: 'auto' }}
                            disabled={v.cantidad <= 0}
                          >
                            {v.color} - {v.talla} ({v.cantidad} ud)
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredCatalogItems.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 4 }}>No se encontraron prendas.</p>
                  )}
                </div>
              </div>
            )}

            {/* Listado del Carrito */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map(item => (
                <div key={item.variante_id} className="modal-prenda-info" style={{ margin: 0, padding: 10, background: 'rgba(255, 255, 255, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 2 }}>
                    <img 
                      src={item.foto_url || 'https://via.placeholder.com/48'} 
                      alt="Prenda" 
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} 
                    />
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                        {item.color} - {item.talla} (Dispo: {item.maxCantidad})
                      </p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>${item.precio.toLocaleString('es-CL')}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flex: 1.2 }}>
                    <input 
                      type="number"
                      min="1"
                      max={item.maxCantidad}
                      value={item.cantidad}
                      onChange={(e) => handleUpdateQuantity(item.variante_id, parseInt(e.target.value) || 1)}
                      className="glass-input"
                      style={{ width: 52, padding: 6, fontSize: '0.8rem', textAlign: 'center' }}
                    />
                    {cart.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => handleRemoveFromCart(item.variante_id)}
                        style={{ color: 'var(--color-error)', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total General Venta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '6px 8px', borderRadius: 8, background: 'rgba(24, 119, 242, 0.05)', border: '1px solid rgba(24, 119, 242, 0.15)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Compra:</span>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>${totalVenta.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* Campo 3: Ruta Programada */}
          <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Selecciona tu ruta programada <span className="opc">(Opcional)</span></label>
            <div className="input-with-icon">
              <Calendar size={16} className="icon-left" />
              <select 
                name="entrega_diaria_id" 
                value={formData.entrega_diaria_id}
                onChange={handleInputChange}
                className="glass-input"
                style={{ paddingLeft: 36 }}
              >
                <option value="">Sin ruta por ahora...</option>
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

          {/* Campo 4: Notas del Pedido (Caso A - Rediseño sin PHP 90) */}
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Notas del Pedido <span className="optional">(Opc)</span></label>
            <input 
              type="text" 
              placeholder="Ej: Le falta transferir $5000"
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              className="glass-input"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--color-text)' }}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !formData.clienta_id || cart.length === 0}>
              {isSubmitting ? 'Registrando...' : 'Confirmar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VenderModal;
