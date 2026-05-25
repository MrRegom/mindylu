import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Share2 } from 'lucide-react';
import api from '../services/api';
import ImageUploader from '../components/ImageUploader';
import './PrendaForm.css';

const PrendaForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicarFacebook, setPublicarFacebook] = useState(false);
  const [images, setImages] = useState([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    talla_tipo: 'unica',
  });

  const [variantes, setVariantes] = useState([
    { id: Date.now(), color: '', talla: 'Única', cantidad: 1 }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVariante = () => {
    setVariantes(prev => [
      ...prev, 
      { id: Date.now(), color: '', talla: formData.talla_tipo === 'unica' ? 'Única' : '', cantidad: 1 }
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
      talla: newTipo === 'unica' ? 'Única' : ''
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

      // 1. Guardar la prenda en el backend local
      const res = await api.post('/catalogo/prendas/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const nuevaPrenda = res.data;

      // 2. Si marcó "Publicar en Facebook", enviarla
      if (publicarFacebook && images.length > 0) {
        try {
          await api.post('/integraciones/publicar-en-facebook/', {
            prenda_id: nuevaPrenda.id
            // 'mensaje' puede ir vacío para auto-generación en el backend
          });
          alert("¡Prenda guardada y publicada en Facebook exitosamente!");
        } catch (fbError) {
          console.error("Error al publicar en FB:", fbError);
          alert("La prenda se guardó, pero hubo un error al publicar en Facebook.");
        }
      } else if (publicarFacebook && images.length === 0) {
        alert("La prenda se guardó localmente, pero se requiere al menos una foto para publicarla en Facebook.");
      } else {
        // alert("Prenda guardada exitosamente.");
      }

      navigate('/catalogo');
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Hubo un error al guardar la prenda.");
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
        
        {/* GALERÍA DE FOTOS (NUEVO COMPONENTE) */}
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
              placeholder="Ej: Chaleco de Lana" 
              value={formData.nombre}
              onChange={handleInputChange}
              required 
            />
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
                    <input 
                      type="text" 
                      placeholder="Ej: Rojo" 
                      value={variante.color}
                      onChange={(e) => handleVarianteChange(variante.id, 'color', e.target.value)}
                      required
                    />
                  </div>
                  
                  {formData.talla_tipo === 'por_talla' && (
                    <div className="input-group mini">
                      <label>Talla</label>
                      <input 
                        type="text" 
                        placeholder="Ej: M" 
                        value={variante.talla}
                        onChange={(e) => handleVarianteChange(variante.id, 'talla', e.target.value)}
                        required
                      />
                    </div>
                  )}

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

        <div className="form-section glass facebook-push-section">
          <div className="facebook-toggle-wrapper">
            <div className="facebook-toggle-info">
              <Share2 size={24} color="#1877F2" />
              <div>
                <h4>Publicar en Facebook</h4>
                <p>Crea un álbum automáticamente en tu página con estas fotos.</p>
              </div>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={publicarFacebook} 
                onChange={(e) => setPublicarFacebook(e.target.checked)} 
              />
              <span className="slider round"></span>
            </label>
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

