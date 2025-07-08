/**
 * Interface for managing form state with snapshot/memento pattern
 * Handles form data persistence, snapshots, and rollback functionality
 */

export interface FormStateServiceInterface {
  state: {
    /** Array of all form snapshots (for undo/redo functionality) */
    snapshots: FormSnapshot[];
    
    /** Currently active snapshot */
    currentSnapshot: FormSnapshot;
    
    /** Index of current snapshot in snapshots array */
    currentSnapshotIndex: number;
    
    /** Whether the form has unsaved changes */
    isDirty: boolean;
    
    /** Whether auto-save is enabled */
    autoSaveEnabled: boolean;
    
    /** Timestamp of last save operation */
    lastSaved: Date | null;
    
    /** Whether a save operation is currently in progress */
    saving: boolean;
    
    /** Error from last save operation (if any) */
    saveError: string | null;
  };

  // Snapshot Management (Memento Pattern)
  
  /**
   * Create a snapshot of current form state at a specific node completion
   * @param nodeId - The node being completed
   * @param description - Optional description for the snapshot
   * @returns The created snapshot
   */
  createSnapshot(nodeId: string, description?: string): FormSnapshot;
  
  /**
   * Restore form state to a specific snapshot
   * @param snapshotId - ID of snapshot to restore
   * @throws Error if snapshot not found
   */
  restoreSnapshot(snapshotId: string): void;
  
  /**
   * Restore to previous snapshot (undo functionality)
   * @returns true if undo was successful, false if no previous snapshot
   */
  restorePreviousSnapshot(): boolean;
  
  /**
   * Restore to next snapshot (redo functionality)
   * @returns true if redo was successful, false if no next snapshot
   */
  restoreNextSnapshot(): boolean;
  
  /**
   * Get all available snapshots
   * @returns Array of snapshots ordered by creation time
   */
  getSnapshots(): FormSnapshot[];
  
  /**
   * Delete a specific snapshot
   * @param snapshotId - ID of snapshot to delete
   */
  deleteSnapshot(snapshotId: string): void;
  
  /**
   * Clear all snapshots and reset to initial state
   */
  clearSnapshots(): void;
  
  // Form Data Management
  
  /**
   * Get form data for a specific node
   * @param nodeId - Node to get data for
   * @returns Form data object for the node
   */
  getNodeData(nodeId: string): any;
  
  /**
   * Update form data for a specific node
   * @param nodeId - Node to update
   * @param data - Partial data to merge with existing node data
   */
  updateNodeData(nodeId: string, data: Partial<any>): void;
  
  /**
   * Set complete form data for a node (replaces existing)
   * @param nodeId - Node to set data for
   * @param data - Complete data object for the node
   */
  setNodeData(nodeId: string, data: any): void;
  
  /**
   * Delete all data for a specific node
   * @param nodeId - Node to clear data for
   */
  clearNodeData(nodeId: string): void;
  
  /**
   * Get all form data across all nodes
   * @returns Complete form data organized by node ID
   */
  getAllFormData(): Record<string, any>;
  
  /**
   * Set complete form data (used for restoration or initialization)
   * @param formData - Complete form data object
   */
  setAllFormData(formData: Record<string, any>): void;
  
  // Field-Level Operations
  
  /**
   * Update a specific field within a node
   * @param nodeId - Node containing the field
   * @param fieldPath - Dot notation path to the field (e.g., 'address.street')
   * @param value - New value for the field
   */
  updateField(nodeId: string, fieldPath: string, value: any): void;
  
  /**
   * Get value of a specific field
   * @param nodeId - Node containing the field
   * @param fieldPath - Dot notation path to the field
   * @returns Current field value
   */
  getFieldValue(nodeId: string, fieldPath: string): any;
  
  /**
   * Check if a specific field has been modified
   * @param nodeId - Node containing the field
   * @param fieldPath - Dot notation path to the field
   * @returns true if field has been modified since last snapshot
   */
  isFieldDirty(nodeId: string, fieldPath: string): boolean;
  
  // Persistence Operations
  
  /**
   * Save current form state to persistent storage (localStorage, server, etc.)
   * @param options - Save options
   * @returns Promise resolving when save is complete
   */
  saveFormState(options?: SaveOptions): Promise<void>;
  
  /**
   * Load form state from persistent storage
   * @param sourceId - Optional specific save to load
   * @returns Promise resolving when load is complete
   */
  loadFormState(sourceId?: string): Promise<void>;
  
