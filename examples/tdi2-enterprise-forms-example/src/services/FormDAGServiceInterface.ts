/**
 * Core interface for managing form workflow as a Directed Acyclic Graph (DAG)
 * Handles node navigation, dependency resolution, and optimal path calculation
 */

export interface FormDAGServiceInterface {
  state: {
    /** Currently active form sections that user can interact with */
    currentNodes: string[];
    
    /** Form sections that have been completed and validated */
    completedNodes: string[];
    
    /** Form sections that are available to start (dependencies met) */
    availableNodes: string[];
    
    /** Form sections that cannot be accessed yet (dependencies not met) */
    blockedNodes: string[];
    
    /** All form data organized by node ID */
    formData: Record<string, any>;
    
    /** Validation results for each node */
    validationResults: Record<string, ValidationResult>;
    
    /** Current overall progress percentage */
    progressPercentage: number;
    
    /** Whether the entire form can be submitted */
    canSubmit: boolean;
  };

  // Core DAG Operations
  
  /**
   * Mark a node as completed after successful validation
   * Triggers dependency resolution for dependent nodes
   */
  completeNode(nodeId: string): Promise<void>;
  
  /**
   * Set a node as currently active for user interaction
   * Validates that the node is accessible
   */
  setCurrentNode(nodeId: string): void;
  
  /**
   * Add a node to currently active nodes (for parallel completion)
   */
  addCurrentNode(nodeId: string): void;
  
  /**
   * Remove a node from currently active nodes
   */
  removeCurrentNode(nodeId: string): void;
  
  // Node Accessibility
  
  /**
   * Check if a node can be accessed based on its dependencies
   * @param nodeId - The node to check
   * @returns true if all dependencies are met and conditions satisfied
   */
  canAccessNode(nodeId: string): boolean;
  
  /**
   * Get all nodes that are currently available to start
   * @returns Array of node IDs that can be activated
   */
  getAvailableNodes(): string[];
  
  /**
   * Get direct dependencies for a specific node
   * @param nodeId - The node to get dependencies for
   * @returns Array of node IDs that must be completed first
   */
  getNodeDependencies(nodeId: string): string[];
  
  /**
   * Get all nodes that depend on the given node
   * @param nodeId - The node to get dependents for
   * @returns Array of node IDs that will be unlocked
   */
  getNodeDependents(nodeId: string): string[];
  
  // Path Optimization
  
  /**
   * Calculate the optimal completion path for remaining nodes
   * Considers dependencies and estimated completion times
   * @returns Ordered array of node IDs for optimal completion
   */
  calculateOptimalPath(): string[];
  
  /**
   * Get the next recommended node to work on
   * @returns The node ID that should be tackled next, or null if complete
   */
  getNextRecommendedNode(): string | null;
  
  /**
   * Calculate estimated time to completion
   * @returns Estimated minutes to complete all remaining nodes
   */
  getEstimatedTimeToCompletion(): number;
  
  // Progress Tracking
  
  /**
   * Check if the user can proceed to submit the form
   * @returns true if all required nodes are completed
   */
  canProceedToNext(): boolean;
  
  /**
   * Get detailed progress information
   * @returns Progress statistics and completion status
   */
  getProgressSummary(): ProgressSummary;
  
  /**
   * Reset the form to initial state
   * Clears all progress and returns to starting nodes
   */
  resetForm(): void;
  
  // Validation Integration
  
  /**
   * Validate a specific node's current data
   * @param nodeId - Node to validate
   * @returns Promise resolving to validation result
   */
  validateNode(nodeId: string): Promise<ValidationResult>;
  
  /**
   * Validate all completed nodes
   * @returns Promise resolving to overall validation status
   */
  validateAllNodes(): Promise<boolean>;
  
  /**
   * Re-validate dependencies when a completed node's data changes
   * @param nodeId - Node that was modified
   */
  revalidateDependentNodes(nodeId: string): Promise<void>;
}

// Supporting Types

export interface FormNode {
  /** Unique identifier for the form section */
  id: string;
  
  /** Human-readable label for display */
  label: string;
  
  /** Detailed description of what this section contains */
  description: string;
  
  /** Node IDs that must be completed before this node is available */
  dependencies: string[];
  
  /** Conditional logic that must be satisfied to access this node */
  conditions: FormCondition[];
  
  /** Validation rules specific to this node */
  validationRules: string[];
  
  /** Criteria that must be met to mark this node as complete */
  completionCriteria: CompletionRule[];
  
  /** Estimated time in minutes to complete this section */
  estimatedMinutes: number;
  
  /** Whether this node is required for form submission */
  required: boolean;
  
  /** Category for grouping related nodes */
  category: string;
  
  /** Priority level for path optimization (1 = highest) */
  priority: number;
}

export interface FormCondition {
  /** Field path to evaluate (e.g., 'demographics.age') */
  field: string;
  
  /** Comparison operator */
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 
           'greater_or_equal' | 'less_or_equal' | 'contains' | 'in' | 
           'not_in' | 'exists' | 'length';
  
  /** Value to compare against */
  value: any;
  
  /** Optional logical operator for combining conditions */
  logicalOperator?: 'AND' | 'OR';
}

export interface CompletionRule {
  /** Type of completion requirement */
  type: 'all_fields_valid' | 'required_fields_only' | 'custom_validation' | 
        'server_confirmation' | 'user_confirmation';
  
  /** Additional parameters for the completion rule */
  parameters?: Record<string, any>;
  
  /** Custom validation function name (for 'custom_validation' type) */
  validationFunction?: string;
}

export interface ProgressSummary {
  /** Total number of nodes in the form */
  totalNodes: number;
  
  /** Number of completed nodes */
  completedNodes: number;
  
  /** Number of available but not started nodes */
  availableNodes: number;
  
  /** Number of blocked nodes */
  blockedNodes: number;
  
  /** Overall completion percentage */
  completionPercentage: number;
  
  /** Estimated minutes remaining */
  estimatedMinutesRemaining: number;
  
  /** Whether form is ready for submission */
  canSubmit: boolean;
  
  /** Next recommended action for the user */
  nextRecommendedAction: RecommendedAction;
}

export interface RecommendedAction {
  /** Type of action recommended */
  type: 'start_node' | 'complete_current' | 'fix_validation' | 'submit_form' | 'review_completed';
  
  /** Node ID related to the action (if applicable) */
  nodeId?: string;
  
  /** Human-readable description of the recommended action */
  description: string;
  
  /** Priority level of this action */
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  
  /** Whether validation is currently in progress */
  isLoading: boolean;
  
  /** Validation errors that prevent completion */
  errors: ValidationError[];
  
  /** Validation warnings that should be addressed */
  warnings: ValidationWarning[];
  
  /** Field-specific validation messages */
  fieldErrors: Record<string, string>;
  
  /** Timestamp of last validation */
  lastValidated: Date;
  
  /** Validation source (client, server, or both) */
  source: 'client' | 'server' | 'both';
}

export interface ValidationError {
  /** Error message for display */
  message: string;
  
  /** Field that caused the error (if applicable) */
  field?: string;
  
  /** Error code for programmatic handling */
  code?: string;
  
  /** Suggested fix for the error */
  suggestion?: string;
  
  /** Validation category */
  category?: string;
  
  /** Additional data from server validation */
  serverResponse?: any;
}

export interface ValidationWarning {
  /** Warning message for display */
  message: string;
  
  /** Field that triggered the warning (if applicable) */
  field?: string;
  
  /** Warning code for programmatic handling */
  code?: string;
  
  /** Suggested action for the warning */
  suggestion?: string;
  
  /** Warning category */
  category?: string;
}