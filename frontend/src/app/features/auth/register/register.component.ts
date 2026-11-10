import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ESPECIALIDADES_DISPONIBLES } from '../../../core/models/cita.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.css']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public registerForm!: FormGroup;
  public isSubmitting = false;
  public showPassword = false;
  public especialidades = ['Dirección Médica', 'Recepción y Admisión', ...ESPECIALIDADES_DISPONIBLES];

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['recepcionista', [Validators.required]],
      especialidad: ['Recepción y Admisión', [Validators.required]]
    });
  }

  public esInvalido(campo: string): boolean {
    const ctrl = this.registerForm.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  public onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.notificationService.error(
        'Datos Incompletos',
        'Por favor completa todos los campos requeridos correctamente.'
      );
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notificationService.success(
          'Cuenta Creada en MongoDB',
          res.message || 'Usuario registrado e iniciado sesión automáticamente.'
        );
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notificationService.error('Error al Registrar', err.message);
        this.cdr.markForCheck();
      }
    });
  }
}

