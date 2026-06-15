import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Trash2, Tag, Palette, Type, Pencil, Check, X, Ruler, Terminal, ChevronRight, Upload, Phone, LayoutTemplate, Clock, Truck, MapPin, MessageSquare, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Ajustes.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';
import { CATEGORY_ICONS, getCategoryIcon, ICON_NAMES_ES } from '../utils/iconMap';
import MantenedorCuentas from '../components/MantenedorCuentas';

const EXTENDED_PALETTE = [
  // Neutros
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF', 
  // Rojos y Vinos
  '#FF0000', '#FF3B30', '#CC0000', '#8B0000', '#800020', '#722F37',
  // Naranjas y Cafés
  '#FF9500', '#FFA500', '#FF8C00', '#D2691E', '#8B4513', '#6F4E37',
  // Tierra y Beige
  '#A0522D', '#D2B48C', '#F5DEB3', '#F5F5DC', '#FFFDD0', '#FAF0E6',
  // Amarillos y Dorados
  '#FFFF00', '#FFCC00', '#FFDB58', '#FFD700', '#DAA520', '#B8860B',
  // Verdes
  '#00FF00', '#34C759', '#008000', '#228B22', '#32CD32', '#9ACD32',
  // Verdes oscuros/oliva
  '#006400', '#6B8E23', '#808000', '#556B2F', '#00FA9A', '#20B2AA',
  // Azules y Celestes
  '#0000FF', '#007AFF', '#0000CD', '#00008B', '#1E90FF', '#4169E1',
  // Celestes y Turquesas
  '#87CEEB', '#87CEFA', '#4682B4', '#5AC8FA', '#00FFFF', '#40E0D0',
  // Morados y Lilas
  '#800080', '#8A2BE2', '#9370DB', '#AF52DE', '#C8A2C8', '#DDA0DD',
  // Rosados y Fucsias
  '#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493', '#C71585', '#FF00FF'
];

/**
 * Componente mantenedor genérico para listas de catálogo.
 * Soporta: agregar, editar inline y eliminar ítems.
 * Cumple SRP — solo gestiona una lista de un endpoint dado.
 */
