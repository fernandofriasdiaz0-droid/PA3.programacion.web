import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { RolUsuario } from '../models/auth.model';

/**
 * Guard de autenticación para proteger rutas en Angular (T03, T04, T07)
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (authService.isAuthenticated()) {
    return true;
  }

  notificationService.info('Acceso Protegido', 'Inicia sesión para acceder al sistema clínico Medisys.');
  return router.createUrlTree(['/login']);
};

/**
 * Guard de autorización por roles para rutas específicas (T07)
 */
export const roleGuard = (...rolesPermitidos: (RolUsuario | RolUsuario[])[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const notificationService = inject(NotificationService);
    const listaRoles = rolesPermitidos.flat();

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (authService.hasRole(...listaRoles)) {
      return true;
    }

    notificationService.error(
      'Rol Insuficiente',
      `Se requiere rol ${listaRoles.join(' o ').toUpperCase()} para acceder a esta sección.`
    );
    return router.createUrlTree(['/dashboard']);
  };
};

