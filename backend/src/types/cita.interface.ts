/**
 * Definición de tipos, enumeraciones e interfaces para el módulo de Citas
 * Cumple con T01 (fundamentos modernos e inmutabilidad) y T02 (tipado TypeScript: interfaces, enums, genéricos)
 */

export enum EstadoCitaEnum {
  PENDIENTE = 'Pendiente',
  CONFIRMADA = 'Confirmada',
  EN_ATENCION = 'En Atención',
  COMPLETADA = 'Completada',
  CANCELADA = 'Cancelada'
}

export enum PrioridadCitaEnum {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  URGENTE = 'Urgente'
}

export type CitaEstado = 'Pendiente' | 'Confirmada' | 'En Atención' | 'Completada' | 'Cancelada';
export type CitaPrioridad = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export interface ICita {
  readonly _id?: string;
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
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface CitaFiltros {
  readonly estado?: string;
  readonly especialidad?: string;
  readonly profesional?: string;
  readonly buscar?: string;
  readonly prioridad?: string;
  readonly fechaDesde?: string;
  readonly fechaHasta?: string;
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

/**
 * Interfaz genérica reutilizable para respuestas estandarizadas de la API REST (T02)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  error?: string;
  code?: string;
}
