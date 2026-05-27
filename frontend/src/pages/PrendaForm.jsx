import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
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
    talla_tipo: 'unica',
  });

  const [variantes, setVariantes] = useState([
    { id: Date.now(), color: 'Negro', talla: 'Única', cantidad: 1 }
  ]);

  const [nombresExistentes, setNombresExistentes] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

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
        const nombresPred = resNombres.data.results || resNombres.data;
        
        // Obtener prendas existentes para complementar nombres
        const resPrendas = await api.get('/catalogo/prendas/');
        const prendas = resPrendas.data.results || resPrendas.data;
        const nombresUnicos = [...new Set([
          ...nombresPred.map(n => n.nombre), 
          ...prendas.map(p => p.nombre)
        ])];
        setNombresExistentes(nombresUnicos);
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      }
    };
    fetchData();
  }, []);

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
      { id: Date.now(), color: 'Negro', talla: formData.talla_tipo === 'unica' ? 'Única' : 'M', cantidad: 1 }
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

  const handleTallaTipoChange = (e) => {
    const newTipo = e.target.value;
    setFormData(prev => ({ ...prev, talla_tipo: newTipo }));
    // Actualizar las variantes existentes con el nuevo tipo
    setVariantes(prev => prev.map(v => ({
      ...v,
      talla: newTipo === 'unica' ? 'Única' : (v.talla === 'Única' ? 'M' : v.talla)
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      payload.append('nombre', formData.nombre);
      const precioLimpio = formData.precio.toString().replace(/\./g, '');
      payload.append('precio', precioLimpio);
      if (formData.precio_compra) {
        const precioCompraLimpio = formData.precio_compra.toString().replace(/\./g, '');
        payload.append('precio_compra', precioCompraLimpio);
      }
      payload.append('talla_tipo', formData.talla_tipo);
      if (formData.categoria) {
        payload.append('categoria_id', formData.categoria);
      }
      
      const cleanVariantes = variantes.map(v => ({
        color: v.color,
        talla: v.talla,
        cantidad: parseInt(v.cantidad, 10)
      }));
      payload.append('variantes', JSON.stringify(cleanVariantes));

      // Añadir las imágenes reales
      images.forEach((imgObj) => {
        payload.append('imagenes', imgObj.file);
      });

      // Guardar la prenda en el backend local
      await api.post('/catalogo/prendas/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/catalogo');
    } catch (error) {
      console.error("Error guardando:", error);
      showAlert("Hubo un error al guardar la prenda.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="prenda-form-container animate-fade-in">
      <div className="form-header glass">
        <button className="btn-back" onClick={() => navigate('/catalogo')} type="button">
          <ArrowLeft size={24} />
        </button>
        <h2>Nueva Prenda</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <form className="prenda-form" onSubmit={handleSubmit}>
        
        {/* GALERÍA DE FOTOS */}
        <div className="form-section glass">
          <h3>Fotos del Producto</h3>
          <ImageUploader images={images} setImages={setImages} />
        </div>

        <div className="form-section glass">
          <h3>Detalles Base</h3>
          
          <div className="input-group" style={{ position: 'relative' }}>
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

          <div className="input-group" style={{ position: 'relative' }}>
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

          <div className="input-group" style={{ position: 'relative' }}>
            <label>Tipo de Talla</label>
            <div
              className={`custom-select-trigger ${formData.talla_tipo ? 'has-value' : ''}`}
              onClick={() => setActiveDropdown(prev => prev === 'talla_tipo' ? null : 'talla_tipo')}
            >
              <span>{formData.talla_tipo === 'unica' ? 'Talla Única' : 'Varias Tallas (S, M, L...)'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {activeDropdown === 'talla_tipo' && (
              <div className="custom-select-dropdown">
                <div
                  className={`custom-select-option ${formData.talla_tipo === 'unica' ? 'selected' : ''}`}
                  onClick={() => {
                    handleTallaTipoChange({ target: { name: 'talla_tipo', value: 'unica' } });
                    setActiveDropdown(null);
                  }}
                >
                  Talla Única
                </div>
                <div
                  className={`custom-select-option ${formData.talla_tipo === 'por_talla' ? 'selected' : ''}`}
                  onClick={() => {
                    handleTallaTipoChange({ target: { name: 'talla_tipo', value: 'por_talla' } });
                    setActiveDropdown(null);
                  }}
                >
                  Varias Tallas (S, M, L...)
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-section glass">
          <div className="section-header-flex">
            <h3>Variantes y Stock</h3>
            <button type="button" className="btn-small-outline" onClick={handleAddVariante}>
              <Plus size={16} /> Agregar
            </button>
          </div>

          <div className="variantes-list-edit">
            {variantes.map((variante) => (
              <div key={variante.id} className="variante-edit-card animate-slide-up">
                <div className="variante-row">
                  <div className="input-group mini" style={{ position: 'relative' }}>
                    <label>Color</label>
                    <div
                      className={`custom-select-trigger ${variante.color ? 'has-value' : ''}`}
                      onClick={() => setActiveDropdown(prev => prev === `color-${variante.id}` ? null : `color-${variante.id}`)}
                    >
                      <span>{variante.color || 'Elegir color...'}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {activeDropdown === `color-${variante.id}` && (
                      <div className="custom-select-dropdown">
                        {colores.map(c => (
                          <div
                            key={c.id}
                            className={`custom-select-option ${variante.color === c.nombre ? 'selected' : ''}`}
                            onClick={() => {
                              handleVarianteChange(variante.id, 'color', c.nombre);
                              setActiveDropdown(null);
                            }}
                          >
                            {c.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                    <input type="text" value={variante.color} required readOnly style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }} />
                  </div>
                  
                  <div className="input-group mini" style={{ position: 'relative' }}>
                    <label>Talla</label>
                    <div
                      className={`custom-select-trigger ${variante.talla ? 'has-value' : ''}`}
                      onClick={() => {
                        if (formData.talla_tipo !== 'unica') {
                          setActiveDropdown(prev => prev === `talla-${variante.id}` ? null : `talla-${variante.id}`);
                        }
                      }}
                      style={{ opacity: formData.talla_tipo === 'unica' ? 0.6 : 1, cursor: formData.talla_tipo === 'unica' ? 'not-allowed' : 'pointer' }}
                    >
                      <span>{variante.talla || 'Elegir talla...'}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {activeDropdown === `talla-${variante.id}` && formData.talla_tipo !== 'unica' && (
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

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={20} />
            {isSubmitting ? 'Procesando...' : 'Guardar Prenda'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrendaForm;

