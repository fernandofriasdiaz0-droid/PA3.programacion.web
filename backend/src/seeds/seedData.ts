import { CitaModel } from '../models/cita.model';
import { UsuarioModel } from '../models/usuario.model';
import { ICita } from '../types/cita.interface';
import { IUsuario } from '../types/usuario.interface';

export const citasIniciales: Array<Omit<ICita, '_id' | 'createdAt' | 'updatedAt'>> = [
  {
    cliente: 'Juan Carlos Pérez',
    email: 'juan.perez@example.com',
    telefono: '+51 987 654 321',
    especialidad: 'Medicina General',
    profesional: 'Dr. Roberto Silva',
    fecha: '2026-10-20',
    hora: '09:00',
    motivo: 'Chequeo preventivo anual y control de presión arterial',
    estado: 'Confirmada',
    prioridad: 'Media',
    costo: 80.0,
    observaciones: 'Paciente con antecedentes de hipertensión familiar.',
    creadoPor: 'Dr. Fernando Administración (admin)'
  },
  {
    cliente: 'María Elena Gómez',
    email: 'maria.gomez@example.com',
    telefono: '+51 976 543 210',
    especialidad: 'Cardiología',
    profesional: 'Dra. Ana Patricia Ruiz',
    fecha: '2026-10-21',
    hora: '10:30',
    motivo: 'Evaluación cardiovascular por taquicardias esporádicas',
    estado: 'Pendiente',
    prioridad: 'Alta',
    costo: 150.0,
    observaciones: 'Traer electrocardiograma previo si cuenta con uno.',
    creadoPor: 'Lucía Admisión Clínica (recepcionista)'
  },
  {
    cliente: 'Rodrigo Morales Ramos',
    email: 'rodrigo.morales@example.com',
    telefono: '+51 965 432 109',
    especialidad: 'Dermatología',
    profesional: 'Dr. Fernando Castro',
    fecha: '2026-10-22',
    hora: '11:15',
    motivo: 'Revisión de manchas solares y dermatitis de contacto',
    estado: 'Confirmada',
    prioridad: 'Baja',
    costo: 120.0,
    observaciones: 'Evaluación con dermatoscopio.',
    creadoPor: 'Lucía Admisión Clínica (recepcionista)'
  },
  {
    cliente: 'Lucía Fernanda Torres',
    email: 'lucia.torres@example.com',
    telefono: '+51 954 321 098',
    especialidad: 'Pediatría',
    profesional: 'Dra. Carmen Delgado',
    fecha: '2026-10-18',
    hora: '15:00',
    motivo: 'Control de crecimiento y desarrollo - 5 años',
    estado: 'Completada',
    prioridad: 'Media',
    costo: 100.0,
    observaciones: 'Vacunación al día. Peso y talla en percentil adecuado.',
    creadoPor: 'Dra. Ana Patricia Ruiz (medico)'
  },
  {
    cliente: 'Gonzalo Andrés Vargas',
    email: 'gonzalo.vargas@example.com',
    telefono: '+51 943 210 987',
    especialidad: 'Odontología',
    profesional: 'Dra. Sofía Mendoza',
    fecha: '2026-10-17',
    hora: '16:30',
    motivo: 'Limpieza dental profunda y evaluación de molar inferior',
    estado: 'Cancelada',
    prioridad: 'Baja',
    costo: 90.0,
    observaciones: 'Cancelado por viaje imprevisto del paciente.',
    creadoPor: 'Lucía Admisión Clínica (recepcionista)'
  },
  {
    cliente: 'Valeria Alexandra Ramos',
    email: 'valeria.ramos@example.com',
    telefono: '+51 932 109 876',
    especialidad: 'Oftalmología',
    profesional: 'Dr. Javier Méndez',
    fecha: '2026-10-23',
    hora: '08:45',
    motivo: 'Disminución de agudeza visual en ojo izquierdo y fatiga ocular',
    estado: 'Pendiente',
    prioridad: 'Alta',
    costo: 130.0,
    observaciones: 'Uso previo de lentes de contacto.',
    creadoPor: 'Dr. Fernando Administración (admin)'
  }
];

export const usuariosIniciales: Array<Omit<IUsuario, '_id' | 'createdAt' | 'updatedAt'>> = [
  {
    nombre: 'Dr. Fernando Administración',
    email: 'admin@medisys.com',
    password: 'Admin123!',
    rol: 'admin',
    especialidad: 'Dirección Médica',
    activo: true
  },
  {
    nombre: 'Dra. Ana Patricia Ruiz',
    email: 'medico@medisys.com',
    password: 'Medico123!',
    rol: 'medico',
    especialidad: 'Cardiología',
    activo: true
  },
  {
    nombre: 'Lucía Admisión Clínica',
    email: 'recepcion@medisys.com',
    password: 'Recepcion123!',
    rol: 'recepcionista',
    especialidad: 'Recepción y Admisión',
    activo: true
  }
];

export const seedDatabase = async (): Promise<number> => {
  // 1. Sembrar usuarios iniciales con contraseñas encriptadas con bcrypt (T07)
  const usuariosCount = await UsuarioModel.countDocuments();
  if (usuariosCount === 0) {
    console.log('🔐 [Seeder] Creando usuarios iniciales con roles y contraseñas encriptadas (bcrypt)...');
    for (const user of usuariosIniciales) {
      await UsuarioModel.create(user);
    }
    console.log(`✅ [Seeder] Se crearon ${usuariosIniciales.length} usuarios de prueba (admin, medico, recepcionista).`);
  }

  // 2. Sembrar citas médicas iniciales (T06)
  const citasCount = await CitaModel.countDocuments();
  if (citasCount === 0) {
    console.log('🌱 [Seeder] Base de datos de citas vacía. Insertando datos de prueba iniciales...');
    const result = await CitaModel.insertMany(citasIniciales);
    console.log(`✅ [Seeder] Se insertaron ${result.length} citas de prueba.`);
    return result.length;
  }

  return citasCount;
};
