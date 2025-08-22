import { Service } from '@tdi2/di-core/decorators';
import type { NotificationServiceInterface, Notification } from '../interfaces/NotificationServiceInterface';

@Service()
export class NotificationService implements NotificationServiceInterface {
  state = {
    notifications: [] as Notification[],
  };

  showSuccess(message: string, autoClose: boolean = true): string {
    return this.addNotification('success', message, autoClose);
  }

  showError(message: string, autoClose: boolean = false): string {
    return this.addNotification('error', message, autoClose);
  }

  showWarning(message: string, autoClose: boolean = true): string {
    return this.addNotification('warning', message, autoClose);
  }

  showInfo(message: string, autoClose: boolean = true): string {
    return this.addNotification('info', message, autoClose);
  }

  dismiss(id: string): void {
    this.state.notifications = this.state.notifications.filter(
      notification => notification.id !== id
    );
  }

  dismissAll(): void {
    this.state.notifications = [];
  }

  private addNotification(
    type: 'success' | 'error' | 'warning' | 'info', 
    message: string, 
    autoClose: boolean
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = autoClose ? (type === 'error' ? 5000 : 3000) : undefined;

    const notification: Notification = {
      id,
      type,
      message,
      timestamp: new Date(),
      autoClose,
      duration,
    };

    this.state.notifications.push(notification);

    // Auto-remove if configured
    if (autoClose && duration) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    // Keep only last 10 notifications
    if (this.state.notifications.length > 10) {
      this.state.notifications = this.state.notifications.slice(-10);
    }

    return id;
  }
}