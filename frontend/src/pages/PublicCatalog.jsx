import React, { useEffect, useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight, Truck, Lock, CreditCard, RefreshCw, Plus } from 'lucide-react';
import api from '../services/api';
import './PublicCatalog.css';

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [config, setConfig] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  
  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchCatalogo();
    fetchConfig();
  }, []);

  const fetchCatalogo = async () => {
    try {
      const res = await api.get('/catalogo/prendas/');
      setPrendas(res.data.filter(p => p.estado !== 'oculta'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/core/configuracion/');
      setConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '$0';
    return `$${Number(price).toLocaleString('es-CL')}`;
  };

  const handleWhatsApp = (text = 'Hola, necesito ayuda con la tienda') => {
    const num = config?.whatsapp || '56912345678';
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const addToCart = (prenda) => {
    setCartItems([...cartItems, prenda]);
    setPrendaSeleccionada(null); // Close modal
    setCartOpen(true); // Open cart sidebar
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
      text += `${idx + 1}. ${item.nombre} - ${formatPrice(item.precio)}\n`;
    });
    const total = cartItems.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
    text += `\nTotal estimado: ${formatPrice(total)}`;
    handleWhatsApp(text);
    setCartOpen(false);
    setCartItems([]);
  };

  const ultimasPrendas = prendas.slice(0, 4);

  return (
    <div className="pk-root">
      
      {/* ── Navbar ── */}
      <nav className="pk-navbar">
        <div className="pk-nav-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} strokeWidth={1.5} />
        </div>
        
        {/* Logo Textual Elegante MindyLu */}
        <div className="pk-logo-container">
          Mindy<span className="pk-logo-script">Lu</span>
        </div>

        <ul className="pk-nav-links pk-hide-mobile">
          <li><a href="#">NUEVO</a></li>
          <li><a href="#catalogo">ROPA</a></li>
          <li><a href="#catalogo">BEST SELLERS</a></li>
          <li><a href="#catalogo">ACCESORIOS</a></li>
          <li><a href="#" className="pk-sale-text">SALE</a></li>
        </ul>

        <div className="pk-nav-icons">
          <Search size={22} strokeWidth={1.2} className="pk-hide-mobile" />
          <User size={22} strokeWidth={1.2} className="pk-hide-mobile" />
          <Heart size={22} strokeWidth={1.2} className="pk-hide-mobile" />
          <div className="pk-cart-icon" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={22} strokeWidth={1.2} />
            {cartItems.length > 0 && <span className="pk-cart-badge">{cartItems.length}</span>}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="pk-mobile-menu">
          <div className="pk-mobile-menu-header">
            <div className="pk-logo-container">Mindy<span className="pk-logo-script">Lu</span></div>
            <X size={28} strokeWidth={1} onClick={() => setMobileMenuOpen(false)} style={{ cursor: 'pointer' }} />
          </div>
          <ul className="pk-mobile-links">
            <li onClick={() => setMobileMenuOpen(false)}><a href="#">NUEVO</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ROPA</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">BEST SELLERS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ACCESORIOS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#" className="pk-sale-text">SALE</a></li>
          </ul>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className="pk-hero">
        {config?.banner_imagen ? (
          <>
            <img src={config.banner_imagen} alt="Mindy Lu Banner" className="pk-hero-bg" />
            <div className="pk-hero-overlay"></div>
          </>
        ) : (
          <div className="pk-hero-bg pk-hero-gradient"></div>
        )}

        <div className="pk-hero-content pk-animate-fade-in">
          <div className="pk-hero-text">
            <div className="pk-hero-subtitle">N U E V A &nbsp;&nbsp;C O L E C C I Ó N</div>
            <h1 className="pk-hero-title">
              Expresa<br/>
              quién eres,<br/>
              <span className="pk-hero-title-script">sin decir una palabra.</span>
            </h1>
            <button className="pk-btn-hero" onClick={() => document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>
              DESCUBRIR COLECCIÓN <Plus size={14} strokeWidth={2} style={{marginLeft: '10px'}} />
            </button>
          </div>

          <div className="pk-hero-stamp pk-hide-mobile">
            <div className="pk-stamp-circle">
              <svg viewBox="0 0 100 100">
                <path id="curve" fill="transparent" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
                <text>
                  <textPath href="#curve" startOffset="0">
                    COLLECT MOMENTS, NOT THINGS •
                  </textPath>
                </text>
              </svg>
              <span className="pk-stamp-face">☺</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Circular Categories ── */}
      <section className="pk-circular-categories pk-animate-slide-up">
        <div className="pk-cats-wrapper">
          <div className="pk-cat-circle-item">
            <div className="pk-circle-icon"><img src="https://cdn-icons-png.flaticon.com/512/1785/1785255.png" alt="Vestidos" /></div>
            <span>VESTIDOS</span>
          </div>
          <div className="pk-cat-circle-item">
            <div className="pk-circle-icon"><img src="https://cdn-icons-png.flaticon.com/512/2806/2806085.png" alt="Tops" /></div>
            <span>TOPS</span>
          </div>
          <div className="pk-cat-circle-item">
            <div className="pk-circle-icon"><img src="https://cdn-icons-png.flaticon.com/512/2806/2806019.png" alt="Pantalones" /></div>
            <span>PANTALONES</span>
          </div>
          <div className="pk-cat-circle-item">
            <div className="pk-circle-icon"><img src="https://cdn-icons-png.flaticon.com/512/2806/2806041.png" alt="Sets" /></div>
            <span>SETS</span>
          </div>
          <div className="pk-cat-circle-item pk-hide-mobile">
            <div className="pk-circle-icon"><img src="https://cdn-icons-png.flaticon.com/512/2806/2806115.png" alt="Accesorios" /></div>
            <span>ACCESORIOS</span>
          </div>
        </div>
        <div className="pk-cat-ver-todo pk-hide-mobile">
          VER TODO <ArrowRight size={14} strokeWidth={1} style={{marginLeft: '6px'}}/>
        </div>
      </section>

      {/* ── Features Bar (Soft Rounded Rectangle) ── */}
      <section className="pk-features-container pk-animate-slide-up">
        <div className="pk-features-bar-box">
          <div className="pk-feature">
            <Truck size={24} strokeWidth={1.2} />
            <div className="pk-feature-text">
              <strong>ENVÍO GRATIS</strong>
              <span>En compras sobre $40.000</span>
            </div>
          </div>
          <div className="pk-feature">
            <Lock size={24} strokeWidth={1.2} />
            <div className="pk-feature-text">
              <strong>PAGO SEGURO</strong>
              <span>100% protegido</span>
            </div>
          </div>
          <div className="pk-feature pk-hide-mobile">
            <CreditCard size={24} strokeWidth={1.2} />
            <div className="pk-feature-text">
              <strong>3 CUOTAS</strong>
              <span>Sin interés</span>
            </div>
          </div>
          <div className="pk-feature pk-hide-mobile">
            <RefreshCw size={24} strokeWidth={1.2} />
            <div className="pk-feature-text">
              <strong>CAMBIOS FÁCILES</strong>
              <span>En todos nuestros productos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lo Nuevo Que Amarás (Latest Real Products) ── */}
      <section id="catalogo" className="pk-lo-nuevo pk-animate-slide-up">
        <div className="pk-lo-nuevo-header">
          <div className="pk-lo-nuevo-titles">
            <span className="pk-new-in">L O &nbsp;&nbsp;N U E V O</span>
            <h2>Lo nuevo<br/>que amarás</h2>
            <p className="pk-new-subtitle">PIEZAS ÚNICAS PARA<br/>TODA OCASIÓN</p>
          </div>
          <div className="pk-lo-nuevo-action pk-hide-mobile">
            <button className="pk-link-btn" onClick={() => document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>
              VER TODO <ArrowRight size={14} strokeWidth={1} style={{marginLeft: '6px'}}/>
            </button>
          </div>
        </div>

        <div className="pk-products-grid">
          {ultimasPrendas.map((p) => {
            const imgUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
            return (
              <div key={p.id} className="pk-product-card" onClick={() => setPrendaSeleccionada(p)}>
                <div className="pk-product-img-box">
                  <img src={imgUrl} alt={p.nombre} />
                  <button className="pk-heart-btn" onClick={(e) => { e.stopPropagation(); }}><Heart size={18} strokeWidth={1} /></button>
                </div>
                <div className="pk-product-info">
                  <h3 className="pk-product-title">{p.nombre.toUpperCase()}</h3>
                  <p className="pk-product-price">{formatPrice(p.precio)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pk-footer">
        <div className="pk-footer-inner">
          <div className="pk-footer-col">
            <div className="pk-logo-container" style={{ fontSize: '2rem', marginBottom: '15px' }}>Mindy<span className="pk-logo-script">Lu</span></div>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Expresa quién eres, sin decir una palabra. Tu boutique exclusiva para mujeres reales.</p>
          </div>
          <div className="pk-footer-col">
            <h4>AYUDA</h4>
            <ul>
              <li>Cambios y Devoluciones</li>
              <li>Envíos y Entregas</li>
              <li>Términos y Condiciones</li>
            </ul>
          </div>
          <div className="pk-footer-col">
            <h4>CONTACTO</h4>
            <ul>
              <li onClick={() => handleWhatsApp()} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                WhatsApp Soporte <ArrowRight size={12} strokeWidth={1}/>
              </li>
              <li>Instagram: @mindylu.cl</li>
            </ul>
          </div>
        </div>
      </footer>

      {/* ── Modal de Detalle (FIXED SIZE) ── */}
      {prendaSeleccionada && (
        <div className="pk-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setPrendaSeleccionada(null) }}>
          <div className="pk-modal-content">
            <button className="pk-modal-close" onClick={() => setPrendaSeleccionada(null)}><X size={24} strokeWidth={1.5}/></button>
            
            <div className="pk-modal-grid">
              <div className="pk-modal-img">
                <img 
                  src={prendaSeleccionada.foto_url || (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes[0]?.imagen) || ""} 
                  alt={prendaSeleccionada.nombre} 
                />
              </div>
              <div className="pk-modal-info">
                <div className="pk-modal-tag">NEW IN</div>
                <h2 className="pk-modal-title">{prendaSeleccionada.nombre.toUpperCase()}</h2>
                <div className="pk-modal-price">{formatPrice(prendaSeleccionada.precio)}</div>
                
                <div className="pk-modal-desc-box">
                  <p>Añade un toque de magia a tu colección. Esta prenda fue elegida pensando en tu comodidad y elegancia. ¡No te quedes sin la tuya!</p>
                </div>

                <div className="pk-modal-variants">
                  <h4>Opciones:</h4>
                  {prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 ? (
                    <div className="pk-variants-list">
                      {prendaSeleccionada.variantes.map(v => (
                        <div key={v.id} className="pk-variant-tag">
                          {v.color || 'Único'} {v.talla ? `/ ${v.talla}` : ''}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pk-variant-tag">Talla estándar única</div>
                  )}
                </div>

                <button className="pk-btn-hero pk-btn-full" onClick={() => addToCart(prendaSeleccionada)}>
                  AÑADIR AL CARRITO 🛍️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Sidebar ── */}
      {cartOpen && (
        <>
          <div className="pk-cart-overlay" onClick={() => setCartOpen(false)}></div>
          <div className="pk-cart-sidebar">
            <div className="pk-cart-header">
              <h3>TU CARRITO</h3>
              <X size={24} strokeWidth={1.5} onClick={() => setCartOpen(false)} style={{cursor: 'pointer'}} />
            </div>
            
            <div className="pk-cart-body">
              {cartItems.length === 0 ? (
                <div className="pk-cart-empty">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p>Tu carrito está vacío</p>
                  <button className="pk-btn-outline" onClick={() => setCartOpen(false)}>SEGUIR COMPRANDO</button>
                </div>
              ) : (
                <div className="pk-cart-items-list">
                  {cartItems.map((item, idx) => {
                    const imgUrl = item.foto_url || (item.imagenes && item.imagenes[0]?.imagen) || "";
                    return (
                      <div key={idx} className="pk-cart-item">
                        <img src={imgUrl} alt={item.nombre} />
                        <div className="pk-cart-item-info">
                          <h4>{item.nombre.toUpperCase()}</h4>
                          <p>{formatPrice(item.precio)}</p>
                        </div>
                        <X size={18} strokeWidth={1.5} style={{cursor:'pointer', color:'#999'}} onClick={() => removeFromCart(idx)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="pk-cart-footer">
                <div className="pk-cart-total">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartItems.reduce((acc, curr) => acc + Number(curr.precio || 0), 0))}</span>
                </div>
                <p className="pk-cart-tax-note">Impuestos y envíos calculados al finalizar la compra.</p>
                <button className="pk-btn-hero pk-btn-full" onClick={checkoutCart}>
                  COMPRAR POR WHATSAPP 💖
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default PublicCatalog;
