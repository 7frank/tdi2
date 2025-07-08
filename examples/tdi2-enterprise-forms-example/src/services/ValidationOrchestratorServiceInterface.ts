/**
 * Interface for orchestrating complex validation workflows with reactive streams
 * Handles client-side, server-side, and cross-field validation using RxJS
 */

import { Observable, BehaviorSubject } from 'rxjs';

export interface ValidationOrchestratorServiceInterface {
  state: {
    /** Map of active validation operations by request ID */
    activeValidations: Map<string, Observable<ValidationResult>>;
    
    /** Cache of validation results by cache key */
    validationCache: Map<string, ValidationResult>;
    
    /** Map of JSON schemas loaded from server by node ID */
    serverSchemas: Map<string, JSONSchema>;
    
    /** Map of validation rules by node ID */
    validationRules: Map<string, ValidationRuleSet>;
    
    /** Global validation state */
    globalValidationState: GlobalValidationState;
    
    /** Real-time validation statistics */
    validationStats: ValidationStats;
  };

  // Core Validation Operations
  
  /**
   * Validate a specific node with its current data
   * Returns an observable that emits validation results
   * @param nodeId - Node to validate
   * @param data - Data to validate
   * @param options - Validation options
   * @returns Observable stream of validation results
   */
  validateNode(nodeId: string, data: any, options?: ValidationOptions): Observable<ValidationResult>;
  
  /**
   * Queue a validation operation with debouncing
   * Useful for real-time validation during user input
   * @param nodeId - Node to validate
   * @param data - Data to validate
   * @param debounceMs - Debounce delay in milliseconds
   */
  queueValidation(nodeId: string, data: any, debounceMs?: number): void;
  
  /**
   * Validate multiple nodes in parallel
   * @param validationRequests - Array of validation requests
   * @returns Observable that emits results as each validation completes
   */
  validateMultipleNodes(validationRequests: ValidationRequest[]): Observable<NodeValidationResult>;
  
  /**
   * Perform cross-field validation across multiple nodes
   * @param fieldMappings - Fields to validate together
   * @param allFormData - Complete form data
   * @returns Observable of cross-validation results
   */
  validateCrossFields(
    fieldMappings: CrossFieldMapping[], 
    allFormData: Record<string, any>
  ): Observable<CrossValidationResult>;
  
  /**
   * Cancel an active validation operation
   * @param validationId - ID of validation to cancel
   */
  cancelValidation(validationId: string): void;
  
  /**
   * Cancel all active validations
   */
  cancelAllValidations(): void;
  
  // Schema Management
  
  /**
   * Preload JSON schemas for specified nodes
   * Improves performance by loading schemas before they're needed
   * @param nodeIds - Array of node IDs to preload schemas for
   * @returns Promise that resolves when all schemas are loaded
   */
  preloadSchemas(nodeIds: string[]): Promise<void>;
  
  /**
   * Get JSON schema for a specific node
   * @param nodeId - Node to get schema for
   * @returns Promise resolving to the JSON schema
   */
  getSchema(nodeId: string): Promise<JSONSchema>;
  
  /**
   * Update the schema for a node (for dynamic form scenarios)
   * @param nodeId - Node to update schema for
   * @param schema - New JSON schema
   */
  updateSchema(nodeId: string, schema: JSONSchema): void;
  
  /**
   * Clear cached schema for a node
   * @param nodeId - Node to clear schema for
   */
  clearSchema(nodeId: string): void;
  
  // Validation Rules Management
  
  /**
   * Register custom validation rules for a node
   * @param nodeId - Node to register rules for
   * @param rules - Validation rule set
   */
  registerValidationRules(nodeId: string, rules: ValidationRuleSet): void;
  
  /**
   * Get validation rules for a node
   * @param nodeId - Node to get rules for
   * @returns Validation rule set or null if none registered
   */
  getValidationRules(nodeId: string): ValidationRuleSet | null;
  
  /**
   * Add a custom validation rule to existing rule set
   * @param nodeId - Node to add rule to
   * @param rule - Validation rule to add
   */
  addValidationRule(nodeId: string, rule: ValidationRule): void;
  
