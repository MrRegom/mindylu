import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import ColorPalettePicker from '../components/ColorPalettePicker';
import api from '../services/api';
import ImageUploader from '../components/ImageUploader';
import './PrendaForm.css';
import { showAlert, showConfirm, showToast, showPrompt } from '../utils/alerts';

const PrendaForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [images, setImages] = useState([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    precio_compra: '',
    precio: '',
    categoria: '',
  });

  const [variantes, setVariantes] = useState([
    { id: Date.now(), color: 'Negro', talla: '', cantidad: 1 }
  ]);

  const { id } = useParams();
  const [nombresExistentes, setNombresExistentes] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-select-trigger') && !e.target.closest('.custom-select-dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCat, resColores, resTallas, resNombres] = await Promise.all([
          api.get('/catalogo/categorias/'),
          api.get('/catalogo/colores/'),
          api.get('/catalogo/tallas/'),
          api.get('/catalogo/nombres-prendas/')
        ]);
        setCategorias(resCat.data.results || resCat.data);
        setColores(resColores.data.results || resColores.data);
        setTallas(resTallas.data.results || resTallas.data);
        
        // Obtener nombres predefinidos
        const arrNombres = Array.isArray(resNombres.data) ? resNombres.data : (resNombres.data?.results || []);
        
        // Obtener prendas existentes para complementar nombres
        let arrPrendas = [];
        try {
          const resPrendas = await api.get('/catalogo/prendas/');
          arrPrendas = Array.isArray(resPrendas.data) ? resPrendas.data : (resPrendas.data?.results || []);
        } catch (errPrendas) {
          console.error("Error cargando prendas para nombres:", errPrendas);
        }
        
        const nombresUnicos = [...new Set([
          ...arrNombres.map(n => n?.nombre), 
          ...arrPrendas.map(p => p?.nombre)
        ])].filter(n => typeof n === 'string' && n.trim() !== '').sort();
        
        
        if (id) {
          setIsLoading(true);
          try {
            const resPrenda = await api.get(`/catalogo/prendas/${id}/`);
            const p = resPrenda.data;
            setFormData({
              nombre: p.nombre || '',
              precio_compra: p.precio_compra ? p.precio_compra.toLocaleString('es-CL') : '',
              precio: p.precio ? p.precio.toLocaleString('es-CL') : '',
              categoria: p.categoria || p.categoria_id || '',
              descripcion: p.descripcion || ''
            });
            if (p.variantes && p.variantes.length > 0) {
              setVariantes(p.variantes.map(v => ({ ...v, tempId: v.id || Date.now() + Math.random() })));
            }
            if (p.imagenes && p.imagenes.length > 0) {
              setImages(p.imagenes.map(img => ({
                id: img.id,
                file: null,
                preview: img.imagen,
                color: img.color || '',
                orden: img.orden || 0,
                principal: img.orden === 0
              })));
            }
          } catch (e) {
            showAlert('Error al cargar la prenda para edición');
          } finally {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrecioChange = (e) => {
    const { name, value } = e.target;
    let val = value.replace(/\D/g, '');
    if (!val) {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }
    const num = parseInt(val, 10);
    setFormData(prev => ({ ...prev, [name]: num.toLocaleString('es-CL') }));
  };

  const handleNombreChange = async (e) => {
    const value = e.target.value;
    if (value === 'CREAR_NUEVO') {
      const nuevoNombre = await showPrompt('Nuevo nombre de prenda', 'Ej: Chaleco de Lana');
      if (nuevoNombre && nuevoNombre.trim()) {
        // Formato Title Case adaptado a español (ej: "sWeaTer" -> "Sweater", "ChaQueta" -> "Chaqueta")
        let nombreLimpio = nuevoNombre.trim().toLowerCase().split(/\s+/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        // Verificar si ya existe sin importar las mayúsculas/minúsculas previas
        const existente = nombresExistentes.find(n => n.toLowerCase() === nombreLimpio.toLowerCase());
        
        if (existente) {
          nombreLimpio = existente;
        } else {
          setNombresExistentes(prev => [...prev, nombreLimpio].sort());
        }
        setFormData(prev => ({ ...prev, nombre: nombreLimpio }));
      } else {
        setFormData(prev => ({ ...prev, nombre: prev.nombre || '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, nombre: value }));
    }
  };

  const handleAddVariante = () => {
    setVariantes(prev => [
      ...prev, 
      { id: Date.now(), color: 'Negro', talla: '', cantidad: 1 }
    ]);
  };

  const handleRemoveVariante = (id) => {
    if (variantes.length === 1) return; // Mínimo 1 variante
    setVariantes(prev => prev.filter(v => v.id !== id));
  };

  const handleVarianteChange = (id, field, value) => {
    setVariantes(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      payload.append('nombre', formData.nombre);
      payload.append('descripcion', formData.descripcion || '');
      const precioLimpio = formData.precio.toString().replace(/\./g, '');
      payload.append('precio', precioLimpio);
      if (formData.precio_compra) {
        const precioCompraLimpio = formData.precio_compra.toString().replace(/\./g, '');
        payload.append('precio_compra', precioCompraLimpio);
      }
      if (formData.categoria) {
        payload.append('categoria_id', formData.categoria);
      }
      
      const cleanVariantes = variantes.map(v => {
        const item = {
          color: v.color,
          talla: v.talla,
          cantidad: parseInt(v.cantidad, 10) || 0
        };
        if (id && v.id && !v.tempId) item.id = v.id; 
        if (id && v.id && v.tempId) item.id = v.id; 
        return item;
      });
      payload.append('variantes', JSON.stringify(cleanVariantes));

      // Extraer data de imágenes
      const imagesData = images.map(imgObj => ({
        id: imgObj.file ? null : imgObj.id,
        color: imgObj.color || '',
        orden: parseInt(imgObj.orden, 10) || 0,
        principal: !!imgObj.principal
      }));
      payload.append('imagenes_data', JSON.stringify(imagesData));

      // Añadir las imágenes reales en el mismo orden
      images.forEach((imgObj) => {
        payload.append('imagenes', imgObj.file);
      });

      // Guardar la prenda en el backend local
      if (id) {
        await api.patch(`/catalogo/prendas/${id}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('success', 'Prenda actualizada con éxito');
      } else {
        await api.post('/catalogo/prendas/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('success', 'Prenda creada con éxito');
      }

      navigate('/panel/catalogo');
    } catch (error) {
      console.error("Error guardando:", error);
      showAlert("Hubo un error al guardar la prenda.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="prenda-form-container animate-fade-in">
      <div className="form-header glass">
        <button className="btn-back" onClick={() => navigate('/panel/catalogo')} type="button">
          <ArrowLeft size={24} />
        </button>
        <h2>{id ? 'Editar Prenda' : 'Nueva Prenda'}</h2>
        <div style={{ width: 24 }}></div>
      </div>

      {isLoading ? (
        <div className="loading-state">Cargando datos de la prenda...</div>
      ) : (
      <form className="prenda-form" onSubmit={handleSubmit}>
        <div className="form-section glass" style={{ zIndex: 20, position: 'relative' }}>
          <h3>Detalles Base</h3>
          
          <div className="input-group" style={{ position: 'relative', zIndex: activeDropdown === 'nombre' ? 10 : 1 }}>
            <label>Nombre de la prenda</label>
            <div
              className={`custom-select-trigger ${formData.nombre ? 'has-value' : ''}`}
              onClick={() => setActiveDropdown(prev => prev === 'nombre' ? null : 'nombre')}
            >
              <span>{formData.nombre || 'Selecciona o crea una prenda...'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {activeDropdown === 'nombre' && (
              <div className="custom-select-dropdown">
                {nombresExistentes.map(nombre => (
                  <div
                    key={nombre}
                    className={`custom-select-option ${formData.nombre === nombre ? 'selected' : ''}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, nombre }));
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
                    await handleNombreChange({ target: { value: 'CREAR_NUEVO' } });
                  }}
                >
                  + Agregar nuevo...
                </div>
              </div>
            )}
            <input type="text" value={formData.nombre} required readOnly style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }} />
          </div>

          <div className="input-group">
            <label>Descripción <span style={{fontWeight: 'normal', color: 'var(--color-text-muted)'}}>(Opcional)</span></label>
            <textarea 
              name="descripcion"
              className="glass-input"
              rows="3"
              placeholder="Ej: Pieza exclusiva diseñada para realzar tu estilo..." 
              value={formData.descripcion || ''}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="input-group">
            <label>Precio de Costo / Compra (CLP) <span style={{fontWeight: 'normal', color: 'var(--color-text-muted)'}}>(Opcional)</span></label>
            <input 
              type="text" 
              inputMode="numeric"
              name="precio_compra"
              placeholder="Ej: 8.000" 
              value={formData.precio_compra}
              onChange={handlePrecioChange}
            />
          </div>

          <div className="input-group">
            <label>Precio de Venta (CLP)</label>
            <input 
              type="text" 
              inputMode="numeric"
              name="precio"
              placeholder="Ej: 15.000" 
              value={formData.precio}
              onChange={handlePrecioChange}
              required
            />
          </div>

          <div className="input-group" style={{ position: 'relative', zIndex: activeDropdown === 'categoria' ? 10 : 1 }}>
            <label>Categoría</label>
            <div
              className={`custom-select-trigger ${formData.categoria ? 'has-value' : ''}`}
              onClick={() => setActiveDropdown(prev => prev === 'categoria' ? null : 'categoria')}
            >
              <span>{categorias.find(c => String(c.id) === String(formData.categoria))?.nombre || 'Selecciona una categoría (Opcional)'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {activeDropdown === 'categoria' && (
              <div className="custom-select-dropdown">
                <div
                  className={`custom-select-option ${!formData.categoria ? 'selected' : ''}`}
                  onClick={() => {
                    handleInputChange({ target: { name: 'categoria', value: '' } });
                    setActiveDropdown(null);
                  }}
                >
                  Ninguna
                </div>
                {categorias.map(cat => (
                  <div
                    key={cat.id}
                    className={`custom-select-option ${String(formData.categoria) === String(cat.id) ? 'selected' : ''}`}
                    onClick={() => {
                      handleInputChange({ target: { name: 'categoria', value: cat.id } });
                      setActiveDropdown(null);
                    }}
                  >
                    {cat.nombre}
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>

        <div className="form-section glass" style={{ zIndex: 10, position: 'relative' }}>
          <div className="section-header-flex">
            <h3>Variantes y Stock</h3>
            <button type="button" className="btn-small-outline" onClick={handleAddVariante}>
              <Plus size={16} /> Agregar
            </button>
          </div>

          <div className="variantes-list-edit">
            {variantes.map((variante, index) => (
              <div 
                key={variante.id} 
                className="variante-edit-card animate-slide-up"
                style={{ zIndex: activeDropdown && String(activeDropdown).includes(variante.id) ? 100 : (50 - index), position: 'relative' }}
              >
                <div className="variante-row">
                  <div className="input-group mini" style={{ marginBottom: 8 }}>
                    <label>Color</label>
                    <ColorPalettePicker 
                      availableColors={colores.map(c => c.nombre)} 
                      selectedColor={variante.color} 
                      onSelectColor={(c) => handleVarianteChange(variante.id, 'color', c)} 
                    />
                  </div>
                  
                  <div className="input-group mini" style={{ position: 'relative', zIndex: activeDropdown === `talla-${variante.id}` ? 100 : 1 }}>
                    <label>Talla</label>
                    <div
                      className={`custom-select-trigger ${variante.talla ? 'has-value' : ''}`}
                      onClick={() => {
                        setActiveDropdown(prev => prev === `talla-${variante.id}` ? null : `talla-${variante.id}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{variante.talla || 'Elegir talla...'}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {activeDropdown === `talla-${variante.id}` && (
                      <div className="custom-select-dropdown">
                        {tallas.map(t => (
                          <div
                            key={t.id}
                            className={`custom-select-option ${variante.talla === t.nombre ? 'selected' : ''}`}
                            onClick={() => {
                              handleVarianteChange(variante.id, 'talla', t.nombre);
                              setActiveDropdown(null);
                            }}
                          >
                            {t.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                    <input type="text" value={variante.talla} required readOnly style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }} />
                  </div>

                  <div className="input-group mini cant-input">
                    <label>Cant.</label>
                    <input 
                      type="number" 
                      min="1"
                      value={variante.cantidad}
                      onChange={(e) => handleVarianteChange(variante.id, 'cantidad', e.target.value)}
                      required
                    />
                  </div>
                  
                  {variantes.length > 1 && (
                    <button 
                      type="button" 
                      className="btn-delete-icon"
                      onClick={() => handleRemoveVariante(variante.id)}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GALERÍA DE FOTOS MOVIDA ABAJO DE VARIANTES */}
        <div className="form-section glass" style={{ zIndex: 5, position: 'relative' }}>
          <h3>Imágenes (por foto elige color y orden)</h3>
          <p style={{fontSize: '0.85rem', color: '#666', marginBottom: '16px'}}>La que marques "Principal" será la portada.</p>
          <ImageUploader images={images} setImages={setImages} variantes={variantes} colores={colores} />
        </div>

        <div className="form-actions sticky-bottom glass">
          <button type="submit" className="btn btn-primary submit-btn" disabled={isSubmitting}>
            <Save size={20} />
            {isSubmitting ? 'Procesando...' : (id ? 'Guardar Cambios' : 'Guardar Prenda')}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default PrendaForm;

