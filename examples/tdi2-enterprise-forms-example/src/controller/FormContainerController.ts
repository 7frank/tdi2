// FormContainerController.ts - View Controller for form navigation and UI coordination
import { Service, Inject } from "@tdi2/di-core/decorators";
import type { FormDAGServiceInterface } from "../services/FormDAGService";
import type { DemographicsFormServiceInterface } from "../services/DemographicsFormService";
import type { InsuranceFormServiceInterface } from "../services/InsuranceFormService";

export interface FormContainerControllerInterface {
  state: {
    // 🎨 VIEW STATE: Form rendering and navigation UI
    currentFormComponent: string;
    isFormTransitioning: boolean;
    lastFormChangeTime: Date | null;
    formSubmissionInProgress: boolean;
    
    // 🎨 VIEW STATE: Error handling and user feedback
    currentError: string | null;
    showSuccessMessage: boolean;
    successMessage: string | null;
    
    // 🎨 VIEW STATE: Form validation and completion feedback
    formValidationState: 'valid' | 'invalid' | 'pending' | 'unknown';
    completionFeedback: string | null;
    
    // 🎨 VIEW STATE: Debug and development feedback
    debugInfo: {
      lastAction: string;
      actionTimestamp: Date | null;
      navigationAttempts: number;
      validationAttempts: number;
    };
  };

  // Core form lifecycle methods
  handleFormComplete(nodeId: string): Promise<void>;
  navigateToForm(nodeId: string): boolean;
  getCurrentFormComponent(): string;
  
  // Form validation coordination
  validateCurrentForm(): Promise<boolean>;
  canSubmitCurrentForm(): boolean;
  
  // UI state management
  clearError(): void;
  showSuccess(message: string): void;
  clearSuccess(): void;
  
  // Form transition coordination
  triggerFormTransition(targetForm: string): void;
  resetTransitionState(): void;
  
  // Development and debugging helpers
  getDebugSnapshot(): any;
  logFormAction(action: string): void;
  resetDebugCounters(): void;
}

@Service()
export class FormContainerController implements FormContainerControllerInterface {
  state = {
    // 🎨 VIEW STATE: Form rendering and navigation
    currentFormComponent: "demographics",
    isFormTransitioning: false,
    lastFormChangeTime: null as Date | null,
    formSubmissionInProgress: false,
    
    // 🎨 VIEW STATE: Error handling and feedback
    currentError: null as string | null,
    showSuccessMessage: false,
    successMessage: null as string | null,
    
    // 🎨 VIEW STATE: Form validation and completion
    formValidationState: 'unknown' as 'valid' | 'invalid' | 'pending' | 'unknown',
    completionFeedback: null as string | null,
    
    // 🎨 VIEW STATE: Debug information
    debugInfo: {
      lastAction: 'initialization',
      actionTimestamp: new Date(),
      navigationAttempts: 0,
      validationAttempts: 0,
    },
  };

  constructor(
    @Inject() private formDAG: FormDAGServiceInterface,
    @Inject() private demographicsForm: DemographicsFormServiceInterface,
    @Inject() private insuranceForm: InsuranceFormServiceInterface
  ) {
    // Initialize controller state based on DAG state
    this.state.currentFormComponent = this.formDAG.state.currentNode;
    this.logFormAction('controller_initialized');
  }

  async handleFormComplete(nodeId: string): Promise<void> {
    this.logFormAction(`handle_form_complete_${nodeId}`);
    this.state.formSubmissionInProgress = true;
    this.clearError();

    try {
      // 🔧 FORM-SPECIFIC VALIDATION: Validate the specific form being completed
      const isValid = await this.validateSpecificForm(nodeId);
      if (!isValid) {
        throw new Error(`${nodeId} form validation failed`);
      }

      // 🔧 FORM-SPECIFIC SUBMISSION: Handle form-specific submission logic
      await this.submitSpecificForm(nodeId);

      // 🔧 DAG COMPLETION: Mark the node as complete in the DAG
      await this.formDAG.completeNode(nodeId);
      
      // 🎨 VIEW STATE: Update completion feedback
      this.state.completionFeedback = `${nodeId} completed successfully`;
      this.showSuccess(`${this.getFormDisplayName(nodeId)} completed successfully!`);

      // 🔧 NAVIGATION: Determine and execute next navigation step
      const navigationSuccess = await this.executePostCompletionNavigation();
      if (!navigationSuccess) {
        console.warn(`⚠️ Post-completion navigation failed for ${nodeId}`);
      }

    } catch (error) {
      this.logFormAction(`form_completion_error_${nodeId}`);
      const errorMessage = error.message || `Failed to complete ${nodeId} form`;
      this.state.currentError = errorMessage;
      
      console.error(`❌ Failed to complete ${nodeId}:`, error);
      throw error; // Re-throw to let the component handle it
    } finally {
      this.state.formSubmissionInProgress = false;
    }
  }

