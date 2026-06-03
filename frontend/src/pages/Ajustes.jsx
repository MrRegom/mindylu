import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Trash2, Tag, Palette, Type, Pencil, Check, X, Ruler, Terminal, ChevronRight, Upload, Phone, LayoutTemplate, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const ConfiguracionTiendaForm = () => {
  const [config, setConfig] = useState({
    marquesina_texto: '',
    marquesina_velocidad: 25,
    banner_titulo: '',
    banner_subtitulo: '',
    whatsapp_numero: '56972677820',
    tienda_nombre: 'MindyLu',
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.get('/core/configuracion/privado/');
        setConfig(res.data);
      } catch (error) {
        console.error('Error al cargar config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('marquesina_texto', config.marquesina_texto || '');
      formData.append('marquesina_velocidad', config.marquesina_velocidad || 25);
      formData.append('banner_titulo', config.banner_titulo || '');
      formData.append('banner_subtitulo', config.banner_subtitulo || '');
      formData.append('whatsapp_numero', config.whatsapp_numero || '');
      formData.append('tienda_nombre', config.tienda_nombre || 'MindyLu');
      
      if (bannerFile) {
        formData.append('banner_imagen', bannerFile);
      }

      const res = await api.patch('/core/configuracion/privado/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setConfig(res.data);
      setBannerFile(null);
      showToast('success', 'Configuración de tienda guardada exitosamente');
    } catch (error) {
      console.error(error);
      showAlert('Error al guardar la configuración de la tienda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted text-center py-4">Cargando configuración...</p>;

  return (
    <div className="card glass configuracion-tienda-card" style={{ marginBottom: '24px' }}>
      <div className="card-header border-b pb-4 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LayoutTemplate size={24} className="icon-primary" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-strong)' }}>Apariencia de la Tienda</h2>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ROW 1: Nombre de tienda y WhatsApp */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
              <Type size={16} /> Nombre de la Tienda (UI)
            </label>
            <input 
              type="text" 
              name="tienda_nombre"
              className="input-field" 
              value={config.tienda_nombre || ''}
              onChange={handleChange}
              placeholder="Ej: MindyLu"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
              <Phone size={16} /> Número de WhatsApp para Pedidos
            </label>
            <input 
              type="text" 
              name="whatsapp_numero"
              className="input-field" 
              value={config.whatsapp_numero || ''}
              onChange={handleChange}
              placeholder="Ej: 56912345678"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%' }}
            />
          </div>
        </div>

        {/* ROW 2: Marquesina */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
              <Type size={16} /> Texto de Marquesina (Scroll Superior)
            </label>
            <input 
              type="text" 
              name="marquesina_texto"
              className="input-field" 
              value={config.marquesina_texto || ''}
              onChange={handleChange}
              placeholder="Ej: NUEVA COLECCIÓN 2025 • ENVÍOS A TODO EL PAÍS"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%' }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
              <Clock size={16} /> Vel. Marquesina (s)
            </label>
            <input 
              type="number" 
              name="marquesina_velocidad"
              className="input-field" 
              value={config.marquesina_velocidad || 25}
              onChange={handleChange}
              min="5" max="100"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%' }}
            />
          </div>
        </div>

        {/* ROW 3: Banner Titulo y Subtitulo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
              <Type size={16} /> Título del Banner Principal
            </label>
            <textarea 
              name="banner_titulo"
              className="input-field" 
              value={config.banner_titulo || ''}
              onChange={handleChange}
              rows="3"
              placeholder="Ej: Moda femenina seleccionada..."
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%', resize: 'none' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
              <Type size={16} /> Subtítulo del Banner
            </label>
            <textarea 
              name="banner_subtitulo"
              className="input-field" 
              value={config.banner_subtitulo || ''}
              onChange={handleChange}
              rows="3"
              placeholder="Ej: Prendas únicas, elegantes..."
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%', resize: 'none' }}
            />
          </div>
        </div>

        {/* ROW 4: Imagen Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
              <Upload size={16} /> Imagen del Banner Principal
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {config.banner_imagen && (
                <img 
                  src={config.banner_imagen} 
                  alt="Banner actual" 
                  style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} 
                />
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="input-field"
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc' }}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="btn-primary"
          style={{ padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, marginTop: '8px' }}
        >
          {saving ? 'Guardando...' : 'Guardar Apariencia'}
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
        <p className="subtitle">Configura los valores por defecto y la apariencia de la tienda pública.</p>
      </div>

      <ConfiguracionTiendaForm />

      <h3 style={{ marginBottom: '16px', color: 'var(--color-text-strong)' }}>Mantenedores de Catálogo</h3>
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

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => window.location.href = '/ajustes/logs'}
          style={{ background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
        >
          <Terminal size={20} />
          Ver Registro de Errores del Sistema (Logs)
        </button>
      </div>
    </div>
  );
};

export default Ajustes;
