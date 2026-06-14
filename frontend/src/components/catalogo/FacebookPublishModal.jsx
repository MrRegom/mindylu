import { useState, useEffect } from 'react';
import { X, Send, Loader } from 'lucide-react';
import api from '../../services/api';
import { showAlert } from '../../utils/alerts';

const FacebookPublishModal = ({ prenda, onClose, onPublished }) => {
  const [mensaje, setMensaje] = useState(`¡Nuevas prendas disponibles!\n\n${prenda.nombre}\nPrecio: $${prenda.precio.toLocaleString('es-CL')}\n\nEscríbenos al interno o comenta para más información.`);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await api.post(`/catalogo/prendas/${prenda.id}/preview_facebook/`, {}, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error("Error preview", err);
        showAlert("No se pudo cargar la vista previa.");
      } finally {
        setIsLoadingPreview(false);
      }
    };
    fetchPreview();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prenda.id]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await api.post(`/catalogo/prendas/${prenda.id}/publicar_facebook/`, { mensaje });
      showAlert("¡Publicado en Facebook con éxito!");
      if (onPublished) onPublished();
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("Error al publicar en Facebook.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="animate-slide-up">
        <div style={headerStyle}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#1877F2' }}>
            <Send size={24} />
            Publicar en Facebook
          </h3>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        
        <div style={bodyStyle}>
          <div style={previewContainerStyle}>
            {isLoadingPreview ? (
              <div style={loadingStyle}>
                <Loader className="spin" size={32} color="#1877F2" />
                <p>Generando estampa...</p>
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview" style={previewImgStyle} />
            ) : (
              <p>No se pudo generar preview</p>
            )}
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 250 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Descripción de la publicación:</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              style={textareaStyle}
              rows={8}
            />
            <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.4 }}>
              Esta foto se subirá automáticamente a tu página de Facebook con el precio estampado y este texto.
            </p>
          </div>
        </div>
        
        <div style={footerStyle}>
          <button onClick={onClose} style={btnCancelStyle} disabled={isPublishing}>Cancelar</button>
          <button onClick={handlePublish} style={btnPublishStyle} disabled={isPublishing || isLoadingPreview}>
            {isPublishing ? 'Publicando...' : 'Publicar Ahora'}
          </button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16
};

const modalStyle = {
  background: 'white', borderRadius: 16, width: '100%', maxWidth: 700,
  overflow: 'hidden', display: 'flex', flexDirection: 'column',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const headerStyle = {
  padding: '16px 20px', borderBottom: '1px solid #eee',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const closeBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#999'
};

const bodyStyle = {
  padding: 20, display: 'flex', gap: 20, flexWrap: 'wrap'
};

const previewContainerStyle = {
  width: 250, height: 350, background: '#f5f5f5', borderRadius: 12,
  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #ddd'
};

const previewImgStyle = {
  width: '100%', height: '100%', objectFit: 'contain'
};

const loadingStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666', gap: 8
};

const textareaStyle = {
  width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd',
  fontFamily: 'inherit', resize: 'vertical'
};

const footerStyle = {
  padding: '16px 20px', borderTop: '1px solid #eee',
  display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#fafafa'
};

const btnCancelStyle = {
  padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd',
  background: 'white', cursor: 'pointer', fontWeight: 600
};

const btnPublishStyle = {
  padding: '10px 20px', borderRadius: 8, border: 'none',
  background: '#1877F2', color: 'white', cursor: 'pointer', fontWeight: 600
};

export default FacebookPublishModal;
