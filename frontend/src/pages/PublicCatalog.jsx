import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';
import './PublicCatalog.css';

// Íconos SVG simples
const LockIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const HeartIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [config, setConfig] = useState(null);
  const [prendaSeleccionada, setPrendaSeleccionada] = useState(null);
  
  useEffect(() => {
    document.title = "Mindy Lu - Boutique";
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    try {
      const { data } = await api.get('/catalogo/publico/prendas/');
      const items = data.results || data; // Manejar paginación
      // Asegurar que solo usamos prendas activas
      const activas = items.filter(p => p.estado !== 'VENDIDO');
      setPrendas(activas.length > 0 ? activas : items);
      
      const confRes = await api.get('/core/configuracion/publico/');
      setConfig(confRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const abrirWhatsAppGeneral = () => {
    const num = config?.telefono_whatsapp || '56912345678';
    window.open(`https://wa.me/${num}?text=Hola, quiero consultar sobre sus prendas.`, '_blank');
  };

  const getCategorias = () => [...new Set(prendas.map(p => p.categoria).filter(Boolean))];
  const categorias = getCategorias();
  
  // Helpers para extraer imágenes de las prendas reales
  const getPrendaImg = (index) => {
    if (!prendas || !prendas[index]) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
    const p = prendas[index];
    return p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
  };

  // Best sellers: tomamos las 4 primeras
  const bestSellers = prendas.slice(0, 4);

  return (
    <div className="mu-root">
      
      {/* ── Navbar ── */}
      <nav className="mu-nav">
        <div style={{width: '20px'}}></div> {/* Placeholder para centrar logo */}
        <div className="mu-nav-logo">
          <img src="/images/logomindylu.png" alt="Mindy Lu Logo" onError={(e) => e.target.style.display='none'} />
        </div>
        <div onClick={abrirWhatsAppGeneral} style={{cursor:'pointer'}}>
          <LockIcon />
        </div>
      </nav>

      {/* ── Screen 1: Hero ── */}
      <section className="mu-hero-1">
        <p className="subtitle">MODA QUE TE REPRESENTA.</p>
        
        <div className="mu-hero-1-img-wrap">
          <img src={config?.banner_imagen || getPrendaImg(0)} alt="Hero" />
          
          <div className="mu-hero-1-overlay">
            <span className="script">new<br/>collection</span>
          </div>
          
          <div className="mu-hero-1-btn-wrap">
            <button className="btn-primary" onClick={() => document.getElementById('catalogo-completo').scrollIntoView({behavior:'smooth'})}>DESCUBRIR</button>
          </div>
        </div>
        
        <div className="mu-hero-1-pink-block">
          <strong>PARA MUJERES<br/>REALES QUE<br/>ROMPEN REGLAS.</strong>
          <span>→</span>
          <div className="washi-tape pink" style={{top: '-10px', right: '30px', transform: 'rotate(5deg)'}}></div>
        </div>
        
        <div className="mu-hero-1-bottom-img">
          <img src={getPrendaImg(1)} alt="Detail" />
        </div>
      </section>

      {/* ── Screen 2: Nueva Colección ── */}
      <section className="mu-hero-2">
        <div className="mu-hero-2-text">
          <div className="brand-small">MINDY LU</div>
          <h2>NUEVA<br/>COLECCIÓN</h2>
          <span className="script-title">Verano '24</span>
          <button className="btn-outline" onClick={() => document.getElementById('catalogo-completo').scrollIntoView({behavior:'smooth'})}>VER TODO</button>
        </div>
        
        <div className="mu-collage-wrap">
          <div className="mu-polaroid mu-polaroid-1">
            <div className="washi-tape pink" style={{top: '-10px', left: '20px', width: '60px'}}></div>
            <img src={config?.polaroid_1_imagen || getPrendaImg(2)} alt="Polaroid 1" />
          </div>
          <div className="mu-polaroid mu-polaroid-2">
            <img src={config?.polaroid_2_imagen || getPrendaImg(3)} alt="Polaroid 2" />
          </div>
          <div className="mu-polaroid mu-polaroid-3">
            <img src={config?.polaroid_3_imagen || getPrendaImg(4)} alt="Polaroid 3" />
          </div>
        </div>
        
        <div className="mu-hero-2-footer script">
          because you<br/>are art. <HeartIcon />
        </div>
      </section>

      {/* ── Screen 3: Categorías ── */}
      <section className="mu-categories">
        <div className="brand-small" style={{textAlign:'left', marginBottom:'10px'}}>MINDY LU</div>
        <h2>CATEGORÍAS</h2>
        
        <div className="mu-cat-list">
          {categorias.length > 0 ? categorias.map((cat, idx) => {
            // Buscar la primera prenda de esta categoría para usarla de fondo
            const pCat = prendas.find(p => p.categoria === cat);
            const bgImg = pCat ? (pCat.foto_url || (pCat.imagenes && pCat.imagenes[0]?.imagen)) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
            return (
              <a href={`#catalogo-completo`} key={idx} className="mu-cat-item">
                <img src={bgImg} alt={cat} />
                <span>{cat}<br/><small style={{fontSize:'0.5rem', opacity:0.8}}>VER MÁS →</small></span>
              </a>
            );
          }) : (
            <p style={{color: '#888', fontSize: '0.8rem'}}>No hay categorías aún.</p>
          )}
        </div>
        <div style={{marginTop: '40px', textAlign: 'right'}}><HeartIcon /></div>
        <div className="torn-edge-pink"></div>
      </section>

      {/* ── Screen 4: Best Sellers ── */}
      <section className="mu-best-sellers">
        <div className="brand-small" style={{textAlign:'left', marginBottom:'10px'}}>MINDY LU</div>
        <h2>BEST<br/>SELLERS <HeartIcon /></h2>
        
        <div className="mu-grid-products">
          {bestSellers.map(p => {
            const imgUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
            return (
              <div key={p.id} className="mu-product-card" onClick={() => setPrendaSeleccionada(p)} style={{cursor: 'pointer'}}>
                <img src={imgUrl} alt={p.nombre} className="mu-product-img" />
                <div className="mu-product-title">{p.nombre}</div>
                <div className="mu-product-price">${parseInt(p.precio||0).toLocaleString('es-CL')}</div>
              </div>
            );
          })}
        </div>
        
        <div style={{marginTop: '40px', textAlign: 'center'}} className="script" style={{fontSize: '2rem'}}>
          you glow different <HeartIcon />
        </div>
        <div className="torn-edge-pink"></div>
      </section>

      {/* ── Screen 5: Catálogo Completo (NUEVO) ── */}
      <section id="catalogo-completo" className="mu-best-sellers" style={{background: '#FDFBF7', padding: '60px 5% 100px 5%'}}>
        <div className="brand-small" style={{textAlign:'left', marginBottom:'10px'}}>MINDY LU</div>
        <h2 style={{fontSize: '1.5rem', marginBottom: '40px'}}>NUESTRO CATÁLOGO</h2>
        
        <div className="mu-grid-products">
          {prendas.map(p => {
            const imgUrl = p.foto_url || (p.imagenes && p.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
            return (
              <div key={p.id} className="mu-product-card" onClick={() => setPrendaSeleccionada(p)} style={{cursor: 'pointer'}}>
                <img src={imgUrl} alt={p.nombre} className="mu-product-img" />
                <div className="mu-product-title">{p.nombre}</div>
                <div className="mu-product-price">${parseInt(p.precio||0).toLocaleString('es-CL')}</div>
                <button className="btn-dark" style={{padding: '6px 12px', marginTop: '10px', fontSize: '0.6rem'}}>
                  VER DETALLE
                </button>
              </div>
            );
          })}
        </div>
        <div className="torn-edge-white" style={{backgroundSize: '100% 100%', backgroundImage: 'url("data:image/svg+xml;utf8,<svg viewBox=\\"0 0 1200 50\\" xmlns=\\"http://www.w3.org/2000/svg\\" preserveAspectRatio=\\"none\\"><path d=\\"M0,50 L0,25 C100,10 200,40 300,20 C400,0 500,30 600,15 C700,0 800,40 900,20 C1000,0 1100,30 1200,15 L1200,50 Z\\" fill=\\"%23EBAEB6\\" /></svg>")'}}></div>
      </section>

      {/* ── Screen 6: Actitud ── */}
      <section className="mu-actitud">
        <div className="mu-actitud-polaroid">
          <div className="washi-tape black" style={{top: '-15px', left: '50%', transform: 'translateX(-50%) rotate(-2deg)'}}></div>
          <img src={getPrendaImg(Math.min(5, prendas.length - 1))} alt="Actitud" />
        </div>
        
        <div className="mu-actitud-text">
          NO ES SOLO<br/>ROPA, ES TU
          <span className="script">Actitud.</span>
        </div>
        <div style={{position: 'absolute', right: '40px', top: '60%'}}><HeartIcon /></div>
        
        <p className="mu-actitud-desc">
          DISEÑOS EXCLUSIVOS<br/>PARA MUJERES QUE<br/>ELIGEN DESTACAR.
        </p>
        <div className="torn-edge-white"></div>
      </section>

      {/* ── Screen 7: Reseñas ── */}
      <section className="mu-reviews">
        <div className="brand-small">MINDY LU</div>
        <h2>LO QUE DICEN <HeartIcon /><br/><span className="script">nuestras clientas</span></h2>
        
        <div className="mu-review-cards">
          <div className="mu-review-card">
            <p>La calidad es increíble y los diseños son demasiado lindos. ¡MindyLu se ha vuelto mi tienda favorita! 🤍</p>
            <span>- Vale R.</span>
          </div>
          <div className="mu-review-card">
            <p>Ropa que realmente te hace sentir segura y poderosa. 100% recomendada.</p>
            <span>- Cami P.</span>
          </div>
        </div>
        
        <button className="btn-dark">VER MÁS RESEÑAS</button>
        <div className="torn-edge-pink"></div>
      </section>

      {/* ── Screen 8: Summer Edit ── */}
      <section className="mu-summer">
        <div className="brand-small" style={{marginBottom: '20px'}}>MINDY LU</div>
        <div className="mu-summer-header">
          <h2>SUMMER<br/>'24<br/>EDIT</h2>
          <p>UN VERANO PARA<br/>EXPRESAR QUIÉN ERES.</p>
          <button className="btn-dark" style={{marginTop: '15px'}} onClick={() => document.getElementById('catalogo-completo').scrollIntoView({behavior:'smooth'})}>VER EDITORIAL</button>
        </div>
        
        <div className="mu-summer-img-wrap">
          <img src={getPrendaImg(Math.min(6, prendas.length - 1))} alt="Summer Edit" />
          
          <div className="mu-summer-note">
            <div className="washi-tape pink" style={{top: '-15px', right: '-10px', transform: 'rotate(15deg)', width: '60px'}}></div>
            <span className="script">collect<br/>moments,<br/>not<br/>things. <HeartIcon /></span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mu-footer">
        <div className="mu-footer-item">
          <svg viewBox="0 0 24 24"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM1 18h22M5 16v4M19 16v4" strokeWidth="2"/></svg>
          <div>
            <strong>ENVÍOS A<br/>TODO CHILE</strong>
            <span>En compras sobre<br/>$40.000</span>
          </div>
        </div>
        
        <div className="mu-footer-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2"/></svg>
          <div>
            <strong>COMPRA<br/>SEGURA</strong>
            <span>Paga como más<br/>te acomode</span>
          </div>
        </div>
        
        <div className="mu-footer-item" onClick={abrirWhatsAppGeneral} style={{cursor:'pointer'}}>
          <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeWidth="2"/></svg>
          <div>
            <strong>¿NECESITAS AYUDA?</strong>
            <span>Escríbenos por<br/>WhatsApp</span>
          </div>
        </div>
        
        <div className="mu-footer-item">
          <HeartIcon />
          <div>
            <strong>SÍGUENOS</strong>
            <span>@mindylu.cl</span>
          </div>
        </div>
      </footer>
      
      {/* ── Modal de Detalle de Prenda ── */}
      {prendaSeleccionada && (
        <div className="mu-modal-overlay" onClick={() => setPrendaSeleccionada(null)}>
          <div className="mu-modal-content" onClick={e => e.stopPropagation()}>
            <button className="mu-modal-close" onClick={() => setPrendaSeleccionada(null)}>
              <X size={24} />
            </button>
            <div className="mu-modal-grid">
              <div className="mu-modal-img-col">
                <img 
                  src={prendaSeleccionada.foto_url || (prendaSeleccionada.imagenes && prendaSeleccionada.imagenes[0]?.imagen) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"} 
                  alt={prendaSeleccionada.nombre} 
                />
              </div>
              <div className="mu-modal-info-col">
                <div className="brand-small" style={{textAlign: 'left', marginBottom: '10px'}}>MINDY LU</div>
                <h2>{prendaSeleccionada.nombre}</h2>
                <div className="mu-product-price" style={{fontSize: '1.5rem', margin: '15px 0'}}>${parseInt(prendaSeleccionada.precio||0).toLocaleString('es-CL')}</div>
                
                <div className="mu-modal-variants">
                  <h4>Opciones Disponibles:</h4>
                  {prendaSeleccionada.variantes && prendaSeleccionada.variantes.length > 0 ? (
                    <ul>
                      {prendaSeleccionada.variantes.map(v => (
                        <li key={v.id}>• {v.color} - {v.talla}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Talla y color único.</p>
                  )}
                </div>

                <p className="mu-modal-desc">
                  Prenda sujeta a disponibilidad de stock. Contáctanos para solicitar la tuya o preguntar por más detalles.
                </p>

                <button 
                  className="btn-primary" 
                  style={{width: '100%', marginTop: 'auto', padding: '15px'}}
                  onClick={() => {
                    const num = config?.whatsapp_numero || '56912345678';
                    const msg = encodeURIComponent(`Hola, me interesa la prenda: *${prendaSeleccionada.nombre}* a $${parseInt(prendaSeleccionada.precio||0).toLocaleString('es-CL')}. ¿Tienen disponibilidad?`);
                    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" style={{marginRight: '8px'}}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" fill="none" strokeWidth="2"/></svg>
                  ME INTERESA
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
