import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingBag } from 'lucide-react';
import api from '../../services/api';
import { showAlert, showToast } from '../../utils/alerts';
import '../EditarPrendaModal.css';

const VenderPrendaModal = ({ prenda, onClose, onSuccess }) => {
  const [clientas, setClientas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [searchClienta, setSearchClienta] = useState('');
  const [selectedClientaId, setSelectedClientaId] = useState('');
  
  const [selectedVarianteId, setSelectedVarianteId] = useState(
    prenda?.variantes?.length > 0 ? prenda.variantes[0].id : ''
  );
  const [cantidad, setCantidad] = useState(1);
  const [selectedRuta, setSelectedRuta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [clientasRes, rutasRes] = await Promise.all([
          api.get('/clientas/'),
          api.get('/pedidos/entregas/')
        ]);
        setClientas(clientasRes.data.results || clientasRes.data);
        
        const rutasData = rutasRes.data.results || rutasRes.data;
        const rutasFuturas = rutasData.sort((a,b) => a.fecha.localeCompare(b.fecha));
        setRutas(rutasFuturas);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchDatos();
  }, []);

  const filteredClientas = clientas.filter(c => 
    c.nombre.toLowerCase().includes(searchClienta.toLowerCase()) || 
    (c.telefono && c.telefono.includes(searchClienta))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientaId || !selectedVarianteId) {
      showAlert("Debes seleccionar una clienta y una variante.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        clienta_id: parseInt(selectedClientaId),
        variante_id: parseInt(selectedVarianteId),
        cantidad: parseInt(cantidad) || 1,
        estado: 'apartado',
        notas: 'Vendido desde Catálogo'
      };

      if (selectedRuta) {
        payload.entrega_diaria_id = parseInt(selectedRuta);
      }
      
      await api.post('/pedidos/crear-desde-catalogo/', payload);
      showToast("¡Prenda asignada con éxito!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al asignar prenda:", error);
      showAlert(error.response?.data?.error || "Error al registrar la venta.");
      setIsSubmitting(false);
    }
  };

  const getStock = () => {
    const v = prenda.variantes?.find(x => x.id === parseInt(selectedVarianteId));
    return v ? v.cantidad : 0;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ maxWidth: '500px', width: '100%', padding: '24px' }}>
        <button className="btn-close-modal" onClick={onClose}><X size={20} /></button>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <ShoppingBag size={24} color="var(--color-primary)" />
          Vender / Asignar
        </h2>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '12px' }}>
          <img src={prenda.foto_url || (prenda.imagenes?.[0]?.imagen)} alt={prenda.nombre} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '8px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0' }}>{prenda.nombre}</h4>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>${Number(prenda.precio || 0).toLocaleString('es-CL')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>1. Seleccionar Clienta</label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#888' }} />
              <input 
                type="text" 
                placeholder="Buscar clienta..." 
                value={searchClienta}
                onChange={(e) => setSearchClienta(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                className="glass-input"
              />
            </div>
            <select 
              className="glass-input" 
              value={selectedClientaId} 
              onChange={(e) => setSelectedClientaId(e.target.value)}
              required
              size={filteredClientas.length > 0 ? Math.min(filteredClientas.length, 3) : 1}
              style={{ padding: '8px', width: '100%' }}
            >
              {filteredClientas.length === 0 && <option value="" disabled>No hay coincidencias</option>}
              {filteredClientas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `(${c.telefono})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>2. Variante y Cantidad</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="glass-input" 
                style={{ flex: 2 }}
                value={selectedVarianteId}
                onChange={(e) => setSelectedVarianteId(e.target.value)}
                required
              >
                {prenda.variantes?.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.color} - {v.talla} (Stock: {v.cantidad})
                  </option>
                ))}
              </select>
              <input 
                type="number" 
                min="1" 
                max={getStock()} 
                value={cantidad} 
                onChange={(e) => setCantidad(e.target.value)} 
                className="glass-input" 
                style={{ flex: 1 }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>3. Asignar Ruta (Opcional)</label>
            <select 
              className="glass-input" 
              value={selectedRuta}
              onChange={(e) => setSelectedRuta(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Solo Separar (Sin ruta)</option>
              {rutas.map(r => {
                const dateStr = new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', {weekday:'short', day:'numeric'});
                const horaStr = r.hora_estimada ? `(${r.hora_estimada.substring(0,5)})` : '';
                return (
                  <option key={r.id} value={r.id}>
                    {dateStr} - {r.punto_entrega_detalle?.nombre} {horaStr}
                  </option>
                );
              })}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}
            disabled={isSubmitting || getStock() < cantidad}
          >
            {isSubmitting ? 'Procesando...' : 'Asignar a Clienta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VenderPrendaModal;