// ─────────────────────────────────────────────────────────────
// frontend/src/pages/NuevaVenta.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Search, Calendar, UserPlus, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './NuevaVenta.css';
import { showAlert, showToast } from '../utils/alerts';

const NuevaVenta = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPrendaId = searchParams.get('prenda_id');

  const [clientas, setClientas] = useState([]);
  const [rutasProgramadas, setRutasProgramadas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ clienta_id: '', entrega_diaria_id: '', notas: '', estado: 'apartado' });

  const [catalogItems, setCatalogItems] = useState([]);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClientas();
    fetchRutasProgramadas();
    fetchCatalogForSelector();
  }, []);

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
      const items = res.data.results || res.data || [];
      setCatalogItems(items);

      if (initialPrendaId && cart.length === 0) {
        const item = items.find(p => p.id.toString() === initialPrendaId);
        if (item && item.variantes && item.variantes.length > 0) {
           const var1 = item.variantes[0];
           handleAddProductToCart(item, var1);
        }
      }
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
    setCart(prev => {
      const exists = prev.find(c => c.variante_id === varianteObj.id);
      if (exists) {
        showAlert("Este producto ya está en tu lista. Puedes aumentar su cantidad.");
        return prev;
      }
      return [...prev, {
        prenda_id: prendaObj.id,
        variante_id: varianteObj.id,
        nombre: prendaObj.nombre,
        foto_url: prendaObj.imagenes?.find(img => img.color && varianteObj.color && img.color.toLowerCase() === varianteObj.color.toLowerCase())?.imagen || prendaObj.imagenes?.[0]?.imagen || prendaObj.foto_url,
        color: varianteObj.color,
        talla: varianteObj.talla,
        cantidad: 1,
        maxCantidad: varianteObj.cantidad,
        precio: prendaObj.precio
      }];
    });
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
      showToast("Pedido creado con éxito", "success");
      navigate('/panel/catalogo');
    } catch (error) {
      console.error("Error al registrar pedido(s):", error);
      showAlert(error.response?.data?.error || "Error al registrar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVenta = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn-back" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--pk2-dark)' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--pk2-dark)', fontFamily: "'Playfair Display', serif" }}>Nueva Venta</h1>
      </div>

      <div className="vender-form-page">
        {/* Campo 1: Seleccionar Clienta */}
        <div className="form-group-card">
          <label className="form-label-title">¿A quién se lo apartas?</label>
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
          
          <div className="clientas-dropdown-inline">
            {filteredClientas.slice(0, 5).map(c => (
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
                Añadir "{searchQuery}"
              </button>
            )}
          </div>
        </div>

        {/* Campo 2: CARRITO DE PRENDAS SELECCIONADAS */}
        <div className="form-group-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <label className="form-label-title" style={{ margin: 0 }}>Prendas Seleccionadas</label>
            <button 
              type="button" 
              onClick={() => setShowAddSelector(!showAddSelector)}
              className="btn-sumar-prenda"
            >
              <Plus size={16} /> Sumar Prenda
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.map(item => (
              <div key={item.variante_id} className="page-prenda-info">
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

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn-delete-item" onClick={() => handleRemoveFromCart(item.variante_id)}>
                    <Trash2 size={16} />
                  </button>
                  <div className="qty-controls">
                    <button type="button" className="btn-qty" disabled={item.cantidad <= 1} onClick={() => handleUpdateQuantity(item.variante_id, item.cantidad - 1)}>-</button>
                    <span className="qty-display">{item.cantidad}</span>
                    <button type="button" className="btn-qty" disabled={item.cantidad >= item.maxCantidad} onClick={() => handleUpdateQuantity(item.variante_id, item.cantidad + 1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: '12px' }}>
                No hay prendas seleccionadas.
              </div>
            )}
          </div>
        </div>

        {/* Campo 3: Ruta Programada */}
        <div className="form-group-card" style={{ marginTop: 16 }}>
          <label className="form-label-title">Ruta de Entrega <span className="optional">(Opcional)</span></label>
          <div className="input-with-icon" style={{ marginTop: 8 }}>
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
        <div className="form-group-card" style={{ marginTop: 16 }}>
          <label className="form-label-title">Estado de Pago</label>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <label className="radio-label">
              <input 
                type="radio" 
                name="estado" 
                value="apartado" 
                checked={formData.estado === 'apartado'} 
                onChange={handleInputChange} 
              />
              Apartado
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="estado" 
                value="por_pagar" 
                checked={formData.estado === 'por_pagar'} 
                onChange={handleInputChange} 
              />
              Por Pagar
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="estado" 
                value="pagado" 
                checked={formData.estado === 'pagado'} 
                onChange={handleInputChange} 
              />
              Pagado
            </label>
          </div>
        </div>

        {/* Campo 4: Notas del Pedido */}
        <div className="form-group-card" style={{ marginTop: 16 }}>
          <label className="form-label-title">Notas Adicionales <span className="optional">(Opcional)</span></label>
          <input 
            type="text" 
            placeholder="Ej: Le falta transferir $5000"
            value={formData.notas}
            onChange={(e) => setFormData({...formData, notas: e.target.value})}
            className="glass-input"
            style={{ marginTop: 8 }}
          />
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="page-sticky-footer">
        <div className="total-row">
          <span>Total Compra</span>
          <span className="total-amount">${totalVenta.toLocaleString('es-CL')}</span>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-confirm-sale" disabled={isSubmitting || cart.length === 0 || !formData.clienta_id} onClick={handleSubmit}>
            {isSubmitting ? 'Registrando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default NuevaVenta;
