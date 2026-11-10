import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public loginForm!: FormGroup;
  public isSubmitting = false;
  public showPassword = false;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loginForm = this.fb.group({
      email: ['admin@medisys.com', [Validators.required, Validators.email]],
      password: ['Admin123!', [Validators.required, Validators.minLength(6)]]
    });
  }

  public rellenarDemo(rol: 'admin' | 'medico' | 'recepcionista'): void {
    const demos = {
      admin: { email: 'admin@medisys.com', password: 'Admin123!' },
      medico: { email: 'medico@medisys.com', password: 'Medico123!' },
      recepcionista: { email: 'recepcion@medisys.com', password: 'Recepcion123!' }
    };
    this.loginForm.patchValue(demos[rol]);
    this.cdr.markForCheck();
  }

  public esInvalido(campo: string): boolean {
    const ctrl = this.loginForm.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.notificationService.error('Formulario Incompleto', 'Ingresa un correo electrónico válido y tu contraseña.');
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notificationService.success(
          'Sesión Iniciada (JWT)',
          res.message || 'Autenticación exitosa en Medisys.'
        );
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notificationService.error('Error de Autenticación', err.message);
        this.cdr.markForCheck();
      }
    });
  }
}