  async validateSpecificForm(nodeId: string): Promise<boolean> {
    this.state.debugInfo.validationAttempts++;
    this.state.formValidationState = 'pending';

    try {
      let validationResult;
      
      switch (nodeId) {
        case "demographics":
          validationResult = await this.demographicsForm.validateForm();
          break;
        case "insurance":
          validationResult = await this.insuranceForm.validateForm();
          // Additional check for insurance eligibility
          if (this.insuranceForm.state.eligibilityCheck.result !== "verified") {
            this.state.formValidationState = 'invalid';
            return false;
          }
          break;
        default:
          // For placeholder forms, assume they're valid
          validationResult = { isValid: true, errors: [] };
      }

      const isValid = validationResult.isValid;
      this.state.formValidationState = isValid ? 'valid' : 'invalid';
      
      if (!isValid) {
        const errorMessages = validationResult.errors?.map(e => e.message).join(", ");
        this.state.currentError = `Validation failed: ${errorMessages}`;
      }

      return isValid;
    } catch (error) {
      this.state.formValidationState = 'invalid';
      console.error(`Validation error for ${nodeId}:`, error);
      return false;
    }
  }

  async submitSpecificForm(nodeId: string): Promise<void> {
    switch (nodeId) {
      case "demographics":
        await this.demographicsForm.submitForm();
        // Store demographics data in DAG for cross-form access
        this.formDAG.state.formData.demographics = this.demographicsForm.state.formData as any;
        break;
        
      case "insurance":
        // Check if form can be submitted according to service logic
        if (!this.insuranceForm.canSubmitForm()) {
          throw new Error("Insurance form is not ready for submission");
        }
        await this.insuranceForm.submitForm();
        // Store insurance data in DAG for cross-form access
        this.formDAG.state.formData.insurance = this.insuranceForm.state.formData as any;
        break;
        
      default:
        // For placeholder forms, no actual submission needed
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate submission
    }
  }

  async executePostCompletionNavigation(): Promise<boolean> {
    const completionStatus = this.formDAG.getCompletionStatus();
    this.state.debugInfo.navigationAttempts++;

    if (completionStatus === "ready_for_submit") {
      this.logFormAction('navigate_to_final_submit');
      return this.navigateToForm("final_submit");
    } else if (completionStatus === "completed") {
      this.logFormAction('flow_completed');
      this.state.completionFeedback = "🎉 Patient onboarding completed!";
      return true; // Stay on current form (completion state)
    } else {
      // Navigate to next optimal form
      const nextNode = this.formDAG.getNextOptimalNode();
      if (nextNode && nextNode !== this.formDAG.state.currentNode) {
        this.logFormAction(`navigate_to_next_${nextNode}`);
        return this.navigateToForm(nextNode);
      }
    }

    return true; // Navigation handled or not needed
  }

  navigateToForm(nodeId: string): boolean {
    this.logFormAction(`navigate_to_${nodeId}`);
    
    // Check if navigation is allowed
    if (!this.formDAG.canAccessNode(nodeId)) {
      this.state.currentError = `Cannot access ${this.getFormDisplayName(nodeId)} form. Dependencies not met.`;
      return false;
    }

    // 🎨 VIEW STATE: Trigger transition animation
    this.triggerFormTransition(nodeId);

    // Execute DAG navigation
    const success = this.formDAG.navigateToNode(nodeId);
    
    if (success) {
      this.state.currentFormComponent = nodeId;
      this.state.lastFormChangeTime = new Date();
      this.clearError(); // Clear any previous navigation errors
    } else {
      this.state.currentError = `Failed to navigate to ${this.getFormDisplayName(nodeId)}`;
    }

    return success;
  }

