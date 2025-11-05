import { Service } from "@tdi2/di-core/decorators";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { ValidationResult, ValidationError } from "../types/form-models";

export interface ValidationOrchestratorServiceInterface {
  state: {
    validationCache: Map<string, ValidationResult>;
    schemaCache: Map<string, any>;
    activeValidations: Set<string>;

    // 🎨 VIEW STATE: Validation UI feedback (could be in components)
    lastValidationTime: Date | null;
    validationStats: {
      totalValidations: number;
      successfulValidations: number;
      failedValidations: number;
      averageValidationTime: number;
    };
    isValidationInProgress: boolean;
    recentValidationResults: Array<{
      nodeId: string;
      timestamp: Date;
      success: boolean;
      errorCount: number;
    }>;
  };

  validateWithSchema(nodeId: string, data: any, schema: any): ValidationResult;
  clearValidationCache(nodeId?: string): void;
  preloadSchemas(schemas: Record<string, any>): void;

  // 🎨 VIEW STATE: Validation analytics for UI
  getValidationSummary(): string;
  getValidationHistory(
    nodeId?: string
  ): Array<{ nodeId: string; timestamp: Date; success: boolean }>;
  resetValidationStats(): void;
}

@Service()
export class ValidationOrchestratorService
  implements ValidationOrchestratorServiceInterface
{
  state = {
    validationCache: new Map<string, ValidationResult>(),
    schemaCache: new Map<string, any>(),
    activeValidations: new Set<string>(),

    // 🎨 VIEW STATE: Validation analytics and feedback
    lastValidationTime: null as Date | null,
    validationStats: {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
    },
    isValidationInProgress: false,
    recentValidationResults: [] as Array<{
      nodeId: string;
      timestamp: Date;
      success: boolean;
      errorCount: number;
    }>,
  };

  private ajv: Ajv;
  private validationTimings: number[] = [];

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  validateWithSchema(nodeId: string, data: any, schema: any): ValidationResult {
    const startTime = Date.now();
    const cacheKey = `${nodeId}-${JSON.stringify(data)}`;

    // Check cache first
    if (this.state.validationCache.has(cacheKey)) {
      return this.state.validationCache.get(cacheKey)!;
    }

    // 🎨 VIEW STATE: Track validation progress
    this.state.isValidationInProgress = true;
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

      // 🎨 VIEW STATE: Update validation analytics
      this.updateValidationStats(
        nodeId,
        isValid,
        errors.length,
        Date.now() - startTime
      );

      return result;
    } finally {
      this.state.activeValidations.delete(nodeId);
      this.state.isValidationInProgress = this.state.activeValidations.size > 0;
      this.state.lastValidationTime = new Date(); // 🎨 VIEW STATE
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

  // 🎨 VIEW STATE: Validation analytics methods
  getValidationSummary(): string {
    const { totalValidations, successfulValidations, failedValidations } =
      this.state.validationStats;

    if (totalValidations === 0) {
      return "No validations performed yet";
    }

    const successRate = Math.round(
      (successfulValidations / totalValidations) * 100
    );
    return `${totalValidations} validations, ${successRate}% success rate`;
  }

  getValidationHistory(
    nodeId?: string
  ): Array<{ nodeId: string; timestamp: Date; success: boolean }> {
    if (nodeId) {
      return this.state.recentValidationResults
        .filter((result) => result.nodeId === nodeId)
        .slice(-10) // Last 10 validations for the node
        .map((result) => ({
          nodeId: result.nodeId,
          timestamp: result.timestamp,
          success: result.success,
        }));
    }

    return this.state.recentValidationResults
      .slice(-20) // Last 20 validations overall
      .map((result) => ({
        nodeId: result.nodeId,
        timestamp: result.timestamp,
        success: result.success,
      }));
  }

  resetValidationStats(): void {
    this.state.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
    };
    this.state.recentValidationResults = [];
    this.validationTimings = [];
  }

  private updateValidationStats(
    nodeId: string,
    success: boolean,
    errorCount: number,
    duration: number
  ): void {
    // Update overall stats
    this.state.validationStats.totalValidations++;
    if (success) {
      this.state.validationStats.successfulValidations++;
    } else {
      this.state.validationStats.failedValidations++;
    }

    // Update average timing
    this.validationTimings.push(duration);
    if (this.validationTimings.length > 100) {
      this.validationTimings.shift(); // Keep only last 100 timings
    }
    this.state.validationStats.averageValidationTime =
      this.validationTimings.reduce((sum, time) => sum + time, 0) /
      this.validationTimings.length;

    // Add to recent results
    this.state.recentValidationResults.push({
      nodeId,
      timestamp: new Date(),
      success,
      errorCount,
    });

    // Keep only last 50 results
    if (this.state.recentValidationResults.length > 50) {
      this.state.recentValidationResults.shift();
    }
  }
}
