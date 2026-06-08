import React, { useEffect, useState } from 'react';
import { Search, User, ShoppingBag, Menu, X, Heart } from 'lucide-react';
import api from '../services/api';
import './PublicCatalog.css';

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

  // Get unique categories for pills
  const allCategorias = ['Todos', ...new Set(prendas.map(p => p.categoria).filter(Boolean))];

  // Filter items
  const prendasFiltradas = categoriaActiva === 'Todos' 
    ? prendas 
    : prendas.filter(p => p.categoria === categoriaActiva);

  const formatPrice = (price) => {
    return '$' + parseInt(price || 0).toLocaleString('es-CL');
  };

  const handleWhatsApp = (prenda) => {
    const num = config?.telefono_whatsapp || '56912345678';
    const text = `Hola, me interesa la prenda: ${prenda.nombre} a ${formatPrice(prenda.precio)}. ¿Tienen disponibilidad?`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="mc-root">
      {/* ── Top Navbar ── */}
      <nav className="mc-navbar">
        <div className="mc-nav-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </div>
        
        <div className="mc-logo">
          <img src="/images/logomindylu.png" alt="Mindy Lu" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
          <span style={{display: 'none', fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', fontStyle: 'italic', color: '#333'}}>Mindy Lu</span>
        </div>

        <ul className="mc-nav-links">
          <li><a href="#">NUEVO</a></li>
          <li><a href="#catalogo">ROPA</a></li>
          <li><a href="#catalogo">BEST SELLERS</a></li>
          <li><a href="#catalogo">ACCESORIOS</a></li>
          <li><a href="#" className="mc-sale">SALE</a></li>
        </ul>

        <div className="mc-nav-icons">
          <Search size={20} />
          <User size={20} />
          <div className="mc-cart-icon">
            <ShoppingBag size={20} />
            <span className="mc-cart-badge">0</span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mc-mobile-menu">
          <div className="mc-mobile-menu-header">
            <span className="mc-logo-text">Mindy Lu</span>
            <X size={24} onClick={() => setMobileMenuOpen(false)} />
          </div>
          <ul className="mc-mobile-links">
            <li onClick={() => setMobileMenuOpen(false)}><a href="#">NUEVO</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ROPA</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">BEST SELLERS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#catalogo">ACCESORIOS</a></li>
            <li onClick={() => setMobileMenuOpen(false)}><a href="#" className="mc-sale">SALE</a></li>
          </ul>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className="mc-hero">
        <div className="mc-hero-text">
          <span className="mc-hero-subtitle">Catálogo</span>
          <h1>MODA QUE<br/>TE REPRESENTA.</h1>
          <p>Descubre las piezas que<br/>elevarán tu estilo esta temporada.</p>
          <a href="#catalogo" className="mc-btn-dark">VER COLECCIÓN</a>
        </div>
        
        <div className="mc-hero-images">
          <div className="mc-hero-img-tall">
            <img src={config?.banner_imagen || getPrendaImg(0)} alt="Hero Main" />
          </div>
          <div className="mc-hero-img-stack">
            <div className="mc-hero-img-small top">
              <img src={config?.polaroid_1_imagen || getPrendaImg(1)} alt="Hero Secondary 1" />
            </div>
            <div className="mc-hero-img-small bottom">
              <img src={config?.polaroid_2_imagen || getPrendaImg(2)} alt="Hero Secondary 2" />
            </div>
          </div>
          <div className="mc-hero-badge">
            <svg viewBox="0 0 100 100" width="100" height="100">
              <path id="curve" fill="transparent" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
              <text fontSize="10.5" letterSpacing="2">
                <textPath href="#curve">NUEVA COLECCIÓN '24 NUEVA COLECCIÓN '24</textPath>
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Categories Section ── */}
      <section id="catalogo" className="mc-categories-section">
        <div className="mc-cat-header">
          <h2>TODAS LAS <span>CATEGORÍAS</span></h2>
          <div className="mc-cat-line"></div>
          <div className="mc-cat-pills">
            {allCategorias.map((cat, idx) => (
              <button 
                key={idx} 
                className={`mc-pill ${categoriaActiva === cat ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(cat)}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        {/* Mobile Filter & Sort Headers */}
        <div className="mc-mobile-filters">
          <span><Search size={16}/> FILTRAR</span>
          <span>ORDENAR <span style={{fontSize:'0.8rem'}}>▼</span></span>
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="mc-products-grid">
        {prendasFiltradas.length > 0 ? (
          prendasFiltradas.map(p => {
            const imgUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
            return (
              <div key={p.id} className="mc-product-card" onClick={() => setPrendaSeleccionada(p)}>
                <div className="mc-product-img-wrap">
                  <img src={imgUrl} alt={p.nombre} />
                  <button className="mc-like-btn"><Heart size={18} /></button>
                </div>
                <div className="mc-product-info">
                  <h3>{p.nombre.toUpperCase()}</h3>
                  <p>{formatPrice(p.precio)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="mc-empty-state">
            <p>No hay prendas en esta categoría.</p>
          </div>
        )}
      </section>

      {/* Mobile Sticky Bottom Bar */}
      <div className="mc-mobile-sticky-bar">
        NUEVA COLECCIÓN VERANO '24 <span style={{marginLeft:'10px'}}>›</span>
      </div>

      {/* ── Modal de Detalle de Prenda ── */}
      {prendaSeleccionada && (
        <div className="mc-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setPrendaSeleccionada(null) }}>
          <div className="mc-modal-content">
            <button className="mc-modal-close" onClick={() => setPrendaSeleccionada(null)}><X size={20} /></button>
            
            <div className="mc-modal-grid">
              <div className="mc-modal-img-col">
                <img 
                  src={prendaSeleccionada.foto_url || (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes[0]?.imagen) || ""} 
                  alt={prendaSeleccionada.nombre} 
                />
              </div>
              <div className="mc-modal-info-col">
                <h2>{prendaSeleccionada.nombre.toUpperCase()}</h2>
                <div style={{fontSize: '1.2rem', color: '#666', marginBottom: '15px'}}>{formatPrice(prendaSeleccionada.precio)}</div>
                
                <div className="mc-modal-variants">
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

                <p className="mc-modal-desc">
                  Esta es una prenda exclusiva de Mindy Lu. Renueva tu clóset con estilo y calidad. 
                  Resérvala ahora mismo antes de que se agote enviándonos un mensaje directo.
                </p>

                <button className="mc-btn-dark" style={{width: '100%', marginTop: 'auto', padding: '15px'}} onClick={() => handleWhatsApp(prendaSeleccionada)}>
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
