import React, { useEffect, useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight, Star } from 'lucide-react';
import api from '../services/api';
import './PublicCatalog.css';

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [config, setConfig] = useState(null);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Mindy Lu - Moda Moderna";
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

  const catList = ['VESTIDOS', 'TOPS', 'PANTALONES', 'SETS', 'ACCESORIOS'];

  return (
    <div className="md-root">
      
      {/* ── Navbar ── */}
      <nav className="md-navbar">
        <div className="md-nav-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={28} strokeWidth={1.5} />
        </div>
        
        {/* Logo Textual Moderno */}
        <div className="md-logo">
          MINDY<span className="md-logo-accent">LU</span>
        </div>

        <ul className="md-nav-links">
          <li><a href="#">NEW IN</a></li>
          <li><a href="#catalogo">COLECCIÓN</a></li>
          <li><a href="#catalogo">MÁS VENDIDOS</a></li>
          <li><a href="#" className="md-sale">SALE %</a></li>
        </ul>

        <div className="md-nav-icons">
          <Search size={22} strokeWidth={1.5} className="md-hide-mobile" />
          <User size={22} strokeWidth={1.5} className="md-hide-mobile" />
          <Heart size={22} strokeWidth={1.5} />
          <div className="md-cart-icon">
            <ShoppingBag size={22} strokeWidth={1.5} />
            <span className="md-cart-badge">2</span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md-mobile-menu">
          <div className="md-mobile-menu-header">
            <div className="md-logo">MINDY<span className="md-logo-accent">LU</span></div>
            <X size={32} strokeWidth={1.5} onClick={() => setMobileMenuOpen(false)} />
          </div>
          <ul className="md-mobile-links">
            <li onClick={() => setMobileMenuOpen(false)}><a href="#">NEW IN</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">COLECCIÓN</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">MÁS VENDIDOS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#" className="md-sale">SALE %</a></li>
          </ul>
        </div>
      )}

      {/* ── Hero Section Full-Width ── */}
      <section className="md-hero">
        <div className="md-hero-image-container">
          {config?.banner_imagen ? (
            <img src={config.banner_imagen} alt="Mindy Lu Banner" className="md-hero-img" />
          ) : (
            <div className="md-hero-placeholder">
              <span>Por favor sube una imagen de Banner en Ajustes &gt; Apariencia</span>
            </div>
          )}
          <div className="md-hero-overlay"></div>
        </div>
        
        <div className="md-hero-content">
          <div className="md-hero-text-box">
            <span className="md-hero-tag">NUEVA TEMPORADA</span>
            <h1 className="md-main-title">
              {config?.banner_titulo || 'REDEFINE TU ESTILO.'}
            </h1>
            <p className="md-hero-desc">
              {config?.banner_subtitulo || 'Colección exclusiva para mujeres reales con actitud.'}
            </p>
            <button className="md-btn-primary" onClick={() => document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}>
              DESCUBRIR <ArrowRight size={16} strokeWidth={2} style={{marginLeft: '10px'}} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Marquesina Dinámica ── */}
      <div className="md-marquee-bar">
        <div className="md-marquee-content" style={{ animationDuration: `${config?.marquesina_velocidad || 20}s` }}>
          <span>{config?.marquesina_texto || '✦ ENVÍOS GRATIS DESDE $40.000 ✦ DISEÑOS EXCLUSIVOS ✦ NUEVA COLECCIÓN DISPONIBLE'}</span>
          <span>{config?.marquesina_texto || '✦ ENVÍOS GRATIS DESDE $40.000 ✦ DISEÑOS EXCLUSIVOS ✦ NUEVA COLECCIÓN DISPONIBLE'}</span>
          <span>{config?.marquesina_texto || '✦ ENVÍOS GRATIS DESDE $40.000 ✦ DISEÑOS EXCLUSIVOS ✦ NUEVA COLECCIÓN DISPONIBLE'}</span>
        </div>
      </div>

      {/* ── Categorías (Modern Pills) ── */}
      <section className="md-categories">
        <div className="md-pills-container">
          <button 
            className={`md-pill ${categoriaActiva === 'Todos' ? 'active' : ''}`}
            onClick={() => setCategoriaActiva('Todos')}
          >
            TODO
          </button>
          {catList.map((cat, idx) => (
            <button 
              key={idx} 
              className={`md-pill ${categoriaActiva === cat ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(categoriaActiva === cat ? 'Todos' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Best Sellers Grid ── */}
      <section id="catalogo" className="md-products-section">
        <div className="md-products-header">
          <h2>TENDENCIA</h2>
          <button className="md-btn-link">Ver todo</button>
        </div>

        <div className="md-products-grid">
          {prendasFiltradas.length > 0 ? (
            prendasFiltradas.map((p, idx) => {
              const imgUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
              return (
                <div key={p.id} className="md-product-card" onClick={() => setPrendaSeleccionada(p)}>
                  <div className="md-product-img-box">
                    <img src={imgUrl} alt={p.nombre} />
                    <button className="md-heart-btn" onClick={(e) => { e.stopPropagation(); }}><Heart size={20} strokeWidth={1.5} /></button>
                  </div>
                  <div className="md-product-info">
                    <h3 className="md-product-title">{p.nombre.toUpperCase()}</h3>
                    <p className="md-product-price">{formatPrice(p.precio)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="md-empty-state">No hay prendas disponibles en esta categoría.</div>
          )}
        </div>
      </section>

      {/* ── Footer Moderno ── */}
      <footer className="md-footer">
        <div className="md-footer-grid">
          <div className="md-footer-col">
            <h4>MINDYLU</h4>
            <p>Diseñamos moda atrevida y moderna para destacar en cada momento.</p>
          </div>
          <div className="md-footer-col">
            <h4>SERVICIO</h4>
            <ul>
              <li>Envíos a todo Chile</li>
              <li>Pagos 100% Seguros</li>
              <li>Políticas de Cambio</li>
            </ul>
          </div>
          <div className="md-footer-col">
            <h4>SOPORTE</h4>
            <button className="md-btn-outline" onClick={() => handleWhatsApp()}>
              Contacto WhatsApp
            </button>
          </div>
        </div>
      </footer>

      {/* ── Modal de Detalle Moderno ── */}
      {prendaSeleccionada && (
        <div className="md-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setPrendaSeleccionada(null) }}>
          <div className="md-modal-content">
            <button className="md-modal-close" onClick={() => setPrendaSeleccionada(null)}><X size={28} strokeWidth={1.5}/></button>
            
            <div className="md-modal-grid">
              <div className="md-modal-img">
                <img 
                  src={prendaSeleccionada.foto_url || (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes[0]?.imagen) || ""} 
                  alt={prendaSeleccionada.nombre} 
                />
              </div>
              <div className="md-modal-info">
                <div className="md-modal-tag">NUEVO</div>
                <h2 className="md-modal-title">{prendaSeleccionada.nombre.toUpperCase()}</h2>
                <div className="md-modal-price">{formatPrice(prendaSeleccionada.precio)}</div>
                
                <div className="md-modal-desc-box">
                  <p>Prenda exclusiva de la nueva colección. Diseñada con un corte perfecto para realzar la figura con total comodidad y actitud.</p>
                </div>

                <div className="md-modal-variants">
                  <h4>Variantes disponibles:</h4>
                  {prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 ? (
                    <div className="md-variants-list">
                      {prendaSeleccionada.variantes.map(v => (
                        <div key={v.id} className="md-variant-tag">
                          {v.color || 'Único'} {v.talla ? `- Talla ${v.talla}` : ''}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="md-variant-tag">Talla única</div>
                  )}
                </div>

                <button className="md-btn-primary md-btn-full" onClick={() => handleWhatsApp(prendaSeleccionada)}>
                  LO QUIERO AHORA <ArrowRight size={16} strokeWidth={2} style={{marginLeft: '10px'}} />
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
