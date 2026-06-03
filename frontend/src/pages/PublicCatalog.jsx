import { useState, useEffect } from 'react';
import axios from 'axios';

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
    // Idealmente el número vendría de los ajustes de la tienda, por ahora un placeholder
    const telefono = "56900000000"; 
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-50">
        <h1 className="text-2xl font-serif text-center font-bold text-gray-800">MindyLu</h1>
        <p className="text-center text-sm text-gray-500">Catálogo Oficial</p>
      </header>

      <div className="px-4 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar flex space-x-2">
        <button
          onClick={() => setCategoriaSel('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoriaSel === '' ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}
        >
          Todas
        </button>
        {categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCategoriaSel(c.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoriaSel === c.id ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <main className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <p className="col-span-full text-center text-gray-500 mt-10">Cargando colección...</p>
        ) : prendas.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 mt-10">No hay prendas disponibles en esta categoría.</p>
        ) : (
          prendas.map(prenda => (
            <div key={prenda.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col relative">
              {prenda.estado === 'reservada' && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded shadow z-10">
                  RESERVADA
                </div>
              )}
              <div className="aspect-[3/4] bg-gray-100 relative">
                {prenda.imagenes && prenda.imagenes.length > 0 ? (
                  <img src={prenda.imagenes[0].imagen} alt={prenda.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin foto</div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{prenda.nombre}</h3>
                <p className="text-pink-600 font-bold mt-1">${parseInt(prenda.precio).toLocaleString('es-CL')}</p>
                
                <div className="text-xs text-gray-500 mt-2 mb-3">
                  {prenda.talla_tipo === 'unica' ? 'Talla Única' : (
                    prenda.variantes?.map(v => v.talla).join(', ')
                  )}
                </div>

                <button
                  onClick={() => handleMeInteresa(prenda)}
                  className={`mt-auto w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${prenda.estado === 'reservada' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-500 text-white shadow-sm'}`}
                >
                  <i className="fa-brands fa-whatsapp text-lg"></i>
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
