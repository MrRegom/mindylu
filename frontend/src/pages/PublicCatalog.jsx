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

// Número de WhatsApp de la tienda (configurable)
const WA_NUMBER = '56900000000';

// ── Icono WhatsApp SVG ─────────────────────────────────────
const WaIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

// ── Helper: abrir WhatsApp ─────────────────────────────────
const abrirWhatsApp = (prenda) => {
  const nombre = prenda?.nombre || 'una prenda';
  const precio = prenda?.precio ? ` - $${parseInt(prenda.precio).toLocaleString('es-CL')}` : '';
  const msg = encodeURIComponent(
    `¡Hola LuPrenditas! 👗\nMe interesa: *${nombre}*${precio}.\n¿Está disponible?`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
};

const abrirWhatsAppGeneral = () => {
  const msg = encodeURIComponent('¡Hola LuPrenditas! Me gustaría ver el catálogo 💕');
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
};

// ── Tarjeta de Producto ────────────────────────────────────
const ProductCard = ({ prenda }) => {
  const estado = prenda.estado || 'disponible';
  
  let imagen = prenda.imagenes?.[0]?.imagen || prenda.foto_url;
  if (imagen && !imagen.startsWith('http')) {
    const baseUrl = API_BASE.replace('/api/v1', '');
    imagen = `${baseUrl}${imagen.startsWith('/') ? '' : '/'}${imagen}`;
  }
  
  const precio = parseInt(prenda.precio || 0).toLocaleString('es-CL');
  const tallas = prenda.variantes?.map(v => v.talla).filter(Boolean).join(' · ');

  const estadoLabel = {
    disponible: 'Disponible',
    reservada:  'Reservado',
    vendida:    'Vendido',
  }[estado] || 'Disponible';

  return (
    <article className="lp-card">
      <div className="lp-card-img-wrap">
        {imagen ? (
          <img src={imagen} alt={prenda.nombre} loading="lazy" />
        ) : (
          <div className="lp-card-no-img">
            <span>👗</span>
            <span>Sin foto</span>
          </div>
        )}
        <div className={`lp-card-status ${estado}`}>{estadoLabel}</div>
        {estado !== 'vendida' && (
          <div className="lp-card-overlay">
            <button
              className="lp-card-btn wa"
              onClick={(e) => { e.stopPropagation(); abrirWhatsApp(prenda); }}
            >
              <WaIcon /> Me Interesa
            </button>
          </div>
        )}
      </div>
      <div className="lp-card-info">
        <p className="lp-card-name">{prenda.nombre}</p>
        <p className="lp-card-price">${precio}</p>
        {tallas && <p className="lp-card-tallas">{tallas}</p>}
        {estado !== 'vendida' && (
          <button
            className="lp-card-btn-mobile wa"
            onClick={(e) => { e.stopPropagation(); abrirWhatsApp(prenda); }}
          >
            <WaIcon /> Lo quiero
          </button>
        )}
      </div>
    </article>
  );
};

// ── Componente Principal ───────────────────────────────────
const PublicCatalog = () => {
  const [prendas, setPrendas]       = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catSel, setCatSel]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [menuOpen, setMenuOpen]     = useState(false);

  const catalogRef  = useRef(null);
  const catRef      = useRef(null);
  const howtoRef    = useRef(null);
  const entregasRef = useRef(null);

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchPrendas();
  }, [catSel]);

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

  return (
    <div className="lp-root">

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <a className="lp-nav-brand" href="/">Lu<span>Prenditas</span></a>

        <ul className="lp-nav-links">
          <li><a onClick={() => scrollTo(catalogRef)}>Catálogo</a></li>
          <li><a onClick={() => scrollTo(catRef)}>Categorías</a></li>
          <li><a onClick={() => scrollTo(howtoRef)}>Cómo Comprar</a></li>
          <li><a onClick={() => scrollTo(entregasRef)}>Entregas</a></li>
        </ul>

        <button className="lp-nav-wa" onClick={abrirWhatsAppGeneral}>
          <WaIcon /> WhatsApp
        </button>

        <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          <span /><span /><span />
        </button>
      </nav>

      {/* Menú mobile */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 70, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.98)', zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 32
        }}>
          {[
            ['Ver Catálogo', catalogRef],
            ['Categorías', catRef],
            ['Cómo Comprar', howtoRef],
            ['Próximas Entregas', entregasRef],
          ].map(([label, ref]) => (
            <button key={label} onClick={() => scrollTo(ref)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.6rem', fontWeight: 600, color: '#111'
            }}>
              {label}
            </button>
          ))}
          <button className="lp-nav-wa" style={{ marginTop: 16 }} onClick={abrirWhatsAppGeneral}>
            <WaIcon size={18} /> Escribir por WhatsApp
          </button>
        </div>
      )}

      {/* ── Banner rotante ── */}
      <div className="lp-banner" style={{ marginTop: 70 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <>
            <span key={`t${i}`} className="lp-banner-text">Nueva Colección 2025</span>
            <span key={`d${i}`} className="lp-banner-dot" />
          </>
        ))}
      </div>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <img src="/images/hero.jpg" alt="LuPrenditas - Moda Femenina" className="lp-hero-img" />
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <div className="lp-hero-tag">✦ Nueva Colección</div>
          <h1 className="lp-hero-title">
            Moda femenina<br /><em>seleccionada</em><br />especialmente para ti
          </h1>
          <p className="lp-hero-sub">
            Prendas únicas, elegantes y exclusivas.<br />
            Cada pieza seleccionada con amor y estilo.
          </p>
          <div className="lp-hero-ctas">
            <button className="lp-btn-primary" onClick={() => scrollTo(catalogRef)}>
              Ver Catálogo
            </button>
            <button className="lp-btn-outline" onClick={abrirWhatsAppGeneral}>
              Consultar por WhatsApp
            </button>
          </div>
        </div>
        <div className="lp-hero-scroll">Scroll</div>
      </section>

      {/* ── Nuevos Ingresos ── */}
      <section className="lp-section" ref={catalogRef}>
        <div className="lp-products-header">
          <div>
            <p className="lp-section-label">✦ Recién llegadas</p>
            <h2 className="lp-section-title">Nuevos <em>Ingresos</em></h2>
          </div>
          <button className="lp-btn-ghost" onClick={() => setCatSel('')}>
            Ver Todo
          </button>
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
          <div className="lp-products-grid">
            {prendas.length === 0 ? (
              <p className="lp-empty">No hay prendas en esta categoría por ahora.</p>
            ) : (
              prendas.map(p => <ProductCard key={p.id} prenda={p} />)
            )}
          </div>
        )}
      </section>

      {/* ── Categorías ── */}
      <section className="lp-section" style={{ background: '#f8f5f2' }} ref={catRef}>
        <p className="lp-section-label lp-text-center">✦ Explora por estilo</p>
        <h2 className="lp-section-title lp-text-center" style={{ marginBottom: 48 }}>
          Nuestras <em>Categorías</em>
        </h2>
        <div className="lp-cats-grid">
          {categorias.length > 0 ? categorias.map(c => (
            <div key={c.id} className="lp-cat-card" onClick={() => { setCatSel(c.id); scrollTo(catalogRef); }}>
              <div className="lp-cat-card-placeholder">{getEmoji(c.nombre)}</div>
              <div className="lp-cat-card-overlay">
                <span className="lp-cat-name">{c.nombre}</span>
              </div>
            </div>
          )) : ['Vestidos', 'Blusas', 'Jeans', 'Chaquetas', 'Accesorios'].map((cat, i) => (
            <div key={i} className="lp-cat-card">
              <div className="lp-cat-card-placeholder">{['👗','👚','👖','🧥','👜'][i]}</div>
              <div className="lp-cat-card-overlay">
                <span className="lp-cat-name">{cat}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote central ── */}
      <div className="lp-splash">
        <p className="lp-splash-quote">
          "Cada prenda tiene una historia. La tuya comienza aquí."
        </p>
        <p className="lp-splash-author">LuPrenditas · Boutique Exclusiva</p>
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
          {[
            { icon: '📍', lugar: 'Centro de Viña del Mar', horario: 'Lunes y Miércoles · 10:00–13:00' },
            { icon: '📍', lugar: 'Estación Limache', horario: 'Martes · 14:00–17:00' },
            { icon: '🚚', lugar: 'Despacho a domicilio', horario: 'Coordinar por WhatsApp' },
          ].map((e, i) => (
            <div key={i} className="lp-entrega-card">
              <div className="lp-entrega-icon">{e.icon}</div>
              <div className="lp-entrega-info">
                <strong>{e.lugar}</strong>
                <p>{e.horario}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div>
            <span className="lp-footer-brand">Lu<span>Prenditas</span></span>
            <p className="lp-footer-desc">
              Boutique de moda femenina exclusiva.<br />
              Moda seleccionada especialmente para ti,<br />
              con atención personalizada.
            </p>
            <div className="lp-footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="lp-social-btn" title="Instagram">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="lp-social-btn" title="Facebook">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <button className="lp-social-btn" title="WhatsApp" onClick={abrirWhatsAppGeneral}>
                <WaIcon />
              </button>
            </div>
          </div>

          <div className="lp-footer-col">
            <h5>Catálogo</h5>
            <ul>
              {['Vestidos', 'Blusas', 'Jeans', 'Chaquetas', 'Accesorios'].map(c => (
                <li key={c}><span onClick={() => scrollTo(catalogRef)}>{c}</span></li>
              ))}
            </ul>
          </div>

          <div className="lp-footer-col">
            <h5>Información</h5>
            <ul>
              <li><span onClick={() => scrollTo(howtoRef)}>Cómo Comprar</span></li>
              <li><span onClick={() => scrollTo(entregasRef)}>Próximas Entregas</span></li>
              <li><span onClick={abrirWhatsAppGeneral}>Contacto</span></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h5>Contacto</h5>
            <ul>
              <li><span>WhatsApp directo</span></li>
              <li><span>Lunes a Sábado</span></li>
              <li><span>10:00 – 20:00 hrs</span></li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© 2025 LuPrenditas · Boutique Femenina</span>
          <span>Hecho con 💕 para ti</span>
        </div>
      </footer>

    </div>
  );
};

export default PublicCatalog;
