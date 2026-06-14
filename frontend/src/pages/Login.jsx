// ─────────────────────────────────────────────────────────────
// frontend/src/pages/Login.jsx
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import api from '../services/api';
import './Login.css';

/**
 * Componente Login
 * 
 * Gestiona el inicio de sesión del tenant. Utiliza el servicio unificado `api`
 * para garantizar el uso de la dirección IP local de desarrollo en lugar de
 * localhost hardcodeado (lo que causaba fallos de red en móviles).
 */
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Consumimos a través del cliente api configurado con la IP de red local
      const response = await api.post('/auth/login/', {
        email,
        password
      });
      
      // Guardar token y datos del usuario
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
      
      // Redirigir al panel de administración
      window.location.href = '/panel';
      
    } catch (err) {
      console.error("Error en login:", err);
      // Mensaje técnico adaptado
      setError('Correo o contraseña incorrectos o error de red.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-header animate-slide-up">
        <img src="/lulogo.png" alt="Lu Prenditas Logo" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', border: '4px solid white' }} />
        <h1>Lu Prenditas</h1>
        <p>Sistema Administrativo</p>
      </div>

      <form className="login-form animate-slide-up" style={{ animationDelay: '0.1s' }} onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="tu@correo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            required 
          />
        </div>
        
        <div className="input-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            required 
          />
        </div>

        {error && <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: '8px', textAlign: 'center' }}>{error}</div>}

        <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar a mi tienda'}
          {!isLoading && <ArrowRight size={20} />}
        </button>
      </form>
    </div>
  );
};

export default Login;
