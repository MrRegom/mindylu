import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Copy, Trash2, CheckCircle2, Plus } from 'lucide-react';
import GlobalSpinner from '../components/GlobalSpinner';
import api from '../services/api';
import './SubidaMasiva.css';
import { showAlert, showConfirm, showToast, showPrompt } from '../utils/alerts';

const compressImage = (file, maxWidth = 1000) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

const SubidaMasiva = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [colores, setColores] = useState([]);
  const [nombresExistentes, setNombresExistentes] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Estado para la imagen ampliada

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [resCat, resNombres, resTallas, resColores] = await Promise.all([
          api.get('/catalogo/categorias/'),
          api.get('/catalogo/nombres-prendas/'),
          api.get('/catalogo/tallas/'),
          api.get('/catalogo/colores/')
        ]);
        setCategorias(Array.isArray(resCat.data) ? resCat.data : (resCat.data.results || []));
        setTallas(resTallas.data.results || resTallas.data);
        setColores(resColores.data.results || resColores.data);
        
        const arrNombres = Array.isArray(resNombres.data) ? resNombres.data : (resNombres.data?.results || []);
        
        let arrPrendas = [];
        try {
          const resCatPrendas = await api.get('/catalogo/prendas/');
          arrPrendas = Array.isArray(resCatPrendas.data) ? resCatPrendas.data : (resCatPrendas.data?.results || []);
        } catch (errPrendas) {
          console.error("Error cargando prendas para nombres:", errPrendas);
        }
        
        const nombresUnicos = [...new Set([
          ...arrNombres.map(n => n?.nombre), 
          ...arrPrendas.map(p => p?.nombre)
        ])].filter(n => typeof n === 'string' && n.trim() !== '').sort();
        
        setNombresExistentes(nombresUnicos);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchDatos();
  }, []);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsSubmitting(true);
    showToast('Comprimiendo imágenes...', 'info');
    
    // Comprimir todas las imágenes en paralelo
    const compressedFiles = await Promise.all(
      files.map(file => compressImage(file))
    );

    const newItems = compressedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      nombre: '',
      precio_compra: '',
      precio: '',
      categoria_id: '',
      variantes: [{ id: Date.now() + Math.random(), color: 'Único', talla: 'Única', cantidad: 1 }]
    }));

    setItems(prev => [...prev, ...newItems]);
    setIsSubmitting(false);
    showToast('Imágenes listas para editar', 'success');

    // Limpiar input para permitir seleccionar los mismos archivos después si se borran
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeItem = (id) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== id);
      // Revoke object URL to prevent memory leaks
      const removed = prev.find(i => i.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      if (field === 'precio' || field === 'precio_compra') {
        const valLimpio = value.replace(/\D/g, '');
        const num = valLimpio ? parseInt(valLimpio, 10) : '';
        return { ...item, [field]: num ? num.toLocaleString('es-CL') : '' };
      }

      return { ...item, [field]: value };
    }));
  };

  const handleNombreChange = async (id, value) => {
    if (value === 'CREAR_NUEVO') {
      const nuevoNombre = await showPrompt('Nueva Prenda', 'Ingresa el nombre de la nueva prenda:');
      if (nuevoNombre && nuevoNombre.trim()) {
        let nombreLimpio = nuevoNombre.trim().toLowerCase().split(/\s+/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        const existente = nombresExistentes.find(n => n.toLowerCase() === nombreLimpio.toLowerCase());
        if (existente) {
          nombreLimpio = existente;
        } else {
          setNombresExistentes(prev => [...prev, nombreLimpio].sort());
        }
        updateItem(id, 'nombre', nombreLimpio);
      }
    } else {
      updateItem(id, 'nombre', value);
    }
  };

  const handleCategoriaChange = async (id, value) => {
    if (value === 'CREAR_NUEVO') {
      const nuevaCat = await showPrompt('Nueva Categoría', 'Ej: Pantalones y Jeans');
      if (nuevaCat && nuevaCat.trim()) {
        try {
          const res = await api.post('/catalogo/categorias/', { nombre: nuevaCat.trim() });
          setCategorias(prev => [...prev, res.data]);
          updateItem(id, 'categoria_id', res.data.id);
          showToast('Categoría creada', 'success');
        } catch (error) {
          showAlert('Error al crear la categoría.');
        }
      }
    } else {
      updateItem(id, 'categoria_id', value);
    }
  };

  const handleAddVariante = (itemId) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        variantes: [...item.variantes, { id: Date.now() + Math.random(), color: '', talla: 'Única', cantidad: 1 }]
      };
    }));
  };

  const handleRemoveVariante = (itemId, varId) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        variantes: item.variantes.filter(v => v.id !== varId)
      };
    }));
  };

  const handleVarianteChange = (itemId, varId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        variantes: item.variantes.map(v => 
          v.id === varId ? { ...v, [field]: value } : v
        )
      };
    }));
  };

  const aplicarATodas = () => {
    if (items.length <= 1) return;
    const first = items[0];
    if (!first.precio && !first.precio_compra && !first.categoria_id) {
      showToast('Llena el primer producto para copiar sus datos.', 'warning');
      return;
    }
    
    if (window.confirm('¿Copiar el precio y categoría de la primera foto a todas las demás?')) {
      setItems(prev => prev.map((item, index) => {
        if (index === 0) return item;
        return {
          ...item,
          precio: first.precio || item.precio,
          precio_compra: first.precio_compra || item.precio_compra,
          categoria_id: first.categoria_id || item.categoria_id,
          // Clonar variantes (asignando nuevos IDs para evitar problemas de key en react)
          variantes: first.variantes.map(v => ({ ...v, id: Date.now() + Math.random() }))
        };
      }));
      showToast('Datos copiados a todas las fotos', 'success');
    }
  };

  const handleGuardar = async () => {
    if (items.length === 0) {
      showAlert('Agrega al menos una foto.');
      return;
    }

    const invalidItem = items.find(i => !i.nombre || !i.precio);
    if (invalidItem) {
      showAlert('Todas las fotos deben tener un Nombre y Precio de Venta.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      
      const itemsList = items.map(item => ({
        nombre: item.nombre,
        precio: parseInt(item.precio.toString().replace(/\./g, ''), 10),
        precio_compra: item.precio_compra ? parseInt(item.precio_compra.toString().replace(/\./g, ''), 10) : null,
        categoria_id: item.categoria_id || null,
        talla_tipo: item.variantes.some(v => v.talla !== 'Única') ? 'multiple' : 'unica',
        variantes: item.variantes.map(v => ({
          color: v.color || 'Único',
          talla: v.talla || 'Única',
          cantidad: parseInt(v.cantidad, 10) || 1
        }))
      }));

      payload.append('items', JSON.stringify(itemsList));
      
      // Adjuntar imágenes
      items.forEach((item, index) => {
        payload.append(`imagenes_${index}`, item.file);
      });

      await api.post('/catalogo/prendas/bulk_create/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('¡Lote guardado en tu catálogo exitosamente!', 'success');
      navigate('/panel/catalogo');
    } catch (error) {
      console.error("Error guardando lote masivo:", error);
      showAlert('Hubo un error al guardar el lote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="subida-masiva-container animate-fade-in">
      <GlobalSpinner isVisible={isSubmitting} text="Guardando y subiendo..." />
      <div className="form-header glass">
        <button className="btn-back" onClick={() => navigate('/panel/catalogo')} type="button" disabled={isSubmitting}>
          <ArrowLeft size={24} />
        </button>
        <h2>Subida Masiva (Lote)</h2>
        <button 
          className="btn-guardar-header"
          onClick={handleGuardar}
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? 'Procesando...' : 'Guardar en Catálogo'}
        </button>
      </div>

      <div className="subida-content">
        <div className="upload-zone-wrapper">
          <input 
            type="file" 
            multiple 
            accept="image/*"
            style={{display: 'none'}}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button className="btn-upload-massive" onClick={() => fileInputRef.current.click()}>
            <Upload size={32} />
            <span>Seleccionar múltiples fotos (Ej: 70 fotos)</span>
          </button>
        </div>

        {items.length > 0 && (
          <div className="bulk-actions glass">
            <div className="bulk-count">
              <strong>{items.length}</strong> foto{items.length > 1 ? 's' : ''} seleccionada{items.length > 1 ? 's' : ''}
            </div>
            <button className="btn-aplicar-todas" onClick={aplicarATodas} title="Copiar datos de la primera foto a las demás">
              <Copy size={16} /> Aplicar precio y categoría a todas
            </button>
          </div>
        )}

        <div className="items-list">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className="item-row glass animate-slide-up" 
              style={{ 
                animationDelay: `${index * 0.05}s`,
                zIndex: activeDropdown && String(activeDropdown).includes(item.id) ? 100 : 1
              }}
            >
              <div className="item-photo" onClick={() => setPreviewImage(item.preview)} style={{cursor: 'pointer'}}>
                <img src={item.preview} alt="preview" />
                <button 
                  className="btn-remove-item" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
                <div className="item-number">{index + 1}</div>
              </div>
              
              <div className="item-fields">
                <div className="field-group input-group" style={{ position: 'relative', zIndex: activeDropdown === `nombre-${item.id}` ? 100 : 1 }}>
                  <label>Nombre de la prenda</label>
                  <div
                    className={`custom-select-trigger ${item.nombre ? 'has-value' : ''}`}
                    onClick={() => setActiveDropdown(prev => prev === `nombre-${item.id}` ? null : `nombre-${item.id}`)}
                  >
                    <span>{item.nombre || 'Selecciona o crea una prenda...'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {activeDropdown === `nombre-${item.id}` && (
                    <div className="custom-select-dropdown" style={{ zIndex: 100 }}>
                      {nombresExistentes.map(nombre => (
                        <div
                          key={nombre}
                          className={`custom-select-option ${item.nombre === nombre ? 'selected' : ''}`}
                          onClick={() => {
                            updateItem(item.id, 'nombre', nombre);
                            setActiveDropdown(null);
                          }}
                        >
                          {nombre}
                        </div>
                      ))}
                      <div
                        className="custom-select-option custom-select-agregar"
                        onClick={async () => {
                          setActiveDropdown(null);
                          await handleNombreChange(item.id, 'CREAR_NUEVO');
                        }}
                      >
                        + Agregar nuevo...
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="field-row">
                  <div className="field-group">
                    <label>Precio Costo</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="Ej: 5.000" 
                      value={item.precio_compra}
                      onChange={(e) => updateItem(item.id, 'precio_compra', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Precio Venta</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="Ej: 15.000" 
                      value={item.precio}
                      onChange={(e) => updateItem(item.id, 'precio', e.target.value)}
                    />
                  </div>
                </div>

                <div className="field-group input-group" style={{ position: 'relative', zIndex: activeDropdown === `categoria-${item.id}` ? 100 : 1 }}>
                  <label>Categoría</label>
                  <div
                    className={`custom-select-trigger ${item.categoria_id ? 'has-value' : ''}`}
                    onClick={() => setActiveDropdown(prev => prev === `categoria-${item.id}` ? null : `categoria-${item.id}`)}
                  >
                    <span>{categorias.find(c => String(c.id) === String(item.categoria_id))?.nombre || 'Selecciona una categoría'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {activeDropdown === `categoria-${item.id}` && (
                    <div className="custom-select-dropdown" style={{ zIndex: 100 }}>
                      <div
                        className={`custom-select-option ${!item.categoria_id ? 'selected' : ''}`}
                        onClick={() => {
                          updateItem(item.id, 'categoria_id', '');
                          setActiveDropdown(null);
                        }}
                      >
                        Ninguna
                      </div>
                      {categorias.map(cat => (
                        <div
                          key={cat.id}
                          className={`custom-select-option ${String(item.categoria_id) === String(cat.id) ? 'selected' : ''}`}
                          onClick={() => {
                            handleCategoriaChange(item.id, cat.id);
                            setActiveDropdown(null);
                          }}
                        >
                          {cat.nombre}
                        </div>
                      ))}
                      <div
                        className="custom-select-option custom-select-agregar"
                        onClick={async () => {
                          setActiveDropdown(null);
                          await handleCategoriaChange(item.id, 'CREAR_NUEVO');
                        }}
                      >
                        + Agregar nuevo...
                      </div>
                    </div>
                  )}
                </div>

                {/* SECCION VARIANTES POR ITEM */}
                <div className="variantes-section">
                  <div className="variantes-header">
                    <h4>Variantes y Stock</h4>
                    <button type="button" className="btn-add-variante" onClick={() => handleAddVariante(item.id)}>
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                  
                  <div className="variantes-list">
                    {item.variantes.map(variante => (
                      <div key={variante.id} className="variante-row">
                        <div className="input-group mini" style={{ position: 'relative', zIndex: activeDropdown === `color-${item.id}-${variante.id}` ? 100 : 1 }}>
                          <label>Color</label>
                          <div
                            className={`custom-select-trigger ${variante.color ? 'has-value' : ''}`}
                            onClick={() => setActiveDropdown(prev => prev === `color-${item.id}-${variante.id}` ? null : `color-${item.id}-${variante.id}`)}
                          >
                            <span>{variante.color || 'Elegir color...'}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                          {activeDropdown === `color-${item.id}-${variante.id}` && (
                            <div className="custom-select-dropdown" style={{ zIndex: 100 }}>
                              {colores.map(c => (
                                <div
                                  key={c.id}
                                  className={`custom-select-option ${variante.color === c.nombre ? 'selected' : ''}`}
                                  onClick={() => {
                                    handleVarianteChange(item.id, variante.id, 'color', c.nombre);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  {c.nombre}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="input-group mini" style={{ position: 'relative', zIndex: activeDropdown === `talla-${item.id}-${variante.id}` ? 100 : 1 }}>
                          <label>Talla</label>
                          <div
                            className={`custom-select-trigger ${variante.talla ? 'has-value' : ''}`}
                            onClick={() => setActiveDropdown(prev => prev === `talla-${item.id}-${variante.id}` ? null : `talla-${item.id}-${variante.id}`)}
                          >
                            <span>{variante.talla || 'Elegir talla...'}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                          {activeDropdown === `talla-${item.id}-${variante.id}` && (
                            <div className="custom-select-dropdown" style={{ zIndex: 100 }}>
                              {tallas.map(t => (
                                <div
                                  key={t.id}
                                  className={`custom-select-option ${variante.talla === t.nombre ? 'selected' : ''}`}
                                  onClick={() => {
                                    handleVarianteChange(item.id, variante.id, 'talla', t.nombre);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  {t.nombre}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="input-group mini cant-input">
                          <label>Cant.</label>
                          <input 
                            type="number" 
                            min="1"
                            value={variante.cantidad}
                            onChange={(e) => handleVarianteChange(item.id, variante.id, 'cantidad', e.target.value)}
                            required
                          />
                        </div>
                        
                        {item.variantes.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-delete-icon"
                            onClick={() => handleRemoveVariante(item.id, variante.id)}
                            title="Eliminar variante"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Vista Previa de Imagen */}
      {previewImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview Ampliada" 
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <button 
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default SubidaMasiva;
