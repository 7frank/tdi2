import type { Inject } from '@tdi2/di-core/markers';
import type { DashboardServiceInterface } from '../../services/interfaces/DashboardServiceInterface';
import type { WebSocketServiceInterface } from '../../services/interfaces/WebSocketServiceInterface';
import { StatusIndicator } from '../ui/StatusIndicator';

interface HeaderProps {
  dashboardService: Inject<DashboardServiceInterface>;
  webSocketService: Inject<WebSocketServiceInterface>;
}

export function Header({ dashboardService, webSocketService }: HeaderProps) {
  const { lastUpdate, isLoading } = dashboardService.state;
  const { connected } = webSocketService.state;

  const handleReload = () => {
    dashboardService.reload();
  };

  return (
    <>
      <div className="header">
        <h1>🌐 TDI2 Dashboard</h1>
        <p>Interactive Dependency Injection Analysis & Debugging</p>
      </div>

      <div className="status-bar">
        <StatusIndicator 
          connected={connected} 
          status={connected ? 'Connected to TDI2 Server' : 'Disconnected'} 
        />
        
        <div>
          <span id="last-update">
            Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
          </span>
        </div>
        
        <div>
          <button 
            className="btn" 
            onClick={handleReload}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Loading...' : '🔄 Reload'}
          </button>
        </div>
      </div>
    </>
  );
}