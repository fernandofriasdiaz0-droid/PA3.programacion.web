import { Schema, model, Document } from 'mongoose';
import { ICita } from '../types/cita.interface';

export interface ICitaDocument extends Omit<ICita, '_id'>, Document {}

const CitaSchema = new Schema<ICitaDocument>(
  {
    cliente: {
      type: String,
      required: [true, 'El nombre del cliente o paciente es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres']
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'El formato de correo electrónico no es válido']
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono de contacto es obligatorio'],
      trim: true
    },
    especialidad: {
      type: String,
      required: [true, 'La especialidad médica es obligatoria'],
      trim: true
    },
    profesional: {
      type: String,
      required: [true, 'El nombre del profesional o médico es obligatorio'],
      trim: true
    },
    fecha: {
      type: String,
      required: [true, 'La fecha de la cita es obligatoria'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD']
    },
    hora: {
      type: String,
      required: [true, 'El horario de atención es obligatorio'],
      match: [/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'El horario debe tener el formato HH:mm']
    },
    motivo: {
      type: String,
      required: [true, 'El motivo de atención es obligatorio'],
      trim: true,
      minlength: [5, 'El motivo debe tener al menos 5 caracteres']
    },
    estado: {
      type: String,
      enum: {
        values: ['Pendiente', 'Confirmada', 'En Atención', 'Completada', 'Cancelada'],
        message: '{VALUE} no es un estado válido'
      },
      default: 'Pendiente'
    },
    prioridad: {
      type: String,
      enum: {
        values: ['Baja', 'Media', 'Alta', 'Urgente'],
        message: '{VALUE} no es una prioridad válida'
      },
      default: 'Media'
    },
    costo: {
      type: Number,
      required: [true, 'El costo de la consulta es obligatorio'],
      min: [0, 'El costo no puede ser negativo']
    },
    observaciones: {
      type: String,
      trim: true,
      default: ''
    },
    creadoPor: {
      type: String,
      trim: true,
      default: 'Sistema Medisys'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const CitaModel = model<ICitaDocument>('Cita', CitaSchema);
