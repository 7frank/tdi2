import { Service, Inject } from '@tdi2/di-core/decorators';
import type { AnalyticsServiceInterface, AnalysisData, MetricsData } from '../interfaces/AnalyticsServiceInterface';
import type { NotificationServiceInterface } from '../interfaces/NotificationServiceInterface';

@Service()
export class AnalyticsService implements AnalyticsServiceInterface {
  state = {
    analysis: null as AnalysisData | null,
    metrics: {
      totalServices: 0,
      healthScore: 0,
      totalIssues: 0,
      circularDependencies: 0,
    } as MetricsData,
    isLoading: true,
    error: null as string | null,
  };

  constructor(
    @Inject() private notificationService: NotificationServiceInterface
  ) {}

  async loadAnalysis(): Promise<void> {
    if (this.state.analysis) return; // Already loaded

    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/analysis');
      if (!response.ok) {
        throw new Error(`Failed to load analysis: ${response.statusText}`);
      }

      const analysis = await response.json();
      this.state.analysis = analysis;
      this.updateMetrics(analysis);
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to load analysis data');
    } finally {
      this.state.isLoading = false;
    }
  }

  async reloadAnalysis(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/analysis?reload=true');
      if (!response.ok) {
        throw new Error(`Failed to reload analysis: ${response.statusText}`);
      }

      const analysis = await response.json();
      this.state.analysis = analysis;
      this.updateMetrics(analysis);
      this.notificationService.showSuccess('Analysis reloaded successfully');
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to reload analysis');
    } finally {
      this.state.isLoading = false;
    }
  }

  exportAnalysis(): void {
    if (!this.state.analysis) {
      this.notificationService.showWarning('No analysis data to export');
      return;
    }

    try {
      const dataStr = JSON.stringify(this.state.analysis, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `tdi2-analysis-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      this.notificationService.showSuccess('Analysis report exported successfully');
    } catch (error) {
      this.notificationService.showError('Failed to export analysis');
    }
  }

  private updateMetrics(analysis: AnalysisData): void {
    this.state.metrics = {
      totalServices: analysis.summary?.totalServices || 0,
      healthScore: analysis.summary?.healthScore || 0,
      totalIssues: analysis.summary?.totalIssues || 0,
      circularDependencies: analysis.summary?.circularDependencies || 0,
    };
  }
}