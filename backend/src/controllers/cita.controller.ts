import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CitaModel } from '../models/cita.model';
import { ApiResponse, EstadisticasCitas, ICita } from '../types/cita.interface';
import { citasIniciales } from '../seeds/seedData';

/**
 * Controlador de Citas Médicas - Medisys (PA3)
 * Implementa las operaciones CRUD, auditoría por usuario y lógica de negocio
 * Demuestra T01 (modern JS), T02 (TypeScript), T05 (Express REST API), T06 (MongoDB) y T07 (Seguridad JWT/Roles)
 */

// 1. OBTENER TODAS LAS CITAS (con filtros opcionales de búsqueda, estado, especialidad y prioridad)
export const obtenerCitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { buscar, estado, especialidad, prioridad } = req.query;

    // Construcción dinámica de consulta MongoDB usando operadores modernos
    const filtro: Record<string, unknown> = {};

    if (estado && typeof estado === 'string' && estado !== 'Todos') {
      filtro.estado = estado;
    }

    if (especialidad && typeof especialidad === 'string' && especialidad !== 'Todas') {
      filtro.especialidad = especialidad;
    }

    if (prioridad && typeof prioridad === 'string' && prioridad !== 'Todas') {
      filtro.prioridad = prioridad;
    }

    if (buscar && typeof buscar === 'string' && buscar.trim() !== '') {
      const regex = new RegExp(buscar.trim(), 'i');
      filtro.$or = [
        { cliente: regex },
        { profesional: regex },
        { especialidad: regex },
        { motivo: regex }
      ];
    }

    // Consulta persistente a MongoDB con orden cronológico
    const citas = await CitaModel.find(filtro).sort({ fecha: 1, hora: 1 }).lean();

    const response: ApiResponse<ICita[]> = {
      success: true,
      message: `Se encontraron ${citas.length} citas registradas`,
      total: citas.length,
      data: citas.map((item) => ({
        ...item,
        _id: item._id.toString()
      })) as ICita[]
    };

    res.status(200).json(response);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error al consultar las citas desde la base de datos',
      error: err.message
    });
  }
};

// 2. OBTENER CITA POR ID
export const obtenerCitaPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: `El identificador "${id}" no es un ObjectId válido de MongoDB`
      });
      return;
    }

    const cita = await CitaModel.findById(id).lean();

    if (!cita) {
      res.status(404).json({
        success: false,
        message: `No se encontró ninguna cita con el identificador: ${id}`
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cita recuperada exitosamente',
      data: {
        ...cita,
        _id: cita._id.toString()
      }
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error interno al consultar la cita',
      error: err.message
    });
  }
};