  getCurrentFormComponent(): string {
    // Sync with DAG state in case it was changed elsewhere
    const dagCurrentNode = this.formDAG.state.currentNode;
    if (dagCurrentNode !== this.state.currentFormComponent) {
      this.state.currentFormComponent = dagCurrentNode;
      this.state.lastFormChangeTime = new Date();
    }
    
    return this.state.currentFormComponent;
  }

  async validateCurrentForm(): Promise<boolean> {
    const currentNode = this.getCurrentFormComponent();
    return await this.validateSpecificForm(currentNode);
  }

  canSubmitCurrentForm(): boolean {
    const currentNode = this.getCurrentFormComponent();
    
    switch (currentNode) {
      case "demographics":
        return this.demographicsForm.state.validationResults?.isValid || false;
      case "insurance":
        return this.insuranceForm.canSubmitForm();
      case "final_submit":
        return this.formDAG.getCompletionStatus() === "ready_for_submit";
      default:
        // For placeholder forms, assume they can be submitted if not currently submitting
        return !this.state.formSubmissionInProgress;
    }
  }

  // 🎨 VIEW STATE: UI feedback methods
  clearError(): void {
    this.state.currentError = null;
  }

  showSuccess(message: string): void {
    this.state.successMessage = message;
    this.state.showSuccessMessage = true;
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      this.clearSuccess();
    }, 3000);
  }

  clearSuccess(): void {
    this.state.showSuccessMessage = false;
    this.state.successMessage = null;
  }

  triggerFormTransition(targetForm: string): void {
    this.state.isFormTransitioning = true;
    this.logFormAction(`transition_to_${targetForm}`);
    
    // Reset transition state after animation
    setTimeout(() => {
      this.resetTransitionState();
    }, 300);
  }

  resetTransitionState(): void {
    this.state.isFormTransitioning = false;
  }

  // 🔧 DEVELOPMENT: Debug and introspection methods
  getDebugSnapshot(): any {
    return {
      controller: {
        currentFormComponent: this.state.currentFormComponent,
        formValidationState: this.state.formValidationState,
        isTransitioning: this.state.isFormTransitioning,
        hasError: !!this.state.currentError,
        debugInfo: this.state.debugInfo,
      },
      dag: {
        currentNode: this.formDAG.state.currentNode,
        completionStatus: this.formDAG.getCompletionStatus(),
        completedNodes: this.formDAG.state.completedNodes,
        nextOptimalNode: this.formDAG.getNextOptimalNode(),
        progress: this.formDAG.calculateProgress(),
      },
      forms: {
        demographics: {
          isDirty: this.demographicsForm.state.isDirty,
          isValid: this.demographicsForm.state.validationResults?.isValid,
        },
        insurance: {
          isDirty: this.insuranceForm.state.isDirty,
          canSubmit: this.insuranceForm.canSubmitForm(),
          eligibilityStatus: this.insuranceForm.state.eligibilityCheck.result,
        },
      },
    };
  }

  logFormAction(action: string): void {
    this.state.debugInfo.lastAction = action;
    this.state.debugInfo.actionTimestamp = new Date();
    
    if (process.env.NODE_ENV === "development") {
      console.log(`🎮 FormController: ${action}`, {
        currentForm: this.state.currentFormComponent,
        timestamp: this.state.debugInfo.actionTimestamp.toISOString(),
      });
    }
  }

  resetDebugCounters(): void {
    this.state.debugInfo.navigationAttempts = 0;
    this.state.debugInfo.validationAttempts = 0;
  }

  // 🔧 HELPER: Get user-friendly form names
  private getFormDisplayName(nodeId: string): string {
    const displayNames = {
      demographics: "Demographics",
      insurance: "Insurance Information",
      guardian_consent: "Guardian Consent",
      medical_history: "Medical History",
      specialist_referral: "Specialist Referral",
      emergency_contacts: "Emergency Contacts",
      hipaa_consent: "HIPAA Consent",
      financial_responsibility: "Financial Responsibility",
      final_submit: "Final Submission",
    };
    
    return displayNames[nodeId] || nodeId;
  }
}