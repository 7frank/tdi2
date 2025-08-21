// Analytics-specific type definitions for dependency analysis and debugging

export interface DependencyNode {
  /** Service token/identifier */
  token: string;
  /** Implementation class name */
  implementationClass: string;
  /** Service file path */
  filePath: string;
  /** Direct dependencies */
  dependencies: string[];
  /** Services that depend on this one */
  dependents: string[];
  /** Service scope */
  scope: 'singleton' | 'transient' | 'scoped';
  /** Whether this service is optional */
  isOptional: boolean;
  /** Service metadata */
  metadata: {
    isInterface: boolean;
    isClass: boolean;
    isInheritanceBased: boolean;
    isStateBased: boolean;
    profiles?: string[];
  };
}

export interface DependencyGraph {
  /** All nodes in the graph */
  nodes: Map<string, DependencyNode>;
  /** Dependency relationships (token -> dependencies) */
  dependencies: Map<string, string[]>;
  /** Reverse dependencies (token -> dependents) */
  dependents: Map<string, string[]>;
  /** Root nodes (no dependencies) */
  roots: string[];
  /** Leaf nodes (no dependents) */
  leaves: string[];
}

export interface CircularDependency {
  /** The circular dependency chain */
  cycle: string[];
  /** Description of the cycle */
  description: string;
  /** Severity level */
  severity: 'error' | 'warning';
  /** Suggested fix */
  suggestion?: string;
}

export interface ResolutionPath {
  /** Target service token */
  target: string;
  /** Resolution steps */
  steps: ResolutionStep[];
  /** Whether resolution was successful */
  success: boolean;
  /** Error message if resolution failed */
  error?: string;
}

export interface ResolutionStep {
  /** Step number */
  step: number;
  /** Service token being resolved */
  token: string;
  /** Resolution strategy used */
  strategy: 'interface' | 'class' | 'inheritance' | 'state' | 'factory';
  /** Implementation found (if any) */
  implementation?: string;
  /** File path where implementation was found */
  filePath?: string;
  /** Status of this step */
  status: 'success' | 'failed' | 'skipped';
  /** Additional details */
  details?: string;
}

export interface ValidationIssue {
  /** Issue type */
  type: 'missing-service' | 'circular-dependency' | 'scope-mismatch' | 'invalid-interface' | 'orphaned-service';
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Service token involved */
  token: string;
  /** Human-readable message */
  message: string;
  /** Technical details */
  details: string;
  /** Suggested fix */
  suggestion?: string;
  /** File path where issue occurs */
  filePath?: string;
  /** Related tokens (for circular dependencies) */
  relatedTokens?: string[];
}

export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Total number of services validated */
  totalServices: number;
  /** Issues found, grouped by severity */
  issues: {
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    info: ValidationIssue[];
  };
  /** Summary statistics */
  summary: {
    missingServices: number;
    circularDependencies: number;
    scopeMismatches: number;
    orphanedServices: number;
  };
  /** Validation duration */
  duration: number;
}

export interface GraphVisualizationOptions {
  /** Output format */
  format: 'ascii' | 'json' | 'dot' | 'mermaid';
  /** Include service details */
  includeDetails?: boolean;
  /** Show only specific node types */
  nodeTypes?: ('interface' | 'class' | 'inheritance' | 'state')[];
  /** Highlight specific tokens */
  highlight?: string[];
  /** Maximum depth to display */
  maxDepth?: number;
  /** Show profiles */
  showProfiles?: boolean;
}

export interface ContainerInspectionResult {
  /** Container statistics */
  stats: {
    totalServices: number;
    registeredTokens: number;
    activeInstances: number;
    byScope: Record<string, number>;
    byType: Record<string, number>;
  };
  /** Active profiles */
  activeProfiles: string[];
  /** Configuration hash */
  configHash?: string;
  /** Health status */
  health: {
    status: 'healthy' | 'warning' | 'error';
    issues: ValidationIssue[];
  };
  /** Performance metrics */
  performance?: {
    resolutionTimes: Record<string, number>;
    memoryUsage: number;
  };
}

export interface AnalyticsConfig {
  /** Enable verbose logging */
  verbose?: boolean;
  /** Include performance metrics */
  includePerformance?: boolean;
  /** Maximum graph depth for analysis */
  maxDepth?: number;
  /** Profiles to analyze */
  activeProfiles?: string[];
}

export interface ServiceDiscoveryIssue {
  /** Type of discovery issue */
  type: 'file-not-scanned' | 'decorator-not-detected' | 'interface-not-extracted' | 'import-resolution-failed';
  /** File path with the issue */
  filePath: string;
  /** Service class name */
  className: string;
  /** Expected interface/token */
  expectedToken: string;
  /** Detailed diagnostic information */
  diagnostic: string;
  /** Suggested fixes */
  fixes: string[];
}