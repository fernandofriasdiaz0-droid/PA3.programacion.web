# 📚 Banco de 22 Ejercicios Resueltos — Proyecto Integrador PA3 (Medisys)

> **Evaluación:** Área Integradora — Proyecto de Desarrollo Web Full (PA3)  
> **Cobertura:** Módulos Técnicos **T01 al T11** (2 ejercicios por cada módulo = **22 ejercicios completos**)  
> **Estructura de cada ejercicio:** Pregunta, Respuesta, Justificación Técnica y Criterio de Validación.

---

## Módulo T01: JavaScript Moderno y TypeScript (Ejercicios 1 y 2)

### Ejercicio 01 — Funciones Puras, Inmutabilidad y `Array.prototype.reduce`
- **Pregunta:** En el controlador `obtenerEstadisticas` de Medisys, se requiere calcular el total de ingresos estimados sumando el campo `costo` de todas las citas cuyo estado sea distinto de `'Cancelada'`, sin mutar el arreglo original `citas`. ¿Cuál es la implementación correcta aplicando funciones puras y métodos modernos de ES6+?
- **Respuesta:**
  ```typescript
  export const calcularIngresosActivos = (citas: readonly ICita[]): number =>
    citas
      .filter((cita) => cita.estado !== 'Cancelada')
      .reduce((acumulado, cita) => acumulado + (cita.costo ?? 0), 0);
  ```
- **Justificación:** La función `calcularIngresosActivos` es una **función pura** porque para una misma entrada siempre produce la misma salida y no genera efectos secundarios ni modifica el arreglo de entrada (`readonly ICita[]`). Combina encadenamiento funcional (`filter` + `reduce`) y el operador de coalescencia nula (`??`).
- **Criterio de validación:** Verificar que al pasar un arreglo con citas activas y canceladas, el arreglo original permanezca intacto y el valor retornado coincida exactamente con la suma de las citas no canceladas.

### Ejercicio 02 — Asincronía con `Promise.all` y `async/await`
- **Pregunta:** En el estado global del panel React (`GlobalStateContext.tsx`), se necesita consultar simultáneamente la lista de citas (`GET /api/citas`) y las estadísticas (`GET /api/citas/estadisticas`) para reducir el tiempo de carga a la mitad. ¿Cómo debe implementarse con `async/await` y `Promise.all`?
- **Respuesta:**
  ```typescript
  const [citasRes, statsRes] = await Promise.all([
    api.get<ApiResponse<Cita[]>>('/citas'),
    api.get<ApiResponse<EstadisticasCitas>>('/citas/estadisticas')
  ]);
  ```
- **Justificación:** A diferencia de ejecutar dos `await` secuenciales (donde la segunda petición espera a que termine la primera), `Promise.all` dispara ambas solicitudes HTTP en paralelo y resuelve cuando ambas concluyen, usando desestructuración de arreglos ES6+.
- **Criterio de validación:** Comprobar en la pestaña Network del navegador que ambas peticiones se inician en el mismo milisegundo y que un fallo en cualquiera es capturado por el bloque `try/catch`.

---

## Módulo T02: TypeScript en Desarrollo Web (Ejercicios 3 y 4)

### Ejercicio 03 — Interfaces Genéricas Reutilizables (`ApiResponse<T>`)
- **Pregunta:** ¿Cómo se diseña en TypeScript una interfaz genérica `ApiResponse<T>` que permita tipar de forma estricta tanto una respuesta de lista de citas (`ICita[]`) como una respuesta de autenticación (`AuthTokenResponse`) sin duplicar código?
- **Respuesta:**
  ```typescript
  export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    total?: number;
    error?: string;
    code?: string;
  }
  ```
- **Justificación:** El uso de parámetros de tipo genérico `<T = unknown>` permite parametrizar la propiedad `data?: T` según el endpoint consumido (`ApiResponse<Cita[]>`, `ApiResponse<EstadisticasCitas>`, `ApiResponse<AuthTokenResponse>`), garantizando autocompletado y verificación estática en tiempo de compilación.
- **Criterio de validación:** El compilador `tsc` debe emitir un error si se intenta acceder a una propiedad inexistente dentro de `res.data` según el tipo concreto pasado a `ApiResponse<T>`.

