import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import { AxiosError } from 'axios';
import api, { REACT_TOKEN_KEY, REACT_USER_KEY } from '../services/api';
import {
  ApiResponse,
  AuthTokenResponse,
  Cita,
  CitaEstado,
  CitaFiltros,
  EstadisticasCitas,
  RolUsuario,
  ToastItem,
  Usuario
} from '../types/medisys.types';

/**
 * Estado Global de la Aplicación React mediante Context API + useReducer (T10)
 * Gestiona de forma centralizada e inmutable:
 * 1. Sesión de usuario y token JWT (T07, T11)
 * 2. Citas médicas sincronizadas con MongoDB (T06, T10)
 * 3. Estadísticas ejecutivas y filtros reactivos
 * 4. Notificaciones Toast globales
 */

interface GlobalState {
  usuario: Usuario | null;
  token: string | null;
  citas: Cita[];
  estadisticas: EstadisticasCitas;
  usuariosRegistrados: Usuario[];
  filtros: CitaFiltros;
  isLoading: boolean;
  serverOnline: boolean;
  databaseMode: string;
  toasts: ToastItem[];
}

type GlobalAction =
  | { type: 'SET_AUTH'; payload: { usuario: Usuario; token: string } }
  | { type: 'CLEAR_AUTH' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CITAS'; payload: Cita[] }
  | { type: 'SET_ESTADISTICAS'; payload: EstadisticasCitas }
  | { type: 'SET_USUARIOS'; payload: Usuario[] }
  | { type: 'SET_FILTROS'; payload: Partial<CitaFiltros> }
  | { type: 'RESET_FILTROS' }
  | { type: 'SET_SERVER_STATUS'; payload: { online: boolean; mode: string } }
  | { type: 'ADD_TOAST'; payload: ToastItem }
  | { type: 'REMOVE_TOAST'; payload: string };

const initialStats: EstadisticasCitas = {
  total: 0,
  pendientes: 0,
  confirmadas: 0,
  enAtencion: 0,
  completadas: 0,
  canceladas: 0,
  ingresosEstimados: 0,
  porEspecialidad: {},
  porPrioridad: {}
};

const initialFiltros: CitaFiltros = {
  buscar: '',
  estado: 'Todos',
  especialidad: 'Todas',
  prioridad: 'Todas'
};

const cargarSesionInicial = (): { usuario: Usuario | null; token: string | null } => {
  try {
    const token = localStorage.getItem(REACT_TOKEN_KEY);
    const rawUser = localStorage.getItem(REACT_USER_KEY);
    if (!token || !rawUser) return { usuario: null, token: null };

    // Verificar si el JWT ya expiró
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem(REACT_TOKEN_KEY);
        localStorage.removeItem(REACT_USER_KEY);
        return { usuario: null, token: null };
      }
    }

    return {
      usuario: JSON.parse(rawUser) as Usuario,
      token
    };
  } catch {
    return { usuario: null, token: null };
  }
};

const sesionInicial = cargarSesionInicial();

const initialState: GlobalState = {
  usuario: sesionInicial.usuario,
  token: sesionInicial.token,
  citas: [],
  estadisticas: initialStats,
  usuariosRegistrados: [],
  filtros: initialFiltros,
  isLoading: false,
  serverOnline: true,
  databaseMode: 'MongoDB Activo',
  toasts: []
};

// Función pura Reducer (T01, T10)
function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        usuario: action.payload.usuario,
        token: action.payload.token
      };
    case 'CLEAR_AUTH':
      return {
        ...state,
        usuario: null,
        token: null,
        citas: [],
        usuariosRegistrados: []
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_CITAS':
      return {
        ...state,
        citas: action.payload
      };
    case 'SET_ESTADISTICAS':
      return {
        ...state,
        estadisticas: action.payload
      };
    case 'SET_USUARIOS':
      return {
        ...state,
        usuariosRegistrados: action.payload
      };
    case 'SET_FILTROS':
      return {
        ...state,
        filtros: { ...state.filtros, ...action.payload }
      };
    case 'RESET_FILTROS':
      return {
        ...state,
        filtros: initialFiltros
      };
    case 'SET_SERVER_STATUS':
      return {
        ...state,
        serverOnline: action.payload.online,
        databaseMode: action.payload.mode
      };
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload)
      };
    default:
      return state;
  }
}

