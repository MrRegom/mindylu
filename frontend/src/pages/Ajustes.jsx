import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Trash2, Tag, Palette, Type, Pencil, Check, X, Ruler } from 'lucide-react';
import api from '../services/api';
import './Ajustes.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

/**
 * Componente mantenedor genérico para listas de catálogo.
 * Soporta: agregar, editar inline y eliminar ítems.
 * Cumple SRP — solo gestiona una lista de un endpoint dado.
 */
const MantenedorList = ({ titulo, icono, endpoint, placeholder }) => {
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [loading, setLoading] = useState(true);
  // Estado para edición inline: { id, valor }
  const [editando, setEditando] = useState(null);
  const editInputRef = useRef(null);

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

  // Foco automático al activar edición
  useEffect(() => {
    if (editando && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editando]);

  /** Formato Title Case al guardar */
  const toTitleCase = (str) =>
    str.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nuevoItem.trim()) return;
    const nombreFormateado = toTitleCase(nuevoItem);
    try {
      await api.post(endpoint, { nombre: nombreFormateado });
      setNuevoItem('');
      fetchItems();
      showToast('success', `${nombreFormateado} agregado`);
    } catch (error) {
      showAlert(`Error al guardar en ${titulo}`);
    }
  };

  const handleStartEdit = (item) => {
    setEditando({ id: item.id, valor: item.nombre });
  };

  const handleCancelEdit = () => {
    setEditando(null);
  };

  const handleSaveEdit = async () => {
    if (!editando || !editando.valor.trim()) return;
    const nombreFormateado = toTitleCase(editando.valor);
    try {
      await api.patch(`${endpoint}${editando.id}/`, { nombre: nombreFormateado });
      setEditando(null);
      fetchItems();
      showToast('success', `Actualizado a "${nombreFormateado}"`);
    } catch (error) {
      showAlert(`Error al actualizar en ${titulo}`);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const handleDelete = async (id) => {
    if (!await showConfirm('¿Eliminar este elemento?')) return;
    try {
      await api.delete(`${endpoint}${id}/`);
      fetchItems();
      showToast('success', 'Eliminado correctamente');
    } catch (error) {
      showAlert(`Error al borrar en ${titulo}`);
    }
  };

  return (
    <div className="mantenedor-card card glass">
      <div className="mantenedor-header">
        {icono}
        <h3>{titulo}</h3>
      </div>

      {/* Lista de ítems existentes */}
      <div className="mantenedor-lista">
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-muted">Sin elementos. Agrega el primero.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="mantenedor-item">
              {editando && editando.id === item.id ? (
                /* Modo edición inline */
                <div className="mantenedor-edit-row">
                  <input
                    ref={editInputRef}
                    className="mantenedor-edit-input"
                    value={editando.valor}
                    onChange={e => setEditando(prev => ({ ...prev, valor: e.target.value }))}
                    onKeyDown={handleEditKeyDown}
                  />
                  <button type="button" className="btn-icon-success" onClick={handleSaveEdit} title="Guardar">
                    <Check size={15} />
                  </button>
                  <button type="button" className="btn-icon-muted" onClick={handleCancelEdit} title="Cancelar">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                /* Modo vista */
                <>
                  <span className="mantenedor-nombre">{item.nombre}</span>
                  <div className="mantenedor-acciones">
                    <button type="button" className="btn-icon-edit" onClick={() => handleStartEdit(item)} title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="btn-icon-danger" onClick={() => handleDelete(item.id)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulario para agregar nuevo */}
      <form className="mantenedor-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={nuevoItem}
          onChange={(e) => setNuevoItem(e.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" className="btn-agregar">
          <Plus size={16} />
          <span>Agregar</span>
        </button>
      </form>
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
          icono={<Ruler size={20} className="icon-accent" />}
          endpoint="/catalogo/tallas/"
          placeholder="Nueva talla (ej. XXL)"
        />
      </div>
    </div>
  );
};

export default Ajustes;
