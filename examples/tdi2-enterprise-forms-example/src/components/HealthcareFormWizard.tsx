import type { Inject } from '@tdi2/di-core/markers';
import type { FormDAGServiceInterface } from '../services/FormDAGServiceInterface';
import type { FormStateServiceInterface } from '../services/FormStateServiceInterface';
import type { ValidationOrchestratorServiceInterface } from '../services/ValidationOrchestratorServiceInterface';
import { FormNodeRenderer } from './FormNodeRenderer';
import { ProgressIndicator } from './ProgressIndicator';
import { NavigationControls } from './NavigationControls';

interface HealthcareFormWizardProps {
  dagService: Inject<FormDAGServiceInterface>;
  stateService: Inject<FormStateServiceInterface>;
  validationService: Inject<ValidationOrchestratorServiceInterface>;
}

export function HealthcareFormWizard({
  dagService,
  stateService,
  validationService
}: HealthcareFormWizardProps) {
  // Pure reactive state - no useState needed!
  const currentNodes = dagService.state.currentNodes;
  const completedNodes = dagService.state.completedNodes;
  const availableNodes = dagService.state.availableNodes;
  const formData = stateService.state.currentSnapshot.data;
  const validationResults = validationService.state.validationCache;

  const handleNodeComplete = async (nodeId: string) => {
    try {
      await dagService.completeNode(nodeId);
    } catch (error) {
      console.error('Failed to complete node:', error);
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    if (dagService.canAccessNode(nodeId)) {
      dagService.setCurrentNode(nodeId);
    }
  };

  return (
    <div className="healthcare-form-wizard">
      <header className="wizard-header">
        <h1>Patient Registration</h1>
        <ProgressIndicator
          completedNodes={completedNodes}
          availableNodes={availableNodes}
          currentNodes={currentNodes}
          onNodeSelect={handleNodeSelect}
        />
      </header>

      <main className="wizard-content">
        <div className="form-sections">
          {currentNodes.map(nodeId => (
            <FormNodeRenderer
              key={nodeId}
              nodeId={nodeId}
              data={formData[nodeId] || {}}
              validationResult={validationResults.get(nodeId)}
              onComplete={() => handleNodeComplete(nodeId)}
            />
          ))}
        </div>

        <aside className="wizard-sidebar">
          <div className="available-sections">
            <h3>Available Sections</h3>
            {availableNodes
              .filter(nodeId => !currentNodes.includes(nodeId))
              .map(nodeId => (
                <button
                  key={nodeId}
                  onClick={() => handleNodeSelect(nodeId)}
                  className="section-button available"
                >
                  {nodeId.replace('_', ' ').toUpperCase()}
                </button>
              ))}
          </div>

          <div className="completed-sections">
            <h3>Completed</h3>
            {completedNodes.map(nodeId => (
              <button
                key={nodeId}
                onClick={() => handleNodeSelect(nodeId)}
                className="section-button completed"
              >
                ✓ {nodeId.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </aside>
      </main>

      <footer className="wizard-footer">
        <NavigationControls
          canProceed={dagService.canProceedToNext()}
          optimalPath={dagService.calculateOptimalPath()}
          onBack={() => stateService.restorePreviousSnapshot()}
          onNext={() => dagService.proceedToOptimalNext()}
        />
      </footer>
    </div>
  );
}