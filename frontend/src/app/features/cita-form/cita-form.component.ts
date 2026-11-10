import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CitaService } from '../../core/services/cita.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  Cita,
  ESPECIALIDADES_DISPONIBLES,
  PROFESIONALES_POR_ESPECIALIDAD
} from '../../core/models/cita.model';

@Component({
  selector: 'app-cita-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cita-form.component.html',
  styleUrls: ['./cita-form.component.css']
})
export class CitaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private citaService = inject(CitaService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  public citaForm!: FormGroup;
  public esModoEdicion = false;
  public citaId: string | null = null;
  public isSubmitting = false;
  public isLoadingData = false;

  public especialidades = ESPECIALIDADES_DISPONIBLES;
  public medicosDisponibles: string[] = [];

  ngOnInit(): void {
    this.inicializarFormulario();
    this.verificarModoEdicion();
  }

  // Inicialización del formulario reactivo con validadores rigurosos (T04)
  private inicializarFormulario(): void {
    // Fecha sugerida por defecto: hoy + 1 día en formato YYYY-MM-DD
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaDefecto = manana.toISOString().split('T')[0];

    this.citaForm = this.fb.group({
      cliente: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[+0-9\s-]{8,15}$/)]],
      especialidad: ['', [Validators.required]],
      profesional: ['', [Validators.required]],
      fecha: [fechaDefecto, [Validators.required]],
      hora: ['09:00', [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
      motivo: ['', [Validators.required, Validators.minLength(5)]],
      estado: ['Pendiente', [Validators.required]],
      prioridad: ['Media', [Validators.required]],
      costo: [100.0, [Validators.required, Validators.min(0)]],
      observaciones: ['']
    });

    // Escuchar cambios en especialidad para sugerir profesionales médicos
    this.citaForm.get('especialidad')?.valueChanges.subscribe((espSeleccionada: string) => {
      this.actualizarMedicosPorEspecialidad(espSeleccionada);
    });
  }

  public actualizarMedicosPorEspecialidad(especialidad: string): void {
    this.medicosDisponibles = PROFESIONALES_POR_ESPECIALIDAD[especialidad] || [];
    const profesionalActual = this.citaForm.get('profesional')?.value;
    // Si el médico actual no pertenece a la especialidad nueva, seleccionar el primero sugerido
    if (this.medicosDisponibles.length > 0 && !this.medicosDisponibles.includes(profesionalActual)) {
      this.citaForm.patchValue({ profesional: this.medicosDisponibles[0] });
    }
  }

  // Verifica si la ruta incluye el parámetro ID para cargar la cita en edición (CRUD - Leer/Actualizar)
  private verificarModoEdicion(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esModoEdicion = true;
      this.citaId = id;
      this.cargarDatosCita(id);
    } else {
      // Sugerir médicos para la primera especialidad por defecto
      this.citaForm.patchValue({ especialidad: this.especialidades[0] });
    }
  }

  private cargarDatosCita(id: string): void {
    this.isLoadingData = true;
    this.cdr.markForCheck();
    this.citaService.getCitaById(id).subscribe({
      next: (res) => {
        this.isLoadingData = false;
        if (res.data) {
          const cita = res.data;
          this.actualizarMedicosPorEspecialidad(cita.especialidad);
          this.citaForm.patchValue({
            cliente: cita.cliente,
            email: cita.email,
            telefono: cita.telefono,
            especialidad: cita.especialidad,
            profesional: cita.profesional,
            fecha: cita.fecha,
            hora: cita.hora,
            motivo: cita.motivo,
            estado: cita.estado,
            prioridad: cita.prioridad,
            costo: cita.costo,
            observaciones: cita.observaciones || ''
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingData = false;
        this.notificationService.error('Error al cargar cita', err.message);
        this.cdr.markForCheck();
        this.router.navigate(['/citas']);
      }
    });
  }

  // Helpers para validación en template HTML (T04)
  public esInvalido(campo: string): boolean {
    const control = this.citaForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  public esValido(campo: string): boolean {
    const control = this.citaForm.get(campo);
    return !!(control && control.valid && (control.dirty || control.touched));
  }

  // Envío del formulario (CRUD - Crear o Actualizar persistente en MongoDB)
  public onSubmit(): void {
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      this.notificationService.error(
        'Formulario Incompleto',
        'Por favor revisa y completa los campos obligatorios marcados en rojo.'
      );
      return;
    }

    this.isSubmitting = true;
    const datosFormulario: Cita = this.citaForm.value;

    if (this.esModoEdicion && this.citaId) {
      // OPERACIÓN UPDATE (PUT /api/citas/:id)
      this.citaService.updateCita(this.citaId, datosFormulario).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.success(
            'Cita Actualizada',
            `La cita de ${datosFormulario.cliente} ha sido actualizada exitosamente en MongoDB.`
          );
          this.router.navigate(['/citas']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notificationService.error('Error al actualizar', err.message);
        }
      });
    } else {
      // OPERACIÓN CREATE (POST /api/citas)
      this.citaService.createCita(datosFormulario).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.success(
            'Cita Registrada',
            `Se ha agendado satisfactoriamente la cita médica para ${datosFormulario.cliente}.`
          );
          this.router.navigate(['/citas']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notificationService.error('Error al registrar', err.message);
        }
      });
    }
  }

  public cancelar(): void {
    this.router.navigate(['/citas']);
  }
}
