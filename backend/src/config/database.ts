import mongoose from 'mongoose';
import dotenv from 'dotenv';
import net from 'net';
import path from 'path';
import fs from 'fs';
import os from 'os';

dotenv.config();

let isMemoryServer = false;

const isPortOpen = (port: number, host: string, timeout = 400): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

export const connectDatabase = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medisys_db';
  const isLocalHost = uri.includes('127.0.0.1') || uri.includes('localhost');

  try {
    // Si la URI es local, verificar en 400ms si el puerto 27017 está abierto para no congelar el servidor
    if (isLocalHost) {
      const portOpen = await isPortOpen(27017, '127.0.0.1', 400);
      if (!portOpen) {
        throw new Error('Puerto local 27017 no está activo');
      }
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✅ [MongoDB] Conectado exitosamente a la base de datos: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch {
    console.warn(`⚡ [MongoDB] Modo rápido: iniciando MongoDB en memoria para pruebas locales inmediatas...`);

    try {
      await mongoose.disconnect();
      const { MongoMemoryServer } = await import('mongodb-memory-server');

      const cacheDir = path.resolve(__dirname, '../../node_modules/.cache/mongodb-memory-server');
      const candidatosBinario = [
        path.join(cacheDir, 'mongod-x64-win32-8.2.6.exe'),
        path.join(os.homedir(), '.cache', 'mongodb-binaries', 'mongod-x64-win32-8.2.6.exe')
      ];
      const binarioExistente = candidatosBinario.find((ruta) => fs.existsSync(ruta));

      const mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'medisys_db'
        },
        binary: binarioExistente
          ? { systemBinary: binarioExistente }
          : { downloadDir: cacheDir }
      });
      const memoryUri = mongod.getUri();
      isMemoryServer = true;

      await mongoose.connect(memoryUri);
      console.log(`⚡ [MongoDB] Conectado a MongoDB Real en Memoria: ${memoryUri}`);
      console.log(`📌 Todos los datos, usuarios (Bcrypt/JWT) y operaciones CRUD funcionan con persistencia MongoDB.`);
    } catch (memError) {
      console.error('❌ [MongoDB] Error crítico al inicializar la base de datos:', memError);
      throw memError;
    }
  }
};

export const isUsingMemoryDatabase = (): boolean => isMemoryServer;

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