  /**
   * Remove a validation rule from a node
   * @param nodeId - Node to remove rule from
   * @param ruleId - ID of rule to remove
   */
  removeValidationRule(nodeId: string, ruleId: string): void;
  
  // Cache Management
  
  /**
   * Clear validation cache for a specific node
   * @param nodeId - Node to clear cache for (optional, clears all if not provided)
   */
  clearValidationCache(nodeId?: string): void;
  
  /**
   * Get cached validation result
   * @param cacheKey - Cache key to lookup
   * @returns Cached validation result or null if not found
   */
  getCachedValidation(cacheKey: string): ValidationResult | null;
  
  /**
   * Set validation result in cache
   * @param cacheKey - Cache key to store under
   * @param result - Validation result to cache
   * @param ttlMs - Time to live in milliseconds (optional)
   */
  setCachedValidation(cacheKey: string, result: ValidationResult, ttlMs?: number): void;
  
  /**
   * Generate cache key for a validation request
   * @param nodeId - Node being validated
   * @param data - Data being validated
   * @returns Generated cache key
   */
  generateCacheKey(nodeId: string, data: any): string;
  
  // Real-time Validation Streams
  
  /**
   * Create a real-time validation stream for a field
   * Emits validation results as the user types
   * @param nodeId - Node containing the field
   * @param fieldPath - Path to the field
   * @param inputStream - Observable of user input
   * @returns Observable of validation results
   */
  createFieldValidationStream(
    nodeId: string, 
    fieldPath: string, 
    inputStream: Observable<any>
  ): Observable<FieldValidationResult>;
  
  /**
   * Create a validation stream that validates when any dependency changes
   * @param nodeId - Node to validate
   * @param dependencies - Array of field paths that trigger validation
   * @param formDataStream - Observable of complete form data
   * @returns Observable of validation results
   */
  createDependentValidationStream(
    nodeId: string, 
    dependencies: string[], 
    formDataStream: Observable<Record<string, any>>
  ): Observable<ValidationResult>;
  
  /**
   * Subscribe to validation state changes
   * @param callback - Function to call when validation state changes
   * @returns Unsubscribe function
   */
  onValidationStateChange(callback: (state: GlobalValidationState) => void): () => void;
  
  // Batch Operations
  
  /**
   * Process a batch of validation requests efficiently
   * @param requests - Array of validation requests
   * @returns Promise resolving to map of results by request ID
   */
  processBatchValidation(requests: ValidationRequest[]): Promise<Map<string, ValidationResult>>;
  
  /**
   * Validate entire form across all nodes
   * @param formData - Complete form data
   * @param options - Validation options
   * @returns Observable of overall validation result
   */
  validateEntireForm(
    formData: Record<string, any>, 
    options?: FormValidationOptions
  ): Observable<FormValidationResult>;
  
  // Error Handling and Recovery
  
  /**
   * Retry a failed validation with exponential backoff
   * @param validationId - ID of validation to retry
   * @param maxRetries - Maximum number of retry attempts
   * @returns Observable of retry results
   */
  retryValidation(validationId: string, maxRetries?: number): Observable<ValidationResult>;
  
  /**
   * Handle validation errors gracefully
   * @param error - Error that occurred during validation
   * @param context - Context information about the validation
   * @returns Fallback validation result
   */
  handleValidationError(error: any, context: ValidationContext): ValidationResult;
  
  /**
   * Get validation performance metrics
   * @returns Current performance statistics
   */
  getPerformanceMetrics(): ValidationPerformanceMetrics;
}

// Supporting Types

export interface ValidationRequest {
  /** Unique identifier for this validation request */
  id: string;
  
  /** Node being validated */
  nodeId: string;
  
  /** Data to validate */
  data: any;
  
  /** Validation options */
  options?: ValidationOptions;
  
