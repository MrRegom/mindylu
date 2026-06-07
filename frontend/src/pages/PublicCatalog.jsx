// ─────────────────────────────────────────────────────────────
// frontend/src/pages/PublicCatalog.jsx
// Landing page premium de boutique — estilo Zara / Sézane
// Responsive: desktop + mobile. Sin autenticación requerida.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './PublicCatalog.css';

// URL base del API (VITE_API_URL ya tiene el formato http://host/api/v1/)
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/').replace(/\/$/, '');

// ── Icono WhatsApp SVG ─────────────────────────────────────
const WaIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

const CartIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// ── Tarjeta de Producto ────────────────────────────────────
const ProductCard = ({ prenda, onAddToCart }) => {
  const [imgError, setImgError] = useState(false);
  const estado = prenda.estado || 'disponible';
  
  let imagen = prenda.imagenes?.[0]?.imagen || prenda.foto_url;
  if (imagen && !imagen.startsWith('http')) {
    const baseUrl = API_BASE.replace('/api/v1', '');
    imagen = `${baseUrl}${imagen.startsWith('/') ? '' : '/'}${imagen}`;
  }
  
  const precio = parseInt(prenda.precio || 0).toLocaleString('es-CL');
  
  // Deduplicar tallas para que no diga "estándar - estándar - estándar"
  const tallasArray = prenda.variantes?.map(v => (v.talla || '').toLowerCase()).filter(Boolean) || [];
  const tallasUnicas = [...new Set(tallasArray)].map(t => t.charAt(0).toUpperCase() + t.slice(1));
  const tallas = tallasUnicas.join(' · ');

  const estadoLabel = {
    disponible: 'Disponible',
    reservada:  'Reservado',
    vendida:    'Vendido',
  }[estado] || 'Disponible';

  return (
    <article className="lp-card" onClick={() => onAddToCart(prenda, 1, '', '', true)}>
      <div className="lp-card-img-wrap">
        {imagen && !imgError ? (
          <img 
            src={imagen} 
            alt={prenda.nombre} 
            loading="lazy" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="lp-card-no-img">
            <span style={{ fontSize: '1.5rem' }}>👗</span>
          </div>
        )}
        <div className={`lp-card-status ${estado}`}>{estadoLabel}</div>
        {estado !== 'vendida' && (
          <div className="lp-card-overlay">
            <button
              className="lp-card-btn"
              onClick={(e) => { e.stopPropagation(); onAddToCart(prenda); }}
            >
              <CartIcon /> Agregar al carrito de consultas
            </button>
          </div>
        )}
      </div>
      <div className="lp-card-info">
        <p className="lp-card-name">{prenda.nombre}</p>
        <p className="lp-card-price">${precio}</p>
        {tallas && <p className="lp-card-tallas">{tallas}</p>}
        {estado !== 'vendida' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <span
              className="lp-link-elegant"
              onClick={(e) => { e.stopPropagation(); onAddToCart(prenda, 1, '', '', true); }}
            >
              Detalles
            </span>
            <button
              className="lp-btn-elegant"
              onClick={(e) => { e.stopPropagation(); onAddToCart(prenda); }}
            >
              <CartIcon size={14} /> Añadir
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

// ── Modal de Producto Avanzado ─────────────────────────────
const ProductModal = ({ prenda, onClose, onAddToCart }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const coloresArray = prenda?.variantes?.map(v => String(v.color || 'único').toLowerCase()) || [];
  const coloresUnicos = [...new Set(coloresArray)].map(c => c.charAt(0).toUpperCase() + c.slice(1));

  const [selectedColor, setSelectedColor] = useState(coloresUnicos.length > 0 ? coloresUnicos[0] : '');
  const [selectedTallaState, setSelectedTallaState] = useState('');

  const variantesColor = prenda?.variantes?.filter(v => String(v.color || 'único').toLowerCase() === selectedColor.toLowerCase()) || [];
  const primeraTalla = variantesColor.length > 0 ? variantesColor[0].talla : '';
  const isTallaValida = variantesColor.some(v => v.talla === selectedTallaState);
  const activeTalla = isTallaValida ? selectedTallaState : primeraTalla;
  
  const selectedVariante = variantesColor.find(v => v.talla === activeTalla) || null;
  const maxStock = selectedVariante ? parseInt(selectedVariante.cantidad, 10) : 0;

  if (!prenda) return null;

  let allImages = [];
  if (prenda.imagenes && prenda.imagenes.length > 0) {
    allImages = prenda.imagenes.map(img => {
      let url = img.imagen;
      if (url && !url.startsWith('http')) {
        const baseUrl = API_BASE.replace('/api/v1', '');
        url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      return { url, color: img.color || '' };
    });
    if (prenda.foto_url) {
      let url = prenda.foto_url;
      if (url && !url.startsWith('http')) {
        const baseUrl = API_BASE.replace('/api/v1', '');
        url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      // Evitar duplicar si por alguna razón ya estuviera
      if (!allImages.find(i => i.url === url)) {
        allImages.unshift({ url, color: '' });
      }
    }
  } else if (prenda.foto_url) {
    let url = prenda.foto_url;
    if (url && !url.startsWith('http')) {
      const baseUrl = API_BASE.replace('/api/v1', '');
      url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    allImages = [{ url, color: '' }];
  }

  const changeImg = (newIdx) => {
    setCurrentImgIdx(newIdx);
    const c = allImages[newIdx]?.color;
    if (c) {
      const match = coloresUnicos.find(cu => cu.trim().toLowerCase() === c.trim().toLowerCase());
      if (match) {
        setSelectedColor(match);
      }
    }
  };

  const handlePrev = () => changeImg(currentImgIdx === 0 ? allImages.length - 1 : currentImgIdx - 1);
  const handleNext = () => changeImg(currentImgIdx === allImages.length - 1 ? 0 : currentImgIdx + 1);

  const handleColorClick = (c) => {
    setSelectedColor(c);
    const idx = allImages.findIndex(img => img.color && img.color.trim().toLowerCase() === c.trim().toLowerCase());
    if (idx !== -1) {
      setCurrentImgIdx(idx);
    }
  };

  const precio = parseInt(prenda.precio || 0).toLocaleString('es-CL');

  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal-content" onClick={e => e.stopPropagation()}>
        <button className="lp-modal-close" onClick={onClose}>&times;</button>
        <div className="lp-modal-grid">
          <div className="lp-modal-gallery">
            {allImages.length > 0 ? (
              <div className="lp-modal-main-img">
                <img src={allImages[currentImgIdx].url} alt={prenda.nombre} />
                {allImages.length > 1 && (
                  <>
                    <button className="lp-gallery-btn prev" onClick={handlePrev}>&lsaquo;</button>
                    <button className="lp-gallery-btn next" onClick={handleNext}>&rsaquo;</button>
                  </>
                )}
              </div>
            ) : (
              <div className="lp-modal-main-img no-img">👗</div>
            )}
            {allImages.length > 1 && (
              <div className="lp-modal-thumbs">
                {allImages.map((img, idx) => (
                  <img 
                    key={idx} src={img.url} alt="thumb"
                    className={idx === currentImgIdx ? 'active' : ''} 
                    onClick={() => changeImg(idx)} 
                  />
                ))}
              </div>
            )}
          </div>
          <div className="lp-modal-info">
            <h2>{prenda.nombre}</h2>
            <p className="price">${precio}</p>
            <p className="desc">{prenda.descripcion || 'Sin descripción adicional.'}</p>

            {coloresUnicos.length > 0 && (
              <div className="lp-modal-opts">
                <h4>Color</h4>
                <div className="lp-modal-chips">
                  {coloresUnicos.map(c => (
                    <span 
                      key={c} 
                      className={`chip clickable-color ${selectedColor === c ? 'selected-chip' : ''}`}
                      onClick={() => handleColorClick(c)}
                      style={{ 
                        cursor: 'pointer', 
                        transition: 'all 0.2s',
                        background: selectedColor === c ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                        color: selectedColor === c ? '#fff' : 'inherit',
                        border: selectedColor === c ? '1px solid var(--color-primary)' : '1px solid transparent'
                      }}
                      onMouseEnter={e => { if (selectedColor !== c) e.target.style.transform = 'scale(1.05)' }}
                      onMouseLeave={e => { if (selectedColor !== c) e.target.style.transform = 'scale(1)' }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {variantesColor.length > 0 && (
              <div className="lp-modal-opts">
                <h4>Tallas</h4>
                <div className="lp-modal-chips">
                  {variantesColor.map(v => (
                    <span 
                      key={v.talla} 
                      className={`chip clickable-color ${activeTalla === v.talla ? 'selected-chip' : ''}`}
                      onClick={() => setSelectedTallaState(v.talla)}
                      style={{ 
                        cursor: 'pointer', 
                        transition: 'all 0.2s',
                        background: activeTalla === v.talla ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                        color: activeTalla === v.talla ? '#fff' : 'inherit',
                        border: activeTalla === v.talla ? '1px solid var(--color-primary)' : '1px solid transparent',
                        opacity: parseInt(v.cantidad, 10) === 0 ? 0.5 : 1
                      }}
                    >
                      {v.talla} <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>({v.cantidad} disp.)</span>
                    </span>
                  ))}
                </div>
                {maxStock === 0 && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '8px' }}>⚠️ Producto sin stock disponible</p>}
              </div>
            )}

            <div className="lp-modal-qty-add">
              <div className="lp-qty-selector">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(maxStock > 0 ? maxStock : 1, q + 1))}>+</button>
              </div>
              <button 
                className="lp-modal-add-btn"
                disabled={maxStock === 0}
                style={{ opacity: maxStock === 0 ? 0.5 : 1, cursor: maxStock === 0 ? 'not-allowed' : 'pointer' }}
                onClick={() => {
                  if (maxStock > 0) {
                    onAddToCart(prenda, qty, selectedColor, activeTalla);
                    onClose();
                  }
                }}
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Componente Principal ───────────────────────────────────
const PublicCatalog = () => {
  const [config, setConfig]         = useState(null);
  const [prendas, setPrendas]       = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [entregas, setEntregas]     = useState([]);
  const [catSel, setCatSel]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [cart, setCart]             = useState([]);
  const [cartOpen, setCartOpen]     = useState(false);
  const [selectedPrenda, setSelectedPrenda] = useState(null);

  const catalogRef  = useRef(null);
  const catRef      = useRef(null);
  const howtoRef    = useRef(null);
  const entregasRef = useRef(null);

  useEffect(() => {
    fetchConfig();
    fetchCategorias();
    fetchEntregas();
  }, []);

  useEffect(() => {
    fetchPrendas();
  }, [catSel]);

  useEffect(() => {
    // Observer para animaciones fade-up
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.fade-up-element');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, [prendas]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/core/configuracion/publico/`);
      setConfig(res.data);
    } catch (e) {
      console.error('Error config:', e);
    }
  };

  const fetchEntregas = async () => {
    try {
      const res = await axios.get(`${API_BASE}/pedidos/publico/entregas/`);
      setEntregas(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (e) {
      console.error('Error entregas:', e);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API_BASE}/catalogo/publico/categorias/`);
      setCategorias(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (e) {
      console.error('Error categorias:', e);
    }
  };

  const fetchPrendas = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/catalogo/publico/prendas/`;
      if (catSel) url += `?categoria=${catSel}`;
      const res = await axios.get(url);
      setPrendas(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (e) {
      console.error('Error prendas:', e);
      setPrendas([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (ref) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Categorías con emojis para mostrar visualmente
  const catEmojis = {
    vestidos: '👗', blusas: '👚', jeans: '👖',
    chaquetas: '🧥', accesorios: '👜', default: '✨'
  };
  const getEmoji = (nombre) => {
    const lower = (nombre || '').toLowerCase();
    return catEmojis[Object.keys(catEmojis).find(k => lower.includes(k))] || catEmojis.default;
  };

  const addToCart = (prenda, qty = 1, color = '', talla = '', isDirect = false) => {
    if (isDirect) {
      setSelectedPrenda(prenda);
      return;
    }
    
    const cartItemId = `${prenda.id}-${color}-${talla}`;
    const existing = cart.find(p => p.cartItemId === cartItemId);
    if (existing) {
      setCart(cart.map(p => p.cartItemId === cartItemId ? { ...p, qty: p.qty + qty } : p));
    } else {
      setCart([...cart, { ...prenda, qty, color, talla, cartItemId }]);
    }
    setCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(p => p.cartItemId !== cartItemId));
  };

  const updateCartQty = (cartItemId, delta) => {
    setCart(cart.map(p => {
      if (p.cartItemId === cartItemId) {
        const newQty = p.qty + delta;
        return newQty > 0 ? { ...p, qty: newQty } : null;
      }
      return p;
    }).filter(Boolean));
  };

  const abrirWhatsAppCart = () => {
    const waNumber = config?.whatsapp_numero || '56900000000';
    if (cart.length === 0) {
      const msg = encodeURIComponent('¡Hola LuPrenditas! Me gustaría ver el catálogo 💕');
      window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
      return;
    }
    
    let msg = '🌸 *¡Hola LuPrenditas!* 🌸\n\nMe gustaría consultar la disponibilidad de este pedido:\n\n';
    let totalSuma = 0;
    
    cart.forEach(p => {
      const pPrecio = parseInt(p.precio) || 0;
      const subtotal = p.qty * pPrecio;
      totalSuma += subtotal;
      
      msg += `✨ *${p.nombre}*\n`;
      msg += `   🛍️ Cantidad: ${p.qty}\n`;
      if (p.color) msg += `   🎨 Color: ${p.color}\n`;
      if (p.talla) msg += `   📏 Talla: ${p.talla}\n`;
      msg += `   💰 Subtotal: $${subtotal.toLocaleString('es-CL')}\n`;
      
      let imgUrl = '';
      if (p.imagenes && p.imagenes.length > 0) {
        const matchingImg = p.imagenes.find(img => img.color && img.color.toLowerCase() === (p.color || '').toLowerCase());
        imgUrl = matchingImg ? matchingImg.imagen : p.imagenes[0].imagen;
      } else if (p.foto_url) {
        imgUrl = p.foto_url;
      }
      
      if (imgUrl) {
        if (!imgUrl.startsWith('http')) {
          const baseUrl = API_BASE.replace('/api/v1', '');
          imgUrl = `${baseUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
        }
        msg += `   📸 Ver Foto: ${imgUrl}\n`;
      }
      msg += `\n`;
    });
    
    msg += `💳 *Total Estimado: $${totalSuma.toLocaleString('es-CL')}*\n\n`;
    msg += '¡Muchas gracias! 💕';
    
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const abrirWhatsAppGeneral = () => {
    const waNumber = config?.whatsapp_numero || '56900000000';
    const msg = encodeURIComponent('¡Hola LuPrenditas! Me gustaría ver el catálogo 💕');
    window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
  };

  return (
    <div className="lp-root">

      {/* ── Navbar Mobile ── */}
      <nav className="lp-nav-mobile">
        <button className="lp-hamburger-desktop" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
        <a className="mobile-brand" href="/">
          {(config?.tienda_nombre || 'MindyLu').toLowerCase() === 'mindylu' ? (
            <>Mindy<span className="script-text">Lu</span></>
          ) : (
            config?.tienda_nombre || 'MindyLu'
          )}
        </a>
        <button className="lp-btn-icon" onClick={() => setCartOpen(true)} style={{ position: 'relative' }}>
          <CartIcon size={24} />
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--color-accent)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cart.length}
            </span>
          )}
        </button>
      </nav>

      {/* Menú mobile Dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--color-bg-alt)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 32
        }}>
          <button onClick={() => setMenuOpen(false)} style={{ position: 'absolute', top: 30, right: 30, background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--color-primary)' }}>&times;</button>
          
          <a className="mobile-brand" href="/" style={{ marginBottom: '20px' }}>
            Mindy<span className="script-text">Lu</span>
          </a>

          {[
            ['NUEVO', catalogRef],
            ['ROPA', catalogRef],
            ['BEST SELLERS', catalogRef],
            ['ACCESORIOS', catalogRef],
            ['SALE', catalogRef]
          ].map(([label, ref]) => (
            <button key={label} onClick={() => { scrollTo(ref); setMenuOpen(false); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "var(--ff-body)", textTransform: 'uppercase', letterSpacing: '3px',
              fontSize: '0.8rem', fontWeight: 600, color: label === 'SALE' ? 'var(--color-accent)' : 'var(--color-text-muted)'
            }}>
              {label}
            </button>
          ))}
          <button onClick={abrirWhatsAppGeneral} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "var(--ff-script)", fontSize: '2rem', color: 'var(--color-primary)', marginTop: '20px'
            }}>
            Contacto
          </button>
        </div>
      )}

      {/* ── Sidebar Desktop ── */}
      <aside className="lp-sidebar">
        <button className="lp-hamburger-desktop" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>

        <nav className="lp-sidebar-links">
          <a onClick={() => scrollTo(catalogRef)}>NUEVO</a>
          <a onClick={() => scrollTo(catalogRef)}>ROPA</a>
          <a onClick={() => scrollTo(catalogRef)}>BEST SELLERS</a>
          <a onClick={() => scrollTo(catalogRef)}>ACCESORIOS</a>
          <a onClick={() => scrollTo(catalogRef)} style={{ color: 'var(--color-accent)' }}>SALE</a>
        </nav>

        <a className="lp-sidebar-brand" href="/">
          {(config?.tienda_nombre || 'MindyLu').toLowerCase() === 'mindylu' ? (
            <>Mindy<span className="script-text">Lu</span></>
          ) : (
            config?.tienda_nombre || 'MindyLu'
          )}
        </a>
      </aside>

      {/* ── Contenedor Principal ── */}
      <main className="lp-main-content">

        {/* ── Hero Split Asimétrico ── */}
        <section className="lp-hero-split fade-up-element">
          <div className="lp-hero-text-area">
            <h1 className="lp-hero-title-main">
              {(config?.tienda_nombre || 'MindyLu').toLowerCase() === 'mindylu' ? (
                <>Mindy<br/><span className="script-text">Lu</span></>
              ) : (
                config?.tienda_nombre || 'MindyLu'
              )}
            </h1>
            <p className="lp-hero-subtitle">B O U T I Q U E</p>
            <p className="lp-hero-desc">Moda que te representa.</p>
            <button className="lp-btn-blush" onClick={() => scrollTo(catalogRef)}>
              DESCUBRIR NUEVO
            </button>
            
            {/* Sello Flotante (SVG) */}
            <div className="lp-hero-stamp mobile-hidden">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
                <text fontSize="10" fontWeight="600" letterSpacing="2px" fill="var(--color-primary)" textTransform="uppercase">
                  <textPath href="#circlePath">
                    POR MUJERES REALES • PARA MUJERES REALES •
                  </textPath>
                </text>
              </svg>
              <div className="heart">♥</div>
            </div>
          </div>
          <div className="lp-hero-img-area">
            <img 
              src={config?.banner_imagen ? (
                config.banner_imagen.startsWith('http') ? config.banner_imagen : `${API_BASE.replace('/api/v1', '')}${config.banner_imagen}`
              ) : config?.tienda_avatar ? (
                config.tienda_avatar.startsWith('http') ? config.tienda_avatar : `${API_BASE.replace('/api/v1', '')}${config.tienda_avatar}`
              ) : "/images/hero.jpg"} 
              alt={config?.banner_titulo || `${config?.tienda_nombre || 'MindyLu'} - Moda`} 
            />
          </div>
        </section>

        {/* ── Sección Actitud (Collage) ── */}
        <section className="lp-section-actitud fade-up-element">
          <div className="actitud-text">
            <h2>
              No es solo<br/>ropa, es tu<br/>
              <span className="script-text">Actitud.</span>
            </h2>
            {/* Trazos SVG simulados con div/background para simplificar */}
            <div style={{ position: 'absolute', top: '70%', left: '-10%', width: '150%', height: '2px', background: 'var(--color-accent)', opacity: 0.3, zIndex: -1, transform: 'rotate(-5deg)' }}></div>
          </div>
          
          <div className="actitud-collage mobile-hidden">
            {/* Polaroids usando las fotos de las primeras prendas si existen */}
            <div className="polaroid">
              <img src={prendas[0]?.foto_url || "/images/placeholder1.jpg"} alt="Moda 1" onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280"><rect width="220" height="280" fill="%23eee"/></svg>'; }} />
            </div>
            <div className="polaroid">
              <img src={prendas[1]?.foto_url || "/images/placeholder2.jpg"} alt="Moda 2" onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280"><rect width="220" height="280" fill="%23ddd"/></svg>'; }} />
            </div>
          </div>

          <div className="actitud-desc">
            <p>DISEÑOS EXCLUSIVOS<br/>PARA MUJERES QUE<br/>ROMPEN REGLAS.</p>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollTo(howtoRef); }} className="actitud-link">CONÓCENOS</a>
          </div>
        </section>

        {/* ── Grid de Categorías Row ── */}
        <section className="lp-categories-row fade-up-element" ref={catalogRef}>
          {['VESTIDOS', 'TOPS', 'PANTALONES', 'ACCESORIOS', 'SETS'].map((cat, i) => (
             <div className="category-box" key={cat} onClick={() => setCatSel(catSel === cat ? 'Todas' : cat)}>
               <img src={prendas[i]?.foto_url || "/images/placeholder1.jpg"} alt={cat} onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%23'+(555+i*10)+'"/></svg>'; }} />
               <div className="category-box-overlay">
                 <h3>{cat} <span>→</span></h3>
               </div>
             </div>
          ))}
        </section>

        {/* ── Summer Edit Collage ── */}
        <section className="lp-summer-edit fade-up-element" ref={howtoRef}>
          <div className="summer-title">
            <p style={{ fontFamily: 'var(--ff-body)', fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>MINDYLU</p>
            <h2>SUMMER<br/>'25<br/>EDIT</h2>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollTo(catalogRef); }} className="actitud-link" style={{ marginTop: '30px' }}>VER EDITORIAL</a>
          </div>
          
          <div className="summer-collage">
            <img src={prendas[2]?.foto_url || "/images/placeholder1.jpg"} alt="Summer" className="img-main" onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23eee"/></svg>'; }} />
            <img src={prendas[3]?.foto_url || "/images/placeholder2.jpg"} alt="Detail" className="img-sub" onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23ddd"/></svg>'; }} />
            
            <div className="ripped-paper mobile-hidden">
              <p>collect<br/>moments<br/>not<br/>things <span style={{fontSize: '1rem'}}>♥</span></p>
            </div>
          </div>
        </section>

        {/* ── Catálogo (Grid de productos real) ── */}
        <section className="lp-section fade-up-element" style={{ background: 'var(--color-bg-alt)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--ff-title)', fontSize: '2rem', fontWeight: 400, color: 'var(--color-primary)' }}>Nuestros Diseños</h2>
          </div>

        {/* Filtros por categoría */}
        <div className="lp-filters">
          <button
            className={`lp-filter-btn ${catSel === '' ? 'active' : ''}`}
            onClick={() => setCatSel('')}
          >
            Todas
          </button>
          {categorias.map(c => (
            <button
              key={c.id}
              className={`lp-filter-btn ${catSel === c.id ? 'active' : ''}`}
              onClick={() => setCatSel(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="lp-loading">
            <div className="lp-spinner" />
            Cargando colección...
          </div>
        ) : (
          <div className="lp-grid">
            {prendas.length === 0 ? (
              <p className="lp-empty">No hay prendas en esta categoría por ahora.</p>
            ) : (
              prendas.map(p => <ProductCard key={p.id} prenda={p} onAddToCart={addToCart} />)
            )}
          </div>
        )}
      </section>

      {/* ── Splash Editorial ── */}
      <div className="lp-splash fade-up-element">
        <p className="lp-splash-quote">
          "La moda no es algo que existe solo en los vestidos. La moda está en el cielo, en la calle; la moda tiene que ver con ideas, con la forma en que vivimos."
        </p>
      </div>

      {/* ── Cómo Comprar ── */}
      <section className="lp-section lp-howto" ref={howtoRef}>
        <p className="lp-section-label lp-text-center">✦ Simple y sin complicaciones</p>
        <h2 className="lp-section-title lp-text-center">¿Cómo <em>Comprar</em>?</h2>
        <div className="lp-steps">
          {[
            { num: '1', icon: '👗', title: 'Ver el Catálogo', desc: 'Navega por nuestras prendas exclusivas y encuentra la que más te gusta.' },
            { num: '2', icon: '💬', title: 'Consultar por WhatsApp', desc: 'Escríbenos directamente. Te atendemos de forma personalizada.' },
            { num: '3', icon: '💖', title: 'Reservar tu Prenda', desc: 'La dueña te confirma disponibilidad y separa la prenda para ti.' },
            { num: '4', icon: '🚚', title: 'Retirar o Recibir', desc: 'Coordina retiro en tienda o despacho a domicilio. ¡Así de fácil!' },
          ].map(step => (
            <div key={step.num} className="lp-step">
              <div className="lp-step-num">{step.num}</div>
              <div className="lp-step-icon">{step.icon}</div>
              <p className="lp-step-title">{step.title}</p>
              <p className="lp-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Próximas Entregas ── */}
      <section className="lp-section lp-entregas" ref={entregasRef}>
        <p className="lp-section-label">✦ Agenda de despachos</p>
        <h2 className="lp-section-title">Próximas <em>Entregas</em></h2>
        <div className="lp-entregas-grid">
          {entregas.length > 0 ? (
            entregas.map((e) => (
              <div key={e.id} className="lp-entrega-card">
                <div className="lp-entrega-icon">📍</div>
                <div className="lp-entrega-info">
                  <strong>{e.punto_entrega_detalle?.nombre || 'Punto de Entrega'}</strong>
                  <p>{e.fecha} · {e.hora_estimada || 'Hora a convenir'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="lp-entrega-card" style={{ gridColumn: '1 / -1', textAlign: 'center', justifyContent: 'center' }}>
              <div className="lp-entrega-info">
                <strong>No hay rutas programadas por ahora</strong>
                <p>Consulte por WhatsApp para coordinar despachos.</p>
              </div>
            </div>
          )}
          <div className="lp-entrega-card">
            <div className="lp-entrega-icon">🚚</div>
            <div className="lp-entrega-info">
              <strong>Despacho a domicilio</strong>
              <p>Coordinar por WhatsApp</p>
            </div>
          </div>
        </div>
      </section>

      {/* Renderizar modal si hay prenda seleccionada */}
      {selectedPrenda && (
        <ProductModal 
          prenda={selectedPrenda} 
          onClose={() => setSelectedPrenda(null)} 
          onAddToCart={addToCart} 
        />
      )}

      {/* ── Carrito Flotante Modal ── */}
      {cartOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px',
          background: '#fff', zIndex: 1000, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column',
          transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 600 }}>Mi Consulta</h3>
            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>Tu lista está vacía.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cart.map(p => {
                  const cartImgUrl = (p.color && p.imagenes?.find(i => i.color?.toLowerCase() === p.color.toLowerCase())?.imagen) || p.imagenes?.[0]?.imagen || p.foto_url || '';
                  return (
                  <div key={p.cartItemId || p.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #f5f5f5', paddingBottom: '16px' }}>
                    <img 
                      src={cartImgUrl} 
                      alt={p.nombre} 
                      style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px 0', fontWeight: 500, fontSize: '0.9rem' }}>{p.nombre}</p>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        {p.color && <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#f0f0f0', borderRadius: '4px', color: '#555' }}>Color: {p.color}</span>}
                        {p.talla && <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#f0f0f0', borderRadius: '4px', color: '#555' }}>Talla: {p.talla}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                          <button onClick={() => updateCartQty(p.cartItemId || p.id, -1)} style={{ padding: '2px 8px', background: '#f5f5f5', border: 'none', cursor: 'pointer' }}>-</button>
                          <span style={{ padding: '2px 8px', fontSize: '0.85rem' }}>{p.qty}</span>
                          <button onClick={() => updateCartQty(p.cartItemId || p.id, 1)} style={{ padding: '2px 8px', background: '#f5f5f5', border: 'none', cursor: 'pointer' }}>+</button>
                        </div>
                        <p style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>${(parseInt(p.precio || 0) * p.qty).toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(p.cartItemId || p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '8px' }}>
                      <TrashIcon />
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div style={{ padding: '24px', borderTop: '1px solid #eee', background: '#fafafa' }}>
            <button 
              onClick={abrirWhatsAppCart}
              disabled={cart.length === 0}
              style={{
                width: '100%', padding: '16px', background: 'var(--color-primary)', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                opacity: cart.length === 0 ? 0.7 : 1
              }}
            >
              <WaIcon size={20} /> Enviar consulta por WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Overlay del carrito */}
      {cartOpen && (
        <div 
          onClick={() => setCartOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}

      {/* ── Footer Minimalista ── */}
      <footer className="lp-footer-min">
        <div className="footer-feature">
          <svg viewBox="0 0 24 24"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM1 18h22M5 16v4M19 16v4" strokeWidth="2"/></svg>
          <div>
            <strong>ENVÍOS A TODO CHILE</strong>
            <span>por compras sobre $40.000</span>
          </div>
        </div>
        <div className="footer-feature">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2"/></svg>
          <div>
            <strong>COMPRA SEGURA</strong>
            <span>Paga como más te acomode</span>
          </div>
        </div>
        <div className="footer-feature" onClick={abrirWhatsAppGeneral} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeWidth="2"/></svg>
          <div>
            <strong>¿NECESITAS AYUDA?</strong>
            <span>Escríbenos por WhatsApp</span>
          </div>
        </div>
      </footer>
      </main> {/* Cierre del contenedor principal */}
    </div>
  );
};

export default PublicCatalog;
