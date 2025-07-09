// Issue: Insurance form isn't completing properly
// Problem: The form validation and submission logic needs to be synchronized

// 1. Updated InsuranceFormService with proper submission completion
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
      checkingProgress: number;
      lastCheckDuration: number;
    };
    validationResults: ValidationResult | null;
    isSubmitting: boolean;
    isDirty: boolean;
    showEligibilityDetails: boolean;
    eligibilityStatusAnimation: boolean;

    // 🔧 FIX: Add submission completion tracking
    isSubmissionComplete: boolean;
    submissionError: string | null;
  };

  updateField(field: string, value: any): void;
  checkEligibility(): Promise<string>;
  validateForm(): Promise<ValidationResult>;
  submitForm(): Promise<void>;
  resetForm(): void;
  toggleEligibilityDetails(): void;
  resetEligibilityCheck(): void;

  // 🔧 FIX: Add validation check method
  canSubmitForm(): boolean;
}

@Service()
export class InsuranceFormService implements InsuranceFormServiceInterface {
  state = {
    formData: {} as Partial<InsuranceInformation>,
    eligibilityCheck: {
      isChecking: false,
      lastChecked: null as Date | null,
      result: null as "pending" | "verified" | "denied" | null,
      checkingProgress: 0,
      lastCheckDuration: 0,
    },
    validationResults: null as ValidationResult | null,
    isSubmitting: false,
    isDirty: false,
    showEligibilityDetails: false,
    eligibilityStatusAnimation: false,

    // 🔧 FIX: Track submission state
    isSubmissionComplete: false,
    submissionError: null as string | null,
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
    this.state.isSubmissionComplete = false; // 🔧 FIX: Reset completion on change
    this.state.submissionError = null;

    // Reset eligibility if key fields change
    if (
      field.includes("primaryInsurance.provider") ||
      field.includes("primaryInsurance.memberId")
    ) {
      this.resetEligibilityCheck();
    }

    // 🔧 FIX: Auto-validate on field change
    this.validateForm();
  }

  async checkEligibility(): Promise<string> {
    const startTime = Date.now();

    this.state.eligibilityCheck.isChecking = true;
    this.state.eligibilityCheck.result = "pending";
    this.state.eligibilityCheck.checkingProgress = 0;

    const progressInterval = setInterval(() => {
      if (this.state.eligibilityCheck.checkingProgress < 90) {
        this.state.eligibilityCheck.checkingProgress += 10;
      }
    }, 200);

    try {
      // Simulate API call with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = "verified";

      this.state.eligibilityCheck.isChecking = false;
      this.state.eligibilityCheck.lastChecked = new Date();
      this.state.eligibilityCheck.result = result as any;
      this.state.eligibilityCheck.checkingProgress = 100;
      this.state.eligibilityCheck.lastCheckDuration = Date.now() - startTime;

      // Update form data with result
      if (!this.state.formData.primaryInsurance) {
        this.state.formData.primaryInsurance = {} as any;
      }
      this.state.formData.eligibilityStatus = result as any;

      this.state.eligibilityStatusAnimation = true;
      setTimeout(() => {
        this.state.eligibilityStatusAnimation = false;
      }, 1000);

      // 🔧 FIX: Re-validate after eligibility check
      await this.validateForm();

      return result;
    } catch (error) {
      this.state.eligibilityCheck.isChecking = false;
      this.state.eligibilityCheck.result = "denied";
      this.state.eligibilityCheck.checkingProgress = 0;
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

  // 🔧 TARGETED FIX: Replace the submitForm method in InsuranceFormService

  async submitForm(): Promise<void> {
    this.state.isSubmitting = true;
    this.state.submissionError = null;

    try {
      // 🔧 FIX: Use the SAME validation logic as canSubmitForm()
      const hasValidation = this.state.validationResults;
      const isFormValid = hasValidation && this.state.validationResults.isValid;
      const isEligibilityVerified =
        this.state.eligibilityCheck.result === "verified";
      const hasRequiredData =
        this.state.formData.primaryInsurance?.provider &&
        this.state.formData.primaryInsurance?.memberId &&
        this.state.formData.primaryInsurance?.planType &&
        this.state.formData.primaryInsurance?.groupNumber &&
        this.state.formData.primaryInsurance?.effectiveDate;

      // 🔧 FIX: Check each requirement individually with specific error messages
      if (!isFormValid) {
        const validationResult = await this.validateForm();
        if (!validationResult.isValid) {
          throw new Error(
            `Validation failed: ${validationResult.errors.map((e) => e.message).join(", ")}`
          );
        }
      }

      if (!isEligibilityVerified) {
        throw new Error(
          "Insurance eligibility must be verified before submission"
        );
      }

      if (!hasRequiredData) {
        const missing = [];
        if (!this.state.formData.primaryInsurance?.provider)
          missing.push("Provider");
        if (!this.state.formData.primaryInsurance?.memberId)
          missing.push("Member ID");
        if (!this.state.formData.primaryInsurance?.planType)
          missing.push("Plan Type");
        if (!this.state.formData.primaryInsurance?.groupNumber)
          missing.push("Group Number");
        if (!this.state.formData.primaryInsurance?.effectiveDate)
          missing.push("Effective Date");
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
      }

      // 🔧 FIX: All checks passed, proceed with submission
      console.log("✅ All validation checks passed, submitting form...");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 🔧 FIX: Mark as successfully submitted
      this.state.isDirty = false;
      this.state.isSubmissionComplete = true;

      console.log(
        "✅ Insurance form submitted successfully:",
        this.state.formData
      );
    } catch (error) {
      this.state.submissionError = error.message;
      console.error("❌ Insurance form submission failed:", error);
      throw error;
    } finally {
      this.state.isSubmitting = false;
    }
  }

  // 🔧 FIX: Also update canSubmitForm to be more explicit
  canSubmitForm(): boolean {
    // Check validation state
    const hasValidation = this.state.validationResults;
    const isFormValid = hasValidation && this.state.validationResults.isValid;

    // Check eligibility
    const isEligibilityVerified =
      this.state.eligibilityCheck.result === "verified";

    // Check required data
    const hasRequiredData =
      this.state.formData.primaryInsurance?.provider &&
      this.state.formData.primaryInsurance?.memberId &&
      this.state.formData.primaryInsurance?.planType &&
      this.state.formData.primaryInsurance?.groupNumber &&
      this.state.formData.primaryInsurance?.effectiveDate;

    // Not currently submitting
    const notSubmitting = !this.state.isSubmitting;

    // Log for debugging
    console.log("🔧 canSubmitForm check:", {
      hasValidation,
      isFormValid,
      isEligibilityVerified,
      hasRequiredData,
      notSubmitting,
      result: !!(
        isFormValid &&
        isEligibilityVerified &&
        hasRequiredData &&
        notSubmitting
      ),
    });

    return !!(
      isFormValid &&
      isEligibilityVerified &&
      hasRequiredData &&
      notSubmitting
    );
  }

  resetForm(): void {
    this.state.formData = {};
    this.state.eligibilityCheck = {
      isChecking: false,
      lastChecked: null,
      result: null,
      checkingProgress: 0,
      lastCheckDuration: 0,
    };
    this.state.validationResults = null;
    this.state.isDirty = false;
    this.state.showEligibilityDetails = false;
    this.state.eligibilityStatusAnimation = false;
    this.state.isSubmissionComplete = false; // 🔧 FIX: Reset completion
    this.state.submissionError = null;
  }

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
