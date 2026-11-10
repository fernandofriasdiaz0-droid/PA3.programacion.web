import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUsuario, RolUsuarioEnum } from '../types/usuario.interface';

export interface IUsuarioDocument extends Omit<IUsuario, '_id'>, Document {
  compararPassword(passwordCandidato: string): Promise<boolean>;
}

const UsuarioSchema = new Schema<IUsuarioDocument>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre completo del usuario es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres']
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'El formato del correo electrónico no es válido']
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false
    },
    rol: {
      type: String,
      enum: {
        values: [RolUsuarioEnum.ADMIN, RolUsuarioEnum.MEDICO, RolUsuarioEnum.RECEPCIONISTA],
        message: '{VALUE} no es un rol válido en el sistema'
      },
      default: RolUsuarioEnum.RECEPCIONISTA
    },
    especialidad: {
      type: String,
      trim: true,
      default: 'General'
    },
    activo: {
      type: Boolean,
      default: true
    },
    ultimoAcceso: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Middleware pre-save para encriptar la contraseña con bcrypt (T07)
UsuarioSchema.pre<IUsuarioDocument>('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método de instancia para verificar la contraseña ingresada con el hash almacenado (T07)
UsuarioSchema.methods.compararPassword = async function (passwordCandidato: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(passwordCandidato, this.password);
};

export const UsuarioModel = model<IUsuarioDocument>('Usuario', UsuarioSchema);