### Ejercicio 04 — Enumeraciones y Tipos Utilitarios (`Omit`, `Partial`)
- **Pregunta:** Al crear un usuario o devolver su perfil público hacia los clientes Angular y React, se debe excluir la propiedad `password` de la interfaz `IUsuario`. ¿Cómo se define este tipo reutilizable en TypeScript junto con la enumeración de roles?
- **Respuesta:**
  ```typescript
  export enum RolUsuarioEnum {
    ADMIN = 'admin',
    MEDICO = 'medico',
    RECEPCIONISTA = 'recepcionista'
  }

  export type UsuarioPublico = Omit<IUsuario, 'password'>;
  ```
- **Justificación:** `RolUsuarioEnum` restringe los valores posibles del dominio a constantes nominales seguras, mientras que el Utility Type `Omit<IUsuario, 'password'>` construye automáticamente un nuevo tipo con todas las propiedades de `IUsuario` excepto `password`, manteniendo la coherencia si `IUsuario` cambia.
- **Criterio de validación:** Verificar que un objeto tipado como `UsuarioPublico` rechace en compilación la asignación del campo `password`.

---

## Módulo T03: Angular 16+ y Componentes (Ejercicios 5 y 6)

### Ejercicio 05 — Comunicación entre Componentes Padre e Hijo (`@Input` y `@Output`)
- **Pregunta:** En Angular, el componente `CitaListComponent` utiliza el componente reutilizable `ConfirmModalComponent` para confirmar la eliminación de una cita médica. ¿Cómo se implementa la comunicación de entrada y salida entre ambos componentes?
- **Respuesta:**
  ```typescript
  // En ConfirmModalComponent (Hijo):
  @Input() isOpen = false;
  @Input() title = '¿Confirmar acción?';
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  ```
  ```html
  <!-- En CitaListComponent (Padre): -->
  <app-confirm-modal
    [isOpen]="modalEliminarAbierto"
    (onConfirm)="confirmarEliminacion()"
    (onCancel)="cerrarModalEliminar()">
  </app-confirm-modal>
  ```
- **Justificación:** El decorador `@Input()` permite el *Property Binding* `[isOpen]` de padre a hijo, mientras que `@Output()` junto con `EventEmitter` habilita el *Event Binding* `(onConfirm)` de hijo a padre, desacoplando la interfaz modal de la lógica de negocio.
- **Criterio de validación:** Al hacer clic en confirmar dentro del modal, el componente padre debe recibir el evento y ejecutar `confirmarEliminacion()`.

### Ejercicio 06 — Navegación con Lazy Loading y Guards Funcionales
- **Pregunta:** ¿Cómo se configura en `app.routes.ts` la carga diferida (*Lazy Loading*) de un componente Standalone en Angular 16+ protegido mediante `authGuard`?
- **Respuesta:**
  ```typescript
  {
    path: 'citas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cita-list/cita-list.component').then((m) => m.CitaListComponent),
    title: 'Citas Médicas — Medisys PA3'
  }
  ```
- **Justificación:** `loadComponent` carga el bundle del componente bajo demanda únicamente cuando el usuario navega a `/citas` y supera la validación síncrona/asíncrona de `canActivate: [authGuard]`.
- **Criterio de validación:** Si el usuario no posee un token JWT válido en `localStorage`, al intentar navegar a `/citas` el router debe redirigirlo automáticamente a `/login`.

---

## Módulo T04: Formularios y APIs en Angular (Ejercicios 7 y 8)

### Ejercicio 07 — Formularios Reactivos y Validaciones Personalizadas
- **Pregunta:** En `CitaFormComponent` y `LoginComponent`, ¿cómo se construye un `FormGroup` reactivo que valide que el correo sea obligatorio y de formato email, y que el horario cumpla el patrón `HH:mm` de 24 horas?
- **Respuesta:**
  ```typescript
  this.citaForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    hora: ['09:00', [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
    costo: [100, [Validators.required, Validators.min(0)]]
  });
  ```
- **Justificación:** `FormBuilder` (`fb.group`) crea una estructura reactiva síncrona cuyo estado de validez (`valid`, `invalid`, `dirty`, `touched`) se evalúa en tiempo real mediante composiciones de `Validators`.
- **Criterio de validación:** El botón de envío o la función `onSubmit()` debe bloquear el envío y marcar los controles como tocados (`markAllAsTouched()`) si se ingresa una hora como `"25:99"` o un correo sin `@`.

