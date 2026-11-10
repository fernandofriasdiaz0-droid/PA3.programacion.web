import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario.model';
import { ApiResponse } from '../types/cita.interface';
import { AuthTokenResponse, JwtPayloadData, RolUsuario, UsuarioPublico } from '../types/usuario.interface';

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'medisys_pa3_super_secret_jwt_key_2026';
};

const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || '8h';
};

/**
 * Función pura auxiliar para generar tokens JWT firmados (T01, T07)
 */
const generarTokenJwt = (payload: JwtPayloadData): string => {
  const options: SignOptions = {
    expiresIn: getJwtExpiresIn() as SignOptions['expiresIn']
  };
  return jwt.sign(payload, getJwtSecret(), options);
};

// 1. REGISTRO DE NUEVO USUARIO (POST /api/auth/register)
export const registrarUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nombre,
      email,
      password,
      rol = 'recepcionista',
      especialidad = 'General'
    } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben completarse (nombre, email y contraseña).'
      });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres por seguridad.'
      });
      return;
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    const usuarioExistente = await UsuarioModel.findOne({ email: emailNormalizado });

    if (usuarioExistente) {
      res.status(409).json({
        success: false,
        message: `El correo electrónico "${emailNormalizado}" ya se encuentra registrado en Medisys.`
      });
      return;
    }

    const rolesValidos: RolUsuario[] = ['admin', 'medico', 'recepcionista'];
    const rolAsignado: RolUsuario = rolesValidos.includes(rol) ? rol : 'recepcionista';

    const nuevoUsuario = await UsuarioModel.create({
      nombre: String(nombre).trim(),
      email: emailNormalizado,
      password: String(password),
      rol: rolAsignado,
      especialidad: String(especialidad || 'General').trim(),
      activo: true,
      ultimoAcceso: new Date()
    });

    const payload: JwtPayloadData = {
      id: nuevoUsuario._id.toString(),
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol
    };

    const token = generarTokenJwt(payload);

    const usuarioPublico: UsuarioPublico = {
      _id: nuevoUsuario._id.toString(),
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      especialidad: nuevoUsuario.especialidad,
      activo: nuevoUsuario.activo,
      ultimoAcceso: nuevoUsuario.ultimoAcceso,
      createdAt: nuevoUsuario.createdAt
    };

    const response: ApiResponse<AuthTokenResponse> = {
      success: true,
      message: `Usuario "${nuevoUsuario.nombre}" registrado exitosamente con rol ${nuevoUsuario.rol.toUpperCase()}.`,
      data: {
        token,
        expiresIn: getJwtExpiresIn(),
        usuario: usuarioPublico
      }
    };

    res.status(201).json(response);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({
      success: false,
      message: 'Error al registrar el usuario en MongoDB',
      error: err.message
    });
  }
};

// 2. INICIO DE SESIÓN CON BCRYPT Y JWT (POST /api/auth/login)
export const iniciarSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Por favor ingresa tu correo electrónico y contraseña.'
      });
      return;
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    const usuario = await UsuarioModel.findOne({ email: emailNormalizado }).select('+password');

    if (!usuario) {
      res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas: correo electrónico o contraseña incorrectos.'
      });
      return;
    }

    if (!usuario.activo) {
      res.status(403).json({
        success: false,
        code: 'USER_INACTIVE',
        message: 'Esta cuenta de usuario se encuentra desactivada. Contacta al administrador.'
      });
      return;
    }

    const passwordValido = await usuario.compararPassword(String(password));
    if (!passwordValido) {
      res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas: correo electrónico o contraseña incorrectos.'
      });
      return;
    }

    usuario.ultimoAcceso = new Date();
    await usuario.save();

    const payload: JwtPayloadData = {
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };

    const token = generarTokenJwt(payload);

    const usuarioPublico: UsuarioPublico = {
      _id: usuario._id.toString(),
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      especialidad: usuario.especialidad,
      activo: usuario.activo,
      ultimoAcceso: usuario.ultimoAcceso,
      createdAt: usuario.createdAt
    };

    const response: ApiResponse<AuthTokenResponse> = {
      success: true,
      message: `Bienvenido(a), ${usuario.nombre} (${usuario.rol.toUpperCase()})`,
      data: {
        token,
        expiresIn: getJwtExpiresIn(),
        usuario: usuarioPublico
      }
    };

    res.status(200).json(response);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error interno al procesar el inicio de sesión',
      error: err.message
    });
  }
};

// 3. OBTENER PERFIL DEL USUARIO AUTENTICADO (GET /api/auth/perfil)
export const obtenerPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.usuario?.id) {
      res.status(401).json({
        success: false,
        message: 'No se encontró sesión activa.'
      });
      return;
    }

    const usuario = await UsuarioModel.findById(req.usuario.id).lean();
    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'El usuario asociado al token ya no existe en la base de datos.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Perfil de sesión recuperado exitosamente',
      data: {
        usuario: {
          ...usuario,
          _id: usuario._id.toString()
        },
        tokenInfo: {
          iat: req.usuario.iat,
          exp: req.usuario.exp
        }
      }
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil del usuario',
      error: err.message
    });
  }
};

// 4. LISTAR TODOS LOS USUARIOS REGISTRADOS (GET /api/auth/usuarios)
export const listarUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await UsuarioModel.find().sort({ createdAt: 1 }).lean();

    res.status(200).json({
      success: true,
      message: `Se encontraron ${usuarios.length} usuarios registrados`,
      total: usuarios.length,
      data: usuarios.map((u) => ({
        ...u,
        _id: u._id.toString()
      }))
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error al consultar la lista de usuarios',
      error: err.message
    });
  }
};

// 5. ACTUALIZAR ROL O ESTADO DE USUARIO (SOLO ADMIN - PATCH /api/auth/usuarios/:id/rol)
export const actualizarRolUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { rol, activo } = req.body;

    const camposActualizar: Record<string, unknown> = {};
    if (rol && ['admin', 'medico', 'recepcionista'].includes(rol)) {
      camposActualizar.rol = rol;
    }
    if (typeof activo === 'boolean') {
      camposActualizar.activo = activo;
    }

    const usuarioActualizado = await UsuarioModel.findByIdAndUpdate(
      id,
      { $set: camposActualizar },
      { new: true, runValidators: true }
    ).lean();

    if (!usuarioActualizado) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Permisos de "${usuarioActualizado.nombre}" actualizados correctamente.`,
      data: {
        ...usuarioActualizado,
        _id: usuarioActualizado._id.toString()
      }
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el rol del usuario',
      error: err.message
    });
  }
};

