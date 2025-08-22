import { Service } from '@tdi2/di-core/decorators';
import type { DashboardServiceInterface } from '../interfaces/DashboardServiceInterface';

@Service()
export class DashboardService implements DashboardServiceInterface {
  state = {
    currentTab: 'overview' as const,
    connectionStatus: 'connecting' as const,
    lastUpdate: null as Date | null,
    isLoading: false,
  };

  switchTab(tab: 'overview' | 'graph' | 'analysis' | 'issues' | 'config'): void {
    this.state.currentTab = tab;
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