### Ejercicio 08 — Interceptor HTTP Funcional para Inyección de JWT
- **Pregunta:** ¿Cómo se implementa en Angular un `HttpInterceptorFn` que adjunte automáticamente el encabezado `Authorization: Bearer <token>` a todas las peticiones HTTP y cierre la sesión si el backend responde `401 Unauthorized`?
- **Respuesta:**
  ```typescript
  export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/api/auth/login')) {
          authService.logout(true);
        }
        return throwError(() => error);
      })
    );
  };
  ```
- **Justificación:** Dado que las instancias de `HttpRequest` en Angular son inmutables, se utiliza `req.clone()` para inyectar la cabecera `Authorization`. El operador `catchError` de RxJS intercepta globalmente las respuestas `401` para limpiar la sesión y redirigir a `/login`.
- **Criterio de validación:** Verificar en las herramientas de desarrollador del navegador que las peticiones a `/api/citas` incluyan el header `Authorization: Bearer eyJ...`.

---

## Módulo T05: Node.js y Express (Ejercicios 9 y 10)

### Ejercicio 09 — Diseño de Controladores REST y Validación de Parámetros
- **Pregunta:** En Express, antes de consultar o eliminar una cita por su `:id` en MongoDB, ¿por qué y cómo se debe validar el parámetro `req.params.id` en el controlador?
- **Respuesta:**
  ```typescript
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: `Identificador de MongoDB no válido: ${id}`
    });
    return;
  }
  ```
- **Justificación:** Si se pasa un ID malformado (por ejemplo `"abc-123"`) directamente a `CitaModel.findById()`, Mongoose lanza una excepción `CastError`. Validar previamente con `ObjectId.isValid(id)` permite devolver un código HTTP semántico `400 Bad Request` en lugar de un `500 Internal Server Error`.
- **Criterio de validación:** Realizar una petición `GET /api/citas/123` y comprobar que el servidor responda con estado HTTP `400` y estructura JSON controlada.

### Ejercicio 10 — Middleware Global de Manejo de Errores y Variables de Entorno
- **Pregunta:** ¿Cuál es la firma obligatoria de un middleware de manejo global de errores en Express y cómo se protege la exposición de trazas internas según `process.env.NODE_ENV`?
- **Respuesta:**
  ```typescript
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
  ```
- **Justificación:** Express identifica un middleware de errores exclusivamente porque define **4 parámetros** `(err, req, res, next)`. Además, condicionar el detalle del error a `NODE_ENV === 'development'` evita filtrar detalles sensibles de infraestructura en producción.
- **Criterio de validación:** Cuando ocurre un error no capturado en una ruta, Express debe invocar este middleware y responder con código `500` en formato JSON.

---

## Módulo T06: MongoDB y Mongoose (Ejercicios 11 y 12)

### Ejercicio 11 — Definición de Esquemas con Validadores de Dominio
- **Pregunta:** ¿Cómo se configura en `CitaSchema` de Mongoose el campo `estado` para que solo acepte los 5 estados válidos del flujo clínico y asigne `'Pendiente'` por defecto?
- **Respuesta:**
  ```typescript
  estado: {
    type: String,
    enum: {
      values: ['Pendiente', 'Confirmada', 'En Atención', 'Completada', 'Cancelada'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'Pendiente'
  }
  ```
- **Justificación:** El validador `enum` a nivel de esquema en Mongoose garantiza la integridad de los datos antes de persistir en MongoDB, incluso si una petición intenta enviar un estado inválido.
- **Criterio de validación:** Intentar insertar o actualizar una cita con `estado: "Inventado"` mediante `runValidators: true` y verificar que Mongoose rechace la operación con `400 Bad Request`.

### Ejercicio 12 — Consultas Dinámicas con Expresiones Regulares (`$or`)
- **Pregunta:** ¿Cómo se construye en Mongoose un filtro dinámico que busque un término de texto de forma insensible a mayúsculas/minúsculas tanto en `cliente`, `profesional`, `especialidad` como en `motivo`?
- **Respuesta:**
  ```typescript
  if (buscar && typeof buscar === 'string' && buscar.trim() !== '') {
    const regex = new RegExp(buscar.trim(), 'i');
    filtro.$or = [
      { cliente: regex },
      { profesional: regex },
      { especialidad: regex },
      { motivo: regex }
    ];
  }
  const citas = await CitaModel.find(filtro).sort({ fecha: 1, hora: 1 }).lean();
  ```
