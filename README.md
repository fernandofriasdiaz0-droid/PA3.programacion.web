# 🩺 Medisys v3.0 — Sistema Full Stack de Gestión de Citas Médicas (PA3)
> **Área Integradora: Proyecto de Desarrollo Web Full — Evaluación PA3**  
> **Alumno:** Jose Fernando Frias Diaz (`@fernandofriasdiaz0-droid`)  
> **Repositorio GitHub:** [`https://github.com/fernandofriasdiaz0-droid/PA3.programacion.web`](https://github.com/fernandofriasdiaz0-droid/PA3.programacion.web)  
> **Stack Integrado:** Angular (Interfaz Principal) + React.js (Panel Secundario) + Node.js / Express + MongoDB + JWT & Bcrypt  

---

## 🎯 Evolución de PA2 a PA3 (Módulos T01 – T11)

Este proyecto amplía el sistema **Medisys** desarrollado en la PA2 conservando todas sus operaciones CRUD reales sobre MongoDB e incorporando los requerimientos completos de la **PA3**:
1. **Autenticación y Seguridad (`T07`):** Registro e inicio de sesión de usuarios en MongoDB, contraseñas encriptadas con `bcryptjs`, tokens firmados con `jsonwebtoken` (JWT) y control de acceso basado en roles (**RBAC**: `admin`, `medico`, `recepcionista`).
2. **Interfaz Principal en Angular (`T03`, `T04`):** Componentes Standalone, formularios reactivos (`LoginComponent`, `RegisterComponent`, `CitaFormComponent`), `authGuard`, `roleGuard` e interceptor HTTP funcional (`authInterceptor`) que inyecta el token Bearer y gestiona sesiones expiradas (`401`) y permisos (`403`).
3. **Panel Secundario en React.js (`T09`, `T10`, `T11`):** SPA construida con React 18, TypeScript, Hooks, **React Router DOM v6**, **Estado Global con Context API + `useReducer`** (`GlobalStateContext.tsx`) y cliente **Axios** con interceptores para tokens expirados.
4. **Control de Cambios y Entregables (`T08` y Anexo):** Bitácora en [`CHANGELOG.md`](./CHANGELOG.md), Informe Técnico en [`docs/INFORME_TECNICO_PA3.md`](./docs/INFORME_TECNICO_PA3.md), Banco de 22 Ejercicios en [`docs/BANCO_22_EJERCICIOS_PA3.md`](./docs/BANCO_22_EJERCICIOS_PA3.md) y archivo [`.env.example`](./.env.example).

---

## 🔐 Cuentas de Prueba Pre-cargadas (Seed Automático en MongoDB)

Al iniciar el backend, el seeder crea automáticamente **3 usuarios con distintos roles** (y contraseñas encriptadas con Bcrypt) además de **6 citas médicas iniciales**. También puedes usar los botones de **Acceso Rápido en 1 Clic** en la pantalla de Login tanto de Angular como de React:

| Rol | Correo Electrónico | Contraseña | Permisos en el Sistema (RBAC) |
| :--- | :--- | :--- | :--- |
| **Administrador (`admin`)** | `admin@medisys.com` | `Admin123!` | **Control Total:** Consultar, Crear, Editar, **Eliminar Citas**, **Restaurar Seed** y **Cambiar Roles de Usuarios**. |
| **Médico (`medico`)** | `medico@medisys.com` | `Medico123!` | Consultar citas y KPIs, agendar y actualizar estado/observaciones. *(Bloqueado con `403 Forbidden` para eliminar o restaurar seed)*. |
| **Recepcionista (`recepcionista`)** | `recepcion@medisys.com` | `Recepcion123!` | Consultar citas, registrar pacientes y editar programación. *(Bloqueado con `403 Forbidden` para eliminar o restaurar seed)*. |

---

## 🚀 Cómo Instalar y Levantar el Proyecto Completo

### 🟢 Opción 1: En Visual Studio Code con 1 Atajo (Recomendada)
1. Abre la carpeta del proyecto en **Visual Studio Code**.
2. Si es la primera vez que ejecutas la versión PA3, instala las dependencias de los 3 proyectos desde la terminal raíz:
   ```bash
   npm run install:all
   ```
3. Presiona **`Ctrl + Shift + B`** *(o menú `Terminal` → `Ejecutar tarea de compilación...` → `🚀 Levantar Proyecto Completo PA3 (Backend + Angular + React)`)*.
4. VS Code abrirá **3 terminales en paralelo** levantando automáticamente:
   - **Backend Express + MongoDB:** `http://localhost:3000`
   - **Frontend Principal Angular:** `http://localhost:4200`
   - **Panel Secundario React.js:** `http://localhost:5173`

---

### 🟢 Opción 2: Manualmente por Terminales
Abre 3 terminales en la carpeta raíz del proyecto:

- **Terminal 1 — Backend API REST (Node.js + Express + MongoDB + JWT):**
  ```bash
  cd backend
  npm install
  npm run dev
  ```
- **Terminal 2 — Frontend Principal (Angular):**
  ```bash
  cd frontend
  npm install
  npm start
  ```
- **Terminal 3 — Panel Secundario (React.js + Context API + Axios):**
  ```bash
  cd panel-react
  npm install
  npm run dev
  ```

---

## 🌐 Enlaces de Acceso Locales y Despliegue

| Servicio | URL Local | Descripción |
| :--- | :--- | :--- |
| **Interfaz Principal (Angular)** | [http://localhost:4200](http://localhost:4200) | SPA Principal con Login, Registro, Dashboard, Listado y Formulario Reactivo CRUD |
| **Panel Secundario (React.js)** | [http://localhost:5173](http://localhost:5173) | SPA Secundaria con Centro Ejecutivo, Gestor CRUD, Context API e Inspector JWT/RBAC |
| **Backend Health Check** | [http://localhost:3000/api/health](http://localhost:3000/api/health) | Estado del servidor Express, versión 3.0.0 y modo de conexión MongoDB |
| **API Auth (Login / Register)** | `http://localhost:3000/api/auth/login` | Endpoints de autenticación con Bcrypt y emisión de JWT |
| **API Citas (Protegida JWT)** | `http://localhost:3000/api/citas` | Endpoints CRUD protegidos por `verificarToken` y `autorizarRoles` |

---

## 📦 Entregables Incluidos en el Repositorio (Sección 5 PA3)

- 📁 **`backend/`**: API REST con Express, TypeScript, Mongoose, `bcryptjs`, `jsonwebtoken` y semillas de usuarios/citas.
- 📁 **`frontend/`**: Cliente principal en Angular con Reactive Forms, `authInterceptor`, `authGuard` y CRUD completo.
- 📁 **`panel-react/`**: Panel secundario en React.js con Hooks, React Router DOM, Estado Global (`Context API + useReducer`) y Axios.
- 📄 **[`CHANGELOG.md`](./CHANGELOG.md)**: Bitácora detallada de refactorización, observaciones corregidas y mejoras de PA2 a PA3 (`T08`).
- 📄 **[`docs/INFORME_TECNICO_PA3.md`](./docs/INFORME_TECNICO_PA3.md)**: Informe técnico completo (arquitectura, modelos, endpoints, seguridad y pruebas).
- 📄 **[`docs/BANCO_22_EJERCICIOS_PA3.md`](./docs/BANCO_22_EJERCICIOS_PA3.md)**: Banco de 22 ejercicios resueltos con preguntas, código, justificaciones y criterios de validación (`T01`–`T11`).
- ⚙️ **[`.env.example`](./.env.example)** y **[`backend/.env.example`](./backend/.env.example)**: Plantillas de configuración de variables de entorno sin credenciales reales.
