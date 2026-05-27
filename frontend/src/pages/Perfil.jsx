import React, { useState } from 'react';
import { Camera, Save, Lock, Mail, User } from 'lucide-react';
import './Perfil.css';
import { showAlert, showConfirm, showToast } from '../utils/alerts';

const Perfil = () => {
  const [perfil, setPerfil] = useState({
    nombre: 'MindyLu',
    email: 'contacto@mindylu.cl',
    telefono: '+56 9 1234 5678',
    password: '',
    confirmPassword: ''
  });
  const [foto, setFoto] = useState("https://i.pravatar.cc/150?img=5");

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(URL.createObjectURL(file));
    }
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    showAlert('¡Perfil actualizado con éxito!');
  };

  return (
    <div className="perfil-container animate-fade-in" style={{ padding: '20px', paddingBottom: '100px' }}>
      <div className="perfil-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Playfair Display', margin: '0 0 2px 0' }}>Mi Perfil</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Ajustes de cuenta y seguridad</p>
      </div>

      <div className="card glass animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-primary-light)', boxShadow: 'var(--shadow-md)' }}>
            <img src={foto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            <Camera size={16} />
            <input type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
          </label>
        </div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{perfil.nombre}</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Administradora</p>
      </div>

      <form onSubmit={handleGuardar} className="card glass animate-slide-up" style={{ padding: '24px', animationDelay: '0.1s' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="var(--color-primary)" /> Datos Personales
        </h3>
        
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Nombre Comercial</label>
          <input 
            type="text" 
            name="nombre" 
            value={perfil.nombre} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', background: 'var(--color-surface)', fontSize: '0.95rem' }} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Teléfono</label>
          <input 
            type="text" 
            name="telefono" 
            value={perfil.telefono} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', background: 'var(--color-surface)', fontSize: '0.95rem' }} 
          />
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} color="var(--color-primary)" /> Seguridad
        </h3>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Correo Electrónico</label>
          <input 
            type="email" 
            name="email" 
            value={perfil.email} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', background: 'var(--color-surface)', fontSize: '0.95rem' }} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Nueva Contraseña</label>
          <input 
            type="password" 
            name="password" 
            placeholder="Dejar en blanco para no cambiar"
            value={perfil.password} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', background: 'var(--color-surface)', fontSize: '0.95rem' }} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Confirmar Contraseña</label>
          <input 
            type="password" 
            name="confirmPassword" 
            placeholder="Repetir nueva contraseña"
            value={perfil.confirmPassword} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', background: 'var(--color-surface)', fontSize: '0.95rem' }} 
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <Save size={18} /> Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default Perfil;
