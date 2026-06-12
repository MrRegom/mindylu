import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import api from '../services/api';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const MantenedorCuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    banco: '',
    tipo_cuenta: 'Cuenta RUT',
    numero_cuenta: '',
    rut_titular: '',
    nombre_titular: '',
    email_notificacion: '',
    activa: true
  });
  const [editId, setEditId] = useState(null);

  const fetchCuentas = async () => {
    try {
      const res = await api.get('/cuentas/bancos/');
      setCuentas(res.data.results || res.data);
    } catch (error) {
      console.error('Error cargando cuentas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (cuenta) => {
    setFormData({
      banco: cuenta.banco,
      tipo_cuenta: cuenta.tipo_cuenta,
      numero_cuenta: cuenta.numero_cuenta,
      rut_titular: cuenta.rut_titular,
      nombre_titular: cuenta.nombre_titular,
      email_notificacion: cuenta.email_notificacion || '',
      activa: cuenta.activa
    });
    setEditId(cuenta.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!await showConfirm('¿Estás segura de eliminar esta cuenta bancaria?')) return;
    try {
      await api.delete(`/cuentas/bancos/${id}/`);
      showToast('success', 'Cuenta eliminada');
      fetchCuentas();
    } catch (error) {
      showAlert('Error al eliminar la cuenta');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.patch(`/cuentas/bancos/${editId}/`, formData);
        showToast('success', 'Cuenta actualizada');
      } else {
        await api.post('/cuentas/bancos/', formData);
        showToast('success', 'Cuenta creada exitosamente');
      }
      setShowForm(false);
      setEditId(null);
      fetchCuentas();
    } catch (error) {
      showAlert('Error al guardar la cuenta. Verifica los datos.');
    }
  };

  const resetForm = () => {
    setFormData({
      banco: '',
      tipo_cuenta: 'Cuenta RUT',
      numero_cuenta: '',
      rut_titular: '',
      nombre_titular: '',
      email_notificacion: '',
      activa: true
    });
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div className="mantenedor-card card glass" style={{ gridColumn: '1 / -1' }}>
      <div className="mantenedor-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={20} className="icon-accent" />
          <h3>Cuentas Bancarias</h3>
        </div>
        {!showForm && (
          <button className="btn-agregar" onClick={() => setShowForm(true)} style={{ padding: '6px 12px' }}>
            <Plus size={16} /> Agregar Cuenta
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: '16px', background: '#fdfa', borderRadius: '12px', marginBottom: '16px' }}>
          <div className="form-group-row">
            <div className="form-group">
              <label>Banco *</label>
              <input required type="text" name="banco" className="input-field" value={formData.banco} onChange={handleInputChange} placeholder="Ej: BancoEstado" />
            </div>
            <div className="form-group">
              <label>Tipo de Cuenta *</label>
              <select name="tipo_cuenta" className="input-field" value={formData.tipo_cuenta} onChange={handleInputChange}>
                <option value="Cuenta RUT">Cuenta RUT</option>
                <option value="Cuenta Corriente">Cuenta Corriente</option>
                <option value="Cuenta Vista">Cuenta Vista</option>
                <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Número de Cuenta *</label>
              <input required type="text" name="numero_cuenta" className="input-field" value={formData.numero_cuenta} onChange={handleInputChange} placeholder="Ej: 12345678" />
            </div>
          </div>
          
          <div className="form-group-row">
            <div className="form-group">
              <label>Nombre Titular *</label>
              <input required type="text" name="nombre_titular" className="input-field" value={formData.nombre_titular} onChange={handleInputChange} placeholder="Ej: Lucía Méndez" />
            </div>
            <div className="form-group">
              <label>RUT Titular *</label>
              <input required type="text" name="rut_titular" className="input-field" value={formData.rut_titular} onChange={handleInputChange} placeholder="Ej: 12.345.678-9" />
            </div>
            <div className="form-group">
              <label>Email de Notificación</label>
              <input type="email" name="email_notificacion" className="input-field" value={formData.email_notificacion} onChange={handleInputChange} placeholder="pagos@mindylu.cl" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn-outline" onClick={resetForm}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} /> {editId ? 'Guardar Cambios' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      )}

      <div className="mantenedor-lista" style={{ maxHeight: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', padding: '16px' }}>
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : cuentas.length === 0 ? (
          <p className="text-muted">No tienes cuentas bancarias registradas.</p>
        ) : (
          cuentas.map(cuenta => (
            <div key={cuenta.id} style={{ border: '1px solid #e9edef', borderRadius: '12px', padding: '16px', background: '#fff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-icon-edit" onClick={() => handleEdit(cuenta)} title="Editar"><Pencil size={14} /></button>
                <button type="button" className="btn-icon-danger" onClick={() => handleDelete(cuenta.id)} title="Eliminar"><Trash2 size={14} /></button>
              </div>
              <h4 style={{ margin: '0 0 8px 0', color: '#d16b7e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Landmark size={18} /> {cuenta.banco}
              </h4>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Tipo:</strong> {cuenta.tipo_cuenta}</p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Nº:</strong> {cuenta.numero_cuenta}</p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Titular:</strong> {cuenta.nombre_titular}</p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>RUT:</strong> {cuenta.rut_titular}</p>
              {cuenta.email_notificacion && <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {cuenta.email_notificacion}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MantenedorCuentas;
