import React, { useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import './ImageUploader.css';

const ImageUploader = ({ images, setImages, variantes }) => {
  const fileInputRef = useRef(null);

  // Colores únicos disponibles de las variantes configuradas
  const coloresUnicos = [...new Set(variantes?.map(v => v.color).filter(Boolean))] || [];
  if (coloresUnicos.length === 0) coloresUnicos.push('Estándar');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
      color: coloresUnicos[0],
      orden: images.length + i + 1,
      principal: images.length === 0 && i === 0 // El primero por defecto es principal
    }));

    setImages(prev => {
      // Si ya hay uno principal, asegurar que solo haya uno.
      const hasPrincipal = prev.some(p => p.principal);
      if (hasPrincipal) {
        newImages.forEach(ni => ni.principal = false);
      }
      return [...prev, ...newImages];
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (idToRemove) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== idToRemove);
      // Si borramos el principal, asignar al primero si existe
      if (filtered.length > 0 && !filtered.some(img => img.principal)) {
        filtered[0].principal = true;
      }
      return filtered;
    });
  };

  const updateImage = (id, field, value) => {
    setImages(prev => {
      const updated = prev.map(img => {
        if (img.id === id) {
          return { ...img, [field]: value };
        }
        // Si el modificado es principal, quitar principal a los demás
        if (field === 'principal' && value === true) {
          return { ...img, principal: false };
        }
        return img;
      });
      return updated;
    });
  };

  return (
    <div className="image-uploader-list-container">
      {images.length > 0 && (
        <div className="image-list-header">
          <div className="col-preview">Archivo</div>
          <div className="col-color">Color</div>
          <div className="col-orden">Orden</div>
          <div className="col-principal">Principal</div>
          <div className="col-actions"></div>
        </div>
      )}

      {images.map((img, idx) => (
        <div key={img.id} className="image-list-row">
          <div className="col-preview">
            <img src={img.preview} alt={`preview-${idx}`} className="row-preview-img" />
          </div>
          <div className="col-color">
            <select 
              value={img.color || ''} 
              onChange={e => updateImage(img.id, 'color', e.target.value)}
              className="row-select"
            >
              <option value="">-- Asignar --</option>
              {coloresUnicos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-orden">
            <input 
              type="number" 
              value={img.orden} 
              onChange={e => updateImage(img.id, 'orden', e.target.value)} 
              className="row-input"
              min="1"
            />
          </div>
          <div className="col-principal">
            <input 
              type="radio" 
              name="img-principal" 
              checked={!!img.principal}
              onChange={() => updateImage(img.id, 'principal', true)}
            />
          </div>
          <div className="col-actions">
            <button type="button" className="btn-row-remove" onClick={() => removeImage(img.id)}>
              <X size={18} />
            </button>
          </div>
        </div>
      ))}

      <div className="add-file-row">
        <button type="button" className="btn-add-file" onClick={() => fileInputRef.current?.click()}>
          <Plus size={16} /> Añadir foto
        </button>
        <span className="add-file-hint">
          {images.length === 0 ? "Sin archivos seleccionados" : `${images.length} fotos seleccionadas`}
        </span>
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