  /** Priority level for processing */
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationOptions {
  /** Whether to include server-side validation */
  includeServerValidation?: boolean;
  
  /** Whether to use cached results if available */
  useCache?: boolean;
  
  /** Timeout for validation operations in milliseconds */
  timeoutMs?: number;
  
  /** Whether to perform deep validation of nested objects */
  deepValidation?: boolean;
  
  /** Context data for validation rules */
  context?: Record<string, any>;
  
  /** Whether to validate dependencies */
  validateDependencies?: boolean;
}

export interface FormValidationOptions extends ValidationOptions {
  /** Whether to stop at first error or collect all errors */
  stopOnFirstError?: boolean;
  
  /** Nodes to skip during validation */
  skipNodes?: string[];
  
  /** Whether to validate cross-field rules */
  includeCrossFieldValidation?: boolean;
}

export interface NodeValidationResult {
  /** Node that was validated */
  nodeId: string;
  
  /** Validation result */
  result: ValidationResult;
  
  /** Duration of validation in milliseconds */
  durationMs: number;
  
  /** Whether result came from cache */
  fromCache: boolean;
}

export interface CrossFieldMapping {
  /** Fields involved in cross-validation */
  fields: string[];
  
  /** Validation rule to apply across these fields */
  rule: CrossFieldValidationRule;
  
  /** Error message template for failures */
  errorMessage: string;
  
  /** Unique identifier for this mapping */
  id: string;
}

export interface CrossFieldValidationRule {
  /** Type of cross-field validation */
  type: 'dependency' | 'mutual_exclusion' | 'conditional_required' | 
        'data_consistency' | 'business_rule' | 'custom';
  
  /** Parameters for the validation rule */
  parameters: Record<string, any>;
  
  /** Custom validation function (for 'custom' type) */
  validationFunction?: (values: Record<string, any>) => ValidationResult;
}

export interface CrossValidationResult {
  /** Whether cross-validation passed */
  isValid: boolean;
  
  /** Fields that failed validation */
  failedFields: string[];
  
  /** Cross-validation errors */
  errors: CrossValidationError[];
  
  /** Warnings from cross-validation */
  warnings: CrossValidationWarning[];
}

export interface CrossValidationError {
  /** Error message */
  message: string;
  
  /** Fields involved in the error */
  fields: string[];
  
  /** Rule that failed */
  ruleId: string;
  
  /** Error code */
  code: string;
}

export interface CrossValidationWarning {
  /** Warning message */
  message: string;
  
  /** Fields involved in the warning */
  fields: string[];
  
  /** Rule that generated warning */
  ruleId: string;
}

export interface FieldValidationResult {
  /** Field that was validated */
  fieldPath: string;
  
  /** Whether field is valid */
  isValid: boolean;
  
  /** Field-specific errors */
  errors: string[];
  
  /** Field-specific warnings */
  warnings: string[];
  
  /** Suggested corrections */
  suggestions: string[];
}

export interface ValidationRuleSet {
  /** Node this rule set applies to */
  nodeId: string;
  
  /** Individual validation rules */
  rules: ValidationRule[];
  
  /** Cross-field rules within this node */
  crossFieldRules: CrossFieldValidationRule[];
  
  /** Rule execution order */
  executionOrder: string[];
}

export interface ValidationRule {
  /** Unique identifier for the rule */
  id: string;
  
  /** Field or fields this rule applies to */
  fields: string[];
  
  /** Rule type */
  type: 'required' | 'format' | 'range' | 'custom' | 'async' | 'conditional';
  
  /** Rule parameters */
  parameters: Record<string, any>;
  
  /** Error message template */
  errorMessage: string;
  
  /** Warning message template (for non-blocking validations) */
  warningMessage?: string;
  
  /** Whether this rule is blocking (prevents form submission) */
  isBlocking: boolean;
  
  /** Conditions under which this rule applies */
  conditions?: ValidationCondition[];
  
  /** Custom validation function */
  validationFunction?: (value: any, context: ValidationContext) => ValidationResult | Promise<ValidationResult>;
}

export interface ValidationCondition {
  /** Field to check condition against */
  field: string;
  
