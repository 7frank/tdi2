import type { Inject } from '@tdi2/di-core/markers';
import type { AnalyticsServiceInterface, ValidationIssue } from '../../services/interfaces/AnalyticsServiceInterface';

interface IssuesTabProps {
  analyticsService: Inject<AnalyticsServiceInterface>;
}

export function IssuesTab({ analyticsService }: IssuesTabProps) {
  const { analysis, isLoading } = analyticsService.state;

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading issues...</p>
      </div>
    );
  }

  const allIssues: ValidationIssue[] = [];
  if (analysis?.validation?.issues) {
    allIssues.push(
      ...analysis.validation.issues.errors,
      ...analysis.validation.issues.warnings,
      ...analysis.validation.issues.info
    );
  }

  if (allIssues.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#28a745' }}>
        <h3>🎉 No Issues Found!</h3>
        <p>Your DI configuration is healthy.</p>
      </div>
    );
  }

  return (
    <div className="issues-list">
      {allIssues.map((issue, index) => {
        const iconClass = `issue-${issue.type}`;
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        
        return (
          <div key={index} className="issue-item">
            <div className={`issue-icon ${iconClass}`}>{icon}</div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: '5px' }}>{issue.message}</div>
              {issue.suggestion && (
                <div style={{ color: '#666', fontSize: '0.9rem' }}>💡 {issue.suggestion}</div>
              )}
              {issue.location && (
                <div style={{ color: '#999', fontSize: '0.8rem', marginTop: '5px' }}>
                  📍 {issue.location.file || issue.location.service || 'Unknown location'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}