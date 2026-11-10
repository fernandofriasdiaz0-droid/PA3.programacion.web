import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const REACT_TOKEN_KEY = 'medisys_pa3_jwt_token';
export const REACT_USER_KEY = 'medisys_pa3_user';

/**
 * Cliente HTTP Axios configurado para consumir la misma API REST de Node.js/Express (T11)
 * Incluye interceptores de petición (Bearer JWT) y respuesta (gestión de tokens expirados y 403)
 */
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de Petición: inyecta el token JWT almacenado
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(REACT_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Interceptor de Respuesta: detecta tokens expirados (401) o falta de permisos por rol (403) (T11)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthRoute) {
      const code = error.response?.data?.code || 'TOKEN_EXPIRED';
      const msg =
        error.response?.data?.message ||
        'Tu sesión JWT ha expirado o es inválida. Inicia sesión nuevamente.';

      localStorage.removeItem(REACT_TOKEN_KEY);
      localStorage.removeItem(REACT_USER_KEY);

      window.dispatchEvent(
        new CustomEvent('medisys:session-expired', {
          detail: { code, message: msg }
        })
      );
    }

    return Promise.reject(error);
  }
);

export default api;

