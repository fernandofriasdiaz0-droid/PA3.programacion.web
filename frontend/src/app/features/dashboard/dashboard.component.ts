import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CitaService } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Cita, EstadisticasCitas } from '../../core/models/cita.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private citaService = inject(CitaService);
  public authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  public estadisticas: EstadisticasCitas = {
    total: 0,
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0,
    ingresosEstimados: 0,
    porEspecialidad: {}
  };

  public proximasCitas: Cita[] = [];
  public isLoading = true;
  public isRestoringSeed = false;

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  public cargarDatosDashboard(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // Cargar estadísticas
    this.citaService.getEstadisticas().subscribe({
      next: (res) => {
        if (res.data) {
          this.estadisticas = res.data;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notificationService.error('Error', err.message || 'No se pudieron cargar las estadísticas');
        this.cdr.markForCheck();
      }
    });

    // Cargar próximas citas
    this.citaService.getCitas().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data) {
          this.proximasCitas = res.data.slice(0, 5);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.error('Error', err.message || 'No se pudieron cargar las citas recientes');
        this.cdr.markForCheck();
      }
    });
  }

  public restaurarDatosPrueba(): void {
    if (!this.authService.isAdmin()) {
      this.notificationService.error(
        'Permiso Restringido por Rol (RBAC)',
        `Tu rol actual (${this.authService.usuarioActual?.rol?.toUpperCase()}) no tiene permiso para restaurar el Seed. Inicia sesión como ADMIN.`
      );
      return;
    }

    if (confirm('¿Deseas restaurar la base de datos con los registros de prueba originales de MongoDB?')) {
      this.isRestoringSeed = true;
      this.citaService.restoreSeed().subscribe({
        next: (res) => {
          this.isRestoringSeed = false;
          this.notificationService.success(
            'Datos Restaurados',
            `Se restablecieron ${res.total || res.data?.length || 6} registros en la base de datos MongoDB.`
          );
          this.cargarDatosDashboard();
        },
        error: (err) => {
          this.isRestoringSeed = false;
          this.notificationService.error('Fallo al restaurar', err.message);
        }
      });
    }
  }

  public getEspecialidadesList(): Array<{ nombre: string; cantidad: number; porcentaje: number }> {
    const total = this.estadisticas.total || 1;
    return Object.entries(this.estadisticas.porEspecialidad || {}).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100)
    }));
  }
}