interface GlobalContextProps extends GlobalState {
  isAuthenticated: boolean;
  citasFiltradas: Cita[];
  mostrarToast: (tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string) => void;
  cerrarToast: (id: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (datos: {
    nombre: string;
    email: string;
    password: string;
    rol: RolUsuario;
    especialidad: string;
  }) => Promise<boolean>;
  logout: () => void;
  simularTokenExpirado: () => Promise<void>;
  sincronizarDatos: () => Promise<void>;
  cargarUsuarios: () => Promise<void>;
  crearCita: (cita: Omit<Cita, '_id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  actualizarCita: (id: string, datos: Partial<Cita>) => Promise<boolean>;
  cambiarEstadoCita: (cita: Cita, nuevoEstado: CitaEstado) => Promise<void>;
  eliminarCita: (id: string) => Promise<boolean>;
  restaurarSeed: () => Promise<void>;
  actualizarRolUsuario: (id: string, rol: RolUsuario) => Promise<void>;
  actualizarFiltros: (nuevosFiltros: Partial<CitaFiltros>) => void;
  limpiarFiltros: () => void;
}

const GlobalStateContext = createContext<GlobalContextProps | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  const cerrarToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const mostrarToast = useCallback(
    (tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      dispatch({ type: 'ADD_TOAST', payload: { id, tipo, titulo, mensaje } });
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
      }, 4500);
    },
    []
  );

  const extraerMensajeError = (error: unknown, porDefecto: string): string => {
    const axiosErr = error as AxiosError<{ message?: string }>;
    return axiosErr.response?.data?.message || axiosErr.message || porDefecto;
  };

  // Escuchar eventos globales de expiración de token disparados por el interceptor Axios (T11)
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      dispatch({ type: 'CLEAR_AUTH' });
      mostrarToast(
        'error',
        'Sesión Expirada (JWT 401)',
        customEvent.detail?.message || 'Tu token JWT ha expirado. Inicia sesión nuevamente.'
      );
    };

    window.addEventListener('medisys:session-expired', handleSessionExpired);
    return () => window.removeEventListener('medisys:session-expired', handleSessionExpired);
  }, [mostrarToast]);

  // Verificar salud del servidor Express
  const verificarHealth = useCallback(async () => {
    try {
      const { data } = await api.get<{ status: string; databaseMode: string }>('/health');
      dispatch({
        type: 'SET_SERVER_STATUS',
        payload: { online: data.status === 'ONLINE', mode: data.databaseMode || 'MongoDB Activo' }
      });
    } catch {
      dispatch({
        type: 'SET_SERVER_STATUS',
        payload: { online: false, mode: 'Desconectado' }
      });
    }
  }, []);

  // Sincronizar citas y estadísticas desde MongoDB
  const sincronizarDatos = useCallback(async () => {
    if (!localStorage.getItem(REACT_TOKEN_KEY)) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [citasRes, statsRes] = await Promise.all([
        api.get<ApiResponse<Cita[]>>('/citas'),
        api.get<ApiResponse<EstadisticasCitas>>('/citas/estadisticas')
      ]);

      if (citasRes.data.data) {
        dispatch({ type: 'SET_CITAS', payload: citasRes.data.data });
      }
      if (statsRes.data.data) {
        dispatch({ type: 'SET_ESTADISTICAS', payload: statsRes.data.data });
      }
      await verificarHealth();
    } catch (error) {
      mostrarToast('error', 'Error de Sincronización', extraerMensajeError(error, 'No se pudo conectar al backend'));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [mostrarToast, verificarHealth]);

  const cargarUsuarios = useCallback(async () => {
    if (!localStorage.getItem(REACT_TOKEN_KEY)) return;
    try {
      const { data } = await api.get<ApiResponse<Usuario[]>>('/auth/usuarios');
      if (data.data) {
        dispatch({ type: 'SET_USUARIOS', payload: data.data });
      }
    } catch (error) {
      mostrarToast('error', 'Error al cargar usuarios', extraerMensajeError(error, 'Error al consultar usuarios'));
    }
  }, [mostrarToast]);

  useEffect(() => {
    verificarHealth();
    if (state.token) {
      sincronizarDatos();
    }
  }, [state.token, sincronizarDatos, verificarHealth]);

  // 1. Iniciar Sesión (T07, T11)
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await api.post<ApiResponse<AuthTokenResponse>>('/auth/login', {
        email,
        password
      });

      if (data.success && data.data) {
        localStorage.setItem(REACT_TOKEN_KEY, data.data.token);
        localStorage.setItem(REACT_USER_KEY, JSON.stringify(data.data.usuario));
        dispatch({
          type: 'SET_AUTH',
          payload: { usuario: data.data.usuario, token: data.data.token }
        });
        mostrarToast('success', 'Bienvenido al Panel React', data.message);
        return true;
      }
      return false;
    } catch (error) {
      mostrarToast('error', 'Credenciales Inválidas', extraerMensajeError(error, 'Error al iniciar sesión'));
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 2. Registrar Usuario (T07, T11)
  const register = async (datos: {
    nombre: string;
    email: string;
    password: string;
    rol: RolUsuario;
    especialidad: string;
  }): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await api.post<ApiResponse<AuthTokenResponse>>('/auth/register', datos);
      if (data.success && data.data) {
        localStorage.setItem(REACT_TOKEN_KEY, data.data.token);
        localStorage.setItem(REACT_USER_KEY, JSON.stringify(data.data.usuario));
        dispatch({
          type: 'SET_AUTH',
          payload: { usuario: data.data.usuario, token: data.data.token }
        });
        mostrarToast('success', 'Registro Exitoso', data.message);
        return true;
      }
      return false;
    } catch (error) {
      mostrarToast('error', 'Error en Registro', extraerMensajeError(error, 'No se pudo registrar el usuario'));
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 3. Cerrar Sesión (T11)
  const logout = useCallback(() => {
    localStorage.removeItem(REACT_TOKEN_KEY);
    localStorage.removeItem(REACT_USER_KEY);
    dispatch({ type: 'CLEAR_AUTH' });
    mostrarToast('info', 'Sesión Finalizada', 'Has cerrado sesión de forma segura en el Panel React.');
  }, [mostrarToast]);

  // 4. Simular Token Expirado/Inválido para demostrar T11 en vivo
  const simularTokenExpirado = async (): Promise<void> => {
    localStorage.setItem(REACT_TOKEN_KEY, 'token.jwt.expirado_demostracion_pa3');
    await api.get('/citas').catch(() => {
      // El interceptor Axios captura el 401 automáticamente y dispara medisys:session-expired
    });
  };

  // 5. Crear Cita en MongoDB
  const crearCita = async (cita: Omit<Cita, '_id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data } = await api.post<ApiResponse<Cita>>('/citas', cita);
      if (data.success) {
        mostrarToast('success', 'Cita Creada en MongoDB', data.message);
        await sincronizarDatos();
        return true;
      }
      return false;
    } catch (error) {
      mostrarToast('error', 'Error al Crear Cita', extraerMensajeError(error, 'Error al guardar en MongoDB'));
      return false;
    }
  };

  // 6. Actualizar Cita en MongoDB
  const actualizarCita = async (id: string, datos: Partial<Cita>): Promise<boolean> => {
    try {
      const { data } = await api.put<ApiResponse<Cita>>(`/citas/${id}`, datos);
      if (data.success) {
        mostrarToast('success', 'Cita Actualizada', data.message);
        await sincronizarDatos();
        return true;
      }
      return false;
    } catch (error) {
      mostrarToast('error', 'Error al Actualizar', extraerMensajeError(error, 'No se pudo actualizar la cita'));
      return false;
    }
  };

  // 7. Cambio Rápido de Estado
  const cambiarEstadoCita = async (cita: Cita, nuevoEstado: CitaEstado): Promise<void> => {
    if (!cita._id || cita.estado === nuevoEstado) return;
    await actualizarCita(cita._id, { estado: nuevoEstado });
  };

  // 8. Eliminar Cita en MongoDB (Protegido por Rol Admin en Backend)
  const eliminarCita = async (id: string): Promise<boolean> => {
    try {
      const { data } = await api.delete<ApiResponse<Cita>>(`/citas/${id}`);
      if (data.success) {
        mostrarToast('success', 'Cita Eliminada', data.message);
        await sincronizarDatos();
        return true;
      }
      return false;
    } catch (error) {
      mostrarToast('error', 'Permiso Denegado / Error', extraerMensajeError(error, 'Solo ADMIN puede eliminar citas'));
      return false;
    }
  };

  // 9. Restaurar Seed (Protegido por Rol Admin en Backend)
  const restaurarSeed = async (): Promise<void> => {
    try {
      const { data } = await api.post<ApiResponse<Cita[]>>('/citas/seed', {});
      if (data.success) {
        mostrarToast('success', 'Seed Restaurado', data.message);
        await sincronizarDatos();
      }
    } catch (error) {
      mostrarToast('error', 'Acceso Restringido (RBAC)', extraerMensajeError(error, 'Solo ADMIN puede restaurar el seed'));
    }
  };

  // 10. Actualizar Rol de Usuario (Solo Admin)
  const actualizarRolUsuario = async (id: string, rol: RolUsuario): Promise<void> => {
    try {
      const { data } = await api.patch<ApiResponse<Usuario>>(`/auth/usuarios/${id}/rol`, { rol });
      if (data.success) {
        mostrarToast('success', 'Rol Actualizado en MongoDB', data.message);
        await cargarUsuarios();
      }
    } catch (error) {
      mostrarToast('error', 'Acceso Denegado (RBAC)', extraerMensajeError(error, 'Solo ADMIN puede modificar roles'));
    }
  };

  const actualizarFiltros = useCallback((nuevosFiltros: Partial<CitaFiltros>) => {
    dispatch({ type: 'SET_FILTROS', payload: nuevosFiltros });
  }, []);

  const limpiarFiltros = useCallback(() => {
    dispatch({ type: 'RESET_FILTROS' });
  }, []);

  // Cálculo derivado memorizado (useMemo - T01, T09)
  const citasFiltradas = useMemo(() => {
    return state.citas.filter((cita) => {
      const coincideEstado = state.filtros.estado === 'Todos' || cita.estado === state.filtros.estado;
      const coincideEsp =
        state.filtros.especialidad === 'Todas' || cita.especialidad === state.filtros.especialidad;
      const coincidePrio =
        state.filtros.prioridad === 'Todas' || cita.prioridad === state.filtros.prioridad;

      const termino = state.filtros.buscar.trim().toLowerCase();
      const coincideBusqueda =
        !termino ||
        cita.cliente.toLowerCase().includes(termino) ||
        cita.profesional.toLowerCase().includes(termino) ||
        cita.especialidad.toLowerCase().includes(termino) ||
        cita.motivo.toLowerCase().includes(termino);

      return coincideEstado && coincideEsp && coincidePrio && coincideBusqueda;
    });
  }, [state.citas, state.filtros]);

  const value: GlobalContextProps = {
    ...state,
    isAuthenticated: !!state.token && !!state.usuario,
    citasFiltradas,
    mostrarToast,
    cerrarToast,
    login,
    register,
    logout,
    simularTokenExpirado,
    sincronizarDatos,
    cargarUsuarios,
    crearCita,
    actualizarCita,
    cambiarEstadoCita,
    eliminarCita,
    restaurarSeed,
    actualizarRolUsuario,
    actualizarFiltros,
    limpiarFiltros
  };

  return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
};

export const useGlobalState = (): GlobalContextProps => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState debe utilizarse dentro de un GlobalStateProvider');
  }
  return context;
};

