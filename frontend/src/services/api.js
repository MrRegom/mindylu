import axios from 'axios';

// Instancia de axios configurada con la URL base del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 segundos de timeout para evitar que se quede "Procesando..." infinitamente
});

// Interceptor para inyectar el token JWT en cada petición
api.interceptors.request.use(
  (config) => {
    // Si la ruta empieza con /, Axios la trata como absoluta desde el dominio, ignorando el path de baseURL.
    // Esto quita el / inicial para que se anexe correctamente a http://dominio.com/api/v1/
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar tokens expirados (opcional para MVP, pero buena práctica)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token expiró, borramos credenciales y mandamos al login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