- **Justificación:** El operador lógico `$or` de MongoDB combinado con `RegExp(..., 'i')` permite coincidencias parciales insensibles a mayúsculas en múltiples campos indexados, y `.lean()` devuelve objetos JavaScript planos optimizando el rendimiento de lectura.
- **Criterio de validación:** Al consultar `GET /api/citas?buscar=cardio`, el endpoint debe retornar todas las citas cuya especialidad o motivo contenga `"cardio"`.

---

## Módulo T07: Autenticación y Seguridad (Ejercicios 13 y 14)

### Ejercicio 13 — Encriptación de Contraseñas con `bcryptjs` en Mongoose
- **Pregunta:** ¿Por qué nunca deben almacenarse contraseñas en texto plano en MongoDB y cómo se automatiza su hash con `bcryptjs` antes de guardar el documento `Usuario`?
- **Respuesta:**
  ```typescript
  UsuarioSchema.pre<IUsuarioDocument>('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });
  ```
- **Justificación:** `bcrypt` aplica una función de derivación criptográfica unidireccional con un *salt* aleatorio (factor de costo 10 = $2^{10}$ rondas), protegiendo las credenciales frente a ataques de diccionario y tablas rainbow. Verificar `this.isModified('password')` evita re-hashear un hash existente al actualizar otros campos del usuario.
- **Criterio de validación:** Inspeccionar el documento en MongoDB tras registrar un usuario y comprobar que el campo `password` comience con el prefijo `$2a$10$` o `$2b$10$`.

### Ejercicio 14 — Autorización Basada en Roles (RBAC) con JWT en Express
- **Pregunta:** ¿Cómo se diseña un middleware reutilizable en Express que permita restringir la eliminación de citas (`DELETE /api/citas/:id`) exclusivamente a usuarios cuyo token JWT tenga el rol `'admin'`?
- **Respuesta:**
  ```typescript
  export const autorizarRoles = (...rolesPermitidos: RolUsuario[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
        res.status(403).json({
          success: false,
          code: 'FORBIDDEN_ROLE',
          message: 'No tienes permisos para realizar esta operación.'
        });
        return;
      }
      next();
    };
  };
  // Uso en la ruta:
  router.delete('/:id', verificarToken, autorizarRoles('admin'), eliminarCita);
  ```
- **Justificación:** Separa la **autenticación** (`verificarToken` → verifica quién es el usuario, devuelve `401` si falla) de la **autorización** (`autorizarRoles('admin')` → verifica qué permisos tiene su rol, devuelve `403 Forbidden` si no está autorizado).
- **Criterio de validación:** Autenticarse con la cuenta `medico@medisys.com` (rol `medico`) e intentar ejecutar `DELETE /api/citas/:id`; el backend debe responder con código `403 Forbidden`.

---

## Módulo T08: Refactorización y Control de Cambios (Ejercicios 15 y 16)

### Ejercicio 15 — Registro de Trazabilidad y Auditoría en Entidades Persistentes
- **Pregunta:** Durante la refactorización de PA2 a PA3, se detectó que las citas creadas no guardaban qué usuario autenticado las había agendado. ¿Qué cambio se aplicó en el modelo y controlador para solucionar esta observación sin romper la compatibilidad con PA2?
- **Respuesta:**
  ```typescript
  // En CitaController (crearCita):
  const autorRegistro = req.usuario
    ? `${req.usuario.nombre} (${req.usuario.rol})`
    : 'Sistema Medisys';
  ```
- **Justificación:** Al definir un valor por defecto (`'Sistema Medisys'`) en el esquema `CitaSchema` y poblar `creadoPor` desde `req.usuario` (inyectado por el middleware JWT), se logra trazabilidad completa manteniendo retrocompatibilidad con los registros existentes de PA2.
- **Criterio de validación:** Crear una cita autenticado como `recepcion@medisys.com` y verificar que el documento almacenado en MongoDB contenga `creadoPor: "Lucía Admisión Clínica (recepcionista)"`.

