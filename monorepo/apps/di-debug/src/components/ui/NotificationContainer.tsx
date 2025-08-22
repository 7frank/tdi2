import type { Inject } from '@tdi2/di-core/markers';
import type { NotificationServiceInterface } from '../../services/interfaces/NotificationServiceInterface';

interface NotificationContainerProps {
  notificationService: Inject<NotificationServiceInterface>;
}

export function NotificationContainer({ notificationService }: NotificationContainerProps) {
  const { notifications } = notificationService.state;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#17a2b8';
    }
  };

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            padding: '15px 20px',
            marginBottom: '10px',
            background: getNotificationColor(notification.type),
            color: 'white',
            borderRadius: '5px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            maxWidth: '400px',
            cursor: 'pointer',
          }}
          onClick={() => notificationService.dismiss(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}