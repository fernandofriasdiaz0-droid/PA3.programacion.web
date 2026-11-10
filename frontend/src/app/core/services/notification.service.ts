import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warning';
  titulo: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$: Observable<ToastMessage[]> = this.toastsSubject.asObservable();

  public show(tipo: 'success' | 'error' | 'info' | 'warning', titulo: string, mensaje: string, duracionMs = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const nuevoToast: ToastMessage = { id, tipo, titulo, mensaje };

    const actuales = this.toastsSubject.getValue();
    this.toastsSubject.next([...actuales, nuevoToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duracionMs);
  }

  public success(titulo: string, mensaje: string): void {
    this.show('success', titulo, mensaje);
  }

  public error(titulo: string, mensaje: string): void {
    this.show('error', titulo, mensaje, 5000);
  }

  public info(titulo: string, mensaje: string): void {
    this.show('info', titulo, mensaje);
  }

  public dismiss(id: string): void {
    const filtrados = this.toastsSubject.getValue().filter((t) => t.id !== id);
    this.toastsSubject.next(filtrados);
  }
}
