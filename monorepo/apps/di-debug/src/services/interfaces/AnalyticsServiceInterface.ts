export interface AnalysisData {
  summary: {
    totalServices: number;
    healthScore: number;
    totalIssues: number;
    circularDependencies: number;
    missingDependencies: string[];
    orphanedServices: string[];
    couplingAnalysis: any;
  };
  validation: {
    isValid: boolean;
    issues: {
      errors: ValidationIssue[];
      warnings: ValidationIssue[];
      info: ValidationIssue[];
    };
  };
  performance?: {
    analysisTime: number;
    memoryUsage?: number;
  };
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  token: string;
  message: string;
  suggestion?: string;
  location?: {
    file?: string;
    service?: string;
  };
}

export interface MetricsData {
  totalServices: number;
  healthScore: number;
  totalIssues: number;
  circularDependencies: number;
}

export interface AnalyticsServiceInterface {
  state: {
    analysis: AnalysisData | null;
    metrics: MetricsData;
    isLoading: boolean;
    error: string | null;
  };
  
  loadAnalysis(): Promise<void>;
  reloadAnalysis(): Promise<void>;
  exportAnalysis(): void;
}