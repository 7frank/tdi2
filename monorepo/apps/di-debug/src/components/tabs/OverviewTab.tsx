import { useEffect } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { AnalyticsServiceInterface } from '../../services/interfaces/AnalyticsServiceInterface';
import { MetricCard } from '../ui/MetricCard';

interface OverviewTabProps {
  analyticsService: Inject<AnalyticsServiceInterface>;
}

export function OverviewTab({ analyticsService }: OverviewTabProps) {
  const { metrics, isLoading } = analyticsService.state;

  useEffect(() => {
    analyticsService.loadAnalysis();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading analysis data...</p>
      </div>
    );
  }

  return (
    <div id="overview" className="tab-content active">
      <div className="metrics-grid">
        <MetricCard
          value={metrics.totalServices}
          label="Total Services"
        />
        <MetricCard
          value={metrics.healthScore}
          label="Health Score"
        />
        <MetricCard
          value={metrics.totalIssues}
          label="Total Issues"
        />
        <MetricCard
          value={metrics.circularDependencies}
          label="Circular Dependencies"
        />
      </div>
    </div>
  );
}