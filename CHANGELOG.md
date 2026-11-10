# 📋 Bitácora de Cambios y Refactorización (CHANGELOG.md) — Medisys

> **Proyecto:** Sistema de Gestión de Citas Médicas — Medisys  
> **Evaluación:** Área Integradora — Proyecto de Desarrollo Web Full (PA3)  
> **Requerimiento Técnico:** **T08. Refactorización y control de cambios**  
> **Autor:** Jose Fernando Frias Diaz (`fernandofriasdiaz0-droid`)  

Este documento registra de manera cronológica y estructurada las observaciones, correcciones, refactorizaciones de código y nuevas funcionalidades implementadas en la evolución del sistema desde la **PA2** hacia la **PA3**.

---

## [v3.0.0] — Entrega Final PA3 (Autenticación JWT, RBAC, Panel React y Estado Global)

### 🔐 Nuevas Funcionalidades Incorporadas (Added)
1. **Módulo Completo de Autenticación y Seguridad en Backend (`T07`):**
   - Creación del esquema y modelo Mongoose `UsuarioModel` (`backend/src/models/usuario.model.ts`) con encriptación automática de contraseñas mediante `bcryptjs` (salt factor = 10) en un hook `pre('save')`.
   - Implementación de generación y verificación de JSON Web Tokens (`jsonwebtoken`) con tiempo de expiración configurable (`JWT_EXPIRES_IN=8h`).
   - Desarrollo del controlador `auth.controller.ts` y rutas `/api/auth/register`, `/api/auth/login`, `/api/auth/perfil`, `/api/auth/usuarios` y `/api/auth/usuarios/:id/rol`.
   - Creación de los middlewares de seguridad `verificarToken` (validación Bearer JWT y detección de `TokenExpiredError`) y `autorizarRoles(...roles)` para control de acceso basado en roles (**RBAC**: `admin`, `medico`, `recepcionista`).

2. **Seguridad, Guards e Interceptores HTTP en Angular (`T03`, `T04`, `T07`):**
   - Implementación del servicio `AuthService` (`frontend/src/app/core/services/auth.service.ts`) para gestionar el ciclo de vida del token JWT y el estado reactivo del usuario (`BehaviorSubject<Usuario | null>`).
   - Creación del interceptor funcional `authInterceptor` (`frontend/src/app/core/interceptors/auth.interceptor.ts`) que adjunta automáticamente la cabecera `Authorization: Bearer <token>` y gestiona errores `401 Unauthorized` (sesión expirada) y `403 Forbidden` (rol insuficiente).
   - Implementación de `authGuard` y `roleGuard` (`frontend/src/app/core/guards/auth.guard.ts`) en `app.routes.ts`.
   - Creación de los componentes standalone `LoginComponent` y `RegisterComponent` con formularios reactivos (`ReactiveFormsModule`), validadores y botones de acceso rápido de prueba para los 3 roles.

3. **Panel Secundario SPA en React.js (`T09`, `T10`, `T11`):**
   - Creación de la aplicación SPA `panel-react/` con **React 18 + TypeScript + Vite** y navegación declarativa con **React Router DOM v6** (`/login`, `/panel`, `/citas`, `/seguridad`).
   - Implementación del **Estado Global** (`panel-react/src/context/GlobalStateContext.tsx`) utilizando **Context API + `useReducer`** para compartir de forma centralizada la sesión JWT, la colección de citas médicas, estadísticas, filtros y notificaciones Toast.
   - Configuración del cliente HTTP **Axios** (`panel-react/src/services/api.ts`) con interceptores de petición y respuesta para inyección de token y cierre automático de sesión ante tokens expirados (`T11`).
   - Creación del módulo **Seguridad JWT & Roles** (`SecurityAuditPage.tsx`) que permite inspeccionar el payload del token activo, probar la expiración del token en vivo y gestionar roles de usuarios en MongoDB.

---

### 🛠️ Refactorizaciones Realizadas respecto a PA2 (Refactored)
1. **Tipado Estricto, Enumeraciones e Inmutabilidad (`T01`, `T02`):**
   - *Observación en PA2:* Algunos tipos en el backend y frontend usaban uniones literales simples sin enumeraciones explícitas ni propiedades de solo lectura (`readonly`).
   - *Mejora en PA3:* Se refactorizaron `backend/src/types/cita.interface.ts` y `usuario.interface.ts` incorporando `EstadoCitaEnum`, `PrioridadCitaEnum`, `RolUsuarioEnum`, modificadores `readonly` e interfaces genéricas `ApiResponse<T>`.
2. **Inmutabilidad en Cálculos Estadísticos (`T01`):**
   - *Observación en PA2:* En `obtenerEstadisticas` (`cita.controller.ts`), el acumulador de `reduce` mutaba directamente el objeto acumulador (`acc[esp] = ...`).
   - *Mejora en PA3:* Se refactorizó utilizando propagación inmutable (`return { ...acc, [esp]: (acc[esp] || 0) + 1 }`) y se añadieron métricas de citas `enAtencion` y desglose `porPrioridad`.
3. **Auditoría de Creación en Citas Médicas (`T06`, `T07`):**
   - *Mejora en PA3:* Se amplió el modelo `CitaModel` con el campo `creadoPor`, registrando automáticamente el nombre y rol del usuario autenticado en el token JWT al crear una cita desde Angular o React.

---

### 🐛 Correcciones de Errores y Seguridad (Fixed)
1. **Protección de Endpoints Críticos (`DELETE` y `/seed`):**
   - *Observación en PA2:* Cualquier visitante podía invocar `DELETE /api/citas/:id` o `POST /api/citas/seed` sin autenticación.
   - *Corrección en PA3:* Todas las rutas de `/api/citas` requieren ahora token JWT válido (`verificarToken`), y las operaciones destructivas (`DELETE /:id` y `POST /seed`) están restringidas exclusivamente al rol `admin` mediante `autorizarRoles('admin')`.
2. **Sincronización Multi-Cliente (CORS y Cache-Control):**
   - Se actualizaron las cabeceras CORS en `server.ts` para permitir explícitamente `Authorization` y los orígenes de Angular (`http://localhost:4200`) y React (`http://localhost:5173`).

---

## [v2.0.0] — Entrega Previa PA2 (Base CRUD Angular + Express + MongoDB)
- Implementación inicial del CRUD de Citas Médicas en Angular Standalone (`DashboardComponent`, `CitaListComponent`, `CitaFormComponent`, `ConfirmModalComponent`).
- Construcción de la API REST en Node.js + Express + TypeScript y conexión híbrida a MongoDB Local / MongoDB Memory Server con 6 registros semilla (`seedData.ts`).

