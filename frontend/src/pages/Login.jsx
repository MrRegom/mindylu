// ─────────────────────────────────────────────────────────────
// frontend/src/pages/Login.jsx
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Lock, Mail } from 'lucide-react';
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
      const response = await api.post('/auth/login/', {
        email,
        password
      });
      
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
      
      window.location.href = '/panel';
      
    } catch (err) {
      console.error("Error en login:", err);
      setError('Correo o contraseña incorrectos.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="login-left-content animate-fade-in">
          <div className="login-logo-container">
            <img src="/lulogo.png" alt="Lu Prenditas Logo" className="login-logo-large" />
          </div>
        </div>
        <div className="login-left-bg"></div>
      </div>

      <div className="login-right">
        <div className="login-form-container animate-slide-up">
          <div className="login-mobile-header">
            <img src="/lulogo.png" alt="Lu Prenditas Logo" className="login-logo-mobile" />
            <h2>Bienvenida de nuevo</h2>
            <p>Ingresa tus credenciales para acceder al panel.</p>
          </div>

          <form className="login-form-enterprise" onSubmit={handleSubmit}>
            <div className="input-group-enterprise">
              <label>Correo Electrónico</label>
              <div className="input-with-icon">
                <Mail size={20} className="input-icon" />
                <input 
                  type="email" 
                  placeholder="admin@luprenditas.cl" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  required 
                />
              </div>
            </div>
            
            <div className="input-group-enterprise">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <Lock size={20} className="input-icon" />
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
            </div>

            {error && <div className="login-error-message">{error}</div>}

            <button type="submit" className="btn-enterprise-primary" disabled={isLoading}>
              {isLoading ? 'Autenticando...' : 'Acceder al Panel'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="login-footer">
            <p>&copy; {new Date().getFullYear()} MindyLu Technologies. Secure Login.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
