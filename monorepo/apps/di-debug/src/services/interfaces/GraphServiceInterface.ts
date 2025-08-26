export interface GraphNode {
  id: string;
  label: string;
  type: 'interface' | 'class' | 'service' | 'component';
  size?: number;
  color?: string; // Backend-computed color based on issues and type
  metadata: {
    scope: string;
    dependencies: string[];
    dependents: string[];
    filePath?: string;
    issues: ValidationIssue[];
    // Additional metadata for enhanced tooltips
    fullToken?: string;
    interfaceName?: string;
    implementationClass?: string;
    implementationClassPath?: string;
    registrationType?: string;
    lifecycle?: any[];
  };
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'implementation' | 'injection' | 'inheritance' | 'potential' | 'dependency';
  optional?: boolean;
  metadata?: {
    strength?: number;
    reason?: string;
    suggestion?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FilterOptions {
  nodeTypes: Set<string>;
  showIssuesOnly: boolean;
  showPotential: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface GraphServiceInterface {
  state: {
    graphData: GraphData;
    filteredData: GraphData;
    filters: FilterOptions;
    selectedNodes: Set<string>;
    layout: 'force' | 'hierarchical' | 'circular';
    searchTerm: string;
    isLoading: boolean;
    error: string | null;
  };
  
  loadGraph(): Promise<void>;
  reloadGraph(): Promise<void>;
  updateFilters(filters: Partial<FilterOptions>): void;
  setLayout(layout: 'force' | 'hierarchical' | 'circular'): void;
  selectNode(nodeId: string): void;
  clearSelection(): void;
  searchNodes(term: string): void;
  clearSearch(): void;
  exportGraph(): void;
}