import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { LuBot } from '../components/LuBot';

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prendas, setPrendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [config, setConfig] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [itemAgregadoReciente, setItemAgregadoReciente] = useState(null);
  const [cantidadAComprar, setCantidadAComprar] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [coloresLista, setColoresLista] = useState([]);

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

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Escuchar si venimos de la vista de detalle con intención de agregar al carro
  useEffect(() => {
    const pendingItemStr = localStorage.getItem('pendingCartItem');
    if (pendingItemStr && searchParams.get('cart') === 'open') {
      try {
        const itemToAdd = JSON.parse(pendingItemStr);
        setCartItems(prev => {
          const existingItemIndex = prev.findIndex(item => {
            if (item.id !== itemToAdd.id) return false;
            if (item.varianteSeleccionada && itemToAdd.varianteSeleccionada) {
               return item.varianteSeleccionada.id === itemToAdd.varianteSeleccionada.id;
            }
            return true;
          });
          if (existingItemIndex >= 0) {
            const newCart = [...prev];
            newCart[existingItemIndex].cantidad += itemToAdd.cantidad;
            return newCart;
          } else {
            return [...prev, itemToAdd];
          }
        });
        setItemAgregadoReciente(itemToAdd);
        setSuccessModalOpen(true);
      } catch (e) {}
      localStorage.removeItem('pendingCartItem');
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const t = Date.now();
      const [prendasRes, configRes, catRes, coloresRes] = await Promise.all([
        api.get(`/catalogo/publico/prendas/?t=${t}`),
        api.get(`/core/configuracion/publico/?t=${t}`),
        api.get(`/catalogo/publico/categorias/?t=${t}`),
        api.get(`/catalogo/publico/colores/?t=${t}`)
      ]);
      setPrendas(prendasRes.data.results || prendasRes.data);
      setConfig(configRes.data);
      setCategorias(catRes.data.results || catRes.data);
      setColoresLista(coloresRes.data.results || coloresRes.data);
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
    let itemToAdd = { ...prendaSeleccionada, cantidad: cantidadAComprar, imagen: imgUrl };

    if (prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0) {
      if (!varianteSeleccionada) {
        showAlert("Por favor selecciona una variante (color/talla).");
        return;
      }
      itemToAdd.varianteSeleccionada = varianteSeleccionada;
    }

    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => {
        if (item.id !== itemToAdd.id) return false;
        if (item.varianteSeleccionada && itemToAdd.varianteSeleccionada) {
           return item.varianteSeleccionada.id === itemToAdd.varianteSeleccionada.id;
        }
        return true;
      });
      
      if (existingItemIndex >= 0) {
        const newCart = [...prev];
        newCart[existingItemIndex].cantidad += itemToAdd.cantidad;
        return newCart;
      } else {
        return [...prev, itemToAdd];
      }
    });

    setItemAgregadoReciente(itemToAdd);
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
      text += `${idx + 1}. *${item.nombre}*${varianteText} x${item.cantidad} - ${formatPrice(item.precio * item.cantidad)} (Ref: #${item.id})\n`;
    });
    const total = cartItems.reduce((acc, curr) => acc + (Number(curr.precio || 0) * curr.cantidad), 0);
    text += `\n*Total estimado: ${formatPrice(total)}*`;
    handleWhatsApp(text);
    setCartOpen(false);
    setCartItems([]);
  };

  const prendasFiltradas = categoriaActiva 
    ? prendas.filter(p => p.categoria?.id === categoriaActiva || p.categoria === categoriaActiva)
    : prendas;
    
  const ultimasPrendas = prendasFiltradas.slice(0, 16);

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
      {/* ── Categories Strip (Marquee Style) ── */}
      <section className="pk2-categories-strip">
        <div className="pk2-categories-wrapper">
          <div className="pk2-categories-marquee" ref={categoriesScrollRef}>
            <div className="pk2-categories-track">
              {categorias && categorias.length > 0 ? [...categorias, ...categorias].map((cat, index) => (
                <div 
                  key={`${cat.id}-${index}`} 
                  className={`pk2-category-item ${categoriaActiva === cat.id ? 'active' : ''}`} 
                  onClick={() => {
                    setCategoriaActiva(prev => prev === cat.id ? null : cat.id);
                    document.getElementById('lo-nuevo').scrollIntoView({behavior: 'smooth'});
                  }}
                >
                    <div className="pk2-category-img-placeholder">
                      <div className="pk2-cat-icon-wrapper">
                        {getCategoryIcon(cat.icono || 'Sparkles', { strokeWidth: 1.5, size: 28, color: categoriaActiva === cat.id ? '#ffffff' : 'var(--pk2-pink)' })}
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
          </div>
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
        ) : ultimasPrendas.length === 0 ? (
          <div className="pk2-empty">No hay productos en esta categoría por ahora...</div>
        ) : (
          <div className="pk2-grid">
            {ultimasPrendas.map((p) => {
              const rawUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "";
              const imgUrl = getImageUrl(rawUrl);
              const uniqueColors = p.variantes ? Array.from(new Set(p.variantes.map(v => v.color))).filter(Boolean) : [];

              return (
                <div key={p.id} className="pk2-card" onClick={() => navigate(`/producto/${p.id}`)}>
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
                    <h4>{p.nombre}</h4>
                    
                    {uniqueColors.length > 0 && (
                       <div className="pk2-card-colors">
                         {uniqueColors.map((colorName, idx) => {
                            const colorData = coloresLista.find(c => c.nombre.toLowerCase() === colorName.toLowerCase());
                            const hexCode = colorData?.hex_code || getColorHex(colorName);
                            
                            return <span key={idx} className="pk2-card-color-dot" style={{ backgroundColor: hexCode }} title={colorName}></span>;
                         })}
                         {uniqueColors.length > 5 && <span className="pk2-card-color-more">+{uniqueColors.length - 5}</span>}
                       </div>
                    )}

                    <div className="pk2-card-price-row">
                      <span className="pk2-card-price">{formatPrice(p.precio)}</span>
                    </div>

                    <button className="pk2-card-add-btn" onClick={(e) => { 
                       e.stopPropagation(); 
                       navigate(`/producto/${p.id}`);
                    }}>
                       Ver Detalles
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

      {/* Product Modal removed */}

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

      <LuBot phoneNumber={config?.whatsapp_contacto || "56912345678"} />
    </div>
  );
};

export default PublicCatalog;
