import React, { useEffect, useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronRight, ChevronLeft, Truck, Lock, Phone } from 'lucide-react';
import api from '../services/api';
import './PublicCatalog.css';

// --- Custom SVGs ---
const SparkleIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="24" height="24">
    <path d="M12 2L13.5 9L21 10.5L13.5 12L12 19L10.5 12L3 10.5L10.5 9L12 2Z" />
  </svg>
);

const HeartOutline = ({ size=18, color="currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke={color} strokeWidth="1.5" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

// Categorías Icons
const IconVestido = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M7 6L8 3H16L17 6L19 12V21H5V12L7 6Z"/><path d="M8 6H16"/><path d="M10 3V6"/><path d="M14 3V6"/></svg>;
const IconTop = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M6 5L9 3H15L18 5L20 12H16C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12H4L6 5Z"/></svg>;
const IconPantalon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M7 3H17L19 21H13L12 11L11 21H5L7 3Z"/></svg>;
const IconSet = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M8 3H16L18 6L16 11H8L6 6L8 3Z"/><path d="M7 13H17L18 21H13L12 16L11 21H6L7 13Z"/></svg>;
const IconBolsa = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8"/></svg>;

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [config, setConfig] = useState(null);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Mindy Lu - Boutique";
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

  const getPrendaImg = (index) => {
    if (!prendas || !prendas[index]) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
    const p = prendas[index];
    return p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
  };

  const prendasFiltradas = categoriaActiva === 'Todos' 
    ? prendas 
    : prendas.filter(p => p.categoria && p.categoria.toLowerCase().includes(categoriaActiva.toLowerCase()));

  const formatPrice = (price) => {
    return '$' + parseInt(price || 0).toLocaleString('es-CL');
  };

  const handleWhatsApp = (prenda = null) => {
    const num = config?.telefono_whatsapp || '56912345678';
    let text = "Hola, necesito ayuda con mi compra en Mindy Lu.";
    if (prenda) {
      text = `Hola, me interesa la prenda: ${prenda.nombre} a ${formatPrice(prenda.precio)}. ¿Tienen disponibilidad?`;
    }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const catIcons = [
    { label: 'Vestidos', icon: <IconVestido /> },
    { label: 'Tops', icon: <IconTop /> },
    { label: 'Pantalones', icon: <IconPantalon /> },
    { label: 'Sets', icon: <IconSet /> },
    { label: 'Accesorios', icon: <IconBolsa /> },
  ];

  return (
    <div className="mv-root">
      
      {/* ── Navbar ── */}
      <nav className="mv-navbar">
        <div className="mv-nav-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </div>
        
        <div className="mv-logo">
          <img src="/images/logomindylu.png" alt="Mindy Lu" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
          <span className="mv-logo-fallback">Mindy Lu</span>
        </div>

        <ul className="mv-nav-links">
          <li><a href="#">NUEVO</a></li>
          <li><a href="#catalogo">ROPA</a></li>
          <li><a href="#catalogo">BEST SELLERS</a></li>
          <li><a href="#catalogo">ACCESORIOS</a></li>
          <li><a href="#" className="mv-sale">SALE</a></li>
        </ul>

        <div className="mv-nav-icons">
          <Search size={22} strokeWidth={1.5} />
          <User size={22} strokeWidth={1.5} />
          <Heart size={22} strokeWidth={1.5} />
          <div className="mv-cart-icon">
            <ShoppingBag size={22} strokeWidth={1.5} />
            <span className="mv-cart-badge">2</span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mv-mobile-menu">
          <div className="mv-mobile-menu-header">
            <span className="mv-logo-fallback">Mindy Lu</span>
            <X size={24} onClick={() => setMobileMenuOpen(false)} />
          </div>
          <ul className="mv-mobile-links">
            <li onClick={() => setMobileMenuOpen(false)}><a href="#">NUEVO</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ROPA</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">BEST SELLERS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ACCESORIOS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#" className="mv-sale">SALE</a></li>
          </ul>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className="mv-hero">
        <div className="mv-hero-content">
          
          <div className="mv-hero-text">
            <div className="mv-hero-script-wrap">
              <span className="mv-script mv-pink-text">Nueva Colección</span>
              <SparkleIcon className="mv-sparkle mv-sparkle-1" />
              <HeartOutline size={20} color="#FF4D85" className="mv-hero-floating-heart" />
            </div>
            
            <h1 className="mv-hero-title">
              <span className="mv-black-text">MODA QUE TE</span><br/>
              <span className="mv-pink-text">REPRESENTA.</span>
            </h1>
            
            <p className="mv-hero-desc">
              Descubre las piezas que elevarán<br/>tu estilo esta temporada.
            </p>
            
            <button className="mv-btn-dark mv-hero-btn" onClick={() => document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>
              VER COLECCIÓN <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="mv-hero-image-wrap">
            <div className="mv-pink-brush-bg"></div>
            {/* Usamos banner o si no hay, la primera prenda */}
            <img src={config?.banner_imagen || getPrendaImg(0)} alt="Hero Fashion" className="mv-hero-model" />
            
            <div className="mv-spinning-badge">
              <svg viewBox="0 0 100 100" width="120" height="120" className="mv-badge-text">
                <path id="badgeCurve" fill="transparent" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
                <text fontSize="8" letterSpacing="1.5" fontWeight="bold">
                  <textPath href="#badgeCurve">PARA MUJERES REALES • QUE ROMPEN REGLAS • </textPath>
                </text>
              </svg>
              <div className="mv-badge-face">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
            </div>
            <SparkleIcon className="mv-sparkle mv-sparkle-2" />
            <div className="mv-doodle-lines">
              <svg viewBox="0 0 50 50" width="50" height="50" stroke="#FF4D85" strokeWidth="2" fill="none">
                <path d="M5 25 Q15 5, 25 25 T45 25" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categorías Vibe ── */}
      <section className="mv-vibe-section">
        <div className="mv-vibe-header">
          <div>
            <h2>ELIGE TU <span className="mv-script mv-pink-text" style={{fontSize:'2.5rem'}}>vibe</span> <HeartOutline size={24} color="#FF4D85" style={{verticalAlign:'middle'}}/></h2>
            <p>Encuentra lo que va contigo</p>
          </div>
          
          <div className="mv-vibe-categories">
            {catIcons.map((cat, idx) => (
              <div 
                key={idx} 
                className={`mv-cat-circle-wrap ${categoriaActiva === cat.label ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(categoriaActiva === cat.label ? 'Todos' : cat.label)}
              >
                <div className="mv-cat-circle">
                  {cat.icon}
                </div>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>

          <div className="mv-vibe-action">
            <div className="mv-pink-brush-small"></div>
            <button className="mv-btn-transparent" onClick={() => setCategoriaActiva('Todos')}>
              Ver todo <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <section id="catalogo" className="mv-products-section">
        <div className="mv-products-header">
          <h2>BEST SELLERS</h2>
          <div className="mv-nav-arrows">
            <div className="mv-arrow"><ChevronLeft size={20}/></div>
            <div className="mv-arrow active"><ChevronRight size={20}/></div>
          </div>
        </div>

        <div className="mv-products-grid">
          {prendasFiltradas.length > 0 ? (
            prendasFiltradas.map((p, idx) => {
              const imgUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
              return (
                <div key={p.id} className="mv-product-card" onClick={() => setPrendaSeleccionada(p)}>
                  <div className="mv-product-img-box">
                    <img src={imgUrl} alt={p.nombre} />
                  </div>
                  <div className="mv-product-info-box">
                    <div>
                      <h3 className="mv-product-title">{p.nombre.toUpperCase()}</h3>
                      <p className="mv-product-price">{formatPrice(p.precio)}</p>
                    </div>
                    <HeartOutline size={18} color="#FF4D85" className="mv-card-heart" />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{gridColumn: '1/-1', textAlign:'center', padding:'40px', color:'#666'}}>No hay prendas en esta categoría.</div>
          )}
        </div>
      </section>

      {/* ── Banners ── */}
      <section className="mv-benefits-banner">
        <div className="mv-benefit-item">
          <Truck size={28} strokeWidth={1.5} />
          <div>
            <strong>ENVÍOS A TODO CHILE</strong>
            <p>En compras sobre $40.000</p>
          </div>
        </div>
        <div className="mv-benefit-item mv-border-left">
          <Lock size={28} strokeWidth={1.5} />
          <div>
            <strong>COMPRA SEGURA</strong>
            <p>Paga como más te acomode</p>
          </div>
        </div>
        <div className="mv-benefit-item mv-border-left">
          <Phone size={28} strokeWidth={1.5} />
          <div>
            <strong>¿NECESITAS AYUDA?</strong>
            <p>Escríbenos por WhatsApp</p>
          </div>
        </div>
      </section>

      {/* ── Ticker Marquee ── */}
      <div className="mv-ticker-wrap">
        <div className="mv-ticker">
          <div className="mv-ticker-content">
            {/* Repeated text for seamless scroll */}
            {[...Array(10)].map((_, i) => (
              <span key={i}>COLLECT MOMENTS, NOT THINGS <HeartOutline size={14} color="#FF4D85" style={{margin:'0 10px', verticalAlign:'middle'}}/></span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Navigation ── */}
      <div className="mv-mobile-bottom-nav">
        <div className="mv-bottom-btn" style={{background: '#FF4D85'}}>
          <Truck size={20} color="#fff" />
          <span>ENVÍOS</span>
          <small>sobre $40.000</small>
        </div>
        <div className="mv-bottom-btn" style={{background: '#FF3377'}}>
          <Lock size={20} color="#fff" />
          <span>PAGO</span>
          <small>seguro</small>
        </div>
        <div className="mv-bottom-btn" style={{background: '#FF1A66'}} onClick={() => handleWhatsApp()}>
          <Phone size={20} color="#fff" />
          <span>AYUDA</span>
          <small>WhatsApp</small>
        </div>
      </div>

      {/* ── Modal de Detalle de Prenda ── */}
      {prendaSeleccionada && (
        <div className="mv-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setPrendaSeleccionada(null) }}>
          <div className="mv-modal-content">
            <button className="mv-modal-close" onClick={() => setPrendaSeleccionada(null)}><X size={20} /></button>
            
            <div className="mv-modal-grid">
              <div className="mv-modal-img-col">
                <img 
                  src={prendaSeleccionada.foto_url || (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes[0]?.imagen) || ""} 
                  alt={prendaSeleccionada.nombre} 
                />
              </div>
              <div className="mv-modal-info-col">
                <h2 className="mv-modal-title">{prendaSeleccionada.nombre.toUpperCase()}</h2>
                <div className="mv-modal-price">{formatPrice(prendaSeleccionada.precio)}</div>
                
                <div className="mv-modal-variants">
                  <h4>OPCIONES DISPONIBLES</h4>
                  {prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 ? (
                    <ul>
                      {prendaSeleccionada.variantes.map(v => (
                        <li key={v.id}>
                          • {v.color || 'Único'} {v.talla ? `/ Talla ${v.talla}` : ''} 
                          <span style={{fontSize:'0.85rem', color:'#888', marginLeft:'10px'}}>({v.cantidad} disp.)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{fontSize:'0.9rem', color:'#666'}}>Talla única / Color único (Consulta stock)</p>
                  )}
                </div>

                <p className="mv-modal-desc">
                  Esta es una prenda exclusiva de Mindy Lu. Renueva tu clóset con estilo y calidad. 
                  Resérvala ahora mismo antes de que se agote enviándonos un mensaje directo.
                </p>

                <button className="mv-btn-dark mv-btn-full" onClick={() => handleWhatsApp(prendaSeleccionada)}>
                  ME INTERESA (WHATSAPP)
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
