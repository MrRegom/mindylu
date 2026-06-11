import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  ShoppingBag, ChevronLeft, ChevronRight, Heart, 
  Truck, ShieldCheck, Check, MessageCircle, AlertCircle
} from 'lucide-react';
import './PublicProductDetail.css';
import { showAlert } from '../utils/alerts';
import { ImageLoader } from '../components/ImageLoader';

const getImageUrl = (path) => {
  if (!path) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  try {
    const url = new URL(import.meta.env.VITE_API_URL);
    return `${url.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (e) {
    return path.startsWith('/') ? path : `/${path}`;
  }
};

const formatPrice = (price) => {
  if (!price) return '$0';
  return `$${Number(price).toLocaleString('es-CL')}`;
};

const PublicProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [cantidadAComprar, setCantidadAComprar] = useState(1);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, configRes] = await Promise.all([
        api.get(`/catalogo/publico/prendas/${id}/`),
        api.get(`/core/configuracion/publico/`)
      ]);
      setProducto(prodRes.data);
      setConfig(configRes.data);
      
      if (prodRes.data.variantes && prodRes.data.variantes.length > 0) {
        const uniqueColors = Array.from(new Set(prodRes.data.variantes.map(v => v.color))).filter(Boolean);
        if (uniqueColors.length > 0) setColorSeleccionado(uniqueColors[0]);
      }
    } catch (error) {
      console.error('Error fetching data', error);
      showAlert('Error al cargar la prenda');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="pk3-loading"><div className="spinner"></div></div>;
  }

  if (!producto) return null;

  // Variables for variants
  const variantes = producto.variantes || [];
  const uniqueColors = Array.from(new Set(variantes.map(v => v.color))).filter(Boolean);
  
  const tallasDisponibles = colorSeleccionado 
    ? variantes.filter(v => v.color === colorSeleccionado) 
    : variantes;
  
  const uniqueTallas = Array.from(new Set(tallasDisponibles.map(v => v.talla))).filter(Boolean);
  
  const varianteSeleccionada = colorSeleccionado && tallaSeleccionada
    ? variantes.find(v => v.color === colorSeleccionado && v.talla === tallaSeleccionada)
    : null;

  // Images
  let allImages = [];
  if (producto.foto_url) allImages.push({ imagen: producto.foto_url });
  if (producto.imagenes && producto.imagenes.length > 0) {
    allImages = [...allImages, ...producto.imagenes];
  }

  const handleNextImage = () => setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  const handlePrevImage = () => setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

  const handleAddToCart = () => {
    if (variantes.length > 0 && !varianteSeleccionada) {
      showAlert("Por favor selecciona color y talla para continuar.");
      return;
    }
    const imgUrl = getImageUrl(producto.foto_url || (producto.imagenes && producto.imagenes[0]?.imagen));
    const itemToAdd = { 
      ...producto, 
      varianteSeleccionada,
      cantidad: cantidadAComprar,
      imagen: imgUrl
    };
    localStorage.setItem('pendingCartItem', JSON.stringify(itemToAdd));
    navigate('/?cart=open');
  };

  const handleWhatsAppBuy = () => {
    if (variantes.length > 0 && !varianteSeleccionada) {
      showAlert("Por favor selecciona color y talla para continuar.");
      return;
    }
    
    let varianteText = '';
    if (varianteSeleccionada) {
       varianteText = ` (Color: ${varianteSeleccionada.color || 'Único'}, Talla: ${varianteSeleccionada.talla || 'Única'})`;
    }
    
    const text = `Hola, quiero comprar el siguiente producto:\n\n*${producto.nombre}*${varianteText} x${cantidadAComprar} - ${formatPrice(producto.precio * cantidadAComprar)}\n`;
    const num = config?.whatsapp_numero || '56912345678';
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="pk3-root">
      {/* ── Breadcrumbs ── */}
      <div className="pk3-breadcrumbs-container">
        <div className="pk3-breadcrumbs">
          <span onClick={() => navigate('/')}>Inicio</span>
          <ChevronRight size={14} />
          {producto.categoria?.nombre && (
             <>
               <span onClick={() => navigate('/')}>{producto.categoria.nombre}</span>
               <ChevronRight size={14} />
             </>
          )}
          <span className="current">{producto.nombre}</span>
        </div>
      </div>

      <div className="pk3-container">
        {/* ── Galería de Imágenes (Izquierda) ── */}
        <div className="pk3-gallery">
          {allImages.length > 1 && (
            <div className="pk3-thumbnails">
              {allImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`pk3-thumbnail ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <ImageLoader src={getImageUrl(img.imagen)} alt={`Thumb ${idx}`} />
                </div>
              ))}
            </div>
          )}
          
          <div className="pk3-main-image-container">
            {allImages.length > 0 ? (
              <ImageLoader src={getImageUrl(allImages[activeImageIndex].imagen)} alt={producto.nombre} className="pk3-main-image" />
            ) : (
              <div className="pk3-no-image">Sin imagen</div>
            )}
            
            {allImages.length > 1 && (
              <>
                <button className="pk3-carousel-btn left" onClick={handlePrevImage}><ChevronLeft size={24}/></button>
                <button className="pk3-carousel-btn right" onClick={handleNextImage}><ChevronRight size={24}/></button>
              </>
            )}
          </div>
        </div>

        {/* ── Info del Producto (Derecha) ── */}
        <div className="pk3-info">
          <h1 className="pk3-title">{producto.nombre}</h1>
          <p className="pk3-price">{formatPrice(producto.precio)}</p>

          <div className="pk3-variants-section">
            {uniqueColors.length > 0 && (
              <div className="pk3-variant-group">
                <span className="pk3-variant-label">Color: <strong>{colorSeleccionado}</strong></span>
                <div className="pk3-color-options">
                  {uniqueColors.map((colorName, idx) => (
                    <button 
                      key={idx}
                      className={`pk3-color-btn ${colorSeleccionado === colorName ? 'selected' : ''}`}
                      onClick={() => {
                        setColorSeleccionado(colorName);
                        setTallaSeleccionada(null);
                        
                        // Buscar imagen correspondiente al color
                        const idx = allImages.findIndex(img => img.color && img.color.toLowerCase() === colorName.toLowerCase());
                        if (idx !== -1) {
                          setActiveImageIndex(idx);
                        }
                      }}
                    >
                      {colorName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uniqueTallas.length > 0 && (
              <div className="pk3-variant-group">
                <span className="pk3-variant-label">Talla: <strong>{tallaSeleccionada || 'Selecciona'}</strong></span>
                <div className="pk3-size-options">
                  {uniqueTallas.map((talla, idx) => {
                     const varianteMatch = tallasDisponibles.find(v => v.talla === talla);
                     const isAgotada = varianteMatch && varianteMatch.stock <= 0;
                     return (
                       <button
                         key={idx}
                         className={`pk3-size-btn ${tallaSeleccionada === talla ? 'selected' : ''} ${isAgotada ? 'agotada' : ''}`}
                         disabled={isAgotada}
                         onClick={() => setTallaSeleccionada(talla)}
                       >
                         {talla}
                       </button>
                     );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pk3-qty-group">
             <div className="pk3-qty-selector">
                <button onClick={() => setCantidadAComprar(Math.max(1, cantidadAComprar - 1))}>-</button>
                <span>{cantidadAComprar}</span>
                <button onClick={() => setCantidadAComprar(cantidadAComprar + 1)}>+</button>
             </div>
          </div>

          <div className="pk3-actions">
            <button className="pk3-btn-buy" onClick={handleAddToCart}>
              <span className="btn-text">Agregar al Carro</span> <ShoppingBag size={18} className="btn-icon" />
            </button>
            <button className="pk3-btn-buy whatsapp-btn" onClick={handleWhatsAppBuy} style={{ background: '#25D366' }}>
              <span className="btn-text">WhatsApp</span> <MessageCircle size={18} className="btn-icon" />
            </button>
          </div>

          {producto.descripcion && (
            <div className="pk3-description" style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px', marginTop: '10px', marginBottom: '25px' }}>
              <p>{producto.descripcion}</p>
            </div>
          )}
          
          <div className="pk3-features-mini" style={{ marginTop: '10px' }}>
             <div className="pk3-feature">
               <Truck size={20} /> <span>Envíos a todo el país</span>
             </div>
             <div className="pk3-feature">
               <ShieldCheck size={20} /> <span>Compra Segura 100% garantizada</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProductDetail;
