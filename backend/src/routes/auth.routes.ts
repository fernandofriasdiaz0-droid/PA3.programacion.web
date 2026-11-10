import { Router } from 'express';
import {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  listarUsuarios,
  actualizarRolUsuario
} from '../controllers/auth.controller';
import { verificarToken, autorizarRoles } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas de autenticación (T07)
router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);

// Rutas protegidas con JWT y autorización por roles (T07)
router.get('/perfil', verificarToken, obtenerPerfil);
router.get('/usuarios', verificarToken, listarUsuarios);
router.patch('/usuarios/:id/rol', verificarToken, autorizarRoles('admin'), actualizarRolUsuario);

export default router;

