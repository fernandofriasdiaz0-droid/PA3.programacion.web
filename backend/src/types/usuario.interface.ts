/**
 * Definición de tipos, enumeraciones e interfaces para Autenticación y Usuarios (T01, T02, T07)
 */

export enum RolUsuarioEnum {
  ADMIN = 'admin',
  MEDICO = 'medico',
  RECEPCIONISTA = 'recepcionista'
}

export type RolUsuario = 'admin' | 'medico' | 'recepcionista';

export interface IUsuario {
  _id?: string;
  nombre: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  especialidad?: string;
  activo: boolean;
  ultimoAcceso?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UsuarioPublico = Omit<IUsuario, 'password'>;

export interface JwtPayloadData {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  iat?: number;
  exp?: number;
}

export interface AuthTokenResponse {
  token: string;
  expiresIn: string;
  usuario: UsuarioPublico;
}

