import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  ShoppingBag, X, Search, User, Heart, 
  Truck, ShieldCheck, CreditCard, RefreshCcw, MessageCircle, Menu,
  ChevronLeft, ChevronRight, Check, Sparkles
} from 'lucide-react';
import './PublicCatalog.css';
import { showAlert } from '../utils/alerts';
import { SkeletonCard } from '../components/Skeleton';
import { ImageLoader } from '../components/ImageLoader';

const getImageUrl = (path) => {
  if (!path) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  try {
    const url = new URL(import.meta.env.VITE_API_URL);
    return `${url.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (e) {
    return path;
  }
};

const formatPrice = (price) => {
  if (!price) return '$0';
  return `$${Number(price).toLocaleString('es-CL')}`;
};

import { CATEGORY_ICONS, getCategoryIcon } from '../utils/iconMap';

const colorHexMap = {
  'blanco': '#FFFFFF', 'negro': '#000000', 'gris': '#808080', 'rojo': '#FF0000',
  'azul': '#0000FF', 'verde': '#008000', 'amarillo': '#FFFF00', 'rosa': '#FFC0CB',
  'rosado': '#FFC0CB', 'fucsia': '#FF00FF', 'lila': '#C8A2C8', 'morado': '#800080',
  'celeste': '#87CEEB', 'naranja': '#FFA500', 'cafe': '#6F4E37', 'café': '#6F4E37',
  'beige': '#F5F5DC', 'crema': '#FFFDD0', 'mostaza': '#FFDB58', 'burdeo': '#800020',
  'vino': '#722F37', 'dorado': '#FFD700', 'plateado': '#C0C0C0',
};

const getColorHex = (colorName) => {
  if (!colorName) return '#ccc';
  const name = colorName.toLowerCase().trim();
  return colorHexMap[name] || '#ccc';
};

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [config, setConfig] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [itemAgregadoReciente, setItemAgregadoReciente] = useState(null);
  const [cantidadAComprar, setCantidadAComprar] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const categoriesScrollRef = useRef(null);
  const touchStartX = useRef(null);

  const scrollCategories = (dir) => {
    if (categoriesScrollRef.current) {
      categoriesScrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const t = Date.now();
      const [prendasRes, configRes, catRes] = await Promise.all([
        api.get(`/catalogo/publico/prendas/?t=${t}`),
        api.get(`/core/configuracion/publico/?t=${t}`),
        api.get(`/catalogo/publico/categorias/?t=${t}`)
      ]);
      setPrendas(prendasRes.data.results || prendasRes.data);
      setConfig(configRes.data);
      setCategorias(catRes.data.results || catRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsApp = (text = 'Hola, necesito ayuda') => {
    const num = config?.whatsapp_numero || '56912345678';
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const addToCart = () => {
    const imgUrl = getImageUrl(prendaSeleccionada.foto_url || (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes[0]?.imagen));
    if (prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0) {
      if (!varianteSeleccionada) {
        showAlert("Por favor selecciona una variante (color/talla).");
        return;
      }
      const itemToAdd = { 
        ...prendaSeleccionada, 
        varianteSeleccionada,
        cantidad: cantidadAComprar,
        imagen: imgUrl
      };
      setCartItems([...cartItems, itemToAdd]);
      setItemAgregadoReciente(itemToAdd);
    } else {
      const itemToAdd = { ...prendaSeleccionada, cantidad: cantidadAComprar, imagen: imgUrl };
      setCartItems([...cartItems, itemToAdd]);
      setItemAgregadoReciente(itemToAdd);
    }
    setSuccessModalOpen(true);
  };

  const removeFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const checkoutCart = () => {
    if (cartItems.length === 0) return;
    let text = 'Hola, quiero comprar los siguientes productos:\n\n';
    cartItems.forEach((item, idx) => {
      let varianteText = '';
      if (item.varianteSeleccionada) {
         varianteText = ` (Color: ${item.varianteSeleccionada.color || 'Único'}, Talla: ${item.varianteSeleccionada.talla || 'Única'})`;
      }
      text += `${idx + 1}. *${item.nombre}*${varianteText} x${item.cantidad} - ${formatPrice(item.precio * item.cantidad)}\n`;
    });
    const total = cartItems.reduce((acc, curr) => acc + (Number(curr.precio || 0) * curr.cantidad), 0);
    text += `\n*Total estimado: ${formatPrice(total)}*`;
    handleWhatsApp(text);
    setCartOpen(false);
    setCartItems([]);
  };

  const ultimasPrendas = prendas.slice(0, 16);

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [];
  if (config?.banner_imagen) slides.push(getImageUrl(config.banner_imagen));
  if (config?.polaroid_1_imagen) slides.push(getImageUrl(config.polaroid_1_imagen));
  if (config?.polaroid_2_imagen) slides.push(getImageUrl(config.polaroid_2_imagen));
  if (config?.polaroid_3_imagen) slides.push(getImageUrl(config.polaroid_3_imagen));
  if (slides.length === 0) slides.push("https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200");

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="pk2-root">
      {config?.marquesina_texto && (
        <div className="pk2-marquee-bar">
          <div className="pk2-marquee-content" style={{ animationDuration: `${config.marquesina_velocidad || 25}s` }}>
            {config.marquesina_texto} &nbsp; • &nbsp; {config.marquesina_texto} &nbsp; • &nbsp; {config.marquesina_texto}
          </div>
        </div>
      )}

      <nav className="pk2-navbar">
        <div className="pk2-nav-top">
          <div className="pk2-nav-left">
            <Menu size={28} className="pk2-mobile-menu-icon" onClick={() => setMobileMenuOpen(true)} />
            <div className="pk2-nav-brand-text">
              {config?.tienda_nombre || 'MindyLu'}<span>.</span>
            </div>
          </div>

          <div className="pk2-nav-center pk2-hide-mobile">
            <div className="pk2-search-bar">
              <input type="text" placeholder={`Buscar en ${config?.tienda_nombre || 'MindyLu'}...`} />
              <button><Search size={20} strokeWidth={2} /></button>
            </div>
          </div>

          <div className="pk2-nav-right">
            <div className="pk2-nav-user pk2-hide-mobile" onClick={() => showAlert('Próximamente: Portal de Clientas')}>
              <User size={24} strokeWidth={1.5} />
              <span>Inicia sesión</span>
            </div>
            <button className="pk2-icon-btn pk2-cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={26} strokeWidth={1.5} />
              {cartItems.length > 0 && <span className="pk2-cart-badge">{cartItems.length}</span>}
            </button>
          </div>
        </div>
        
        <div className="pk2-nav-bottom pk2-hide-desktop">
           <div className="pk2-search-bar-mobile">
             <input type="text" placeholder={`Buscar en ${config?.tienda_nombre || 'MindyLu'}...`} />
             <button><Search size={18} strokeWidth={2} /></button>
           </div>
        </div>
      </nav>

      <div className={`pk2-mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="pk2-mobile-sidebar-close">
          <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        <div className="pk2-mobile-links">
          <a href="#" onClick={() => setMobileMenuOpen(false)}>CATÁLOGO</a>
          <a href="#envios" onClick={() => setMobileMenuOpen(false)}>ENVÍOS</a>
          <a href="#envios" onClick={() => setMobileMenuOpen(false)}>ENTREGAS</a>
          <a href="#" onClick={() => { showAlert('Próximamente'); setMobileMenuOpen(false); }}>MI CUENTA</a>
        </div>
      </div>
      {mobileMenuOpen && <div className="pk2-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      <header className="pk2-hero-carousel">
        <div className="pk2-carousel-slides">
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              className={`pk2-carousel-slide ${idx === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
        </div>
        {slides.length > 1 && (
          <div className="pk2-carousel-controls">
            <div className="pk2-carousel-dots">
              {slides.map((_, idx) => (
                <button 
                  key={idx} 
                  className={`pk2-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                ></button>
              ))}
            </div>
          </div>
        )}
      </header>
      {/* ── Categories Strip (Falabella Style under banner) ── */}
      <section className="pk2-categories-strip">
        <div className="pk2-categories-wrapper">
          <button className="pk2-cat-arrow left" onClick={(e) => { e.preventDefault(); scrollCategories(-1); }}>
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          
          <div className="pk2-categories-horizontal-scroll" ref={categoriesScrollRef}>
            {categorias && categorias.length > 0 ? categorias.map((cat) => (
              <div key={cat.id} className="pk2-category-item" onClick={() => document.getElementById('lo-nuevo').scrollIntoView({behavior: 'smooth'})}>
                  <div className="pk2-category-img-placeholder">
                    <div className="pk2-cat-icon-wrapper">
                      {getCategoryIcon(cat.icono || 'Sparkles', { strokeWidth: 1.5, size: 28, color: 'var(--pk2-pink)' })}
                    </div>
                  </div>
                <span>{cat.nombre}</span>
              </div>
            )) : (
              <div className="pk2-category-item">
                <div className="pk2-category-img-placeholder"></div>
                <span>Próximamente...</span>
              </div>
            )}
          </div>

          <button className="pk2-cat-arrow right" onClick={(e) => { e.preventDefault(); scrollCategories(1); }}>
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {/* ── Feature Strip ── */}
      <section className="pk2-features">
        <div className="pk2-feature-item">
          <Truck size={24} strokeWidth={1.5} />
          <div><strong>ENVÍO A DOMICILIO</strong><span>sobre $40.000</span></div>
        </div>
        <div className="pk2-feature-item">
          <ShieldCheck size={24} strokeWidth={1.5} />
          <div><strong>PAGO SEGURO</strong><span>100% protegido</span></div>
        </div>
        <div className="pk2-feature-item pk2-hide-mobile">
          <MessageCircle size={24} strokeWidth={1.5} />
          <div><strong>ATENCIÓN PERSONALIZADA</strong><span>vía WhatsApp</span></div>
        </div>
      </section>

      {/* ── Catalog Grid ── */}
      <section className="pk2-latest" id="lo-nuevo">
        {isLoading ? (
          <div className="pk2-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : prendas.length === 0 ? (
          <div className="pk2-empty">Próximamente nueva colección...</div>
        ) : (
          <div className="pk2-grid">
            {ultimasPrendas.map((p) => {
              const rawUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "";
              const imgUrl = getImageUrl(rawUrl);
              const uniqueColors = p.variantes ? Array.from(new Set(p.variantes.map(v => v.color))).filter(Boolean) : [];

              return (
                <div key={p.id} className="pk2-card" onClick={() => { 
                  setPrendaSeleccionada(p); setActiveImageIndex(0); setVarianteSeleccionada(null); setCantidadAComprar(1);
                  const uniqueColors = p.variantes ? Array.from(new Set(p.variantes.map(v => v.color))).filter(Boolean) : [];
                  setColorSeleccionado(uniqueColors.length > 0 ? uniqueColors[0] : null);
                }}>
                  <div className="pk2-card-img-wrapper">
                    <ImageLoader src={imgUrl} alt={p.nombre} skeletonClass="skeleton-img" />
                    <button className="pk2-card-heart" onClick={(e) => { e.stopPropagation(); showAlert('Añadido a favoritos'); }}>
                      <Heart size={18} strokeWidth={1.5} />
                    </button>
                    {p.estado !== 'disponible' && (
                      <div className={`pk2-badge pk2-badge-${p.estado}`}>
                        {p.estado.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="pk2-card-info">
                    <p className="pk2-card-brand">{config?.tienda_nombre?.toUpperCase() || 'MINDYLU'}</p>
                    <h4>{p.nombre}</h4>
                    
                    {uniqueColors.length > 0 && (
                       <div className="pk2-card-colors">
                         {uniqueColors.map((colorName, idx) => {
                            let imgMatch = p.imagenes?.find(img => img.color?.toLowerCase() === colorName.toLowerCase());
                            if (!imgMatch && p.imagenes && p.imagenes.length > idx) {
                              imgMatch = p.imagenes[idx];
                            }
                            if (imgMatch) {
                               return <img key={idx} src={getImageUrl(imgMatch.imagen)} alt={colorName} className="pk2-card-color-dot img-dot" title={colorName} />;
                            }
                            return <span key={idx} className="pk2-card-color-dot" style={{ backgroundColor: getColorHex(colorName) }} title={colorName}></span>;
                         })}
                         {uniqueColors.length > 5 && <span className="pk2-card-color-more">+{uniqueColors.length - 5}</span>}
                       </div>
                    )}

                    <div className="pk2-card-price-row">
                      <span className="pk2-card-price">{formatPrice(p.precio)}</span>
                    </div>

                    <button className="pk2-card-add-btn" onClick={(e) => { 
                       e.stopPropagation(); setPrendaSeleccionada(p); setActiveImageIndex(0); setVarianteSeleccionada(null); setCantidadAComprar(1);
                       const uniqueColors = p.variantes ? Array.from(new Set(p.variantes.map(v => v.color))).filter(Boolean) : [];
                       setColorSeleccionado(uniqueColors.length > 0 ? uniqueColors[0] : null);
                    }}>
                       Agregar <ShoppingBag size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="pk2-footer">
        <div className="pk2-footer-content">
          <div className="pk2-footer-brand">
            <div className="pk2-footer-logo">MindyLu<span>*</span></div>
            <p>Expresa quién eres, sin decir una palabra. Tu boutique exclusiva para mujeres reales.</p>
          </div>
          <div className="pk2-footer-links-container">
            <div className="pk2-footer-links">
              <h4>AYUDA</h4>
              <a href="#">Cambios y Devoluciones</a>
              <a href="#envios">Envíos y Entregas</a>
            </div>
            <div className="pk2-footer-links">
              <h4>CONTACTO</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsApp(); }}>WhatsApp Soporte →</a>
              <a href="#">Instagram: @mindylu.cl</a>
            </div>
          </div>
        </div>
        <div className="pk2-footer-bottom">
          &copy; {new Date().getFullYear()} MindyLu Boutique. Todos los derechos reservados.
        </div>
      </footer>

      {/* ── Product Modal (Select Variant) ── */}
      {prendaSeleccionada && !successModalOpen && (
        <div className="pk2-modal-overlay" onClick={() => { setPrendaSeleccionada(null); setVarianteSeleccionada(null); setColorSeleccionado(null); setActiveImageIndex(0); }}>
          <div className="pk2-modal-content" onClick={e => e.stopPropagation()}>
            <button className="pk2-modal-close" onClick={() => { setPrendaSeleccionada(null); setVarianteSeleccionada(null); setColorSeleccionado(null); setActiveImageIndex(0); }}>
              <X size={24} strokeWidth={1.5} />
            </button>
            <div className="pk2-modal-grid">
              <div className="pk2-modal-img-container">
                {(() => {
                  let sliderImages = [];
                  if (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes.length > 0) {
                    sliderImages = prendaSeleccionada.imagenes;
                  } else if (prendaSeleccionada.foto_url) {
                    sliderImages = [{ imagen: prendaSeleccionada.foto_url, color: null }];
                  }

                  if (sliderImages.length === 0) {
                    return <div className="pk2-modal-img"><img src={getImageUrl("")} alt="Sin imagen" /></div>;
                  }

                  const handleNextImage = () => {
                    const nextIdx = (activeImageIndex + 1) % sliderImages.length;
                    handleImageChange(nextIdx, sliderImages);
                  };

                  const handlePrevImage = () => {
                    const prevIdx = (activeImageIndex - 1 + sliderImages.length) % sliderImages.length;
                    handleImageChange(prevIdx, sliderImages);
                  };

                  const handleImageChange = (index, images) => {
                    setActiveImageIndex(index);
                  };

                  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
                  const handleTouchEnd = (e) => {
                    if (!touchStartX.current) return;
                    const diff = touchStartX.current - e.changedTouches[0].clientX;
                    if (diff > 40) handleNextImage();
                    else if (diff < -40) handlePrevImage();
                    touchStartX.current = null;
                  };

                  return (
                    <div className="pk2-modal-img" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                      <ImageLoader src={getImageUrl(sliderImages[activeImageIndex]?.imagen)} alt={prendaSeleccionada.nombre} style={{ touchAction: 'pan-y', backgroundColor: '#f4f4f4' }} objectFit="contain" />
                      {sliderImages.length > 1 && (
                        <>
                          <button className="pk2-carousel-btn left" onClick={handlePrevImage}>‹</button>
                          <button className="pk2-carousel-btn right" onClick={handleNextImage}>›</button>
                          <div className="pk2-carousel-dots">
                            {sliderImages.map((_, i) => (
                              <span key={i} className={`pk2-dot ${i === activeImageIndex ? 'active' : ''}`} onClick={() => handleImageChange(i, sliderImages)} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="pk2-modal-info">
                <div className="pk2-modal-header">
                  <p className="pk2-card-brand">{config?.tienda_nombre?.toUpperCase() || 'MINDYLU'}</p>
                  <h2>{prendaSeleccionada.nombre}</h2>
                  <div className="pk2-modal-price">{formatPrice(prendaSeleccionada.precio)}</div>
                </div>
                
                {/* Variantes (Tallas y Colores Estilo Falabella) */}
                {prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 && (
                  <div className="pk2-modal-variants-falabella">
                    
                    {/* Selector de Color (Miniaturas) */}
                    {Array.from(new Set(prendaSeleccionada.variantes.map(v => v.color))).filter(Boolean).length > 0 && (
                      <div className="pk2-modal-color-selector">
                        <p className="pk2-modal-label">Color: <strong>{colorSeleccionado || 'Único'}</strong></p>
                        <div className="pk2-modal-color-thumbnails">
                          {Array.from(new Set(prendaSeleccionada.variantes.map(v => v.color))).filter(Boolean).map((col, idx) => {
                             let imgMatch = prendaSeleccionada.imagenes?.find(img => img.color?.toLowerCase() === col.toLowerCase());
                             if (!imgMatch && prendaSeleccionada.imagenes && prendaSeleccionada.imagenes.length > idx) {
                               imgMatch = prendaSeleccionada.imagenes[idx];
                             }
                             const isSelected = colorSeleccionado === col;
                             return (
                               <button 
                                 key={idx} 
                                 className={`pk2-modal-color-thumb ${isSelected ? 'selected' : ''}`}
                                 onClick={() => {
                                    setColorSeleccionado(col);
                                    setVarianteSeleccionada(null); // Limpiar talla al cambiar color
                                    if (imgMatch) {
                                      let imgIndex = prendaSeleccionada.imagenes.findIndex(img => img.color?.toLowerCase() === col.toLowerCase());
                                      if (imgIndex === -1 && prendaSeleccionada.imagenes.length > idx) {
                                        imgIndex = idx;
                                      }
                                      if (imgIndex !== -1) setActiveImageIndex(imgIndex);
                                    }
                                 }}
                                 title={col}
                               >
                                 {imgMatch ? (
                                   <img src={getImageUrl(imgMatch.imagen)} alt={col} />
                                 ) : (
                                   <span style={{ backgroundColor: getColorHex(col) }}></span>
                                 )}
                               </button>
                             );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Selector de Tallas */}
                    <div className="pk2-modal-size-selector">
                      <p className="pk2-modal-label">Elige una opción:</p>
                      <div className="pk2-variants-list">
                        {prendaSeleccionada.variantes.filter(v => v.color === colorSeleccionado || !v.color).map((v) => {
                          const agotada = v.cantidad === 0;
                          const isSelected = varianteSeleccionada?.id === v.id;
                          return (
                            <button 
                              key={v.id} 
                              className={`pk2-variant-size-pill ${agotada ? 'agotada' : ''} ${isSelected ? 'selected' : ''}`}
                              disabled={agotada}
                              onClick={() => setVarianteSeleccionada(v)}
                            >
                              {v.talla || 'Única'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                  </div>
                )}

                <div className="pk2-modal-actions-wrapper">
                  <div className="pk2-modal-qty-actions">
                    <div className="pk2-qty-selector">
                      <button onClick={() => setCantidadAComprar(Math.max(1, cantidadAComprar - 1))}>-</button>
                      <span>{cantidadAComprar}</span>
                      <button onClick={() => setCantidadAComprar(cantidadAComprar + 1)}>+</button>
                    </div>
                    <button 
                      className="pk2-btn-black pk2-btn-large"
                      onClick={addToCart}
                      disabled={prendaSeleccionada.estado !== 'disponible'}
                      style={{ flex: 1 }}
                    >
                      <ShoppingBag size={20} strokeWidth={1.5} />
                      {prendaSeleccionada.estado === 'disponible' ? 'Agregar' : 'No disponible'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal (Agregado al carro) ── */}
      {successModalOpen && itemAgregadoReciente && (
        <div className="pk2-success-overlay" onClick={() => setSuccessModalOpen(false)}>
          <div className="pk2-success-modal" onClick={e => e.stopPropagation()}>
             <button className="pk2-success-close" onClick={() => setSuccessModalOpen(false)}>
               <X size={24} />
             </button>
             <div className="pk2-success-header">
               <div className="pk2-success-icon"><Check size={28} strokeWidth={3} /></div>
               <h3>Producto agregado a tu Carro</h3>
             </div>
             
             <div className="pk2-success-body">
               <img src={getImageUrl(itemAgregadoReciente.foto_url || itemAgregadoReciente.imagenes?.[0]?.imagen)} alt="Item" />
               <div className="pk2-success-info">
                 <p className="pk2-success-brand">{config?.tienda_nombre?.toUpperCase() || 'MINDYLU'}</p>
                 <p className="pk2-success-name">{itemAgregadoReciente.nombre}</p>
                 <p className="pk2-success-price">{formatPrice(itemAgregadoReciente.precio)}</p>
                 {itemAgregadoReciente.varianteSeleccionada && (
                   <p className="pk2-success-variant">
                     Color: {itemAgregadoReciente.varianteSeleccionada.color || 'Único'} | Talla: {itemAgregadoReciente.varianteSeleccionada.talla || 'Única'}
                   </p>
                 )}
               </div>
             </div>

             <div className="pk2-success-actions">
               <button className="pk2-btn-black pk2-btn-large" onClick={() => { 
                 setSuccessModalOpen(false); 
                 setPrendaSeleccionada(null); 
                 setVarianteSeleccionada(null);
                 setColorSeleccionado(null);
                 setCartOpen(true); 
               }}>
                 Ir al Carro
               </button>
               <button className="pk2-btn-outline" onClick={() => setSuccessModalOpen(false)}>
                 Seguir comprando
               </button>
             </div>
          </div>
        </div>
      )}

      {/* ── Cart Sidebar ── */}
      <div className={`pk2-cart-sidebar ${cartOpen ? 'open' : ''}`}>
        <div className="pk2-cart-header">
          <h3>Tu Bolsa ({cartItems.length})</h3>
          <button onClick={() => setCartOpen(false)}><X size={24} /></button>
        </div>
        <div className="pk2-cart-body">
          {cartItems.length === 0 ? (
            <div className="pk2-cart-empty">
              <ShoppingBag size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
              <p>Tu bolsa está vacía</p>
              <button className="pk2-btn-black" onClick={() => setCartOpen(false)}>SEGUIR COMPRANDO</button>
            </div>
          ) : (
            <div className="pk2-cart-items-list">
              {cartItems.map((item, idx) => {
                const rawUrl = item.foto_url || (item.imagenes && item.imagenes[0]?.imagen) || "";
                const imgUrl = getImageUrl(rawUrl);
                return (
                  <div key={idx} className="pk2-cart-item">
                    <img src={imgUrl} alt={item.nombre} />
                    <div className="pk2-cart-item-info">
                      <h4>{item.nombre}</h4>
                      {item.varianteSeleccionada && (
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '2px 0 4px 0' }}>
                          Color: {item.varianteSeleccionada.color || 'Único'} | Talla: {item.varianteSeleccionada.talla || 'Única'}
                        </p>
                      )}
                      <span className="pk2-cart-item-price">{formatPrice(item.precio)}</span>
                    </div>
                    <button className="pk2-cart-item-remove" onClick={() => removeFromCart(idx)}>
                      <X size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="pk2-cart-footer">
            <div className="pk2-cart-total">
              <span>TOTAL</span>
              <span>{formatPrice(cartItems.reduce((acc, curr) => acc + Number(curr.precio || 0), 0))}</span>
            </div>
            <button className="pk2-btn-black" onClick={checkoutCart}>IR A PAGAR (WhatsApp)</button>
          </div>
        )}
      </div>
      {cartOpen && <div className="pk2-overlay" onClick={() => setCartOpen(false)}></div>}

    </div>
  );
};

export default PublicCatalog;
