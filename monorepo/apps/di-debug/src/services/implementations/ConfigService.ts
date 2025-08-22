import { Service, Inject } from '@tdi2/di-core/decorators';
import type { ConfigServiceInterface, ConfigData } from '../interfaces/ConfigServiceInterface';
import type { NotificationServiceInterface } from '../interfaces/NotificationServiceInterface';

@Service()
export class ConfigService implements ConfigServiceInterface {
  state = {
    config: null as ConfigData | null,
    isLoading: true,
    error: null as string | null,
  };

  constructor(
    @Inject() private notificationService: NotificationServiceInterface
  ) {}

  async loadConfig(): Promise<void> {
    if (this.state.config) return; // Already loaded

    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }

      const config = await response.json();
      this.state.config = config;
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to load configuration');
    } finally {
      this.state.isLoading = false;
    }
  }

  async reloadConfig(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      // Trigger server config reload
      const reloadResponse = await fetch('/api/analysis/reload', { method: 'POST' });
      if (!reloadResponse.ok) {
        throw new Error(`Failed to reload config: ${reloadResponse.statusText}`);
      }

      // Fetch updated config
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error(`Failed to fetch updated config: ${response.statusText}`);
      }

      const config = await response.json();
      this.state.config = config;
      this.notificationService.showSuccess('Configuration reloaded successfully');
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to reload configuration');
    } finally {
      this.state.isLoading = false;
    }
  }

  async updateConfig(config: Partial<ConfigData>): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to update config: ${response.statusText}`);
      }

      const updatedConfig = await response.json();
      this.state.config = updatedConfig;
      this.notificationService.showSuccess('Configuration updated successfully');
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to update configuration');
    } finally {
      this.state.isLoading = false;
    }
  }
}