  /**
   * Enable or disable auto-save functionality
   * @param enabled - Whether to enable auto-save
   * @param intervalMs - Auto-save interval in milliseconds (default: 30000)
   */
  setAutoSave(enabled: boolean, intervalMs?: number): void;
  
  /**
   * Manually trigger auto-save (if enabled)
   * @returns Promise resolving when save is complete
   */
  triggerAutoSave(): Promise<void>;
  
  /**
   * Check if there are unsaved changes
   * @returns true if form has been modified since last save
   */
  hasUnsavedChanges(): boolean;
  
  // Validation State Management
  
  /**
   * Store validation result for a node
   * @param nodeId - Node the validation applies to
   * @param result - Validation result to store
   */
  setValidationResult(nodeId: string, result: ValidationResult): void;
  
  /**
   * Get stored validation result for a node
   * @param nodeId - Node to get validation for
   * @returns Stored validation result or null if none
   */
  getValidationResult(nodeId: string): ValidationResult | null;
  
  /**
   * Clear validation results for a node
   * @param nodeId - Node to clear validation for
   */
  clearValidationResult(nodeId: string): void;
  
  /**
   * Clear all validation results
   */
  clearAllValidationResults(): void;
  
  // Change Tracking
  
  /**
   * Get list of all changes since last snapshot
   * @returns Array of changes with details
   */
  getChangesSinceLastSnapshot(): FormChange[];
  
  /**
   * Get changes for a specific node since last snapshot
   * @param nodeId - Node to get changes for
   * @returns Array of changes for the node
   */
  getNodeChangesSinceLastSnapshot(nodeId: string): FormChange[];
  
  /**
   * Mark form as clean (no unsaved changes)
   * Typically called after successful save
   */
  markAsClean(): void;
  
  /**
   * Subscribe to form state changes
   * @param callback - Function to call when state changes
   * @returns Unsubscribe function
   */
  onStateChange(callback: (change: FormStateChange) => void): () => void;
}

// Supporting Types

export interface FormSnapshot {
  /** Unique identifier for the snapshot */
  id: string;
  
  /** Timestamp when snapshot was created */
  timestamp: Date;
  
  /** Node ID that triggered this snapshot (if applicable) */
  triggerNodeId?: string;
  
  /** Human-readable description of the snapshot */
  description: string;
  
  /** Complete form data at time of snapshot */
  data: Record<string, any>;
  
  /** Validation results at time of snapshot */
  validationResults: Record<string, ValidationResult>;
  
  /** DAG state at time of snapshot */
  dagState: {
    completedNodes: string[];
    currentNodes: string[];
    availableNodes: string[];
  };
  
  /** Metadata about the snapshot */
  metadata: {
    /** User agent when snapshot was created */
    userAgent: string;
    
    /** Form version/schema version */
    formVersion: string;
    
    /** Any additional custom metadata */
    custom?: Record<string, any>;
  };
}

export interface SaveOptions {
  /** Whether to create a snapshot before saving */
  createSnapshot?: boolean;
  
  /** Description for the save operation */
  description?: string;
  
  /** Where to save the data */
  target?: 'localStorage' | 'sessionStorage' | 'server' | 'indexedDB';
  
  /** Whether to compress the data before saving */
  compress?: boolean;
  
  /** Whether to encrypt sensitive data */
  encrypt?: boolean;
  
  /** Custom save identifier */
  saveId?: string;
}

export interface FormChange {
  /** Type of change that occurred */
  type: 'field_updated' | 'node_data_set' | 'node_data_cleared' | 'validation_updated';
  
  /** Node ID where change occurred */
  nodeId: string;
  
  /** Field path (for field-level changes) */
  fieldPath?: string;
  
  /** Previous value */
  previousValue: any;
  
  /** New value */
  newValue: any;
  
  /** Timestamp of the change */
  timestamp: Date;
  
  /** Source of the change */
  source: 'user_input' | 'programmatic' | 'validation' | 'restoration';
}

export interface FormStateChange {
  /** Type of state change */
  type: 'data_updated' | 'snapshot_created' | 'snapshot_restored' | 
        'validation_updated' | 'save_completed' | 'load_completed';
  
  /** Additional details about the change */
  details: {
    nodeId?: string;
    fieldPath?: string;
    snapshotId?: string;
    [key: string]: any;
  };
  
  /** Timestamp of the change */
  timestamp: Date;
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