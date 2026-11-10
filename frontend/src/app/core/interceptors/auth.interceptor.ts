import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Interceptor HTTP Funcional en Angular (T04, T07)
 * 1. Adjunta automáticamente el token JWT (Authorization: Bearer <token>) a cada petición hacia la API REST.
 * 2. Gestiona respuestas 401 (token expirado o inválido) cerrando sesión automáticamente.
 * 3. Gestiona respuestas 403 (acceso denegado por rol insuficiente).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

      if (error.status === 401 && !isAuthEndpoint) {
        const codigo = error.error?.code;
        const msg =
          codigo === 'TOKEN_EXPIRED'
            ? 'Tu sesión JWT ha expirado. Por favor, inicia sesión nuevamente.'
            : 'Sesión no válida o expirada. Inicia sesión para continuar.';
        notificationService.error('Sesión Expirada', msg);
        authService.logout(true);
      } else if (error.status === 403) {
        const msg =
          error.error?.message ||
          'Tu rol actual no cuenta con los permisos necesarios para ejecutar esta acción.';
        notificationService.error('Permiso Restringido por Rol', msg);
      }

      return throwError(() => error);
    })
  );
};

