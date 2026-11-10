/**
 * Modelo de Citas Médicas para el Frontend Angular (PA3)
 * Cumple con los requerimientos técnicos T01 y T02
 */

export type CitaEstado = 'Pendiente' | 'Confirmada' | 'En Atención' | 'Completada' | 'Cancelada';
export type CitaPrioridad = 'Baja' | 'Media' | 'Alta' | 'Urgente';

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

export interface CitaFiltros {
  buscar?: string;
  estado?: string;
  especialidad?: string;
  prioridad?: string;
}

export interface EstadisticasCitas {
  total: number;
  pendientes: number;
  confirmadas: number;
  enAtencion?: number;
  completadas: number;
  canceladas: number;
  ingresosEstimados: number;
  porEspecialidad: Record<string, number>;
  porPrioridad?: Record<string, number>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  total?: number;
  data?: T;
  error?: string;
  code?: string;
}

export const ESPECIALIDADES_DISPONIBLES: string[] = [
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

export const PROFESIONALES_POR_ESPECIALIDAD: Record<string, string[]> = {
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
