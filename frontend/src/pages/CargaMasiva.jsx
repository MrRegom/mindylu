// ─────────────────────────────────────────────────────────────
// frontend/src/pages/CargaMasiva.jsx
// Flujo de subida de fotos con detección de duplicados (Combobox).
// La App es la fuente de verdad; Facebook es solo un canal.
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Plus, Trash2, AlertCircle, Check, X } from 'lucide-react';
import api from '../services/api';
import './CargaMasiva.css';

const COLORES_OPCIONES = ['Negro', 'Blanco', 'Café', 'Beige', 'Gris', 'Rosado', 'Rojo', 'Azul', 'Verde', 'Único'];
const TALLAS_OPCIONES = ['Estándar', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

// ── Componente: Combobox de búsqueda de prendas ────────────────────────────
const PrendaCombobox = ({ prendas, value, onChange, placeholder }) => {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtradas = prendas.filter(p =>
    p.nombre.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const seleccionar = (prenda) => {
    setQuery(prenda.nombre);
    setOpen(false);
    onChange({ tipo: 'existente', prenda });
  };

  const confirmarNueva = () => {
    setOpen(false);
    onChange({ tipo: 'nueva', nombre: query });
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="input-field"
        value={query}
        placeholder={placeholder || '🔍 Buscar o escribir nombre de prenda...'}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange(null); }}
        onFocus={() => setOpen(true)}
        style={{ width: '100%' }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 9999,
          background: 'var(--color-card)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)', maxHeight: '220px', overflowY: 'auto',
          border: '1px solid rgba(var(--color-primary-rgb), 0.2)'
        }}>
          {filtradas.length > 0 && filtradas.map(p => (
            <div
              key={p.id}
              onClick={() => seleccionar(p)}
              style={{
                padding: '12px 16px', cursor: 'pointer', fontSize: '0.9rem',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--color-primary-rgb), 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {p.imagenes?.[0]?.imagen && (
                <img src={p.imagenes[0].imagen} alt={p.nombre} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>${p.precio} · {p.variantes?.length} variante(s)</div>
              </div>
            </div>
          ))}
          {query.trim() && (
            <div
              onClick={confirmarNueva}
              style={{
                padding: '12px 16px', cursor: 'pointer', fontSize: '0.9rem',
                color: 'var(--color-primary)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--color-primary-rgb), 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={16} /> Crear nueva prenda "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Componente: Tarjeta de foto por identificar ───────────────────────────
const FotoCard = ({ foto, index, prendas, categorias, onRemove, onChange }) => {
  const [seleccion, setSeleccion] = useState(null); // { tipo: 'existente'|'nueva', prenda?, nombre? }
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [variantes, setVariantes] = useState([{ color: 'Único', talla: 'Estándar', cantidad: 1 }]);

  const actualizarPadre = (sel, p, c, v) => {
    const s = sel !== undefined ? sel : seleccion;
    const pr = p !== undefined ? p : precio;
    const ca = c !== undefined ? c : categoriaId;
    const va = v !== undefined ? v : variantes;
    onChange(index, { seleccion: s, precio: pr, categoriaId: ca, variantes: va });
  };

  const handleSeleccion = (val) => {
    setSeleccion(val);
    actualizarPadre(val, precio, categoriaId, variantes);
  };

  const agregarVariante = () => {
    const nuevas = [...variantes, { color: 'Único', talla: 'Estándar', cantidad: 1 }];
    setVariantes(nuevas);
    actualizarPadre(seleccion, precio, categoriaId, nuevas);
  };

  const actualizarVariante = (i, campo, valor) => {
    const nuevas = variantes.map((v, idx) => idx === i ? { ...v, [campo]: valor } : v);
    setVariantes(nuevas);
    actualizarPadre(seleccion, precio, categoriaId, nuevas);
  };

  const eliminarVariante = (i) => {
    const nuevas = variantes.filter((_, idx) => idx !== i);
    setVariantes(nuevas);
    actualizarPadre(seleccion, precio, categoriaId, nuevas);
  };

  return (
    <div className="card glass animate-slide-up" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Foto */}
        <div style={{ width: 100, minHeight: 120, flexShrink: 0, position: 'relative', background: '#f0f0f0' }}>
          <img src={foto.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            onClick={() => onRemove(index)}
            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Formulario */}
        <div style={{ flex: 1, padding: '12px 14px' }}>
          {/* Combobox */}
          <PrendaCombobox prendas={prendas} onChange={handleSeleccion} />

          {seleccion && seleccion.tipo === 'nueva' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Precio $</label>
                  <input
                    type="number" className="input-field" value={precio}
                    onChange={e => { setPrecio(e.target.value); actualizarPadre(seleccion, e.target.value, categoriaId, variantes); }}
                    placeholder="Ej: 7990"
                    style={{ width: '100%', padding: '8px 10px', marginTop: 4 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Categoría</label>
                  <select
                    className="input-field"
                    value={categoriaId}
                    onChange={e => { setCategoriaId(e.target.value); actualizarPadre(seleccion, precio, e.target.value, variantes); }}
                    style={{ width: '100%', padding: '8px 10px', marginTop: 4 }}
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {seleccion && seleccion.tipo === 'existente' && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(var(--color-primary-rgb), 0.08)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              <AlertCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Ya existe en tu catálogo. Se sumará stock.
            </div>
          )}

          {/* Variantes */}
          {seleccion && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>Colores / Tallas</div>
              {variantes.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <select
                    className="input-field"
                    value={v.color}
                    onChange={e => actualizarVariante(i, 'color', e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '0.82rem' }}
                  >
                    {COLORES_OPCIONES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select
                    className="input-field"
                    value={v.talla}
                    onChange={e => actualizarVariante(i, 'talla', e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '0.82rem' }}
                  >
                    {TALLAS_OPCIONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input
                    type="number" min="1" value={v.cantidad}
                    onChange={e => actualizarVariante(i, 'cantidad', parseInt(e.target.value) || 1)}
                    style={{ width: 44, padding: '6px 6px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', textAlign: 'center', fontSize: '0.82rem' }}
                  />
                  {variantes.length > 1 && (
                    <button onClick={() => eliminarVariante(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={agregarVariante} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginTop: 2 }}>
                <Plus size={13} /> Agregar color/talla
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ── Página principal ───────────────────────────────────────────────────────
const CargaMasiva = () => {
  const navigate = useNavigate();
  const [fotos, setFotos] = useState([]);             // [{ file, preview }]
  const [fotosData, setFotosData] = useState({});     // { index: { seleccion, precio, variantes } }
  const [prendas, setPrendas] = useState([]);         // catálogo existente
  const [categorias, setCategorias] = useState([]);
  const [lotesProgramados, setLotesProgramados] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);   // { guardadas, sumadas }

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    try {
      const [rPrendas, rCats, rLotes] = await Promise.all([
        api.get('/catalogo/prendas/'),
        api.get('/catalogo/categorias/'),
        api.get('/catalogo/ciclos/programados/')
      ]);
      setPrendas(rPrendas.data);
      setCategorias(rCats.data);
      setLotesProgramados(rLotes.data);
    } catch (e) {
      console.error('Error al cargar datos:', e);
    }
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const nuevas = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setFotos(prev => [...prev, ...nuevas]);
  };

  const handleRemove = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
    setFotosData(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleChange = (index, data) => {
    setFotosData(prev => ({ ...prev, [index]: data }));
  };

  const handleGuardar = async () => {
    // Validar que todas las fotos tengan selección
    const sinSeleccion = fotos.filter((_, i) => !fotosData[i]?.seleccion);
    if (sinSeleccion.length > 0) {
      alert(`Falta identificar ${sinSeleccion.length} foto(s). Selecciona o crea una prenda para cada una.`);
      return;
    }
    setIsSubmitting(true);
    let guardadas = 0;
    let sumadas = 0;

    for (let i = 0; i < fotos.length; i++) {
      const { seleccion, precio, categoriaId, variantes } = fotosData[i];
      const foto = fotos[i];

      try {
        if (seleccion.tipo === 'existente') {
          // Sumar stock a la prenda existente
          await api.post('/catalogo/prendas/asociar_stock/', {
            prenda_id: seleccion.prenda.id,
            variantes: variantes
          });
          sumadas++;
        } else {
          // Crear prenda nueva con la foto
          const formData = new FormData();
          formData.append('nombre', seleccion.nombre);
          formData.append('precio', precio || 0);
          if (categoriaId) formData.append('categoria_id', categoriaId);
          formData.append('variantes', JSON.stringify(variantes));
          formData.append('imagen', foto.file);
          await api.post('/catalogo/prendas/subir_foto/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          guardadas++;
        }
      } catch (e) {
        console.error('Error al guardar prenda', i, e);
      }
    }

    setIsSubmitting(false);
    setResultado({ guardadas, sumadas });
    setFotos([]);
    setFotosData({});
    await fetchDatos(); // Recargar catálogo y lotes
  };

  // Vista de éxito
  if (resultado) {
    return (
      <div className="carga-masiva-container animate-fade-in" style={{ padding: 24, paddingBottom: 100, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ marginBottom: 8 }}>¡Guardado en el catálogo!</h2>
        {resultado.guardadas > 0 && <p style={{ color: 'var(--color-text-muted)' }}>{resultado.guardadas} prenda(s) nueva(s) creada(s).</p>}
        {resultado.sumadas > 0 && <p style={{ color: 'var(--color-text-muted)' }}>{resultado.sumadas} prenda(s) con stock actualizado.</p>}
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
          Para publicar en Facebook, ve al Catálogo y selecciona las prendas que quieres publicar.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => { setResultado(null); }}>
          Subir más fotos
        </button>
        <button className="btn" style={{ marginTop: 12, width: '100%', background: 'transparent', color: 'var(--color-primary)', fontWeight: 600 }} onClick={() => navigate('/catalogo')}>
          Ir al Catálogo →
        </button>
      </div>
    );
  }

  return (
    <div className="carga-masiva-container animate-fade-in" style={{ padding: '20px', paddingBottom: '120px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Subir Fotos</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>El catálogo es la fuente de verdad ✨</p>
        </div>
      </div>

      {/* Zona de arrastre / subida */}
      <label style={{
        display: 'block', border: '2px dashed rgba(var(--color-primary-rgb), 0.4)',
        borderRadius: 'var(--radius-lg)', padding: '28px 20px', textAlign: 'center',
        cursor: 'pointer', marginBottom: 20, background: 'rgba(var(--color-primary-rgb), 0.03)'
      }}>
        <Upload size={32} color="var(--color-primary)" style={{ marginBottom: 8 }} />
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Toca para seleccionar fotos</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Puedes subir varias a la vez</div>
        <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
      </label>

      {/* Tarjetas de fotos */}
      {fotos.map((foto, i) => (
        <FotoCard
          key={i}
          index={i}
          foto={foto}
          prendas={prendas}
          categorias={categorias}
          onRemove={handleRemove}
          onChange={handleChange}
        />
      ))}

      {/* Botón guardar */}
      {fotos.length > 0 && (
        <button
          className="btn btn-primary"
          onClick={handleGuardar}
          disabled={isSubmitting}
          style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          <Save size={18} />
          {isSubmitting ? 'Guardando...' : `Guardar ${fotos.length} foto(s) en el Catálogo`}
        </button>
      )}

      {/* Lotes programados */}
      {lotesProgramados.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>📅 Lotes Programados</h3>
          {lotesProgramados.map(lote => (
            <div key={lote.id} className="card" style={{ padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid rgba(var(--color-primary-rgb), 0.3)' }}>
              {lote.prendas?.[0]?.imagenes?.[0]?.imagen && (
                <img src={lote.prendas[0].imagenes[0].imagen} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} alt="" />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                  {new Date(lote.fecha_programada).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{lote.prendas?.length} prendas</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CargaMasiva;
