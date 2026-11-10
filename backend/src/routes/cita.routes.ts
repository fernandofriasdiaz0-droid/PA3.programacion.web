import { Router } from 'express';
import {
  obtenerCitas,
  obtenerCitaPorId,
  crearCita,
  actualizarCita,
  eliminarCita,
  obtenerEstadisticas,
  restaurarSeed
} from '../controllers/cita.controller';
import { verificarToken, autorizarRoles } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Rutas de Citas Médicas protegidas con JWT y Autorización por Roles (T05, T07)
 * - Lectura (GET): permitida para todos los roles autenticados (admin, medico, recepcionista)
 * - Creación (POST): permitida solo para 'admin' y 'recepcionista'
 * - Actualización (PUT): 'admin' y 'recepcionista' editan todo; 'medico' solo puede cambiar el estado clínico
 * - Eliminación y Restauración de Seed (DELETE / POST seed): exclusiva para rol 'admin'
 */

// Rutas especiales (antes de /:id para evitar colisiones)
router.get('/estadisticas', verificarToken, obtenerEstadisticas);
router.post('/seed', verificarToken, autorizarRoles('admin'), restaurarSeed);

// Operaciones CRUD principales
router.get('/', verificarToken, obtenerCitas);
router.get('/:id', verificarToken, obtenerCitaPorId);
router.post('/', verificarToken, autorizarRoles('admin', 'recepcionista'), crearCita);
router.put('/:id', verificarToken, autorizarRoles('admin', 'recepcionista', 'medico'), actualizarCita);
router.delete('/:id', verificarToken, autorizarRoles('admin'), eliminarCita);

export default router;
