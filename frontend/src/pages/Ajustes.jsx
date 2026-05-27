import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Tag, Palette, Type, Search } from 'lucide-react';
import api from '../services/api';
import './Ajustes.css';

const MantenedorList = ({ titulo, icono, endpoint, placeholder }) => {
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await api.get(endpoint);
      setItems(res.data.results || res.data);
    } catch (error) {
      console.error(`Error al cargar ${titulo}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nuevoItem.trim()) return;
    
    try {
      await api.post(endpoint, { nombre: nuevoItem });
      setNuevoItem('');
      fetchItems();
    } catch (error) {
      alert(`Error al guardar ${titulo}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que quieres borrar este elemento?')) return;
    try {
      await api.delete(`${endpoint}${id}/`);
      fetchItems();
    } catch (error) {
      alert(`Error al borrar ${titulo}`);
    }
  };

  return (
    <div className="mantenedor-card card glass">
      <div className="mantenedor-header">
        {icono}
        <h3>{titulo}</h3>
      </div>
      
      <form className="mantenedor-form" onSubmit={handleAdd}>
        <input 
          type="text" 
          value={nuevoItem} 
          onChange={(e) => setNuevoItem(e.target.value)} 
          placeholder={placeholder} 
        />
        <button type="submit" className="btn btn-primary btn-icon">
          <Plus size={18} />
        </button>
      </form>

      <div className="mantenedor-lista">
        {loading ? <p className="text-muted">Cargando...</p> : items.length === 0 ? <p className="text-muted">No hay elementos.</p> : (
          items.map(item => (
            <div key={item.id} className="mantenedor-item">
              <span>{item.nombre}</span>
              <button type="button" className="btn-icon-danger" onClick={() => handleDelete(item.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Ajustes = () => {
  return (
    <div className="page-container page-ajustes animate-fade-in">
      <div className="page-header">
        <h1>
          <Settings size={28} />
          Ajustes
        </h1>
        <p className="subtitle">Configura los valores por defecto de la aplicación.</p>
      </div>

      <div className="ajustes-grid">
        <MantenedorList 
          titulo="Categorías" 
          icono={<Tag size={20} className="icon-accent" />} 
          endpoint="/catalogo/categorias/" 
          placeholder="Nueva categoría (ej. Pantalones)"
        />
        <MantenedorList 
          titulo="Nombres de Prendas" 
          icono={<Type size={20} className="icon-accent" />} 
          endpoint="/catalogo/nombres-prendas/" 
          placeholder="Nuevo nombre base"
        />
        <MantenedorList 
          titulo="Colores" 
          icono={<Palette size={20} className="icon-accent" />} 
          endpoint="/catalogo/colores/" 
          placeholder="Nuevo color (ej. Burdeo)"
        />
        <MantenedorList 
          titulo="Tallas" 
          icono={<Search size={20} className="icon-accent" />} 
          endpoint="/catalogo/tallas/" 
          placeholder="Nueva talla (ej. XXL)"
        />
      </div>
    </div>
  );
};

export default Ajustes;
