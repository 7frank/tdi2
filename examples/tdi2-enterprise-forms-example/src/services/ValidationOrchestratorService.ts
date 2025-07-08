import { Service } from "@tdi2/di-core/decorators";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { ValidationResult, ValidationError } from "../types/form-models";

export interface ValidationOrchestratorServiceInterface {
  state: {
    validationCache: Map<string, ValidationResult>;
    schemaCache: Map<string, any>;
    activeValidations: Set<string>;
  };

  validateWithSchema(nodeId: string, data: any, schema: any): ValidationResult;
  clearValidationCache(nodeId?: string): void;
  preloadSchemas(schemas: Record<string, any>): void;
}

@Service()
export class ValidationOrchestratorService
  implements ValidationOrchestratorServiceInterface
{
  state = {
    validationCache: new Map<string, ValidationResult>(),
    schemaCache: new Map<string, any>(),
    activeValidations: new Set<string>(),
  };

  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  validateWithSchema(nodeId: string, data: any, schema: any): ValidationResult {
    const cacheKey = `${nodeId}-${JSON.stringify(data)}`;

    // Check cache first
    if (this.state.validationCache.has(cacheKey)) {
      return this.state.validationCache.get(cacheKey)!;
    }

    this.state.activeValidations.add(nodeId);

    try {
      const validate = this.ajv.compile(schema);
      const isValid = validate(data);

      const errors: ValidationError[] = isValid
        ? []
        : (validate.errors || []).map((error) => ({
            field: error.instancePath || error.dataPath || "unknown",
            message: error.message || "Validation error",
            code: error.keyword || "validation_error",
            severity: "error" as const,
          }));

      const result: ValidationResult = {
        isValid,
        errors,
        warnings: [],
        timestamp: new Date(),
      };

      // Cache the result
      this.state.validationCache.set(cacheKey, result);

      return result;
    } finally {
      this.state.activeValidations.delete(nodeId);
    }
  }

  clearValidationCache(nodeId?: string): void {
    if (nodeId) {
      // Clear cache entries for specific node
      const keysToDelete = Array.from(this.state.validationCache.keys()).filter(
        (key) => key.startsWith(`${nodeId}-`)
      );
      keysToDelete.forEach((key) => this.state.validationCache.delete(key));
    } else {
      this.state.validationCache.clear();
    }
  }

  preloadSchemas(schemas: Record<string, any>): void {
    Object.entries(schemas).forEach(([nodeId, schema]) => {
      this.state.schemaCache.set(nodeId, schema);
    });
  }
}
