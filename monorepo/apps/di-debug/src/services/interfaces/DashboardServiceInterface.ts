export interface DashboardServiceInterface {
  state: {
    currentTab: 'overview' | 'graph' | 'analysis' | 'issues' | 'config';
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    lastUpdate: Date | null;
    isLoading: boolean;
  };
  
  switchTab(tab: 'overview' | 'graph' | 'analysis' | 'issues' | 'config'): void;
  reload(): Promise<void>;
  updateConnectionStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void;
  updateLastUpdate(): void;
}