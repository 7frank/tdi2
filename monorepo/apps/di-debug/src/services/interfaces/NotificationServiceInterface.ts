export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationServiceInterface {
  state: {
    notifications: Notification[];
  };
  
  showSuccess(message: string, autoClose?: boolean): string;
  showError(message: string, autoClose?: boolean): string;
  showWarning(message: string, autoClose?: boolean): string;
  showInfo(message: string, autoClose?: boolean): string;
  dismiss(id: string): void;
  dismissAll(): void;
}