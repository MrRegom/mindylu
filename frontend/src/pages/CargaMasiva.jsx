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
    <div className="carga-masiva-container animate-fade-in">
      <div className="form-header glass">
        <button className="btn-back" onClick={() => navigate('/catalogo')} type="button">
          <ArrowLeft size={24} />
        </button>
        <h2>Carga Masiva Rápidisima 🚀</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="uploader-header-card glass">
        <div className="upload-btn-wrapper">
          <button className="btn btn-secondary">
            <Upload size={20} style={{ marginRight: 8 }} />
            Seleccionar 40+ Fotos
          </button>
          <input type="file" multiple accept="image/*" onChange={handleFiles} />
        </div>
        <p>Sube todas las fotos de un golpe y ponle precio en segundos.</p>
      </div>

      {items.length > 0 && (
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
