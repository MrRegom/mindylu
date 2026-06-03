import { useState, useEffect } from 'react';
import axios from 'axios';
import './PublicCatalog.css';

const PublicCatalog = () => {
  const [prendas, setPrendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSel, setCategoriaSel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
    fetchPrendas();
  }, [categoriaSel]);

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/catalogo/publico/categorias/`);
      setCategorias(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPrendas = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/catalogo/publico/prendas/`;
      if (categoriaSel) url += `?categoria=${categoriaSel}`;
      const res = await axios.get(url);
      setPrendas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeInteresa = (prenda) => {
    // Redirigir a WhatsApp
    const mensaje = encodeURIComponent(`¡Hola! Me interesa la prenda: ${prenda.nombre} (Código: ${prenda.id}). ¿Sigue disponible?`);
    const telefono = "56900000000"; // Placeholder
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="public-catalog-container">
      <header className="public-header">
        <h1>MindyLu</h1>
        <p>Catálogo Oficial</p>
      </header>

      <div className="categories-scroll">
        <button
          onClick={() => setCategoriaSel('')}
          className={`category-btn ${categoriaSel === '' ? 'active' : ''}`}
        >
          Todas
        </button>
        {categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCategoriaSel(c.id)}
            className={`category-btn ${categoriaSel === c.id ? 'active' : ''}`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <main className="public-grid">
        {loading ? (
          <p className="empty-message">Cargando colección...</p>
        ) : prendas.length === 0 ? (
          <p className="empty-message">No hay prendas disponibles en esta categoría.</p>
        ) : (
          prendas.map(prenda => (
            <div key={prenda.id} className="public-card">
              {prenda.estado === 'reservada' && (
                <div className="badge-reservada">RESERVADA</div>
              )}
              <div className="card-image-container">
                {prenda.imagenes && prenda.imagenes.length > 0 ? (
                  <img src={prenda.imagenes[0].imagen} alt={prenda.nombre} />
                ) : (
                  <div className="card-no-image">Sin foto</div>
                )}
              </div>
              <div className="card-content">
                <h3 className="card-title">{prenda.nombre}</h3>
                <p className="card-price">${parseInt(prenda.precio).toLocaleString('es-CL')}</p>
                
                <div className="card-variants">
                  {prenda.talla_tipo === 'unica' ? 'Talla Única' : (
                    prenda.variantes?.map(v => v.talla).join(', ')
                  )}
                </div>

                <button
                  onClick={() => handleMeInteresa(prenda)}
                  className={`btn-whatsapp ${prenda.estado === 'reservada' ? 'reservada' : 'disponible'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                  {prenda.estado === 'reservada' ? 'Preguntar' : 'Me interesa'}
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default PublicCatalog;
