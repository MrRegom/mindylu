import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, Plus } from 'lucide-react';
import api from '../services/api';
import './CargaMasiva.css';

import { compressImage } from '../utils/imageCompression';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const LoteAddFotos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

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
    e.target.value = '';
  };

  const removeItem = (id) => setItems(prev => prev.filter(item => item.id !== id));
  
  const handleChange = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleVarianteChange = (itemId, varId, field, value) => {
    setItems(prev => prev.map(item => item.id === itemId ? {
        ...item, variantes: item.variantes.map(v => v.id === varId ? { ...v, [field]: value } : v)
      } : item));
  };

  const addVariante = (itemId) => {
    setItems(prev => prev.map(item => item.id === itemId ? {
        ...item, variantes: [...item.variantes, { id: Math.random().toString(36).substring(7), color: '', talla: '', cantidad: 1 }]
      } : item));
  };

  const removeVariante = (itemId, varId) => {
    setItems(prev => prev.map(item => item.id === itemId ? {
        ...item, variantes: item.variantes.filter(v => v.id !== varId)
      } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    const incompletos = items.some(item => !item.nombre || !item.precio || item.variantes.length === 0);
    if (incompletos) {
      showAlert("Por favor, completa nombre, precio y al menos una variante.");
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
      items.forEach((item, index) => payload.append(`imagenes_${index}`, item.file));

      await api.post(`/catalogo/ciclos/${id}/agregar_fotos/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showAlert(`¡${items.length} fotos añadidas al lote programado!`);
      navigate('/catalogo/lotes');
    } catch (error) {
      console.error("Error agregando fotos:", error);
      showAlert("Hubo un error al agregar las fotos al lote.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="carga-masiva-container animate-fade-in">
      <div className="form-header glass">
        <button className="btn-back" onClick={() => navigate('/catalogo/lotes')} type="button">
          <ArrowLeft size={24} />
        </button>
        <h2>Añadir al Lote 🕒</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="uploader-header-card glass">
        <div className="upload-btn-wrapper">
          <button className="btn btn-secondary">
            <Upload size={20} style={{ marginRight: 8 }} />
            Añadir Fotos Extra
          </button>
          <input type="file" multiple accept="image/*" onChange={handleFiles} />
        </div>
        <p>Estas prendas se publicarán en Facebook junto al resto del álbum.</p>
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
                    <input type="text" placeholder="Ej: Vestido Lanilla" value={item.nombre} onChange={(e) => handleChange(item.id, 'nombre', e.target.value)} required />
                  </div>
                  <div className="input-group mini">
                    <label>Precio *</label>
                    <input type="number" placeholder="$" value={item.precio} onChange={(e) => handleChange(item.id, 'precio', e.target.value)} required />
                  </div>
                  
                  <div className="item-variantes">
                    <div className="item-variantes-header">
                      <label>Variantes</label>
                      <button type="button" className="btn-add-mini" onClick={() => addVariante(item.id)}><Plus size={14} /> Add</button>
                    </div>
                    {item.variantes.map((v) => (
                      <div key={v.id} className="variante-mini-row">
                        <div className="variante-fields">
                          <div className="variante-field-group">
                            <label>Color</label>
                            <input type="text" placeholder="Ej: Rojo" value={v.color} onChange={(e) => handleVarianteChange(item.id, v.id, 'color', e.target.value)} className="input-mini" />
                          </div>
                          <div className="variante-field-group">
                            <label>Talla</label>
                            <input type="text" placeholder="Ej: L" value={v.talla} onChange={(e) => handleVarianteChange(item.id, v.id, 'talla', e.target.value)} className="input-mini" />
                          </div>
                          <div className="variante-field-group">
                            <label>Stock</label>
                            <input type="number" min="1" placeholder="Ej: 3" value={v.cantidad} onChange={(e) => handleVarianteChange(item.id, v.id, 'cantidad', e.target.value)} className="input-mini stock-mini" required />
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

          <div className="fixed-bottom-bar glass">
            <div className="summary-info">
              <span>{items.length} prendas nuevas</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={20} />
              {isSubmitting ? 'Procesando...' : 'Guardar y Unir al Lote'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoteAddFotos;
