import type { Inject } from '@tdi2/di-core/markers';
import type { AnalyticsServiceInterface } from '../../services/interfaces/AnalyticsServiceInterface';

interface AnalysisTabProps {
  analyticsService: Inject<AnalyticsServiceInterface>;
}

export function AnalysisTab({ analyticsService }: AnalysisTabProps) {
  const { analysis, isLoading } = analyticsService.state;

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading detailed analysis...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="loading-spinner">
        <p>No analysis data available</p>
      </div>
    );
  }

  return (
    <div>
      <h3>📊 Detailed Analysis Report</h3>
      
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
        <h4>📈 Summary Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div>
            <strong>Total Services:</strong> {analysis.summary?.totalServices || 0}
          </div>
          <div>
            <strong>Missing Services:</strong> {analysis.summary?.missingDependencies?.length || 0}
          </div>
          <div>
            <strong>Circular Dependencies:</strong> {analysis.summary?.circularDependencies || 0}
          </div>
          <div>
            <strong>Health Score:</strong> {analysis.summary?.healthScore || 0}/100
          </div>
        </div>
      </div>

      {analysis.summary?.missingDependencies && analysis.summary.missingDependencies.length > 0 && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
          <h4>⚠️ Missing Dependencies</h4>
          <ul style={{ marginTop: '10px' }}>
            {analysis.summary.missingDependencies.slice(0, 10).map((dep, index) => (
              <li key={index}>{dep}</li>
            ))}
            {analysis.summary.missingDependencies.length > 10 && (
              <li><em>... and {analysis.summary.missingDependencies.length - 10} more</em></li>
            )}
          </ul>
        </div>
      )}

      {analysis.performance && (
        <div style={{ background: '#e8f5e8', border: '1px solid #c8e6c9', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
          <h4>⚡ Performance Metrics</h4>
          <div style={{ marginTop: '10px' }}>
            <div><strong>Analysis Time:</strong> {analysis.performance.analysisTime}ms</div>
            {analysis.performance.memoryUsage && (
              <div><strong>Memory Usage:</strong> {Math.round(analysis.performance.memoryUsage / 1024 / 1024)}MB</div>
            )}
          </div>
        </div>
      )}

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
        <h4>🔄 Actions</h4>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button className="btn" onClick={() => analyticsService.reloadAnalysis()}>
            🔄 Reload Analysis
          </button>
          <button className="btn" onClick={() => analyticsService.exportAnalysis()}>
            📥 Export Report
          </button>
        </div>
      </div>
    </div>
  );
}