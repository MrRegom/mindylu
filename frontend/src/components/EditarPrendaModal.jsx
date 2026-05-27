import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Package } from 'lucide-react';
import api from '../services/api';
import './EditarPrendaModal.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const TALLAS_DISPONIBLES = ['S', 'M', 'L', 'XL', 'estándar', '34', '36', '38', '40', '42', '44', '34/36', '36/38', '38/40'];
const COLORES_DISPONIBLES = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Beige', 'Café', 'Rosado', 'Morado', 'Naranjo', 'Multicolor', 'Por defecto'];

const EditarPrendaModal = ({ isOpen, onClose, prenda, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
  });
  const [variantes, setVariantes] = useState([]);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && prenda) {
      setFormData({
        nombre: prenda.nombre || '',
        precio: prenda.precio || 0,
      });
      // Clonar las variantes para no modificar el estado original hasta guardar
      setVariantes(
        (prenda.variantes || []).map(v => ({ ...v, _tempId: v.id || Date.now() + Math.random() }))
      );
    }
  }, [isOpen, prenda]);

  if (!isOpen || !prenda) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVarianteChange = (tempId, field, value) => {
    setVariantes(prev => prev.map(v => 
      v._tempId === tempId ? { ...v, [field]: value } : v
    ));
  };

  const handleAddVariante = () => {
    setVariantes(prev => [
      ...prev, 
      { _tempId: Date.now(), id: null, color: '', talla: 'Única', cantidad: 1 }
    ]);
  };

  const handleRemoveVariante = (tempId) => {
    // Si la variante tiene id real, en el backend se pondrá stock 0 si no se envía
    setVariantes(prev => prev.filter(v => v._tempId !== tempId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Preparar el payload
    const payload = {
      nombre: formData.nombre,
      precio: parseInt(formData.precio, 10),
      variantes: variantes.map(v => {
        const item = { color: v.color, talla: v.talla, cantidad: parseInt(v.cantidad, 10) || 0 };
        if (v.id) item.id = v.id;
        return item;
      })
    };

    try {
      await api.patch(`/catalogo/prendas/${prenda.id}/`, payload);
      onSuccess();
    } catch (error) {
      console.error("Error al actualizar la prenda:", error);
      showAlert("Hubo un error al guardar los cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="editar-modal glass animate-slide-up" onClick={e => e.stopPropagation()} style={{ zIndex: 10000, background: 'var(--color-surface, #ffffff)' }}>
        <div className="modal-header">
          <div>
            <h2>Editar Prenda</h2>
            <p className="modal-subtitle">Modifica precio, nombre y gestiona variantes</p>
          </div>
          <button className="btn-close" onClick={onClose} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="editar-form">
          {/* FOTO MINIATURA (Opcional visual) */}
          <div className="editar-preview">
            {prenda.imagenes && prenda.imagenes.length > 0 ? (
               <img src={prenda.imagenes[0].imagen} alt="Preview" className="preview-img" />
            ) : prenda.foto_url ? (
               <img src={prenda.foto_url} alt="Preview" className="preview-img" />
            ) : (
               <div className="preview-placeholder"><Package size={40} /></div>
            )}
          </div>

          <div className="form-group">
            <label>Nombre de la prenda</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleInputChange} 
              className="glass-input"
              required 
            />
          </div>

          <div className="form-group">
            <label>Precio ($)</label>
            <input 
              type="number" 
              name="precio" 
              value={formData.precio === 0 ? '' : formData.precio} 
              onChange={handleInputChange} 
              className="glass-input"
              placeholder="Ej: 15000"
              required 
            />
          </div>

          <div className="variantes-section">
            <div className="section-header">
              <h3>Variantes y Stock</h3>
              <button type="button" className="btn btn-secondary btn-small" onClick={handleAddVariante}>
                <Plus size={16} /> Agregar
              </button>
            </div>

            {variantes.length === 0 && (
              <div className="empty-variantes">
                No hay variantes. Agrega al menos una.
              </div>
            )}

            <div className="variantes-grid">
              {variantes.map((v) => (
                <div key={v._tempId} className="variante-row glass-dark">
                  <div className="var-col">
                    <label>Color</label>
                    <select
                      value={v.color || ''}
                      onChange={(e) => handleVarianteChange(v._tempId, 'color', e.target.value)}
                      className="glass-input small-input"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      {COLORES_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="var-col">
                    <label>Talla</label>
                    <select
                      value={v.talla || ''}
                      onChange={(e) => handleVarianteChange(v._tempId, 'talla', e.target.value)}
                      className="glass-input small-input"
                      style={{ WebkitAppearance: 'none' }}
                      required
                    >
                      {TALLAS_DISPONIBLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="var-col stock-col">
                    <label>Stock</label>
                    <input 
                      type="number" 
                      min="0"
                      value={v.cantidad} 
                      onChange={(e) => handleVarianteChange(v._tempId, 'cantidad', e.target.value)} 
                      className="glass-input small-input"
                      required
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-icon var-remove" 
                    onClick={() => handleRemoveVariante(v._tempId)}
                    title="Remover variante"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (
                <>
                  <Save size={20} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarPrendaModal;
