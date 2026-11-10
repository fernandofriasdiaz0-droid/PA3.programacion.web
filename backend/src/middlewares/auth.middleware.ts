import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { JwtPayloadData, RolUsuario } from '../types/usuario.interface';

// Extensión del tipo Request de Express para incluir los datos del usuario autenticado (T02)
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayloadData;
    }
  }
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'medisys_pa3_super_secret_jwt_key_2026';
};

/**
 * Middleware de autenticación JWT (T05, T07)
 * Verifica la validez y vigencia del token Bearer enviado en la cabecera Authorization
 */
export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Acceso denegado. Se requiere iniciar sesión con un token JWT válido (Bearer Token).'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        code: 'INVALID_FORMAT',
        message: 'Formato de cabecera de autorización no válido.'
      });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayloadData;
    req.usuario = decoded;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      });
      return;
    }

    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Token JWT inválido o manipulado. Inicia sesión nuevamente.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error interno al verificar la autenticación.'
    });
  }
};

/**
 * Middleware de autorización basada en roles (RBAC - T07)
 * Función de orden superior que restringe el acceso según los roles permitidos
 */
export const autorizarRoles = (...rolesPermitidos: RolUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Usuario no autenticado.'
      });
      return;
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: `Acceso restringido: tu rol actual (${req.usuario.rol.toUpperCase()}) no tiene permisos para realizar esta operación. Se requiere rol: ${rolesPermitidos.map((r) => r.toUpperCase()).join(' o ')}.`
      });
      return;
    }

    next();
  };
};

