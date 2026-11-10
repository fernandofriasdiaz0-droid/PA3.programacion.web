import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CitaService } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Cita, CitaEstado, ESPECIALIDADES_DISPONIBLES } from '../../core/models/cita.model';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-cita-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmModalComponent],
  templateUrl: './cita-list.component.html',
  styleUrls: ['./cita-list.component.css']
})
export class CitaListComponent implements OnInit {
  private citaService = inject(CitaService);
  public authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  public citas: Cita[] = [];
  public citasFiltradas: Cita[] = [];
  public especialidades = ESPECIALIDADES_DISPONIBLES;

  // Filtros de búsqueda
  public terminoBusqueda = '';
  public estadoFiltro: string = 'Todos';
  public especialidadFiltro: string = 'Todas';
  public soloMisCitas = false;

  // Estados UI
  public isLoading = true;
  public estadosDisponibles: CitaEstado[] = ['Pendiente', 'Confirmada', 'En Atención', 'Completada', 'Cancelada'];

  // Modal de Confirmación para Eliminar (Requerimiento obligatorio CRUD + RBAC)
  public modalEliminarAbierto = false;
  public citaAEliminar: Cita | null = null;
  public isEliminando = false;

  ngOnInit(): void {
    this.cargarCitas();
  }

  public cargarCitas(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.citaService.getCitas().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.citas = res.data || [];
        this.aplicarFiltros();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.error('Error al cargar', err.message || 'No se pudo conectar a MongoDB');
        this.cdr.markForCheck();
      }
    });
  }

  // Filtrado reactivo en el frontend utilizando métodos de arrays modernos (T01)
  public aplicarFiltros(): void {
    let resultado = [...this.citas];

    if (this.estadoFiltro !== 'Todos') {
      resultado = resultado.filter((c) => c.estado === this.estadoFiltro);
    }

    if (this.especialidadFiltro !== 'Todas') {
      resultado = resultado.filter((c) => c.especialidad === this.especialidadFiltro);
    }

    if (this.soloMisCitas && this.authService.usuarioActual?.nombre) {
      const nombreMedico = this.authService.usuarioActual.nombre.toLowerCase();
      resultado = resultado.filter((c) => c.profesional.toLowerCase().includes(nombreMedico));
    }

    if (this.terminoBusqueda.trim() !== '') {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      resultado = resultado.filter((c) =>
        c.cliente.toLowerCase().includes(termino) ||
        c.profesional.toLowerCase().includes(termino) ||
        c.especialidad.toLowerCase().includes(termino) ||
        c.motivo.toLowerCase().includes(termino)
      );
    }

    this.citasFiltradas = resultado;
  }

  public cambiarEstadoFiltro(estado: string): void {
    this.estadoFiltro = estado;
    this.aplicarFiltros();
  }

  public limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.estadoFiltro = 'Todos';
    this.especialidadFiltro = 'Todas';
    this.soloMisCitas = false;
    this.aplicarFiltros();
  }

  public alternarMisCitas(): void {
    this.soloMisCitas = !this.soloMisCitas;
    this.aplicarFiltros();
  }

  /**
   * Exporta los registros filtrados a un archivo CSV compatible con Excel (T01: programación funcional e inmutabilidad)
   */
  public exportarCSV(): void {
    if (this.citasFiltradas.length === 0) {
      this.notificationService.info('Sin registros', 'No hay citas en la vista actual para exportar.');
      return;
    }

    const cabeceras = ['Paciente', 'Email', 'Teléfono', 'Especialidad', 'Profesional', 'Fecha', 'Hora', 'Prioridad', 'Estado', 'Costo (S/)', 'Motivo'];
    const filas = this.citasFiltradas.map((c) => [
      `"${c.cliente.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"Tel: ${c.telefono}"`,
      `"${c.especialidad}"`,
      `"${c.profesional}"`,
      c.fecha,
      c.hora,
      c.prioridad,
      c.estado,
      c.costo.toFixed(2),
      `"${c.motivo.replace(/"/g, '""')}"`
    ]);

    // En Excel en español (Windows Latinoamérica/Perú), el separador de columnas nativo es punto y coma (;)
    const contenidoCsv = '\uFEFF' + [cabeceras.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte-citas-medisys-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);

    this.notificationService.success(
      'Reporte CSV Generado',
      `Se exportaron ${this.citasFiltradas.length} citas médicas a Excel (.csv).`
    );
  }

  // Actualización rápida de estado (CRUD - Actualizar)
  public actualizarEstadoRapido(cita: Cita, nuevoEstado: CitaEstado): void {
    if (!cita._id || cita.estado === nuevoEstado) return;

    const estadoAnterior = cita.estado;
    cita.estado = nuevoEstado;

    this.citaService.updateCita(cita._id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.notificationService.success(
          'Estado Actualizado',
          `La cita de ${cita.cliente} ahora está "${nuevoEstado}".`
        );
        this.aplicarFiltros();
        this.cdr.markForCheck();
      },
      error: (err) => {
        cita.estado = estadoAnterior;
        this.notificationService.error('Error al actualizar estado', err.message);
        this.cdr.markForCheck();
      }
    });
  }

  // Validación RBAC para edición de datos administrativos (solo permitido a admin y recepcionista)
  public notificarEdicionRestringida(): void {
    this.notificationService.error(
      'Edición Restringida por Rol (RBAC)',
      `Tu rol actual (${this.authService.usuarioActual?.rol?.toUpperCase()}) solo está autorizado para actualizar el ESTADO de atención en la tabla, no para modificar los datos administrativos de la cita.`
    );
  }

  // Apertura del modal de confirmación antes de eliminar (solo permitido a rol admin)
  public abrirModalEliminar(cita: Cita): void {
    if (!this.authService.isAdmin()) {
      this.notificationService.error(
        'Eliminación Restringida por Rol (RBAC)',
        `Tu rol actual (${this.authService.usuarioActual?.rol?.toUpperCase()}) no tiene autorización para eliminar registros. Solo el rol ADMIN puede eliminar citas.`
      );
      return;
    }
    this.citaAEliminar = cita;
    this.modalEliminarAbierto = true;
    this.cdr.markForCheck();
  }

  public cerrarModalEliminar(): void {
    this.modalEliminarAbierto = false;
    this.citaAEliminar = null;
    this.cdr.markForCheck();
  }

  // Confirmación y ejecución de eliminación (CRUD - Eliminar persistente)
  public confirmarEliminacion(): void {
    if (!this.citaAEliminar?._id) return;

    this.isEliminando = true;
    this.cdr.markForCheck();
    const nombreCliente = this.citaAEliminar.cliente;

    this.citaService.deleteCita(this.citaAEliminar._id).subscribe({
      next: () => {
        this.isEliminando = false;
        this.cerrarModalEliminar();
        this.notificationService.success(
          'Cita Eliminada',
          `Se eliminó exitosamente el registro de ${nombreCliente} de MongoDB.`
        );
        this.cargarCitas();
      },
      error: (err) => {
        this.isEliminando = false;
        this.notificationService.error('Fallo al eliminar', err.message);
        this.cdr.markForCheck();
      }
    });
  }
}
