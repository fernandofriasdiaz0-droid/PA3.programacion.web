import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { ApiResponse } from '../models/cita.model';
import {
  AuthTokenResponse,
  LoginCredentials,
  RegisterPayload,
  RolUsuario,
  Usuario
} from '../models/auth.model';

const TOKEN_STORAGE_KEY = 'medisys_pa3_jwt_token';
const USER_STORAGE_KEY = 'medisys_pa3_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api/auth';

  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.cargarUsuarioLocal());
  public usuario$ = this.usuarioSubject.asObservable();

  constructor() {
    // Validar vigencia del token al iniciar la aplicación
    if (this.getToken() && this.isTokenExpired()) {
      this.limpiarSesionLocal();
    }
  }

  public get usuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Decodifica el payload del JWT para verificar la fecha de expiración (exp) sin librerías externas
   */
  public isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;
      const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(decodedJson) as { exp?: number };
      if (!payload.exp) return false;
      const ahoraSegundos = Math.floor(Date.now() / 1000);
      return payload.exp < ahoraSegundos;
    } catch {
      return true;
    }
  }

  public hasRole(...roles: (RolUsuario | RolUsuario[])[]): boolean {
    const user = this.usuarioActual;
    if (!user) return false;
    const listaRoles = roles.flat();
    return listaRoles.includes(user.rol);
  }

  public isAdmin(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  public login(credenciales: LoginCredentials): Observable<ApiResponse<AuthTokenResponse>> {
    return this.http.post<ApiResponse<AuthTokenResponse>>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.guardarSesionLocal(res.data.token, res.data.usuario);
        }
      }),
      catchError((error) => this.handleError('iniciar sesión', error))
    );
  }

  public register(datos: RegisterPayload): Observable<ApiResponse<AuthTokenResponse>> {
    return this.http.post<ApiResponse<AuthTokenResponse>>(`${this.apiUrl}/register`, datos).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.guardarSesionLocal(res.data.token, res.data.usuario);
        }
      }),
      catchError((error) => this.handleError('registrar usuario', error))
    );
  }

  public getUsuarios(): Observable<ApiResponse<Usuario[]>> {
    return this.http.get<ApiResponse<Usuario[]>>(`${this.apiUrl}/usuarios`).pipe(
      catchError((error) => this.handleError('consultar usuarios', error))
    );
  }

  public logout(redirigir = true): void {
    this.limpiarSesionLocal();
    if (redirigir) {
      this.router.navigate(['/login']);
    }
  }

  private guardarSesionLocal(token: string, usuario: Usuario): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    }
    this.usuarioSubject.next(usuario);
  }

  private limpiarSesionLocal(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    this.usuarioSubject.next(null);
  }

  private cargarUsuarioLocal(): Usuario | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }

  private handleError(operacion: string, error: unknown): Observable<never> {
    const errObj = error as { error?: { message?: string } };
    const mensaje = errObj?.error?.message || `Error al ${operacion}. Verifica tus datos o la conexión al servidor.`;
    return throwError(() => new Error(mensaje));
  }
}