// 3. CREAR NUEVA CITA
export const crearCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      cliente,
      email,
      telefono,
      especialidad,
      profesional,
      fecha,
      hora,
      motivo,
      estado = 'Pendiente',
      prioridad = 'Media',
      costo,
      observaciones = ''
    } = req.body;

    // Validación manual de campos obligatorios en el backend (T05)
    const camposFaltantes = ['cliente', 'email', 'telefono', 'especialidad', 'profesional', 'fecha', 'hora', 'motivo', 'costo']
      .filter((campo) => req.body[campo] === undefined || req.body[campo] === null || req.body[campo] === '');

    if (camposFaltantes.length > 0) {
      res.status(400).json({
        success: false,
        message: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`
      });
      return;
    }

    const autorRegistro = req.usuario
      ? `${req.usuario.nombre} (${req.usuario.rol})`
      : 'Sistema Medisys';

    // Creación en MongoDB a través del modelo Mongoose (T06)
    const nuevaCita = await CitaModel.create({
      cliente: String(cliente).trim(),
      email: String(email).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      especialidad: String(especialidad).trim(),
      profesional: String(profesional).trim(),
      fecha,
      hora,
      motivo: String(motivo).trim(),
      estado,
      prioridad,
      costo: Number(costo),
      observaciones: observaciones?.trim() ?? '',
      creadoPor: autorRegistro
    });

    res.status(201).json({
      success: true,
      message: 'Cita médica registrada exitosamente en MongoDB',
      data: nuevaCita
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({
      success: false,
      message: 'Error al registrar la cita médica',
      error: err.message
    });
  }
};

// 4. ACTUALIZAR CITA EXISTENTE
export const actualizarCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: `Identificador de MongoDB no válido: ${id}`
      });
      return;
    }

    const datosActualizados = { ...req.body };

    // Restricción RBAC para el rol 'medico': solo puede cambiar 'estado' u 'observaciones', no datos administrativos
    if (req.usuario?.rol === 'medico') {
      const camposAdministrativos = ['cliente', 'email', 'telefono', 'especialidad', 'profesional', 'fecha', 'hora', 'costo'];
      const intentaEditarAdmin = camposAdministrativos.some((campo) => datosActualizados[campo] !== undefined);
      if (intentaEditarAdmin) {
        res.status(403).json({
          success: false,
          code: 'FORBIDDEN_ROLE',
          message: 'Acceso denegado (RBAC): El rol MÉDICO solo puede actualizar el estado de atención de la cita, no editar los datos administrativos.'
        });
        return;
      }
    }

    if (datosActualizados.costo !== undefined) {
      datosActualizados.costo = Number(datosActualizados.costo);
    }

    const citaActualizada = await CitaModel.findByIdAndUpdate(
      id,
      { $set: datosActualizados },
      { new: true, runValidators: true }
    );

    if (!citaActualizada) {
      res.status(404).json({
        success: false,
        message: `No se encontró la cita con ID ${id} para actualizar`
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cita actualizada correctamente en MongoDB',
      data: citaActualizada
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la cita',
      error: err.message
    });
  }
};

// 5. ELIMINAR CITA (Protegido para rol Admin en rutas)
export const eliminarCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: `Identificador de MongoDB no válido: ${id}`
      });
      return;
    }

    const citaEliminada = await CitaModel.findByIdAndDelete(id);

    if (!citaEliminada) {
      res.status(404).json({
        success: false,
        message: `No se encontró la cita con ID ${id} para eliminar`
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Cita de "${citaEliminada.cliente}" eliminada satisfactoriamente de la base de datos`,
      data: citaEliminada
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la cita de MongoDB',
      error: err.message
    });
  }
};

// 6. ESTADÍSTICAS PARA EL DASHBOARD (Angular y React)
export const obtenerEstadisticas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const citas = await CitaModel.find().lean();

    // Demostración de métodos modernos de manipulación de arreglos e inmutabilidad (T01): reduce, filter
    const stats: EstadisticasCitas = {
      total: citas.length,
      pendientes: citas.filter((c) => c.estado === 'Pendiente').length,
      confirmadas: citas.filter((c) => c.estado === 'Confirmada').length,
      enAtencion: citas.filter((c) => c.estado === 'En Atención').length,
      completadas: citas.filter((c) => c.estado === 'Completada').length,
      canceladas: citas.filter((c) => c.estado === 'Cancelada').length,
      ingresosEstimados: citas
        .filter((c) => c.estado !== 'Cancelada')
        .reduce((acumulado, c) => acumulado + (c.costo || 0), 0),
      porEspecialidad: citas.reduce<Record<string, number>>((acc, c) => {
        const esp = c.especialidad || 'General';
        return { ...acc, [esp]: (acc[esp] || 0) + 1 };
      }, {}),
      porPrioridad: citas.reduce<Record<string, number>>((acc, c) => {
        const prio = c.prioridad || 'Media';
        return { ...acc, [prio]: (acc[prio] || 0) + 1 };
      }, {})
    };

    res.status(200).json({
      success: true,
      message: 'Estadísticas calculadas exitosamente',
      data: stats
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error al calcular estadísticas',
      error: err.message
    });
  }
};

// 7. RESTAURAR DATOS DE PRUEBA (SEED - Protegido para rol Admin)
export const restaurarSeed = async (_req: Request, res: Response): Promise<void> => {
  try {
    await CitaModel.deleteMany({});
    const insertados = await CitaModel.insertMany(citasIniciales);

    res.status(200).json({
      success: true,
      message: `Base de datos restaurada con ${insertados.length} citas de prueba`,
      total: insertados.length,
      data: insertados
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'Error al restaurar registros de prueba',
      error: err.message
    });
  }
};
