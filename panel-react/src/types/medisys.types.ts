/**
 * Definición de Tipos, Enumeraciones y Genéricos para el Panel React (T01, T02, T09, T10, T11)
 * Mantiene total coherencia de tipos con el Backend Express/MongoDB y el Frontend Angular
 */

export type RolUsuario = 'admin' | 'medico' | 'recepcionista';
export type CitaEstado = 'Pendiente' | 'Confirmada' | 'En Atención' | 'Completada' | 'Cancelada';
export type CitaPrioridad = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  especialidad?: string;
  activo: boolean;
  ultimoAcceso?: string;
  createdAt?: string;
}

export interface Cita {
  _id?: string;
  cliente: string;
  email: string;
  telefono: string;
  especialidad: string;
  profesional: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: CitaEstado;
  prioridad: CitaPrioridad;
  costo: number;
  observaciones?: string;
  creadoPor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstadisticasCitas {
  total: number;
  pendientes: number;
  confirmadas: number;
  enAtencion: number;
  completadas: number;
  canceladas: number;
  ingresosEstimados: number;
  porEspecialidad: Record<string, number>;
  porPrioridad: Record<string, number>;
}

export interface CitaFiltros {
  buscar: string;
  estado: string;
  especialidad: string;
  prioridad: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  error?: string;
  code?: string;
}

export interface AuthTokenResponse {
  token: string;
  expiresIn: string;
  usuario: Usuario;
}

export interface ToastItem {
  id: string;
  tipo: 'success' | 'error' | 'info';
  titulo: string;
  mensaje: string;
}

export const ESPECIALIDADES_LISTA: readonly string[] = [
  'Medicina General',
  'Cardiología',
  'Pediatría',
  'Dermatología',
  'Odontología',
  'Oftalmología',
  'Neurología',
  'Traumatología',
  'Ginecología'
];

export const MEDICOS_POR_ESPECIALIDAD: Record<string, string[]> = {
  'Medicina General': ['Dr. Roberto Silva', 'Dra. Patricia Wong'],
  'Cardiología': ['Dra. Ana Patricia Ruiz', 'Dr. Marcos Valdivia'],
  'Pediatría': ['Dra. Carmen Delgado', 'Dr. Luis Estrada'],
  'Dermatología': ['Dr. Fernando Castro', 'Dra. Gabriela Vega'],
  'Odontología': ['Dra. Sofía Mendoza', 'Dr. Kevin Barrientos'],
  'Oftalmología': ['Dr. Javier Méndez', 'Dra. Lorena Salinas'],
  'Neurología': ['Dra. Elena Ramos', 'Dr. Andrés Pacheco'],
  'Traumatología': ['Dr. Hugo Benavides', 'Dr. Carlos Poma'],
  'Ginecología': ['Dra. Valeria Quintana', 'Dra. Rocío Alarcón']
};

