import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, isUsingMemoryDatabase } from './config/database';
import { seedDatabase } from './seeds/seedData';
import authRoutes from './routes/auth.routes';
import citaRoutes from './routes/cita.routes';

// Carga de variables de entorno (T05)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares (CORS habilitado para Angular :4200 y React :5173)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());

// Middleware para evitar almacenamiento en caché de respuestas
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Middleware de registro ligero de peticiones
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Endpoint público de estado del servidor (Health Check)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Medisys API REST - Gestión de Citas Médicas (PA3 Full Stack)',
    version: '3.0.0',
    security: 'JWT + Bcrypt + RBAC Active',
    clients: ['Angular Principal (4200)', 'React Panel Secundario (5173)'],
    timestamp: new Date().toISOString(),
    databaseMode: isUsingMemoryDatabase() ? 'MongoDB In-Memory' : 'MongoDB Standard'
  });
});

// Rutas de la API REST (T05, T06, T07)
app.use('/api/auth', authRoutes);
app.use('/api/citas', citaRoutes);

// Manejo de rutas no encontradas (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: [${req.method}] ${req.originalUrl}`
  });
});

// Manejo global de errores (T05)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Error global no capturado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicialización del servidor y base de datos
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`
===================================================================
🚀 Servidor Medisys Backend (PA3) corriendo exitosamente
📡 URL Base:         http://localhost:${PORT}
🩺 Endpoint Health:  http://localhost:${PORT}/api/health
🔐 API Auth (JWT):   http://localhost:${PORT}/api/auth/login
📋 API Citas:        http://localhost:${PORT}/api/citas
📊 Estadísticas:     http://localhost:${PORT}/api/citas/estadisticas
👤 Cuentas Demo:     admin@medisys.com / Admin123! (Rol: admin)
                     medico@medisys.com / Medico123! (Rol: medico)
                     recepcion@medisys.com / Recepcion123! (Rol: recepcionista)
===================================================================
      `);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
