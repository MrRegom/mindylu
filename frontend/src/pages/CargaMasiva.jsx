import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, Share2, Plus } from 'lucide-react';
import api from '../services/api';
import './CargaMasiva.css';

import { compressImage } from '../utils/imageCompression';

const CargaMasiva = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [publicarFacebook, setPublicarFacebook] = useState(true);
  const [mensajeFacebook, setMensajeFacebook] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Comprimir todas las imágenes antes de agregarlas al estado
    const newItemsPromises = files.map(async (file) => {
      let compressedFile = file;
      try {
        compressedFile = await compressImage(file, 1080, 0.7);
      } catch (err) {
        console.error('Error comprimiendo imagen', err);
      }
      return {
        id: Math.random().toString(36).substring(7),
        file: compressedFile,
        preview: URL.createObjectURL(compressedFile),
        nombre: '',
        precio: '',
        variantes: [
          { id: Math.random().toString(36).substring(7), color: 'Único', talla: 'Única', cantidad: 1 }
        ]
      };
    });

    const newItems = await Promise.all(newItemsPromises);

    setItems(prev => [...prev, ...newItems]);
    e.target.value = ''; // Reset input
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleVarianteChange = (itemId, varId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          variantes: item.variantes.map(v => v.id === varId ? { ...v, [field]: value } : v)
        };
      }
      return item;
    }));
  };

  const addVariante = (itemId) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          variantes: [...item.variantes, { id: Math.random().toString(36).substring(7), color: '', talla: '', cantidad: 1 }]
        };
      }
      return item;
    }));
  };

  const removeVariante = (itemId, varId) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          variantes: item.variantes.filter(v => v.id !== varId)
        };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    // Validación básica
    const incompletos = items.some(item => !item.nombre || !item.precio || item.variantes.length === 0);
    if (incompletos) {
      alert("Por favor, ponle nombre, precio y al menos una variante a todas las prendas.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      
      const cleanItems = items.map(item => ({
        nombre: item.nombre,
        precio: item.precio,
        variantes: item.variantes
      }));
      
      payload.append('items', JSON.stringify(cleanItems));
      if (fechaProgramada) {
        payload.append('fecha_programada', new Date(fechaProgramada).toISOString());
      }
      if (publicarFacebook) {
        payload.append('mensaje', mensajeFacebook);
      }
      
      items.forEach((item, index) => {
        payload.append(`imagenes_${index}`, item.file);
      });

      // 1. Crear las prendas masivamente
      const res = await api.post('/catalogo/prendas/bulk_create/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const creadas_ids = res.data.prenda_ids;

      // 2. Si no es programado y marcó publicar en FB, mandamos los IDs a publicar AHORA
      if (!fechaProgramada && publicarFacebook && creadas_ids.length > 0) {
        try {
          await api.post('/integraciones/publicar-lote-facebook/', {
            prenda_ids: creadas_ids,
            mensaje: mensajeFacebook
          });
          alert(`¡${creadas_ids.length} prendas guardadas y publicadas en Facebook como álbum!`);
        } catch (fbError) {
          console.error("Error al publicar en FB:", fbError);
          alert(`Se guardaron las prendas, pero falló la publicación en Facebook.`);
        }
      } else if (fechaProgramada) {
        alert(`¡${creadas_ids.length} prendas guardadas y programadas para ${new Date(fechaProgramada).toLocaleString()}!`);
      }

      navigate('/catalogo');
    } catch (error) {
      console.error("Error en carga masiva:", error);
      alert("Hubo un error al realizar la carga masiva.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="carga-masiva-container animate-fade-in" style={{ padding: '20px', paddingBottom: '100px' }}>
      {items.length === 0 ? (
        <>
          <div className="catalogo-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--color-primary)' }}><Sparkles size={28} /></div>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontFamily: 'Playfair Display', margin: '0 0 2px 0' }}>Auto-Catálogo</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Inteligente con IA ✨</p>
              </div>
            </div>
          </div>

          <div className="card scan-card" style={{ background: 'var(--color-primary-gradient)', color: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', zIndex: 2, position: 'relative' }}>Escanea tus publicaciones ✨</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '24px', maxWidth: '75%', zIndex: 2, position: 'relative', lineHeight: 1.4 }}>
              Importa prendas directamente de tus Lives de Facebook con OCR para descripciones y precios.
            </p>
            <div className="upload-btn-wrapper" style={{ position: 'relative', zIndex: 2 }}>
              <button className="btn" style={{ background: 'white', color: 'var(--color-primary-dark)', width: 'auto', padding: '12px 24px', borderRadius: 'var(--radius-full)' }}>
                Escanear publicación
              </button>
              <input type="file" multiple accept="image/*" onChange={handleFiles} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>
            {/* Background Camera Icon Decoration */}
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.15, transform: 'rotate(-15deg)', zIndex: 1 }}>
              <Upload size={140} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Últimas publicaciones</h3>
              <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 500 }}>Ver todas</span>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
              {/* Dummy Post 1 */}
              <div className="card" style={{ minWidth: '220px', padding: 0, overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1551048632-24e444b48a3e?auto=format&fit=crop&q=80&w=300" style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="Live" />
                <div style={{ padding: '16px' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '8px' }}>24 may 2026, 06:31 p.m.</p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    ✨ Prenditas disponibles para entrega inmediata...
                  </p>
                  <button className="btn btn-primary" style={{ padding: '8px', fontSize: '0.9rem' }}>Procesar</button>
                </div>
              </div>
              
              {/* Dummy Post 2 */}
              <div className="card" style={{ minWidth: '220px', padding: 0, overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&q=80&w=300" style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="Live" />
                <div style={{ padding: '16px' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '8px' }}>22 may 2026, 09:27 p.m.</p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    Sábado 23 entregar a las 13 hrs en lider placilla...
                  </p>
                  <button className="btn btn-primary" style={{ padding: '8px', fontSize: '0.9rem' }}>Procesar</button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form className="carga-masiva-form" onSubmit={handleSubmit}>
          <div className="items-grid">
            {items.map((item, index) => (
              <div key={item.id} className="item-row glass animate-slide-up">
                <div className="item-foto">
                  <img src={item.preview} alt={`prenda-${index}`} />
                  <button type="button" className="btn-remove-row" onClick={() => removeItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="item-inputs">
                  <div className="input-group mini">
                    <label>Nombre *</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Vestido Lanilla" 
                      value={item.nombre}
                      onChange={(e) => handleChange(item.id, 'nombre', e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group mini">
                    <label>Precio *</label>
                    <input 
                      type="number" 
                      placeholder="$" 
                      value={item.precio}
                      onChange={(e) => handleChange(item.id, 'precio', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="item-variantes">
                    <div className="item-variantes-header">
                      <label>Variantes (Talla/Color/Stock)</label>
                      <button type="button" className="btn-add-mini" onClick={() => addVariante(item.id)}>
                        <Plus size={14} /> Add
                      </button>
                    </div>
                    {item.variantes.map((v) => (
                      <div key={v.id} className="variante-mini-row">
                        <div className="variante-fields">
                          <div className="variante-field-group">
                            <label>Color</label>
                            <input 
                              type="text" 
                              placeholder="Ej: Rojo" 
                              value={v.color}
                              onChange={(e) => handleVarianteChange(item.id, v.id, 'color', e.target.value)}
                              className="input-mini"
                            />
                          </div>
                          <div className="variante-field-group">
                            <label>Talla</label>
                            <input 
                              type="text" 
                              placeholder="Ej: L" 
                              value={v.talla}
                              onChange={(e) => handleVarianteChange(item.id, v.id, 'talla', e.target.value)}
                              className="input-mini"
                            />
                          </div>
                          <div className="variante-field-group">
                            <label>Stock</label>
                            <input 
                              type="number" 
                              min="1"
                              placeholder="Ej: 3"
                              value={v.cantidad}
                              onChange={(e) => handleVarianteChange(item.id, v.id, 'cantidad', e.target.value)}
                              className="input-mini stock-mini"
                              required
                            />
                          </div>
                        </div>
                        {item.variantes.length > 1 && (
                          <button type="button" className="btn-remove-mini" onClick={() => removeVariante(item.id, v.id)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="form-section glass facebook-push-section" style={{ marginTop: 24 }}>
            <div className="facebook-toggle-wrapper" style={{ marginBottom: 16 }}>
              <div className="facebook-toggle-info">
                <Share2 size={24} color="#1877F2" />
                <div>
                  <h4>Álbum de Facebook</h4>
                  <p>¿Cuándo deseas publicarlo en FB?</p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label>Texto de la publicación</label>
                <textarea 
                  placeholder="Ej: ✨ ¡Llegó mercadería nueva! ✨&#10;No te quedes sin la tuya..."
                  value={mensajeFacebook}
                  onChange={(e) => setMensajeFacebook(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
                />
                <small style={{ color: '#666' }}>Las tallas, colores y stock se guardarán internamente, pero no se publicarán en Facebook.</small>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '8px' }}>
                <input 
                  type="radio" 
                  name="schedule_type" 
                  checked={!fechaProgramada}
                  onChange={() => {
                    setFechaProgramada('');
                    setPublicarFacebook(true);
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Publicar Inmediatamente</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Sube todo a Facebook en este instante</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '8px' }}>
                <input 
                  type="radio" 
                  name="schedule_type" 
                  checked={!!fechaProgramada}
                  onChange={() => {
                    const d = new Date();
                    d.setHours(d.getHours() + 1);
                    d.setMinutes(0);
                    // Format to datetime-local expected string YYYY-MM-DDThh:mm
                    setFechaProgramada(d.toISOString().slice(0, 16));
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Programar para después</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Elige la fecha y hora exacta</div>
                  {fechaProgramada && (
                    <input 
                      type="datetime-local" 
                      value={fechaProgramada}
                      onChange={(e) => setFechaProgramada(e.target.value)}
                      style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="fixed-bottom-bar glass">
            <div className="summary-info">
              <span>{items.length} prendas listas</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={20} />
              {isSubmitting ? 'Procesando...' : (fechaProgramada ? 'Dejar Programado' : 'Publicar Ahora')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CargaMasiva;
