import { Service, Inject } from "@tdi2/di-core/decorators";
import { BehaviorSubject, Observable, of, delay, map } from "rxjs";
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
    };
    validationResults: ValidationResult | null;
    isSubmitting: boolean;
    isDirty: boolean;
  };

  updateField(field: string, value: any): void;
  checkEligibility(): Observable<string>;
  validateForm(): Promise<ValidationResult>;
  submitForm(): Promise<void>;
  resetForm(): void;
}

@Service()
export class InsuranceFormService implements InsuranceFormServiceInterface {
  state = {
    formData: {} as Partial<InsuranceInformation>,
    eligibilityCheck: {
      isChecking: false,
      lastChecked: null as Date | null,
      result: null as "pending" | "verified" | "denied" | null,
    },
    validationResults: null as ValidationResult | null,
    isSubmitting: false,
    isDirty: false,
  };

  private formData$ = new BehaviorSubject<Partial<InsuranceInformation>>({});

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
    this.formData$.next(newData);
  }

  checkEligibility(): Observable<string> {
    this.state.eligibilityCheck.isChecking = true;
    this.state.eligibilityCheck.result = "pending";

    // Simulate API call with realistic delay
    return of("verified").pipe(
      delay(2000),
      map((result) => {
        this.state.eligibilityCheck.isChecking = false;
        this.state.eligibilityCheck.lastChecked = new Date();
        this.state.eligibilityCheck.result = result as any;

        // Update form data with result
        if (!this.state.formData.primaryInsurance) {
          this.state.formData.primaryInsurance = {} as any;
        }
        this.state.formData.eligibilityStatus = result as any;

        return result;
      })
    );
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
    };
    this.state.validationResults = null;
    this.state.isDirty = false;
    this.formData$.next({});
  }
}
