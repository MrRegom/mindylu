import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import './ImageUploader.css';

const ImageUploader = ({ images, setImages }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // Resetear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (idToRemove) => {
    setImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="image-uploader-container">
      <div 
        className="uploader-dropzone glass" 
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload size={32} className="uploader-icon" />
        <p>Toca para agregar fotos<br/><small>(o arrástralas aquí)</small></p>
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }}
        />
      </div>

      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((img, idx) => (
            <div key={img.id} className="preview-item">
              <img src={img.preview} alt={`preview-${idx}`} />
              {idx === 0 && <span className="badge-portada">Portada</span>}
              <button 
                type="button" 
                className="btn-remove-img" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