### Ejercicio 16 — Estructura de la Bitácora Técnica (`CHANGELOG.md`)
- **Pregunta:** ¿Qué secciones clave debe documentar el archivo `CHANGELOG.md` para cumplir con las buenas prácticas de control de cambios (Keep a Changelog / Semantic Versioning) en la transición de PA2 (`v2.0.0`) a PA3 (`v3.0.0`)?
- **Respuesta:**
  Debe clasificar los cambios por versión semántica (`[v3.0.0]`) en categorías explícitas:
  1. **Added (Nuevas funcionalidades):** Autenticación JWT/Bcrypt, RBAC, Panel React, Context API.
  2. **Refactored (Refactorizaciones):** Tipado con Enums/Genéricos, inmutabilidad en acumuladores `reduce`.
  3. **Fixed (Correcciones de seguridad):** Cierre de endpoints públicos destructivos (`DELETE` y `/seed`).
- **Justificación:** Permite a cualquier desarrollador o evaluador auditar qué vulnerabilidades o limitaciones técnicas de la PA2 fueron subsanadas y qué módulos nuevos se agregaron en la PA3.
- **Criterio de validación:** Verificar la existencia del archivo `CHANGELOG.md` en la raíz del repositorio con el detalle técnico de la versión `v3.0.0`.

---

## Módulo T09: React.js y SPA (Ejercicios 17 y 18)

### Ejercicio 17 — Componentes Funcionales, Hooks (`useState`, `useMemo`) y JSX
- **Pregunta:** En el panel React de Medisys, ¿por qué es recomendable utilizar el hook `useMemo` para calcular la lista `citasFiltradas` a partir de `state.citas` y `state.filtros`?
- **Respuesta:**
  ```tsx
  const citasFiltradas = useMemo(() => {
    return state.citas.filter((cita) => {
      const coincideEstado = state.filtros.estado === 'Todos' || cita.estado === state.filtros.estado;
      const coincideBusqueda = !state.filtros.buscar ||
        cita.cliente.toLowerCase().includes(state.filtros.buscar.toLowerCase());
      return coincideEstado && coincideBusqueda;
    });
  }, [state.citas, state.filtros]);
  ```
- **Justificación:** `useMemo` memoriza el resultado del filtrado y solo lo recalcula cuando cambian las dependencias `[state.citas, state.filtros]`, evitando recomputaciones innecesarias cuando el componente se re-renderiza por otros cambios de interfaz (como notificaciones Toast).
- **Criterio de validación:** Al escribir en el buscador o cambiar el selector de estado en `/citas` del Panel React, la tabla debe actualizarse instantáneamente sin realizar llamadas redundantes al backend.

### Ejercicio 18 — Navegación SPA con React Router DOM v6
- **Pregunta:** ¿Cómo se declara el árbol de rutas en `App.tsx` utilizando `BrowserRouter`, `Routes`, `Route` y `Navigate` para redirigir la raíz `/` hacia `/panel` y proteger las vistas privadas?
- **Respuesta:**
  ```tsx
  <Routes>
    <Route path="/" element={<Navigate to="/panel" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/panel" element={<ProtectedRoute><ExecutivePanelPage /></ProtectedRoute>} />
    <Route path="/citas" element={<ProtectedRoute><CitasManagerPage /></ProtectedRoute>} />
  </Routes>
  ```
- **Justificación:** En React Router DOM v6, el componente `<Navigate to="/panel" replace />` realiza redirecciones declarativas en el cliente sin recargar el documento HTML del navegador, conservando el comportamiento de una Single Page Application (SPA).
- **Criterio de validación:** Navegar entre `/panel`, `/citas` y `/seguridad` comprobando que no exista recarga completa de página en el navegador.

---

## Módulo T10: Estado Global en React (Ejercicios 19 y 20)

### Ejercicio 19 — Arquitectura de Estado Global con Context API + `useReducer`
- **Pregunta:** ¿Cómo se estructura un `reducer` en React con TypeScript (`GlobalStateContext.tsx`) para actualizar de forma predecible e inmutable la lista de citas y la sesión de autenticación?
- **Respuesta:**
  ```tsx
  function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
    switch (action.type) {
      case 'SET_AUTH':
        return { ...state, usuario: action.payload.usuario, token: action.payload.token };
      case 'CLEAR_AUTH':
        return { ...state, usuario: null, token: null, citas: [] };
      case 'SET_CITAS':
        return { ...state, citas: action.payload };
      default:
        return state;
    }
  }
  ```
