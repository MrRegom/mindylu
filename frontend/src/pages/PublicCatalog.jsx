import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  ShoppingBag, X, Search, User, Heart, 
  Truck, ShieldCheck, CreditCard, RefreshCcw, MessageCircle, Menu,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import './PublicCatalog.css';
import { showAlert } from '../utils/alerts';

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

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [config, setConfig] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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
    }
  };

  const handleWhatsApp = (text = 'Hola, necesito ayuda') => {
    const num = config?.whatsapp_numero || '56912345678';
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const addToCart = (prenda) => {
    setCartItems([...cartItems, prenda]);
    showAlert("¡Agregado a la bolsa!");
    // Eliminamos el cierre automático del modal para que pueda elegir más tallas de la misma prenda
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
      text += `${idx + 1}. *${item.nombre}*${varianteText} - ${formatPrice(item.precio)}\n`;
    });
    const total = cartItems.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
    text += `\n*Total estimado: ${formatPrice(total)}*`;
    handleWhatsApp(text);
    setCartOpen(false);
    setCartItems([]);
  };

  const ultimasPrendas = prendas.slice(0, 8);

  // Fake categories for layout matching
  const categoryBubbles = [
    { name: "VESTIDOS", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=300" },
    { name: "TOPS", img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=300" },
    { name: "PANTALONES", img: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=300" },
    { name: "SETS", img: "https://images.unsplash.com/photo-1515347619152-16a7fbc266cb?auto=format&fit=crop&q=80&w=300" },
    { name: "ACCESORIOS", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=300" }
  ];

  // Carousel Logic
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Recopilar slides (banner + polaroids)
  const slides = [];
  if (config?.banner_imagen) slides.push(getImageUrl(config.banner_imagen));
  if (config?.polaroid_1_imagen) slides.push(getImageUrl(config.polaroid_1_imagen));
  if (config?.polaroid_2_imagen) slides.push(getImageUrl(config.polaroid_2_imagen));
  if (config?.polaroid_3_imagen) slides.push(getImageUrl(config.polaroid_3_imagen));
  // Si no hay ninguno, usar un placeholder
  if (slides.length === 0) slides.push("https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200");

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000); // 5 segundos por slide
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="pk2-root">
      {/* ── Marquee (Cinta Deslizante) ── */}
      {config?.marquesina_texto && (
        <div className="pk2-marquee-bar">
          <div className="pk2-marquee-content" style={{ animationDuration: `${config.marquesina_velocidad || 25}s` }}>
            {config.marquesina_texto} &nbsp; • &nbsp; {config.marquesina_texto} &nbsp; • &nbsp; {config.marquesina_texto}
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="pk2-navbar">
        <div className="pk2-nav-left">
          <Menu size={24} className="pk2-mobile-menu-icon" onClick={() => setMobileMenuOpen(true)} />
          <div className="pk2-nav-brand-text">
            {config?.tienda_nombre || 'MindyLu'}<span>.</span>
          </div>
        </div>

        <div className="pk2-nav-center">
          <a href="#">CATÁLOGO</a>
          <a href="#envios">ENVÍOS</a>
          <a href="#envios">ENTREGAS</a>
        </div>

        <div className="pk2-nav-right">
          <button className="pk2-icon-btn"><Search size={20} strokeWidth={1.5} /></button>
          <button className="pk2-icon-btn pk2-hide-mobile"><Heart size={20} strokeWidth={1.5} /></button>
          <button className="pk2-icon-btn pk2-cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartItems.length > 0 && <span className="pk2-cart-badge">{cartItems.length}</span>}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Sidebar ── */}
      <div className={`pk2-mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="pk2-mobile-sidebar-close">
          <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        <div className="pk2-mobile-links">
          <a href="#" onClick={() => setMobileMenuOpen(false)}>CATÁLOGO</a>
          <a href="#envios" onClick={() => setMobileMenuOpen(false)}>ENVÍOS</a>
          <a href="#envios" onClick={() => setMobileMenuOpen(false)}>ENTREGAS</a>
        </div>
      </div>
      {mobileMenuOpen && <div className="pk2-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* ── Hero Carousel ── */}
      <header className="pk2-hero-carousel">
        
        {/* Slides Container */}
        <div className="pk2-carousel-slides">
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              className={`pk2-carousel-slide ${idx === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            >
              <div className="pk2-hero-overlay"></div>
            </div>
          ))}
        </div>

        {/* Text Content Overlay */}
        <div className="pk2-hero-content">
          <h1>{config?.banner_titulo || 'TU ESTILO.\nTU MOMENTO.'}</h1>
          <h2 className="pk2-hero-cursive">{config?.banner_titulo_cursiva || 'Tu Mindy Lu.'}</h2>
          <p>{config?.banner_subtitulo || 'Piezas únicas para mujeres reales\nque inspiran todos los días.'}</p>
          <button className="pk2-hero-btn" onClick={() => document.getElementById('lo-nuevo').scrollIntoView({behavior: 'smooth'})}>
            DESCUBRIR COLECCIÓN →
          </button>
        </div>

        {/* Carousel Controls */}
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

      {/* ── Feature Strip ── */}
      <section className="pk2-features">
        <div className="pk2-feature-item">
          <Truck size={24} strokeWidth={1} />
          <div>
            <strong>ENVÍO A DOMICILIO</strong>
            <span>sobre $40.000</span>
          </div>
        </div>
        <div className="pk2-feature-item">
          <ShieldCheck size={24} strokeWidth={1} />
          <div>
            <strong>PAGO SEGURO</strong>
            <span>100% protegido</span>
          </div>
        </div>
        <div className="pk2-feature-item pk2-hide-mobile">
          <MessageCircle size={24} strokeWidth={1} />
          <div>
            <strong>ATENCIÓN PERSONALIZADA</strong>
            <span>escríbenos por WhatsApp</span>
          </div>
        </div>
      </section>

      {/* ── Categories Strip (Typography Only) ── */}
      <section className="pk2-categories-strip">
        <div className="pk2-section-header-inline">
          <div className="pk2-subtitle">COLECCIONES EXCLUSIVAS</div>
          <h3 className="pk2-title-main">Elige tu<br/><em>estilo</em></h3>
        </div>
        
        <div className="pk2-categories-wrapper">
          <button className="pk2-cat-arrow left" onClick={(e) => { e.preventDefault(); scrollCategories(-1); }}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="pk2-categories-horizontal-scroll" ref={categoriesScrollRef}>
            {categorias && categorias.length > 0 ? categorias.map((cat) => (
              <a href="#" key={cat.id} className="pk2-category-word">
                <span className="pk2-cursive-word">{cat.nombre}</span>
              </a>
            )) : (
              <div className="pk2-category-word">
                <span className="pk2-cursive-word">Próximamente...</span>
              </div>
            )}
          </div>

          <button className="pk2-cat-arrow right" onClick={(e) => { e.preventDefault(); scrollCategories(1); }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ── Recién Llegados ── */}
      <section className="pk2-latest" id="lo-nuevo">
        <div className="pk2-section-header">
          <div>
            <div className="pk2-subtitle">LO MÁS NUEVO</div>
            <h3 className="pk2-title-main">Recién llegados</h3>
          </div>
          <a href="#" className="pk2-link">VER TODO →</a>
        </div>

        {prendas.length === 0 ? (
          <div className="pk2-empty">Próximamente nueva colección...</div>
        ) : (
          <div className="pk2-grid">
            {ultimasPrendas.map((p) => {
              const rawUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "";
              const imgUrl = getImageUrl(rawUrl);
              return (
                <div key={p.id} className="pk2-card" onClick={() => { setPrendaSeleccionada(p); setActiveImageIndex(0); setVarianteSeleccionada(null); }}>
                  <div className="pk2-card-img-wrapper">
                    <img src={imgUrl} alt={p.nombre} />
                    <button className="pk2-card-heart" onClick={(e) => { e.stopPropagation(); /* TODO fav */ }}>
                      <Heart size={18} strokeWidth={1.5} />
                    </button>
                    {p.estado !== 'disponible' && (
                      <div className={`pk2-badge pk2-badge-${p.estado}`}>
                        {p.estado.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="pk2-card-info">
                    <h4>{p.nombre}</h4>
                    <span className="pk2-card-price">{formatPrice(p.precio)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Envíos y Entregas ── */}
      <section className="pk2-envios-section" id="envios" style={{ padding: '4rem 0', backgroundColor: '#fff' }}>
        <div className="pk2-section-header-inline" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <div className="pk2-subtitle">INFORMACIÓN DE</div>
          <h3 className="pk2-title-main">Envíos y Entregas</h3>
        </div>
        
        <div className="pk2-shipping-container">
          <div className="pk2-shipping-track">
            {(config?.envios_texto || "Envíos a Viña del Mar $2500\nValparaíso $2500\nCurauma Placilla $2500\nQuilpué Villa Alemana $2500\n\nRegiones envío por Starken por pagar")
              .split('\n')
              .filter(line => line.trim() !== '')
              .map((line, i) => {
                let title = line;
                let price = '';
                if (line.includes('$')) {
                  const parts = line.split('$');
                  title = parts[0].trim();
                  price = '$' + parts[1].trim();
                } else if (line.toLowerCase().includes('por pagar')) {
                  title = line.replace(/por pagar/i, '').trim();
                  price = 'Por Pagar';
                }
                return (
                  <div key={i} className="pk2-shipping-card">
                    <div className="pk2-shipping-icon">
                      <Truck size={28} strokeWidth={1.5} />
                    </div>
                    <h4 className="pk2-shipping-title">{title.replace(/Envíos a /i, '')}</h4>
                    {price && <p className="pk2-shipping-price">Cargo: {price}</p>}
                  </div>
                );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer Estilo Revista (Dark & Elegant) ── */}
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
              <a href="#">Envíos y Entregas</a>
              <a href="#">Términos y Condiciones</a>
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

      {/* ── Product Modal (Luxury Redesign) ── */}
      {prendaSeleccionada && (
        <div className="pk2-modal-overlay" onClick={() => { setPrendaSeleccionada(null); setVarianteSeleccionada(null); setActiveImageIndex(0); }}>
          <div className="pk2-modal-content" onClick={e => e.stopPropagation()}>
            <button className="pk2-modal-close" onClick={() => { setPrendaSeleccionada(null); setVarianteSeleccionada(null); setActiveImageIndex(0); }}>
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
                    const imgObj = images[index];
                    if (imgObj && imgObj.color && prendaSeleccionada.variantes) {
                      const match = prendaSeleccionada.variantes.find(v => v.color && v.color.toLowerCase() === imgObj.color.toLowerCase() && v.cantidad > 0);
                      if (match) setVarianteSeleccionada(match);
                    }
                  };

                  const handleTouchStart = (e) => {
                    touchStartX.current = e.touches[0].clientX;
                  };

                  const handleTouchEnd = (e) => {
                    if (!touchStartX.current) return;
                    const touchEnd = e.changedTouches[0].clientX;
                    const diff = touchStartX.current - touchEnd;
                    if (diff > 40) {
                      handleNextImage();
                    } else if (diff < -40) {
                      handlePrevImage();
                    }
                    touchStartX.current = null;
                  };

                  return (
                    <div className="pk2-modal-img" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                      <img src={getImageUrl(sliderImages[activeImageIndex]?.imagen)} alt={prendaSeleccionada.nombre} style={{ touchAction: 'pan-y' }} />
                      
                      {sliderImages.length > 1 && (
                        <>
                          <button className="pk2-carousel-btn left" onClick={handlePrevImage}>‹</button>
                          <button className="pk2-carousel-btn right" onClick={handleNextImage}>›</button>
                          <div className="pk2-carousel-dots">
                            {sliderImages.map((_, i) => (
                              <span 
                                key={i} 
                                className={`pk2-dot ${i === activeImageIndex ? 'active' : ''}`}
                                onClick={() => handleImageChange(i, sliderImages)}
                              />
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
                  <h2>{prendaSeleccionada.nombre}</h2>
                  <div className="pk2-modal-price">{formatPrice(prendaSeleccionada.precio)}</div>
                </div>
                
                {prendaSeleccionada.descripcion && (
                  <p className="pk2-modal-desc">
                    {prendaSeleccionada.descripcion}
                  </p>
                )}
                
                {/* Variantes (Tallas y Colores) */}
                {prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 && (
                  <div className="pk2-modal-variants">
                    <h4 className="pk2-variants-title">Selecciona tu opción:</h4>
                    <div className="pk2-variants-list">
                      {prendaSeleccionada.variantes.map((v) => {
                        const agotada = v.cantidad === 0;
                        const isSelected = varianteSeleccionada?.id === v.id;
                        return (
                          <button 
                            key={v.id} 
                            className={`pk2-variant-pill ${agotada ? 'agotada' : ''}`}
                            style={{ 
                              border: isSelected ? '2px solid var(--color-primary)' : '', 
                              background: isSelected ? 'rgba(251, 165, 181, 0.1)' : '' 
                            }}
                            disabled={agotada}
                            onClick={() => {
                              setVarianteSeleccionada(v);
                              if (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes.length > 0 && v.color) {
                                const matchingImgIndex = prendaSeleccionada.imagenes.findIndex(img => img.color && img.color.toLowerCase() === v.color.toLowerCase());
                                if (matchingImgIndex !== -1) setActiveImageIndex(matchingImgIndex);
                              }
                            }}
                          >
                            <span className="pk2-v-color">{v.color || 'Único'}</span>
                            {v.talla && <span className="pk2-v-divider">|</span>}
                            {v.talla && <span className="pk2-v-size">Talla: {v.talla}</span>}
                            <span className="pk2-v-divider">|</span>
                            <span className="pk2-v-stock">Stock: {v.cantidad}</span>
                            {agotada && <span className="pk2-v-out"> (Agotado)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pk2-modal-actions">
                  <button 
                    className="pk2-btn-black"
                    onClick={() => {
                      if (prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0) {
                        if (!varianteSeleccionada) {
                          showAlert("Por favor selecciona una variante (color/talla).");
                          return;
                        }
                        addToCart({...prendaSeleccionada, varianteSeleccionada: varianteSeleccionada});
                      } else {
                        addToCart(prendaSeleccionada);
                      }
                    }}
                    disabled={prendaSeleccionada.estado !== 'disponible'}
                  >
                    <ShoppingBag size={18} strokeWidth={1.5} />
                    {prendaSeleccionada.estado === 'disponible' ? 'AGREGAR AL CARRITO' : 'NO DISPONIBLE'}
                  </button>
                  <button className="pk2-btn-outline" onClick={() => {
                    if (prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 && !varianteSeleccionada) {
                      showAlert("Por favor selecciona una variante (color/talla) para consultar.");
                      return;
                    }
                    const varText = varianteSeleccionada ? ` (Opción: ${varianteSeleccionada.color || ''} ${varianteSeleccionada.talla || ''})` : '';
                    handleWhatsApp(`Hola, me encantó esta prenda: ${prendaSeleccionada.nombre}${varText}. ¿Me das más detalles?`)
                  }}>
                    <MessageCircle size={18} strokeWidth={1.5} />
                    CONSULTAR
                  </button>
                </div>
              </div>
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
