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

// Función auxiliar para no enviar logs de los propios logs (evitar bucle infinito)
const sendErrorLog = (error) => {
  const url = error.config?.url || '';
  if (url.includes('logs/')) return;
  
  try {
    const errorMsg = error.response?.data?.error || error.message;
    const stack = error.stack || JSON.stringify(error.response?.data || {});
    // Enviar asíncronamente sin esperar respuesta
    axios.post(API_URL + 'logs/', {
      tipo: 'FRONTEND',
      mensaje: `[${error.config?.method?.toUpperCase()}] ${url} - ${errorMsg}`,
      stack_trace: stack
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    }).catch(() => {});
  } catch (e) {}
};

// Interceptor para manejar tokens expirados y registrar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token expiró, borramos credenciales y mandamos al login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else {
      // Registrar error en el backend
      sendErrorLog(error);
    }
    return Promise.reject(error);
  }
);

export default api;
