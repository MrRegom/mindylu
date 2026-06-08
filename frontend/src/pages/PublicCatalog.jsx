import React, { useEffect, useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight } from 'lucide-react';
import api from '../services/api';
import './PublicCatalog.css';

// --- Custom Thin Elegant SVGs ---
const IconSparkle = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="1"><path d="M12 2L13.5 9L21 10.5L13.5 12L12 19L10.5 12L3 10.5L10.5 9L12 2Z" /></svg>
);
const IconHeartOutline = ({ size=18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="1" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

// Categorías Icons (Thin Outlines)
const IconVestido = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32"><path d="M7 6L8 3H16L17 6L19 12V21H5V12L7 6Z"/><path d="M8 6H16"/><path d="M10 3V6"/><path d="M14 3V6"/></svg>;
const IconTop = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32"><path d="M6 5L9 3H15L18 5L20 12H16C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12H4L6 5Z"/></svg>;
const IconPantalon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32"><path d="M7 3H17L19 21H13L12 11L11 21H5L7 3Z"/></svg>;
const IconSet = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32"><path d="M8 3H16L18 6L16 11H8L6 6L8 3Z"/><path d="M7 13H17L18 21H13L12 16L11 21H6L7 13Z"/></svg>;
const IconBolsa = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32"><path d="M6 8H18V20H6V8Z"/><path d="M9 8V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V8"/></svg>;

// Banner Icons
const IconTruck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="36" height="36"><rect x="3" y="6" width="13" height="11" rx="1"/><path d="M16 9h4l2 3v5h-6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
const IconLock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="36" height="36"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/><circle cx="12" cy="16" r="1"/></svg>;
const IconWhatsApp = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="36" height="36"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>;
const IconStar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="36" height="36"><path d="M12 2L14 9L21 11L14 13L12 20L10 13L3 11L10 9L12 2Z"/></svg>;

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [config, setConfig] = useState(null);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Mindy Lu - Boutique Elegante";
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
    { label: 'VESTIDOS', icon: <IconVestido /> },
    { label: 'TOPS', icon: <IconTop /> },
    { label: 'PANTALONES', icon: <IconPantalon /> },
    { label: 'SETS', icon: <IconSet /> },
    { label: 'ACCESORIOS', icon: <IconBolsa /> },
  ];

  return (
    <div className="eb-root">
      
      {/* ── Navbar ── */}
      <nav className="eb-navbar">
        <div className="eb-nav-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} strokeWidth={1} />
        </div>
        
        <div className="eb-logo">
          <img src="/images/logomindylu.png" alt="Mindy Lu" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='inline-flex'; }} />
          <span className="eb-logo-fallback">MindyLu <IconSparkle /></span>
        </div>

        <ul className="eb-nav-links">
          <li><a href="#">NUEVO</a></li>
          <li><a href="#catalogo">ROPA</a></li>
          <li><a href="#catalogo">BEST SELLERS</a></li>
          <li><a href="#catalogo">ACCESORIOS</a></li>
          <li><a href="#" className="eb-sale">SALE</a></li>
        </ul>

        <div className="eb-nav-icons">
          <Search size={22} strokeWidth={1} />
          <User size={22} strokeWidth={1} />
          <Heart size={22} strokeWidth={1} />
          <div className="eb-cart-icon">
            <ShoppingBag size={22} strokeWidth={1} />
            <span className="eb-cart-badge">2</span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="eb-mobile-menu">
          <div className="eb-mobile-menu-header">
            <span className="eb-logo-fallback">MindyLu <IconSparkle /></span>
            <X size={24} strokeWidth={1} onClick={() => setMobileMenuOpen(false)} />
          </div>
          <ul className="eb-mobile-links">
            <li onClick={() => setMobileMenuOpen(false)}><a href="#">NUEVO</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ROPA</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">BEST SELLERS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ACCESORIOS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#" className="eb-sale">SALE</a></li>
          </ul>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className="eb-hero">
        <div className="eb-hero-content">
          <div className="eb-hero-text">
            <div className="eb-script-title">Nueva colección</div>
            <h1 className="eb-main-title">MODA QUE<br/>TE REPRESENTA<span className="eb-dot">.</span></h1>
            <p className="eb-hero-desc">
              DISEÑOS EXCLUSIVOS PARA MUJERES<br/>
              REALES QUE ROMPEN REGLAS.
            </p>
            <button className="eb-btn-pink" onClick={() => document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>
              VER COLECCIÓN <ArrowRight size={14} style={{marginLeft: '10px'}} />
            </button>
          </div>
          
          <div className="eb-hero-image-wrap">
            <div className="eb-arch-bg"></div>
            <img src={config?.banner_imagen || getPrendaImg(0)} alt="Hero Fashion" className="eb-hero-model" />
            
            <div className="eb-spinning-badge">
              <svg viewBox="0 0 100 100" width="160" height="160" className="eb-badge-text">
                <path id="badgeCurve" fill="transparent" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
                <text fontSize="7.5" letterSpacing="2.5" fontWeight="400">
                  <textPath href="#badgeCurve">PARA MUJERES REALES • QUE ROMPEN REGLAS • </textPath>
                </text>
              </svg>
              <div className="eb-badge-center">
                ML
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categorías (Light Bar) ── */}
      <section className="eb-categories-bar">
        <div className="eb-cat-inner">
          <div className="eb-cat-list">
            {catIcons.map((cat, idx) => (
              <div 
                key={idx} 
                className={`eb-cat-item ${categoriaActiva === cat.label ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(categoriaActiva === cat.label ? 'Todos' : cat.label)}
              >
                <div className="eb-cat-icon">{cat.icon}</div>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
          <div className="eb-cat-action">
            <button className="eb-btn-transparent" onClick={() => setCategoriaActiva('Todos')}>
              VER TODO <ArrowRight size={14} style={{marginLeft: '5px'}} strokeWidth={1}/>
            </button>
          </div>
        </div>
      </section>

      {/* ── Best Sellers Grid ── */}
      <section id="catalogo" className="eb-products-section">
        <div className="eb-products-header">
          <h2>BEST SELLERS</h2>
          <button className="eb-btn-transparent">
            Ver todo <ArrowRight size={14} style={{marginLeft: '5px'}} strokeWidth={1}/>
          </button>
        </div>

        <div className="eb-products-grid">
          {prendasFiltradas.length > 0 ? (
            prendasFiltradas.map((p, idx) => {
              const imgUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
              return (
                <div key={p.id} className="eb-product-card" onClick={() => setPrendaSeleccionada(p)}>
                  <div className="eb-product-img-box">
                    <img src={imgUrl} alt={p.nombre} />
                  </div>
                  <div className="eb-product-info-box">
                    <div className="eb-product-details">
                      <h3 className="eb-product-title">{p.nombre.toUpperCase()}</h3>
                      <p className="eb-product-price">{formatPrice(p.precio)}</p>
                    </div>
                    <div className="eb-product-heart">
                      <IconHeartOutline size={18} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{gridColumn: '1/-1', textAlign:'center', padding:'40px', color:'#999'}}>No hay prendas en esta categoría.</div>
          )}
        </div>
      </section>

      {/* ── Footer Banner ── */}
      <section className="eb-footer-banner">
        <div className="eb-benefit-item">
          <IconTruck />
          <div className="eb-benefit-text">
            <strong>ENVÍOS A<br/>TODO CHILE</strong>
            <p>En compras sobre<br/>$40.000</p>
          </div>
        </div>
        <div className="eb-benefit-divider"></div>
        <div className="eb-benefit-item">
          <IconLock />
          <div className="eb-benefit-text">
            <strong>COMPRA<br/>SEGURA</strong>
            <p>Paga como más<br/>te acomode</p>
          </div>
        </div>
        <div className="eb-benefit-divider"></div>
        <div className="eb-benefit-item">
          <IconWhatsApp />
          <div className="eb-benefit-text">
            <strong>¿NECESITAS AYUDA?</strong>
            <p>Escríbenos por<br/>WhatsApp</p>
          </div>
        </div>
        <div className="eb-benefit-divider"></div>
        <div className="eb-benefit-item">
          <IconStar />
          <div className="eb-benefit-text">
            <strong>EXCLUSIVO</strong>
            <p>Diseños únicos<br/>que no verás en<br/>ninguna otra parte</p>
          </div>
        </div>
      </section>

      {/* ── Mobile Bottom Nav ── */}
      <div className="eb-mobile-bottom-nav">
        <div className="eb-bottom-btn">
          <IconTruck />
          <div className="eb-bottom-text">
            <strong>ENVÍOS</strong>
            <span>sobre $40.000</span>
          </div>
        </div>
        <div className="eb-bottom-btn">
          <IconLock />
          <div className="eb-bottom-text">
            <strong>PAGO</strong>
            <span>SEGURO</span>
          </div>
        </div>
        <div className="eb-bottom-btn" onClick={() => handleWhatsApp()}>
          <IconWhatsApp />
          <div className="eb-bottom-text">
            <strong>AYUDA</strong>
            <span>WhatsApp</span>
          </div>
        </div>
      </div>

      {/* ── Modal de Detalle de Prenda ── */}
      {prendaSeleccionada && (
        <div className="eb-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setPrendaSeleccionada(null) }}>
          <div className="eb-modal-content">
            <button className="eb-modal-close" onClick={() => setPrendaSeleccionada(null)}><X size={24} strokeWidth={1}/></button>
            
            <div className="eb-modal-grid">
              <div className="eb-modal-img-col">
                <img 
                  src={prendaSeleccionada.foto_url || (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes[0]?.imagen) || ""} 
                  alt={prendaSeleccionada.nombre} 
                />
              </div>
              <div className="eb-modal-info-col">
                <h2 className="eb-modal-title">{prendaSeleccionada.nombre.toUpperCase()}</h2>
                <div className="eb-modal-price">{formatPrice(prendaSeleccionada.precio)}</div>
                
                <div className="eb-modal-variants">
                  <h4>OPCIONES DISPONIBLES</h4>
                  {prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 ? (
                    <ul>
                      {prendaSeleccionada.variantes.map(v => (
                        <li key={v.id}>
                          <span style={{letterSpacing: '1px'}}>• {v.color || 'Único'} {v.talla ? `/ Talla ${v.talla}` : ''}</span> 
                          <span style={{fontSize:'0.75rem', color:'#999', marginLeft:'10px'}}>({v.cantidad} disp.)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{fontSize:'0.8rem', color:'#999'}}>Talla única / Color único</p>
                  )}
                </div>

                <p className="eb-modal-desc">
                  Diseño exclusivo de Mindy Lu. Renueva tu clóset con estilo y elegancia suprema. 
                  Resérvala ahora mismo enviándonos un mensaje directo.
                </p>

                <button className="eb-btn-pink eb-btn-full" onClick={() => handleWhatsApp(prendaSeleccionada)}>
                  ME INTERESA <ArrowRight size={14} style={{marginLeft: '10px'}} />
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
