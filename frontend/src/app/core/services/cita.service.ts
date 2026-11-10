import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponse, Cita, CitaFiltros, EstadisticasCitas } from '../models/cita.model';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/citas';
  private healthUrl = 'http://localhost:3000/api/health';

  /**
   * Obtiene la lista de citas médicas desde el backend MongoDB
   * Soporta filtros de búsqueda, estado y especialidad (T01, T04)
   */
  public getCitas(filtros?: CitaFiltros): Observable<ApiResponse<Cita[]>> {
    let params = new HttpParams();

    if (filtros?.buscar) {
      params = params.set('buscar', filtros.buscar);
    }
    if (filtros?.estado && filtros.estado !== 'Todos') {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.especialidad && filtros.especialidad !== 'Todas') {
      params = params.set('especialidad', filtros.especialidad);
    }

    return this.http.get<ApiResponse<Cita[]>>(this.apiUrl, { params }).pipe(
      catchError((error) => this.handleError('obtener las citas', error))
    );
  }

  /**
   * Obtiene una cita médica específica por su ID de MongoDB
   */
  public getCitaById(id: string): Observable<ApiResponse<Cita>> {
    return this.http.get<ApiResponse<Cita>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => this.handleError('obtener el detalle de la cita', error))
    );
  }

  /**
   * Registra una nueva cita médica en MongoDB a través del backend
   */
  public createCita(cita: Omit<Cita, '_id' | 'createdAt' | 'updatedAt'>): Observable<ApiResponse<Cita>> {
    return this.http.post<ApiResponse<Cita>>(this.apiUrl, cita).pipe(
      catchError((error) => this.handleError('crear la cita médica', error))
    );
  }

  /**
   * Actualiza los datos de una cita existente en MongoDB
   */
  public updateCita(id: string, cita: Partial<Cita>): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}`, cita).pipe(
      catchError((error) => this.handleError('actualizar la cita médica', error))
    );
  }

  /**
   * Elimina permanentemente una cita médica de la base de datos MongoDB
   */
  public deleteCita(id: string): Observable<ApiResponse<Cita>> {
    return this.http.delete<ApiResponse<Cita>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => this.handleError('eliminar la cita', error))
    );
  }

  /**
   * Obtiene las métricas y estadísticas agregadas para el dashboard
   */
  public getEstadisticas(): Observable<ApiResponse<EstadisticasCitas>> {
    return this.http.get<ApiResponse<EstadisticasCitas>>(`${this.apiUrl}/estadisticas`).pipe(
      catchError((error) => this.handleError('obtener estadísticas', error))
    );
  }

  /**
   * Restaura la base de datos con los registros de prueba iniciales
   */
  public restoreSeed(): Observable<ApiResponse<Cita[]>> {
    return this.http.post<ApiResponse<Cita[]>>(`${this.apiUrl}/seed`, {}).pipe(
      catchError((error) => this.handleError('restaurar datos de prueba', error))
    );
  }

  /**
   * Verifica la conectividad y estado del backend
   */
  public checkHealth(): Observable<{ status: string; service: string; databaseMode: string }> {
    return this.http.get<{ status: string; service: string; databaseMode: string }>(this.healthUrl).pipe(
      catchError((error) => this.handleError('verificar estado del servidor', error))
    );
  }

  /**
   * Manejador centralizado de errores HTTP
   */
  private handleError(operacion: string, error: unknown): Observable<never> {
    console.error(`❌ [CitaService] Error al ${operacion}:`, error);
    const mensaje = (error as { error?: { message?: string } })?.error?.message 
      || `Ocurrió un error inesperado al ${operacion}.`;
    return throwError(() => new Error(mensaje));
  }
}
