// ─────────────────────────────────────────────────────────────
// frontend/src/pages/PublicCatalog.jsx
// Catálogo público, sin autenticación, responsive desktop/mobile
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import axios from 'axios';
import './PublicCatalog.css';

// La URL base del API sin el prefijo /api/ (se agrega por separado)
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/').replace(/\/api\/v1\/?$/, '');

const WaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSel, setCategoriaSel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchPrendas();
  }, [categoriaSel]);

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/catalogo/publico/categorias/`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCategorias(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchPrendas = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/api/v1/catalogo/publico/prendas/`;
      if (categoriaSel) url += `?categoria=${categoriaSel}`;
      const res = await axios.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPrendas(data);
    } catch (error) {
      console.error('Error cargando prendas:', error);
      setPrendas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMeInteresa = (prenda) => {
    const nombre = prenda.nombre || 'una prenda';
    const precio = prenda.precio ? ` ($${parseInt(prenda.precio).toLocaleString('es-CL')})` : '';
    const mensaje = encodeURIComponent(
      `¡Hola MindyLu! 👋\nMe interesa la prenda: *${nombre}*${precio}.\n¿Sigue disponible?`
    );
    // El número de WhatsApp se configura en ajustes — por ahora placeholder
    const telefono = '56900000000';
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };

  const seleccionarCategoria = (id) => setCategoriaSel(id);

  return (
    <div className="pc-root">
      {/* ── Cabecera ── */}
      <header className="pc-header">
        <div className="pc-header-brand">
          <h1>MindyLu</h1>
          <p>Catálogo Oficial</p>
        </div>
      </header>

      <div className="pc-layout">
        {/* ── Sidebar categorías (desktop) ── */}
        <aside className="pc-sidebar">
          <h3>Categorías</h3>
          <button
            className={`pc-sidebar-btn ${categoriaSel === '' ? 'active' : ''}`}
            onClick={() => seleccionarCategoria('')}
          >
            Todas
          </button>
          {categorias.map(c => (
            <button
              key={c.id}
              className={`pc-sidebar-btn ${categoriaSel === c.id ? 'active' : ''}`}
              onClick={() => seleccionarCategoria(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </aside>

        {/* ── Contenido principal ── */}
        <main className="pc-main">
          {/* Chips categorías (mobile) */}
          <div className="pc-chips">
            <button
              className={`pc-chip ${categoriaSel === '' ? 'active' : ''}`}
              onClick={() => seleccionarCategoria('')}
            >
              Todas
            </button>
            {categorias.map(c => (
              <button
                key={c.id}
                className={`pc-chip ${categoriaSel === c.id ? 'active' : ''}`}
                onClick={() => seleccionarCategoria(c.id)}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          {/* Grilla de prendas */}
          {loading ? (
            <div className="pc-loading">
              <div className="pc-empty-icon">✨</div>
              Cargando colección...
            </div>
          ) : prendas.length === 0 ? (
            <div className="pc-grid">
              <div className="pc-empty">
                <div className="pc-empty-icon">🛍️</div>
                <p>No hay prendas disponibles en esta categoría.</p>
              </div>
            </div>
          ) : (
            <div className="pc-grid">
              {prendas.map(prenda => (
                <div key={prenda.id} className="pc-card">
                  {prenda.estado === 'reservada' && (
                    <div className="pc-badge-reservada">Reservada</div>
                  )}

                  <div className="pc-card-img">
                    {prenda.imagenes && prenda.imagenes.length > 0 ? (
                      <img src={prenda.imagenes[0].imagen} alt={prenda.nombre} />
                    ) : (
                      <div className="pc-card-no-img">Sin foto</div>
                    )}
                  </div>

                  <div className="pc-card-body">
                    <h3 className="pc-card-name">{prenda.nombre}</h3>
                    <p className="pc-card-price">
                      ${parseInt(prenda.precio || 0).toLocaleString('es-CL')}
                    </p>
                    <p className="pc-card-tallas">
                      {prenda.talla_tipo === 'unica'
                        ? 'Talla Única'
                        : prenda.variantes?.map(v => v.talla).filter(Boolean).join(' · ')}
                    </p>

                    <button
                      onClick={() => handleMeInteresa(prenda)}
                      className={`pc-btn-wa ${prenda.estado === 'reservada' ? 'reservada' : 'disponible'}`}
                    >
                      <WaIcon />
                      {prenda.estado === 'reservada' ? 'Consultar disponibilidad' : 'Me interesa'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PublicCatalog;
