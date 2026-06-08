import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ImageUploader from '../components/ImageUploader';
import { Upload, Smartphone, Check } from 'lucide-react';
import './Ajustes.css';

const Ajustes = () => {
  const [config, setConfig] = useState({
    nombre_tienda: '',
    whatsapp: '',
    texto_marquesina: 'NUEVA COLECCIÓN 2026',
    velocidad_marquesina: 25,
    titulo_banner: 'Moda femenina seleccionada especialmente para ti',
    subtitulo_banner: 'Prendas únicas, elegantes y exclusivas. Cada pieza seleccionada con amor y estilo.',
    banner_imagen: '',
    polaroid_1: '',
    polaroid_2: '',
    polaroid_3: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/core/configuracion/');
      if (res.data) setConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/core/configuracion/', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error guardando ajustes');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600";
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    try {
      const url = new URL(import.meta.env.VITE_API_URL);
      return `${url.origin}${path.startsWith('/') ? '' : '/'}${path}`;
    } catch (e) {
      return path;
    }
  };

  return (
    <div className="ajustes-spectacular-root">
      
      <div className="ajustes-left-panel">
        <div className="ajustes-header">
          <h2><Smartphone size={28} /> Apariencia de la Tienda</h2>
          <p>Personaliza cómo luce tu boutique para tus clientas.</p>
        </div>

        <form onSubmit={handleSubmit} className="ajustes-form">
          <div className="form-row">
            <div className="form-group">
              <label>T Nombre de la Tienda</label>
              <input type="text" name="nombre_tienda" value={config.nombre_tienda || ''} onChange={handleChange} placeholder="MindyLu" />
            </div>
            <div className="form-group">
              <label>WhatsApp Pedidos</label>
              <input type="text" name="whatsapp" value={config.whatsapp || ''} onChange={handleChange} placeholder="56972677820" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>T Texto Marquesina</label>
              <input type="text" name="texto_marquesina" value={config.texto_marquesina || ''} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Vel. (s)</label>
              <input type="number" name="velocidad_marquesina" value={config.velocidad_marquesina || 25} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>T Título del Banner</label>
            <textarea name="titulo_banner" value={config.titulo_banner || ''} onChange={handleChange} rows="2" />
          </div>

          <div className="form-group">
            <label>T Subtítulo del Banner</label>
            <textarea name="subtitulo_banner" value={config.subtitulo_banner || ''} onChange={handleChange} rows="3" />
          </div>

          <div className="form-group">
            <label><Upload size={14} /> Imagen del Banner Principal</label>
            <ImageUploader 
              onUploadComplete={(url) => setConfig({...config, banner_imagen: url})} 
              endpoint="/core/upload-banner/" 
              tipo="banner"
            />
          </div>

          <button type="submit" className={`ajustes-save-btn ${saved ? 'saved' : ''}`} disabled={loading}>
            {loading ? 'Guardando...' : saved ? <><Check size={18} /> Guardado con Éxito</> : 'Guardar Apariencia'}
          </button>
        </form>
      </div>

      <div className="ajustes-right-panel">
        <h3 className="preview-title">Previsualización en Vivo</h3>
        
        <div className="phone-mockup">
          <div className="phone-notch"></div>
          <div className="phone-screen">
            
            {/* Live Preview Elements */}
            <div className="preview-marquee">
              {config.texto_marquesina || 'NUEVA COLECCIÓN'}
            </div>
            
            <div className="preview-navbar">
              <span className="preview-logo">{config.nombre_tienda || 'MindyLu'}</span>
              <div className="preview-icons">
                <span className="preview-circle"></span>
                <span className="preview-circle"></span>
              </div>
            </div>

            <div className="preview-hero">
              <img src={getImageUrl(config.banner_imagen)} alt="Hero" className="preview-hero-bg" />
              <div className="preview-hero-overlay"></div>
              <div className="preview-hero-content">
                <h2>{config.titulo_banner || 'Moda femenina'}</h2>
                <p>{config.subtitulo_banner || 'Prendas únicas...'}</p>
                <button>Ver Colección</button>
              </div>
            </div>

            <div className="preview-body">
              <div className="preview-cats">
                <div className="preview-cat-circle"></div>
                <div className="preview-cat-circle"></div>
                <div className="preview-cat-circle"></div>
              </div>
              <div className="preview-grid">
                <div className="preview-card"></div>
                <div className="preview-card"></div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default Ajustes;
