import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import api from '../services/api';
import ImageUploader from '../components/ImageUploader';
import './PrendaForm.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const PrendaForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [images, setImages] = useState([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    categoria: '',
    talla_tipo: 'unica',
  });

  const [variantes, setVariantes] = useState([
    { id: Date.now(), color: 'Negro', talla: 'Única', cantidad: 1 }
  ]);

  const [nombresExistentes, setNombresExistentes] = useState([]);

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
      payload.append('precio', formData.precio);
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
          
          <div className="input-group">
            <label>Nombre de la prenda</label>
            <input 
              type="text" 
              name="nombre"
              list="nombres-prendas"
              placeholder="Ej: Chaleco de Lana (Busca o crea)" 
              value={formData.nombre}
              onChange={handleInputChange}
              required 
            />
            <datalist id="nombres-prendas">
              {nombresExistentes.map(nombre => (
                <option key={nombre} value={nombre} />
              ))}
            </datalist>
          </div>

          <div className="input-group">
            <label>Precio (CLP)</label>
            <input 
              type="number" 
              name="precio"
              placeholder="Ej: 15000" 
              value={formData.precio}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="input-group">
            <label>Categoría</label>
            <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="form-select">
              <option value="">Selecciona una categoría (Opcional)</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Tipo de Talla</label>
            <select name="talla_tipo" value={formData.talla_tipo} onChange={handleTallaTipoChange} className="form-select">
              <option value="unica">Talla Única</option>
              <option value="por_talla">Varias Tallas (S, M, L...)</option>
            </select>
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
                  <div className="input-group mini">
                    <label>Color</label>
                    <select 
                      value={variante.color}
                      onChange={(e) => handleVarianteChange(variante.id, 'color', e.target.value)}
                      required
                      className="form-select"
                    >
                      <option value="">Elegir color...</option>
                      {colores.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="input-group mini">
                    <label>Talla</label>
                    <select 
                      value={variante.talla}
                      onChange={(e) => handleVarianteChange(variante.id, 'talla', e.target.value)}
                      required
                      className="form-select"
                      disabled={formData.talla_tipo === 'unica'}
                    >
                      <option value="">Elegir talla...</option>
                      {formData.talla_tipo === 'unica' ? (
                        <option value="Única">Única</option>
                      ) : (
                        tallas.map(t => (
                          <option key={t.id} value={t.nombre}>{t.nombre}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="input-group mini" style={{ width: '80px' }}>
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

