import type { Inject } from '@tdi2/di-core/markers';
import type { DashboardServiceInterface } from './services/interfaces/DashboardServiceInterface';
import type { NotificationServiceInterface } from './services/interfaces/NotificationServiceInterface';
import type { WebSocketServiceInterface } from './services/interfaces/WebSocketServiceInterface';
import type { AnalyticsServiceInterface } from './services/interfaces/AnalyticsServiceInterface';
import { Dashboard } from './components/Dashboard';
import { useEffect } from 'react';

interface AppProps {
  dashboardService: Inject<DashboardServiceInterface>;
  notificationService: Inject<NotificationServiceInterface>;
  webSocketService: Inject<WebSocketServiceInterface>;
  analyticsService: Inject<AnalyticsServiceInterface>;
}

function App({ 
  dashboardService, 
  notificationService, 
  webSocketService, 
  analyticsService 
}: AppProps) {
  
  useEffect(() => {
    // Setup WebSocket message handlers
    const handleWebSocketMessage = (message: any) => {
      switch (message.type) {
        case 'analysis_update':
          if (message.data && message.data.connected) {
            analyticsService.reloadAnalysis();
          }
          break;
        case 'config_reload':
          notificationService.showInfo('Configuration updated - reloading...');
          setTimeout(() => analyticsService.reloadAnalysis(), 1000);
          break;
        case 'error':
          notificationService.showError(message.data?.message || 'An error occurred');
          break;
      }
    };

    webSocketService.onMessage(handleWebSocketMessage);

    // Update dashboard connection status based on WebSocket state
    const updateConnectionStatus = () => {
      dashboardService.updateConnectionStatus(
        webSocketService.state.connected ? 'connected' : 'disconnected'
      );
    };

    // Check connection status periodically
    const connectionInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      webSocketService.removeMessageListener(handleWebSocketMessage);
      clearInterval(connectionInterval);
    };
  }, [dashboardService, notificationService, webSocketService, analyticsService]);

  return <Dashboard />;
}

export default App;