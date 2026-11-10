/**
 * Modelos, enumeraciones e interfaces de Autenticación y Roles para Angular (T02, T04, T07)
 */

export enum RolUsuarioEnum {
  ADMIN = 'admin',
  MEDICO = 'medico',
  RECEPCIONISTA = 'recepcionista'
}

export type RolUsuario = 'admin' | 'medico' | 'recepcionista';

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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
  especialidad?: string;
}

export interface AuthTokenResponse {
  token: string;
  expiresIn: string;
  usuario: Usuario;
}

