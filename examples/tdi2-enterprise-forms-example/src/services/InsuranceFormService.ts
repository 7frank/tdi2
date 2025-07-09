import { Service, Inject } from "@tdi2/di-core/decorators";
import type {
  InsuranceInformation,
  ValidationResult,
} from "../types/form-models";
import type { ValidationOrchestratorServiceInterface } from "./ValidationOrchestratorService";

export interface InsuranceFormServiceInterface {
  state: {
    formData: Partial<InsuranceInformation>;
    eligibilityCheck: {
      isChecking: boolean;
      lastChecked: Date | null;
      result: "pending" | "verified" | "denied" | null;
      // 🎨 VIEW STATE: UI feedback states
      checkingProgress: number; // 0-100 for progress bar
      lastCheckDuration: number; // milliseconds for UI feedback
    };
    validationResults: ValidationResult | null;
    isSubmitting: boolean;
    isDirty: boolean;
    
    // 🎨 VIEW STATE: Form UI states that could be in component
    showEligibilityDetails: boolean;
    eligibilityStatusAnimation: boolean;
  };

  updateField(field: string, value: any): void;
  checkEligibility(): Promise<string>;
  validateForm(): Promise<ValidationResult>;
  submitForm(): Promise<void>;
  resetForm(): void;
  
  // 🎨 VIEW STATE: UI-specific methods
  toggleEligibilityDetails(): void;
  resetEligibilityCheck(): void;
}

@Service()
export class InsuranceFormService implements InsuranceFormServiceInterface {
  state = {
    formData: {} as Partial<InsuranceInformation>,
    eligibilityCheck: {
      isChecking: false,
      lastChecked: null as Date | null,
      result: null as "pending" | "verified" | "denied" | null,
      // 🎨 VIEW STATE: UI feedback
      checkingProgress: 0,
      lastCheckDuration: 0,
    },
    validationResults: null as ValidationResult | null,
    isSubmitting: false,
    isDirty: false,
    
    // 🎨 VIEW STATE: Could be moved to component but kept here for consistency
    showEligibilityDetails: false,
    eligibilityStatusAnimation: false,
  };

  constructor(
    @Inject()
    private validationOrchestrator: ValidationOrchestratorServiceInterface
  ) {}

  updateField(field: string, value: any): void {
    const keys = field.split(".");
    const newData = { ...this.state.formData };

    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    this.state.formData = newData;
    this.state.isDirty = true;
    
    // Reset eligibility if key fields change
    if (field.includes('primaryInsurance.provider') || field.includes('primaryInsurance.memberId')) {
      this.resetEligibilityCheck();
    }
  }

  async checkEligibility(): Promise<string> {
    const startTime = Date.now();
    
    this.state.eligibilityCheck.isChecking = true;
    this.state.eligibilityCheck.result = "pending";
    this.state.eligibilityCheck.checkingProgress = 0; // 🎨 VIEW STATE
    
    // 🎨 VIEW STATE: Simulate progress for UI feedback
    const progressInterval = setInterval(() => {
      if (this.state.eligibilityCheck.checkingProgress < 90) {
        this.state.eligibilityCheck.checkingProgress += 10;
      }
    }, 200);

    try {
      // Simulate API call with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulate response (in real app, this would be actual API call)
      const result = "verified";
      
      this.state.eligibilityCheck.isChecking = false;
      this.state.eligibilityCheck.lastChecked = new Date();
      this.state.eligibilityCheck.result = result as any;
      this.state.eligibilityCheck.checkingProgress = 100; // 🎨 VIEW STATE
      this.state.eligibilityCheck.lastCheckDuration = Date.now() - startTime; // 🎨 VIEW STATE

      // Update form data with result
      if (!this.state.formData.primaryInsurance) {
        this.state.formData.primaryInsurance = {} as any;
      }
      this.state.formData.eligibilityStatus = result as any;

      // 🎨 VIEW STATE: Trigger success animation
      this.state.eligibilityStatusAnimation = true;
      setTimeout(() => {
        this.state.eligibilityStatusAnimation = false;
      }, 1000);

      return result;
    } catch (error) {
      this.state.eligibilityCheck.isChecking = false;
      this.state.eligibilityCheck.result = "denied";
      this.state.eligibilityCheck.checkingProgress = 0; // 🎨 VIEW STATE
      throw error;
    } finally {
      clearInterval(progressInterval);
    }
  }

  async validateForm(): Promise<ValidationResult> {
    const schema = {
      type: "object",
      required: ["primaryInsurance"],
      properties: {
        primaryInsurance: {
          type: "object",
          required: [
            "provider",
            "planType",
            "memberId",
            "groupNumber",
            "effectiveDate",
          ],
          properties: {
            provider: { type: "string", minLength: 1 },
            planType: {
              type: "string",
              enum: ["HMO", "PPO", "EPO", "POS", "HDHP"],
            },
            memberId: { type: "string", minLength: 1 },
            groupNumber: { type: "string", minLength: 1 },
            effectiveDate: {
              type: "string",
              pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            },
            copay: { type: "number", minimum: 0 },
            deductible: { type: "number", minimum: 0 },
          },
        },
        eligibilityStatus: {
          type: "string",
          enum: ["pending", "verified", "denied", "expired"],
        },
      },
    };

    const result = this.validationOrchestrator.validateWithSchema(
      "insurance",
      this.state.formData,
      schema
    );

    this.state.validationResults = result;
    return result;
  }

  async submitForm(): Promise<void> {
    this.state.isSubmitting = true;

    try {
      const validationResult = await this.validateForm();
      if (!validationResult.isValid) {
        throw new Error("Validation failed");
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.state.isDirty = false;
    } finally {
      this.state.isSubmitting = false;
    }
  }

  resetForm(): void {
    this.state.formData = {};
    this.state.eligibilityCheck = {
      isChecking: false,
      lastChecked: null,
      result: null,
      checkingProgress: 0, // 🎨 VIEW STATE
      lastCheckDuration: 0, // 🎨 VIEW STATE
    };
    this.state.validationResults = null;
    this.state.isDirty = false;
    this.state.showEligibilityDetails = false; // 🎨 VIEW STATE
    this.state.eligibilityStatusAnimation = false; // 🎨 VIEW STATE
  }

  // 🎨 VIEW STATE: UI-specific methods
  toggleEligibilityDetails(): void {
    this.state.showEligibilityDetails = !this.state.showEligibilityDetails;
  }

  resetEligibilityCheck(): void {
    this.state.eligibilityCheck.result = null;
    this.state.eligibilityCheck.lastChecked = null;
    this.state.eligibilityCheck.checkingProgress = 0;
    this.state.eligibilityStatusAnimation = false;
  }
}