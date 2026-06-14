import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import api from '../services/api';

const getImageUrl = (path) => {
  if (!path) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  try {
    const url = new URL(import.meta.env.VITE_API_URL);
    return `${url.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (e) {
    return path.startsWith('/') ? path : `/${path}`;
  }
};

const SuggestionModal = ({ onClose, onSend }) => {
  const [categorias, setCategorias] = useState([]);
  const [prendas, setPrendas] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prendasRes] = await Promise.all([
          api.get('catalogo/categorias/'),
          api.get('catalogo/prendas/')
        ]);
        setCategorias(catRes.data.results || catRes.data);
        setPrendas(prendasRes.data.results || prendasRes.data);
      } catch (error) {
        console.error("Error fetching data for modal", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const prendasFiltradas = prendas.filter(p => {
    const matchCat = categoriaSeleccionada ? (p.categoria?.id === categoriaSeleccionada || p.categoria === categoriaSeleccionada) : true;
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.variantes?.some(v => v.cantidad > 0);
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdf5f6' }}>
          <h3 style={{ margin: 0, color: '#d16b7e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛍️ Sugerir Opción
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', position: 'relative', marginBottom: '12px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#999' }} />
            <input 
              type="text" 
              placeholder="Buscar prenda..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            <button 
              onClick={() => setCategoriaSeleccionada(null)}
              style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', background: categoriaSeleccionada === null ? '#d16b7e' : '#f0f0f0', color: categoriaSeleccionada === null ? '#fff' : '#666' }}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', background: categoriaSeleccionada === cat.id ? '#d16b7e' : '#f0f0f0', color: categoriaSeleccionada === cat.id ? '#fff' : '#666' }}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#fafafa' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Cargando catálogo...</div>
          ) : prendasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No se encontraron prendas con stock en esta categoría.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {prendasFiltradas.map(p => {
                const imageUrl = getImageUrl(p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || '');
                
                // Generar info de stock
                let stockInfo = [];
                if (p.variantes) {
                   p.variantes.filter(v => v.cantidad > 0).forEach(v => {
                      stockInfo.push(`${v.talla || 'Unica'} ${v.color || ''}(${v.cantidad})`);
                   });
                }
                const stockText = stockInfo.join(', ');

                return (
                  <div 
                    key={p.id} 
                    onClick={() => {
                      // Adapt to the format expected by handleSendSuggestion
                      onSend({
                        id: p.id,
                        nombre: p.nombre,
                        precio: p.precio,
                        imagen: imageUrl,
                        stock_info: stockText
                      });
                      onClose();
                    }}
                    style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ width: '100%', height: '140px', background: '#f5f5f5', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ padding: '8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#333', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: '#d16b7e', fontWeight: 'bold', marginBottom: '4px' }}>${Number(p.precio).toLocaleString('es-CL')}</div>
                      <div style={{ fontSize: '0.65rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Stock: {stockText}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionModal;
