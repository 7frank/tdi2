// Types for TDI2 serve module

export interface ServerOptions {
  srcPath: string;
  port: number;
  verbose: boolean;
  host?: string;
  open?: boolean;
  watch?: boolean;
  dev?: boolean;
  showPotentialRelations: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'interface' | 'class' | 'service' | 'component';
  metadata: {
    dependencies: string[];
    dependents: string[];
    issues?: ValidationIssue[];
    scope?: string;
    filePath?: string;
    lifecycle?: string[];
    // Enhanced metadata for better tooltips
    fullToken?: string; // The full implementationClassPath token
    implementationClass?: string;
    implementationClassPath?: string;
    interfaceName?: string;
    registrationType?: string;
  };
  position?: { x: number; y: number };
  color?: string;
  size?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'dependency' | 'inheritance' | 'implementation' | 'injection' | 'potential';
  optional?: boolean;
  metadata?: {
    property?: string;
    strength?: number;
    reason?: string;
    suggestion?: string;
  };
}

export interface LayoutData {
  nodes: Array<{ id: string; x: number; y: number }>;
  bounds: { width: number; height: number };
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layouts: {
    hierarchical: LayoutData;
    force: LayoutData;
    circular: LayoutData;
  };
  metadata: {
    totalNodes: number;
    totalEdges: number;
    analysisTimestamp: string;
    sourceInfo: {
      path: string;
      configFiles: string[];
    };
  };
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
}

export interface AnalysisResponse {
  summary: {
    totalServices: number;
    totalIssues: number;
    healthScore: number;
    circularDependencies: number;
    missingServices: number;
  };
  issues: ValidationIssue[];
  performance: {
    analysisTime: number;
    memoryUsage?: number;
  };
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'analysis_update' | 'config_reload' | 'error' | 'progress';
  data: any;
  timestamp: string;
}

export interface FilterOptions {
  nodeTypes: Set<string>;
  showOptional: boolean;
  showRequired: boolean;
  issueLevel: 'all' | 'errors' | 'warnings';
  searchQuery?: string;
  selectedNodes?: Set<string>;
}