- **Justificación:** Combinar `createContext` con `useReducer` proporciona un flujo de datos unidireccional idéntico al patrón Flux/Redux: los componentes despachan acciones tipadas (`GlobalAction`) y una función pura (`globalReducer`) retorna un nuevo árbol de estado inmutable.
- **Criterio de validación:** Al crear o actualizar una cita desde `CitasManagerPage`, el contador de KPIs en `ExecutivePanelPage` debe reflejar el cambio automáticamente al compartir el mismo `GlobalStateContext`.

### Ejercicio 20 — Hook Personalizado `useGlobalState` con Validación de Proveedor
- **Pregunta:** ¿Por qué se encapsula `useContext(GlobalStateContext)` dentro de un custom hook `useGlobalState()`?
- **Respuesta:**
  ```tsx
  export const useGlobalState = (): GlobalContextProps => {
    const context = useContext(GlobalStateContext);
    if (!context) {
      throw new Error('useGlobalState debe utilizarse dentro de un GlobalStateProvider');
    }
    return context;
  };
  ```
- **Justificación:** Garantiza que el valor retornado nunca sea `undefined` para los componentes consumidores y arroja un mensaje de error claro si un desarrollador intenta usar el hook fuera del árbol de `<GlobalStateProvider>`.
- **Criterio de validación:** Todos los componentes de páginas (`LoginPage`, `ExecutivePanelPage`, `CitasManagerPage`, `SecurityAuditPage`) consumen el estado global limpiamente mediante `useGlobalState()`.

---

## Módulo T11: APIs y Sesiones en React (Ejercicios 21 y 22)

### Ejercicio 21 — Interceptores Axios y Gestión Automática de Tokens Expirados
- **Pregunta:** ¿Cómo se configura Axios en React (`panel-react/src/services/api.ts`) para detectar cuando el token JWT ha expirado (`401 Unauthorized`), limpiar `localStorage` y notificar automáticamente al `GlobalStateContext` para cerrar la sesión?
- **Respuesta:**
  ```typescript
  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; code?: string }>) => {
      if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem(REACT_TOKEN_KEY);
        localStorage.removeItem(REACT_USER_KEY);
        window.dispatchEvent(new CustomEvent('medisys:session-expired', {
          detail: { message: error.response?.data?.message }
        }));
      }
      return Promise.reject(error);
    }
  );
  ```
- **Justificación:** El interceptor de respuesta de Axios centraliza el control de sesiones expiradas: ante cualquier código `401` devuelto por el backend Express, elimina las credenciales caducadas y emite el evento `medisys:session-expired`, el cual es escuchado por `GlobalStateProvider` para ejecutar `CLEAR_AUTH` y redirigir a `/login`.
- **Criterio de validación:** En la pestaña **Seguridad JWT & Roles** del Panel React, hacer clic en el botón **"Probar Expiración de Token (T11)"** y verificar que el sistema detecte el error `401`, muestre la alerta de sesión expirada y redirija automáticamente a `/login`.

### Ejercicio 22 — Componente `ProtectedRoute` y Sincronización entre Clientes (Angular y React)
- **Pregunta:** ¿Cómo garantiza el componente `ProtectedRoute` en React que un usuario no autenticado no pueda acceder mediante URL directa a `/panel` o `/citas`, y cómo se verifica la persistencia compartida con Angular?
- **Respuesta:**
  ```tsx
  export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, usuario } = useGlobalState();
    if (!isAuthenticated || !usuario) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
      return <Navigate to="/panel" replace />;
    }
    return <>{children}</>;
  };
  ```
- **Justificación:** `ProtectedRoute` evalúa el estado global `isAuthenticated` antes de montar los componentes hijos. Además, dado que tanto Angular (`:4200`) como React (`:5173`) consumen los mismos endpoints REST (`http://localhost:3000/api/citas`), cualquier cita creada, editada o eliminada en React se refleja inmediatamente en Angular y viceversa.
- **Criterio de validación:** Abrir `/citas` sin sesión activa en una ventana de incógnito (debe redirigir a `/login`), iniciar sesión, crear una cita en React (`:5173`) y comprobar que aparece inmediatamente en el listado de Angular (`:4200`).

