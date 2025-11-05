import { Service, Inject } from "@tdi2/di-core/decorators";
import type {
  PatientDemographics,
  ValidationResult,
} from "../types/form-models";
import type { ValidationOrchestratorServiceInterface } from "./ValidationOrchestratorService";

export interface DemographicsFormServiceInterface {
  state: {
    formData: Partial<PatientDemographics>;
    validationResults: ValidationResult | null;
    isSubmitting: boolean;
    isDirty: boolean;
    
    // 🎨 VIEW STATE: Could be moved to component, but kept here for cross-form coordination
    lastValidationTime: Date | null;
    validationDebounceActive: boolean;
  };

  updateField(field: string, value: any): void;
  validateForm(): Promise<ValidationResult>;
  submitForm(): Promise<void>;
  resetForm(): void;
  calculateAge(dateOfBirth: string): number;
}

@Service()
export class DemographicsFormService implements DemographicsFormServiceInterface {
  state = {
    formData: {} as Partial<PatientDemographics>,
    validationResults: null as ValidationResult | null,
    isSubmitting: false,
    isDirty: false,
    
    // 🎨 VIEW STATE: UI feedback for validation timing
    lastValidationTime: null as Date | null,
    validationDebounceActive: false,
  };

  private validationTimeout: NodeJS.Timeout | null = null;

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

    // Special handling for date of birth -> age calculation
    if (field === "dateOfBirth" && value) {
      newData.age = this.calculateAge(value);
    }

    this.state.formData = newData;
    this.state.isDirty = true;
    
    // 🎨 VIEW STATE: Debounced validation with UI feedback
    this.state.validationDebounceActive = true;
    
    // Clear existing timeout
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
    
    // Set up debounced validation
    this.validationTimeout = setTimeout(() => {
      this.validateForm();
      this.state.validationDebounceActive = false;
    }, 300);
  }

  async validateForm(): Promise<ValidationResult> {
    const schema = {
      type: "object",
      required: [
        "firstName",
        "lastName",
        "dateOfBirth",
        "ssn",
        "gender",
        "address",
        "phone",
        "email",
      ],
      properties: {
        firstName: { type: "string", minLength: 1, maxLength: 50 },
        lastName: { type: "string", minLength: 1, maxLength: 50 },
        dateOfBirth: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        age: { type: "number", minimum: 0, maximum: 150 },
        ssn: { type: "string", pattern: "^\\d{3}-\\d{2}-\\d{4}$" },
        gender: {
          type: "string",
          enum: ["male", "female", "other", "prefer-not-to-say"],
        },
        address: {
          type: "object",
          required: ["street", "city", "state", "zipCode"],
          properties: {
            street: { type: "string", minLength: 1 },
            city: { type: "string", minLength: 1 },
            state: { type: "string", minLength: 2, maxLength: 2 },
            zipCode: { type: "string", pattern: "^\\d{5}(-\\d{4})?$" },
          },
        },
        phone: { type: "string", pattern: "^\\+?1?\\d{10,14}$" },
        email: { type: "string", format: "email" },
      },
    };

    const result = this.validationOrchestrator.validateWithSchema(
      "demographics",
      this.state.formData,
      schema
    );

    this.state.validationResults = result;
    this.state.lastValidationTime = new Date(); // 🎨 VIEW STATE
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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.state.isDirty = false;
    } finally {
      this.state.isSubmitting = false;
    }
  }

  resetForm(): void {
    this.state.formData = {};
    this.state.validationResults = null;
    this.state.isDirty = false;
    this.state.lastValidationTime = null; // 🎨 VIEW STATE
    this.state.validationDebounceActive = false; // 🎨 VIEW STATE
    
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
      this.validationTimeout = null;
    }
  }

  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }
}