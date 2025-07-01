import { Service } from "@tdi2/di-core";
import { type NotificationServiceInterface } from "./types";

@Service()
export class NotificationService implements NotificationServiceInterface {
  state = {
    notifications: [] as Array<{
      id: string;
      message: string;
      type: "success" | "error" | "info";
      timestamp: Date;
    }>,
  };

  showSuccess(message: string): void {
    this.addNotification(message, "success");
  }

  showError(message: string): void {
    this.addNotification(message, "error");
  }

  showInfo(message: string): void {
    this.addNotification(message, "info");
  }

  dismiss(id: string): void {
    this.state.notifications = this.state.notifications.filter(
      (n) => n.id !== id
    );
  }

  clear(): void {
    this.state.notifications = [];
  }

  private addNotification(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    const notification = {
      id: this.generateId(),
      message,
      type,
      timestamp: new Date(),
    };

    this.state.notifications.push(notification);

    // Auto-dismiss after 5 seconds for success/info, 8 seconds for errors
    const dismissDelay = type === "error" ? 8000 : 5000;
    setTimeout(() => {
      this.dismiss(notification.id);
    }, dismissDelay);
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
