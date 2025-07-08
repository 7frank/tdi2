
interface NavigationControlsProps {
  canProceed: boolean;
  optimalPath: string[];
  onBack: () => void;
  onNext: () => void;
  onSaveAndExit?: () => void;
  onSubmitAll?: () => void;
  completedCount?: number;
  totalCount?: number;
}

export function NavigationControls({
  canProceed,
  optimalPath,
  onBack,
  onNext,
  onSaveAndExit,
  onSubmitAll,
  completedCount = 0,
  totalCount = 0
}: NavigationControlsProps) {
  
  const isComplete = completedCount === totalCount && totalCount > 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getNextStepHint = () => {
    if (optimalPath.length === 0) {
      return "All sections completed!";
    }
    
    const nextStep = optimalPath[0];
    const stepName = nextStep.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `Next: ${stepName}`;
  };

  return (
    <div className="navigation-controls">
      <div className="nav-section nav-left">
        <button
          onClick={onBack}
          className="nav-button secondary"
          disabled={completedCount === 0}
        >
          ← Back
        </button>
        
        {onSaveAndExit && (
          <button
            onClick={onSaveAndExit}
            className="nav-button tertiary"
          >
            💾 Save & Exit
          </button>
        )}
      </div>

      <div className="nav-section nav-center">
        <div className="progress-info">
          <div className="progress-text">
            <span className="completed-count">{completedCount}</span>
            <span className="separator"> of </span>
            <span className="total-count">{totalCount}</span>
            <span className="sections-label"> sections completed</span>
          </div>
          
          <div className="mini-progress-bar">
            <div 
              className="mini-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="next-step-hint">
            {getNextStepHint()}
          </div>
        </div>
      </div>

      <div className="nav-section nav-right">
        {!isComplete ? (
          <>
            <button
              onClick={onNext}
              className={`nav-button primary ${canProceed ? 'enabled' : 'disabled'}`}
              disabled={!canProceed}
            >
              {canProceed ? 'Continue →' : 'Complete Current Section'}
            </button>
            
            <div className="nav-info">
              {!canProceed && (
                <span className="nav-hint error">
                  Please complete all required fields
                </span>
              )}
              
              {canProceed && optimalPath.length > 1 && (
                <span className="nav-hint success">
                  {optimalPath.length - 1} more sections to go
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            {onSubmitAll && (
              <button
                onClick={onSubmitAll}
                className="nav-button submit"
              >
                ✅ Submit Registration
              </button>
            )}
            
            <div className="nav-info">
              <span className="nav-hint success">
                🎉 All sections completed! Ready to submit.
              </span>
            </div>
          </>
        )}
      </div>

      {/* Quick action shortcuts */}
      <div className="quick-actions">
        <div className="action-group">
          <span className="action-label">Quick Actions:</span>
          
          <button
            className="quick-action-btn"
            onClick={() => window.print()}
            title="Print current progress"
          >
            🖨️
          </button>
          
          <button
            className="quick-action-btn"
            onClick={() => {
              // This would trigger a service method to export current state
              console.log('Export functionality would be implemented by service');
            }}
            title="Export progress"
          >
            📥
          </button>
          
          <button
            className="quick-action-btn"
            onClick={() => {
              // This would trigger validation service to check all sections
              console.log('Full validation would be triggered by validation service');
            }}
            title="Validate all sections"
          >
            ✅
          </button>
        </div>
      </div>
    </div>
  );
}