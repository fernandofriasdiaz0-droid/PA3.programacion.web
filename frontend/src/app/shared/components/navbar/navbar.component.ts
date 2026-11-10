import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CitaService } from '../../../core/services/cita.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Usuario } from '../../../core/models/auth.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  private citaService = inject(CitaService);
  public authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  public serverStatus: 'online' | 'offline' | 'checking' = 'checking';
  public databaseMode = 'Verificando...';
  public isMobileMenuOpen = false;
  public usuarioActual: Usuario | null = null;

  ngOnInit(): void {
    this.verificarServidor();
    this.authService.usuario$.subscribe((user) => {
      this.usuarioActual = user;
      this.cdr.markForCheck();
    });
  }

  public verificarServidor(): void {
    this.serverStatus = 'checking';
    this.cdr.markForCheck();
    this.citaService.checkHealth().subscribe({
      next: (res) => {
        this.serverStatus = 'online';
        this.databaseMode = res.databaseMode || 'MongoDB Activo';
        this.cdr.markForCheck();
      },
      error: () => {
        this.serverStatus = 'offline';
        this.databaseMode = 'Desconectado';
        this.cdr.markForCheck();
      }
    });
  }

  public toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  public cerrarSesion(): void {
    this.isMobileMenuOpen = false;
    this.authService.logout(true);
    this.notificationService.info('Sesión Cerrada', 'Has cerrado sesión correctamente en Medisys.');
  }

  /**
   * Simula un token JWT vencido/alterado para demostrar en vivo el Interceptor HTTP 401 (T04 / T07)
   */
  public simularTokenExpirado(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medisys_pa3_jwt_token', 'token.jwt.expirado_demostracion_pa3');
    }
    this.citaService.getCitas().subscribe({
      error: () => {
        // El authInterceptor captura automáticamente el 401, muestra la alerta y redirige a /login
      }
    });
  }
}