  /** Condition operator */
  operator: 'equals' | 'not_equals' | 'exists' | 'not_exists' | 'greater_than' | 'less_than';
  
  /** Value to compare against */
  value: any;
}

export interface ValidationContext {
  /** Node being validated */
  nodeId: string;
  
  /** Complete form data */
  formData: Record<string, any>;
  
  /** User information */
  user?: {
    id: string;
    roles: string[];
    permissions: string[];
  };
  
  /** External validation context */
  external?: Record<string, any>;
  
  /** Validation timestamp */
  timestamp: Date;
}

export interface GlobalValidationState {
  /** Total number of validations in progress */
  activeValidationCount: number;
  
  /** Overall validation status */
  overallStatus: 'valid' | 'invalid' | 'validating' | 'unknown';
  
  /** Nodes currently being validated */
  validatingNodes: string[];
  
  /** Nodes with validation errors */
  invalidNodes: string[];
  
  /** Nodes that have been validated successfully */
  validNodes: string[];
  
  /** Last validation timestamp */
  lastValidationTime: Date;
  
  /** Whether any validations have failed */
  hasErrors: boolean;
  
  /** Whether any validations have warnings */
  hasWarnings: boolean;
}

export interface ValidationStats {
  /** Total validations performed */
  totalValidations: number;
  
  /** Successful validations */
  successfulValidations: number;
  
  /** Failed validations */
  failedValidations: number;
  
  /** Average validation time in milliseconds */
  averageValidationTimeMs: number;
  
  /** Cache hit rate percentage */
  cacheHitRate: number;
  
  /** Validations per minute */
  validationsPerMinute: number;
  
  /** Most recent validation errors */
  recentErrors: ValidationError[];
}

export interface FormValidationResult {
  /** Whether entire form is valid */
  isValid: boolean;
  
  /** Overall validation status */
  status: 'valid' | 'invalid' | 'validating' | 'partial';
  
  /** Results by node ID */
  nodeResults: Map<string, ValidationResult>;
  
  /** Cross-field validation results */
  crossFieldResults: CrossValidationResult[];
  
  /** Summary of all errors */
  allErrors: ValidationError[];
  
  /** Summary of all warnings */
  allWarnings: ValidationWarning[];
  
  /** Nodes that can be submitted */
  submittableNodes: string[];
  
  /** Nodes that block submission */
  blockingNodes: string[];
}

export interface ValidationPerformanceMetrics {
  /** Average response time for client validations */
  clientValidationAvgMs: number;
  
  /** Average response time for server validations */
  serverValidationAvgMs: number;
  
  /** Cache hit rate */
  cacheHitRate: number;
  
  /** Number of concurrent validations */
  concurrentValidations: number;
  
  /** Memory usage for validation cache */
  cacheMemoryUsageMB: number;
  
  /** Total validations in last hour */
  validationsLastHour: number;
  
  /** Error rate percentage */
  errorRate: number;
}

export interface JSONSchema {
  /** Schema version */
  $schema?: string;
  
  /** Schema ID */
  $id?: string;
  
  /** Schema title */
  title?: string;
  
  /** Schema description */
  description?: string;
  
  /** Data type */
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  
  /** Object properties */
  properties?: Record<string, JSONSchema>;
  
  /** Required properties */
  required?: string[];
  
  /** Additional properties allowed */
  additionalProperties?: boolean | JSONSchema;
  
  /** Property patterns */
  patternProperties?: Record<string, JSONSchema>;
  
  /** Array items schema */
  items?: JSONSchema | JSONSchema[];
  
  /** Minimum array length */
  minItems?: number;
  
  /** Maximum array length */
  maxItems?: number;
  
  /** String pattern */
  pattern?: string;
  
  /** Minimum string length */
  minLength?: number;
  
  /** Maximum string length */
  maxLength?: number;
  
  /** Numeric minimum */
  minimum?: number;
  
  /** Numeric maximum */
  maximum?: number;
  
  /** Enumeration values */
  enum?: any[];
  
  /** Constant value */
  const?: any;
  
  /** Schema composition */
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  
  /** Conditional schema */
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;
}