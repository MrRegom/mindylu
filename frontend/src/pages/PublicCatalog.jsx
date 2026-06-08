import React, { useEffect, useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight, Truck, Lock, CreditCard, RefreshCw, HeadphonesIcon } from 'lucide-react';
import api from '../services/api';
import './PublicCatalog.css';

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [config, setConfig] = useState(null);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Mindy Lu - Boutique Oficial";
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    try {
      const { data } = await api.get('/catalogo/publico/prendas/');
      const items = data.results || data;
      const activas = items.filter(p => p.estado !== 'VENDIDO');
      setPrendas(activas.length > 0 ? activas : items);
      
      const confRes = await api.get('/core/configuracion/publico/');
      setConfig(confRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatPrice = (price) => {
    return '$' + parseInt(price || 0).toLocaleString('es-CL');
  };

  const handleWhatsApp = (prenda = null) => {
    const num = config?.telefono_whatsapp || '56912345678';
    let text = "Hola, necesito ayuda con mi compra en Mindy Lu 💖";
    if (prenda) {
      text = `Hola! Me encantó la prenda: ${prenda.nombre} a ${formatPrice(prenda.precio)}. ¿Tienen disponibilidad? ✨`;
    }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const categoriasDestacadas = [
    { nombre: 'VESTIDOS', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600' },
    { nombre: 'PANTALONES', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600' },
    { nombre: 'TOPS', img: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3db8?auto=format&fit=crop&q=80&w=600' },
    { nombre: 'SETS', img: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=600' }
  ];

  return (
    <div className="pk-root">
      
      {/* ── Top Announcement Bar ── */}
      <div className="pk-top-bar">
        <div className="pk-top-bar-item">
          <Truck size={14} /> ENVÍO GRATIS EN COMPRAS SOBRE $40.000
        </div>
        <div className="pk-top-bar-item pk-hide-mobile">
          <CreditCard size={14} /> 3 CUOTAS SIN INTERÉS
        </div>
        <div className="pk-top-bar-item pk-hide-mobile">
          <RefreshCw size={14} /> CAMBIOS FÁCILES
        </div>
      </div>

      {/* ── Navbar ── */}
      <nav className="pk-navbar">
        <div className="pk-nav-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} strokeWidth={1} />
        </div>
        
        {/* Logo Textual Elegante MindyLu */}
        <div className="pk-logo-container">
          Mindy<span className="pk-logo-script">Lu</span>
        </div>

        <ul className="pk-nav-links">
          <li><a href="#">NUEVO</a></li>
          <li><a href="#catalogo">ROPA</a></li>
          <li><a href="#catalogo">BEST SELLERS</a></li>
          <li><a href="#catalogo">ACCESORIOS</a></li>
          <li><a href="#" className="pk-sale-text">SALE</a></li>
        </ul>

        <div className="pk-nav-icons">
          <Search size={20} strokeWidth={1.2} className="pk-hide-mobile" />
          <User size={20} strokeWidth={1.2} className="pk-hide-mobile" />
          <Heart size={20} strokeWidth={1.2} className="pk-hide-mobile" />
          <div className="pk-cart-icon">
            <ShoppingBag size={20} strokeWidth={1.2} />
            <span className="pk-cart-badge">2</span>
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
          <img src={config.banner_imagen} alt="Mindy Lu Banner" className="pk-hero-bg" />
        ) : (
          <div className="pk-hero-bg pk-hero-placeholder">
            <span>Sube tu foto de portada en Ajustes &gt; Apariencia</span>
          </div>
        )}
        <div className="pk-hero-overlay"></div>

        <div className="pk-hero-content">
          <div className="pk-hero-text">
            <div className="pk-hero-subtitle">Nueva colección</div>
            <h1 className="pk-hero-title">
              EXPRESA<br/>
              QUIÉN ERES,<br/>
              <span className="pk-hero-title-script">sin decir</span><br/>
              <span className="pk-hero-title-script">una palabra.</span>
            </h1>
            <button className="pk-btn-primary" onClick={() => document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>
              DESCUBRIR COLECCIÓN <ArrowRight size={14} strokeWidth={1.5} style={{marginLeft: '10px'}} />
            </button>
          </div>

          <div className="pk-hero-stamp pk-hide-mobile">
            <div className="pk-stamp-circle">
              <svg viewBox="0 0 100 100">
                <path id="curve" fill="transparent" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
                <text>
                  <textPath href="#curve" startOffset="0">
                    PARA MUJERES REALES • QUE ROMPEN REGLAS •
                  </textPath>
                </text>
              </svg>
              <span className="pk-stamp-year">'24</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Bar ── */}
      <section className="pk-features-bar">
        <div className="pk-feature">
          <Truck size={24} strokeWidth={1} />
          <div className="pk-feature-text">
            <strong>ENVÍO GRATIS</strong>
            <span>sobre $40.000</span>
          </div>
        </div>
        <div className="pk-feature">
          <Lock size={24} strokeWidth={1} />
          <div className="pk-feature-text">
            <strong>PAGO SEGURO</strong>
            <span>100% protegido</span>
          </div>
        </div>
        <div className="pk-feature">
          <CreditCard size={24} strokeWidth={1} />
          <div className="pk-feature-text">
            <strong>3 CUOTAS</strong>
            <span>sin interés</span>
          </div>
        </div>
        <div className="pk-feature pk-hide-mobile">
          <RefreshCw size={24} strokeWidth={1} />
          <div className="pk-feature-text">
            <strong>CAMBIOS</strong>
            <span>fáciles</span>
          </div>
        </div>
        <div className="pk-feature pk-hide-mobile">
          <HeadphonesIcon size={24} strokeWidth={1} />
          <div className="pk-feature-text">
            <strong>ATENCIÓN</strong>
            <span>personalizada</span>
          </div>
        </div>
      </section>

      {/* ── Lo Nuevo Que Amarás (Categories/Products) ── */}
      <section className="pk-lo-nuevo">
        <div className="pk-lo-nuevo-sidebar">
          <span className="pk-new-in">NEW IN</span>
          <h2>LO NUEVO<br/>QUE AMARÁS</h2>
          <button className="pk-link-btn">Ver todo <ArrowRight size={14} strokeWidth={1} /></button>
        </div>

        <div className="pk-categories-grid">
          {categoriasDestacadas.map((cat, idx) => (
            <div key={idx} className="pk-cat-card" onClick={() => document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>
              <img src={cat.img} alt={cat.nombre} />
              <div className="pk-cat-card-overlay">
                <h3>{cat.nombre}</h3>
                <span className="pk-cat-card-link">Ver todo <ArrowRight size={12} strokeWidth={1} /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catálogo Real (MindyLu Products) ── */}
      <section id="catalogo" className="pk-real-products">
        <div className="pk-section-title-center">
          <span className="pk-new-in">CATÁLOGO</span>
          <h2>NUESTRAS PRENDAS</h2>
        </div>

        <div className="pk-products-grid">
          {prendas.length > 0 ? (
            prendas.map((p, idx) => {
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
            })
          ) : (
            <div className="pk-empty-state">No hay prendas disponibles.</div>
          )}
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

      {/* ── Bottom Mobile Action Bar (Pink) ── */}
      <div className="pk-bottom-mobile-bar">
        <div className="pk-bottom-item">
          <Truck size={20} strokeWidth={1.2}/>
          <span>ENVÍOS</span>
          <small>sobre $40.000</small>
        </div>
        <div className="pk-bottom-item">
          <Lock size={20} strokeWidth={1.2}/>
          <span>PAGO</span>
          <small>seguro</small>
        </div>
        <div className="pk-bottom-item" onClick={() => handleWhatsApp()}>
          <HeadphonesIcon size={20} strokeWidth={1.2}/>
          <span>AYUDA</span>
          <small>WhatsApp</small>
        </div>
      </div>

      {/* ── Modal de Detalle (Organic style) ── */}
      {prendaSeleccionada && (
        <div className="pk-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setPrendaSeleccionada(null) }}>
          <div className="pk-modal-content">
            <button className="pk-modal-close" onClick={() => setPrendaSeleccionada(null)}><X size={24} strokeWidth={1}/></button>
            
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

                <button className="pk-btn-primary pk-btn-full" onClick={() => handleWhatsApp(prendaSeleccionada)}>
                  LO QUIERO 💖 <ArrowRight size={14} strokeWidth={1} style={{marginLeft: '10px'}} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublicCatalog;
