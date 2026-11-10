import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  @Input() public isOpen = false;
  @Input() public title = 'Confirmar acción';
  @Input() public message = '¿Estás seguro de que deseas proceder con esta acción?';
  @Input() public details = '';
  @Input() public confirmText = 'Confirmar';
  @Input() public cancelText = 'Cancelar';
  @Input() public isDanger = true;
  @Input() public isLoading = false;

  @Output() public onConfirm = new EventEmitter<void>();
  @Output() public onCancel = new EventEmitter<void>();

  public confirm(): void {
    if (!this.isLoading) {
      this.onConfirm.emit();
    }
  }

  public cancel(): void {
    if (!this.isLoading) {
      this.onCancel.emit();
    }
  }
}