const MantenedorList = ({ titulo, icono, endpoint, placeholder, forceUppercase = false, hasIcons = false, hasColors = false }) => {
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [nuevoIcono, setNuevoIcono] = useState('Sparkles');
  const [nuevoHex, setNuevoHex] = useState('');
  const [showNuevoPalette, setShowNuevoPalette] = useState(false);
  const [showEditPalette, setShowEditPalette] = useState(false);
  const [loading, setLoading] = useState(true);
  // Estado para edición inline: { id, valor, icono, hex_code }
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

  useEffect(() => {
    if (editando?.id && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editando?.id]);

  /** Formato de texto al guardar */
  const formatText = (str) => {
    if (forceUppercase) return str.trim().toUpperCase();
    return str.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nuevoItem.trim()) return;
    const nombreFormateado = formatText(nuevoItem);
    try {
      const payload = { nombre: nombreFormateado };
      if (hasIcons) payload.icono = nuevoIcono;
      if (hasColors && nuevoHex) payload.hex_code = nuevoHex;
      await api.post(endpoint, payload);
      setNuevoItem('');
      setNuevoIcono('Sparkles');
      setNuevoHex('');
      fetchItems();
      showToast('success', `${nombreFormateado} agregado`);
    } catch (error) {
      showAlert(`Error al guardar en ${titulo}`);
    }
  };

  const handleStartEdit = (item) => {
    setEditando({ id: item.id, valor: item.nombre, icono: item.icono || 'Sparkles', hex_code: item.hex_code || '' });
  };

  const handleCancelEdit = () => {
    setEditando(null);
  };

  const handleSaveEdit = async () => {
    if (!editando || !editando.valor.trim()) return;
    const nombreFormateado = formatText(editando.valor);
    try {
      const payload = { nombre: nombreFormateado };
      if (hasIcons) payload.icono = editando.icono;
      if (hasColors) payload.hex_code = editando.hex_code;
      await api.patch(`${endpoint}${editando.id}/`, payload);
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
                  {hasIcons && (
                    <div className="mantenedor-icon-selector">
                      <select value={editando.icono} onChange={e => setEditando(prev => ({ ...prev, icono: e.target.value }))} className="mantenedor-select-light" style={{ width: '130px', marginRight: '5px' }}>
                        {Object.keys(CATEGORY_ICONS).map(k => <option key={k} value={k}>{ICON_NAMES_ES[k] || k}</option>)}
                      </select>
                    </div>
                  )}
                  {hasColors && (
                    <div style={{ marginRight: '5px' }}>
                      <input
                        type="color"
                        className="color-picker-input"
                        value={editando.hex_code || '#ff9a9e'}
                        onChange={(e) => setEditando(prev => ({ ...prev, hex_code: e.target.value }))}
                        title="Elegir color"
                      />
                    </div>
                  )}
                  <input
                    ref={editInputRef}
                    className="mantenedor-edit-input"
                    value={editando.valor}
                    onChange={e => setEditando(prev => ({ ...prev, valor: e.target.value }))}
                    onKeyDown={handleEditKeyDown}
                    style={{ backgroundColor: '#fff0f3', color: '#111b21' }}
                  />
                  <button type="button" className="btn-icon-success" onClick={handleSaveEdit} title="Guardar">
                    <Check size={15} />
                  </button>
                  <button type="button" className="btn-icon-simple btn-icon-muted" onClick={handleCancelEdit}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                /* Modo vista */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasIcons && <div style={{ color: 'var(--color-primary)' }}>{getCategoryIcon(item.icono || 'Sparkles', { size: 16 })}</div>}
                    {hasColors && (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: item.hex_code || '#ddd', border: '1px solid #ccc' }}></div>
                    )}
                    <span className="mantenedor-nombre">{item.nombre}</span>
                  </div>
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
        {hasIcons && (
          <select value={nuevoIcono} onChange={e => setNuevoIcono(e.target.value)} className="mantenedor-select-light" style={{ flexShrink: 0 }}>
            {Object.keys(CATEGORY_ICONS).map(k => <option key={k} value={k}>{ICON_NAMES_ES[k] || k}</option>)}
          </select>
        )}
        {hasColors && (
          <input
            type="color"
            className="color-picker-input"
            value={nuevoHex || '#ff9a9e'}
            onChange={(e) => setNuevoHex(e.target.value)}
            title="Elegir color"
          />
        )}
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
      envios_texto: '',
      sugerencia_mensaje_top: '',
      sugerencia_mensaje_bottom: '',
      whatsapp_numero: '56933075784',
      tienda_nombre: 'MindyLu',
      bot_mensaje_bienvenida: '',
      bot_opcion_1: '',
      bot_respuesta_1: '',
      bot_opcion_2: '',
      bot_respuesta_2: '',
      bot_opcion_3: ''
    });
  const [bannerFile, setBannerFile] = useState(null);
  const [polaroid1File, setPolaroid1File] = useState(null);
  const [polaroid2File, setPolaroid2File] = useState(null);
  const [polaroid3File, setPolaroid3File] = useState(null);
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

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
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
      formData.append('banner_titulo_cursiva', config.banner_titulo_cursiva || '');
      formData.append('banner_subtitulo', config.banner_subtitulo || '');
      formData.append('envios_texto', config.envios_texto || '');
      formData.append('sugerencia_mensaje_top', config.sugerencia_mensaje_top || '');
      formData.append('sugerencia_mensaje_bottom', config.sugerencia_mensaje_bottom || '');
      formData.append('whatsapp_numero', config.whatsapp_numero || '');
      formData.append('tienda_nombre', config.tienda_nombre || 'MindyLu');
      formData.append('bot_mensaje_bienvenida', config.bot_mensaje_bienvenida || '');
      formData.append('bot_opcion_1', config.bot_opcion_1 || '');
      formData.append('bot_respuesta_1', config.bot_respuesta_1 || '');
      formData.append('bot_opcion_2', config.bot_opcion_2 || '');
      formData.append('bot_respuesta_2', config.bot_respuesta_2 || '');
      formData.append('bot_opcion_3', config.bot_opcion_3 || '');
      
      if (bannerFile) formData.append('banner_imagen', bannerFile);
      if (polaroid1File) formData.append('polaroid_1_imagen', polaroid1File);
      if (polaroid2File) formData.append('polaroid_2_imagen', polaroid2File);
      if (polaroid3File) formData.append('polaroid_3_imagen', polaroid3File);

      const res = await api.patch('/core/configuracion/privado/', formData);
      setConfig(res.data);
      setBannerFile(null);
      setPolaroid1File(null);
      setPolaroid2File(null);
      setPolaroid3File(null);
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
    <div className="card glass configuracion-tienda-card" style={{ marginBottom: '24px', overflow: 'hidden', padding: '16px', boxSizing: 'border-box', width: '100%', maxWidth: '100vw' }}>
      <div className="card-header border-b pb-4 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LayoutTemplate size={24} className="icon-primary" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-strong)' }}>Apariencia de la Tienda</h2>
      </div>
      
      <div className="apariencia-split-layout">
        <form onSubmit={handleSubmit} className="apariencia-form-col">
          
          <div className="form-group-row">
            <div className="form-group">
              <label><Type size={16} /> Nombre de la Tienda</label>
              <input type="text" name="tienda_nombre" className="input-field" value={config.tienda_nombre || ''} onChange={handleChange} placeholder="Ej: MindyLu" />
            </div>
            <div className="form-group">
              <label><Phone size={16} /> WhatsApp Pedidos</label>
              <input type="text" name="whatsapp_numero" className="input-field" value={config.whatsapp_numero || ''} onChange={handleChange} placeholder="Ej: 56912345678" />
            </div>
          </div>

          <div className="form-group-row" style={{ gridTemplateColumns: '3fr 1fr' }}>
            <div className="form-group">
              <label><Type size={16} /> Texto Marquesina</label>
              <input type="text" name="marquesina_texto" className="input-field" value={config.marquesina_texto || ''} onChange={handleChange} placeholder="NUEVA COLECCIÓN..." />
            </div>
            <div className="form-group">
              <label><Clock size={16} /> Vel. (s)</label>
              <input type="number" name="marquesina_velocidad" className="input-field" value={config.marquesina_velocidad || 25} onChange={handleChange} min="5" max="100" />
            </div>
          </div>

          <div className="form-group">
            <label><Type size={16} /> Título del Banner</label>
            <textarea name="banner_titulo" className="input-field" value={config.banner_titulo || ''} onChange={handleChange} rows="2" placeholder="Moda femenina seleccionada..." />
          </div>

          <div className="form-group">
            <label><Type size={16} /> Título Cursiva del Banner</label>
            <input type="text" name="banner_titulo_cursiva" className="input-field" value={config.banner_titulo_cursiva || ''} onChange={handleChange} placeholder="Tu Mindy Lu." />
          </div>

          <div className="form-group">
            <label><Type size={16} /> Subtítulo del Banner</label>
            <textarea name="banner_subtitulo" className="input-field" value={config.banner_subtitulo || ''} onChange={handleChange} rows="2" placeholder="Prendas únicas, elegantes..." />
          </div>

          <div className="form-group">
            <label><Truck size={16} /> Información de Envíos</label>
            <textarea name="envios_texto" className="input-field" value={config.envios_texto || ''} onChange={handleChange} rows="5" placeholder="Envíos a todo Chile...\nValparaíso: $2500" />
          </div>

          <div className="form-group">
            <label><MessageCircle size={16} /> Texto Superior Sugerencia WhatsApp</label>
            <textarea name="sugerencia_mensaje_top" className="input-field" value={config.sugerencia_mensaje_top || ''} onChange={handleChange} rows="2" placeholder="¡Hola linda! Mira esta opción hermosa..." />
          </div>

          <div className="form-group">
            <label><MessageCircle size={16} /> Texto Inferior Sugerencia WhatsApp</label>
            <textarea name="sugerencia_mensaje_bottom" className="input-field" value={config.sugerencia_mensaje_bottom || ''} onChange={handleChange} rows="2" placeholder="¿Te gusta? 💕" />
          </div>

          <div className="form-group-row">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label><MessageCircle size={16} /> Mensaje Bienvenida LuBot</label>
              <textarea name="bot_mensaje_bienvenida" className="input-field" value={config.bot_mensaje_bienvenida || ''} onChange={handleChange} rows="2" placeholder="¡Hola, hermosa! 👋 Soy LuBot..." />
            </div>
            
            <div className="form-group">
              <label><MessageCircle size={16} /> Bot Opción 1</label>
              <input type="text" name="bot_opcion_1" className="input-field" value={config.bot_opcion_1 || ''} onChange={handleChange} placeholder="¿Hacen entregas...?" />
            </div>
            <div className="form-group">
              <label><MessageCircle size={16} /> Bot Respuesta 1</label>
              <textarea name="bot_respuesta_1" className="input-field" value={config.bot_respuesta_1 || ''} onChange={handleChange} rows="3" placeholder="Sí, hacemos envíos..." />
            </div>

            <div className="form-group">
              <label><MessageCircle size={16} /> Bot Opción 2</label>
              <input type="text" name="bot_opcion_2" className="input-field" value={config.bot_opcion_2 || ''} onChange={handleChange} placeholder="Quiero preguntar..." />
            </div>
            <div className="form-group">
              <label><MessageCircle size={16} /> Bot Respuesta 2</label>
              <textarea name="bot_respuesta_2" className="input-field" value={config.bot_respuesta_2 || ''} onChange={handleChange} rows="3" placeholder="Todas nuestras prendas..." />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label><MessageCircle size={16} /> Bot Opción Hablar con Lu (Opción 3)</label>
              <input type="text" name="bot_opcion_3" className="input-field" value={config.bot_opcion_3 || ''} onChange={handleChange} placeholder="Quiero hablar directo con Lu 💕" />
            </div>
          </div>

          <div className="form-group">
            <label><Upload size={16} /> Imagen del Banner Principal</label>
            <div className="file-upload-wrapper">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setBannerFile)} className="file-upload-input" />
              <div className={`file-upload-box ${bannerFile || config.banner_imagen ? 'has-file' : ''}`}>
                <div className="file-upload-icon"><Upload size={16} /></div>
                <span className="file-upload-text">
                  {bannerFile ? bannerFile.name : (config.banner_imagen ? "Imagen actual seleccionada. Clic para cambiar" : "Haz clic para seleccionar tu foto (JPG, PNG)")}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group-row" style={{ marginTop: '10px' }}>
            <div className="form-group">
              <label><Upload size={14} /> Polaroid 1</label>
              <div className="file-upload-wrapper">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPolaroid1File)} className="file-upload-input" />
                <div className={`file-upload-box ${polaroid1File || config.polaroid_1_imagen ? 'has-file' : ''}`}>
                  <div className="file-upload-icon"><Upload size={14} /></div>
                  <span className="file-upload-text" style={{fontSize:'0.8rem'}}>
                    {polaroid1File ? polaroid1File.name : (config.polaroid_1_imagen ? "Foto actual" : "Seleccionar foto")}
                  </span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label><Upload size={14} /> Polaroid 2</label>
              <div className="file-upload-wrapper">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPolaroid2File)} className="file-upload-input" />
                <div className={`file-upload-box ${polaroid2File || config.polaroid_2_imagen ? 'has-file' : ''}`}>
                  <div className="file-upload-icon"><Upload size={14} /></div>
                  <span className="file-upload-text" style={{fontSize:'0.8rem'}}>
                    {polaroid2File ? polaroid2File.name : (config.polaroid_2_imagen ? "Foto actual" : "Seleccionar foto")}
                  </span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label><Upload size={14} /> Polaroid 3</label>
              <div className="file-upload-wrapper">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPolaroid3File)} className="file-upload-input" />
                <div className={`file-upload-box ${polaroid3File || config.polaroid_3_imagen ? 'has-file' : ''}`}>
                  <div className="file-upload-icon"><Upload size={14} /></div>
                  <span className="file-upload-text" style={{fontSize:'0.8rem'}}>
                    {polaroid3File ? polaroid3File.name : (config.polaroid_3_imagen ? "Foto actual" : "Seleccionar foto")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop: 'auto', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
            {saving ? 'Guardando...' : 'Guardar Apariencia'}
          </button>
        </form>

        <div className="apariencia-preview-col">
          <h3 className="preview-title">Previsualización en Vivo</h3>
          
          <div className="preview-device">
            <div className="preview-screen">
              {/* Marquesina */}
              <div className="preview-marquesina">
                <div className="preview-marquesina-track" style={{ animationDuration: `${config.marquesina_velocidad || 25}s` }}>
                  <span>{config.marquesina_texto || 'Texto Marquesina ✦ Envíos a todo el país'}</span>
                </div>
              </div>
              
              {/* Header */}
              <div className="preview-header">
                <div className="preview-logo">{config.tienda_nombre || 'MindyLu'}</div>
                <div className="preview-icons">
                  <div className="preview-icon-mock"></div>
                  <div className="preview-icon-mock"></div>
                </div>
              </div>

              {/* Hero Banner */}
              <div className="preview-hero" style={{ 
                backgroundImage: bannerFile ? `url(${URL.createObjectURL(bannerFile)})` : (config.banner_imagen ? `url(${
                  config.banner_imagen.startsWith('http') ? config.banner_imagen : (
                    import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin + (config.banner_imagen.startsWith('/') ? '' : '/') + config.banner_imagen : config.banner_imagen
                  )
                })` : 'none'),
                backgroundColor: '#f4f4f4'
              }}>
                <div className="preview-hero-overlay"></div>
                <div className="preview-hero-content">
                  <h1 className="preview-hero-title">{config.banner_titulo || 'Título Principal'}</h1>
                  <p className="preview-hero-subtitle">{config.banner_subtitulo || 'Subtítulo del banner'}</p>
                  <div className="preview-hero-btn">Ver Colección</div>
                </div>
              </div>

              {/* Faux Content */}
              <div className="preview-content-mock">
                <div className="mock-title"></div>
                <div className="mock-grid">
                  <div className="mock-card"></div>
                  <div className="mock-card"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Ajustes = () => {
  const [activeTab, setActiveTab] = useState('tienda');

  return (
    <div className="page-container page-ajustes animate-fade-in">
      <div className="page-header">
        <h1>
          <Settings size={28} />
          Ajustes
        </h1>
        <p className="subtitle">Configura tu boutique y catálogos.</p>
      </div>

      <div className="ajustes-tabs">
        <button className={`ajustes-tab ${activeTab === 'tienda' ? 'active' : ''}`} onClick={() => setActiveTab('tienda')}>
          <LayoutTemplate size={18} /> Apariencia
        </button>
        <button className={`ajustes-tab ${activeTab === 'catalogo' ? 'active' : ''}`} onClick={() => setActiveTab('catalogo')}>
          <Tag size={18} /> Catálogo
        </button>
        <button className={`ajustes-tab ${activeTab === 'logistica' ? 'active' : ''}`} onClick={() => setActiveTab('logistica')}>
          <Truck size={18} /> Logística y Pagos
        </button>
        <button className={`ajustes-tab ${activeTab === 'avanzado' ? 'active' : ''}`} onClick={() => setActiveTab('avanzado')}>
          <Settings size={18} /> Avanzado
        </button>
      </div>

      <div className="ajustes-tab-content">
        {activeTab === 'tienda' && (
          <ConfiguracionTiendaForm />
        )}

        {activeTab === 'catalogo' && (
          <div className="ajustes-grid">
            <MantenedorList
              titulo="Categorías"
              icono={<Tag size={20} className="icon-accent" />}
              endpoint="/catalogo/categorias/"
              placeholder="Nueva categoría (ej. Pantalones)"
              hasIcons={true}
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
              hasColors={true}
            />
            <MantenedorList
              titulo="Tallas"
              icono={<Ruler size={20} className="icon-accent" />}
              endpoint="/catalogo/tallas/"
              placeholder="Nueva talla (ej. XXL)"
              forceUppercase={true}
            />
          </div>
        )}

        {activeTab === 'logistica' && (
          <div className="ajustes-grid">
            <MantenedorList
              titulo="Lugares de Entrega"
              icono={<MapPin size={20} className="icon-accent" />}
              endpoint="/pedidos/puntos/"
              placeholder="Nuevo lugar (ej. Metro Viña)"
            />
            <MantenedorCuentas />
          </div>
        )}

        {activeTab === 'avanzado' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <button 
              onClick={() => window.location.href = '/panel/ajustes/bot-reglas'}
              style={{ background: '#eaf4ff', color: '#1677ff', border: '1px solid #91caff', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', width: '100%' }}
            >
              <MessageSquare size={24} />
              <div style={{ textAlign: 'left' }}>
                <div>Bot de WhatsApp</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 400, color: '#666' }}>Configura respuestas automáticas</div>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/panel/ajustes/chats-rapidos'}
              style={{ background: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', width: '100%' }}
            >
              <MessageSquare size={24} />
              <div style={{ textAlign: 'left' }}>
                <div>Chats Rápidos</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 400, color: '#666' }}>Configura botones de WhatsApp</div>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/panel/ajustes/logs'}
              style={{ background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', width: '100%' }}
            >
              <Terminal size={24} />
              <div style={{ textAlign: 'left' }}>
                <div>Registro de Errores</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 400, color: '#666' }}>Ver logs del sistema</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ajustes;
