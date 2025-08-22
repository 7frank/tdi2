import { Service } from '@tdi2/di-core/decorators';
import type { DashboardServiceInterface } from '../interfaces/DashboardServiceInterface';

@Service()
export class DashboardService implements DashboardServiceInterface {
  state = {
    currentTab: 'overview' as 'overview' | 'graph' | 'analysis' | 'issues' | 'config',
    connectionStatus: 'connecting' as 'connecting' | 'connected' | 'disconnected' | 'error',
    lastUpdate: null as Date | null,
    isLoading: false,
  };

  switchTab(tab: 'overview' | 'graph' | 'analysis' | 'issues' | 'config'): void {
    console.log('[DashboardService] Switching to tab:', tab);
    this.state.currentTab = tab;
    console.log('[DashboardService] Current tab is now:', this.state.currentTab);
  }

  async reload(): Promise<void> {
    this.state.isLoading = true;
    try {
      // Trigger reload of all data
      this.updateLastUpdate();
    } finally {
      this.state.isLoading = false;
    }
  }

  updateConnectionStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.state.connectionStatus = status;
  }

  updateLastUpdate(): void {
    this.state.lastUpdate = new Date();
  }
}