// Advanced dependency graph analysis and circular dependency detection

import type { 
  DependencyGraph, 
  DependencyNode, 
  CircularDependency,
  AnalyticsConfig 
} from './types';

export class DependencyAnalyzer {
  private config: AnalyticsConfig;
  
  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      verbose: false,
      maxDepth: 50,
      ...config
    };
  }
  
  /**
   * Build a complete dependency graph from DI configuration
   */
  buildDependencyGraph(diConfig: Record<string, any>): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();
    const dependencies = new Map<string, string[]>();
    const dependents = new Map<string, string[]>();
    
    // First pass: Create all nodes
    for (const [token, config] of Object.entries(diConfig)) {
      const node: DependencyNode = {
        token,
        implementationClass: config.implementationClass || token,
        filePath: this.extractFilePath(config.implementationClass || token),
        dependencies: config.dependencies || [],
        dependents: [],
        scope: config.scope || 'singleton',
        isOptional: config.isOptional || false,
        metadata: {
          isInterface: config.registrationType === 'interface',
          isClass: config.isClassBased || false,
          isInheritanceBased: config.isInheritanceBased || false,
          isStateBased: config.isStateBased || false,
          profiles: config.profiles
        }
      };
      
      nodes.set(token, node);
      dependencies.set(token, config.dependencies || []);
    }
    
    // Second pass: Build reverse dependencies
    for (const [token, deps] of dependencies.entries()) {
      for (const dep of deps) {
        if (!dependents.has(dep)) {
          dependents.set(dep, []);
        }
        dependents.get(dep)!.push(token);
      }
    }
    
    // Update nodes with dependents
    for (const [token, deps] of dependents.entries()) {
      const node = nodes.get(token);
      if (node) {
        node.dependents = deps;
      }
    }
    
    // Find roots and leaves
    const roots: string[] = [];
    const leaves: string[] = [];
    
    for (const [token, node] of nodes.entries()) {
      if (node.dependencies.length === 0) {
        roots.push(token);
      }
      if (node.dependents.length === 0) {
        leaves.push(token);
      }
    }
    
    const graph: DependencyGraph = {
      nodes,
      dependencies,
      dependents,
      roots,
      leaves
    };
    
    if (this.config.verbose) {
      console.log(`🔍 Built dependency graph: ${nodes.size} nodes, ${roots.length} roots, ${leaves.length} leaves`);
    }
    
    return graph;
  }
  
  /**
   * Find all circular dependencies in the graph
   */
  findCircularDependencies(graph: DependencyGraph): CircularDependency[] {
    const circularDeps: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathStack: string[] = [];
    
    const detectCircular = (token: string): void => {
      if (recursionStack.has(token)) {
        // Found a cycle - extract it from the path stack
        const cycleStartIndex = pathStack.indexOf(token);
        const cycle = pathStack.slice(cycleStartIndex).concat([token]);
        
        circularDeps.push({
          cycle,
          description: this.formatCircularDependency(cycle),
          severity: 'error',
          suggestion: this.suggestCircularDependencyFix(cycle, graph)
        });
        return;
      }
      
      if (visited.has(token)) return;
      
      visited.add(token);
      recursionStack.add(token);
      pathStack.push(token);
      
      const deps = graph.dependencies.get(token) || [];
      for (const dep of deps) {
        detectCircular(dep);
      }
      
      recursionStack.delete(token);
      pathStack.pop();
    };
    
    // Check each node for circular dependencies
    for (const token of graph.nodes.keys()) {
      if (!visited.has(token)) {
        detectCircular(token);
      }
    }
    
    if (this.config.verbose) {
      console.log(`🔄 Found ${circularDeps.length} circular dependencies`);
    }
    
    return circularDeps;
  }
  
  /**
   * Get all paths from one token to another
   */
  findPathsBetween(graph: DependencyGraph, from: string, to: string, maxPaths: number = 10): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();
    
    const dfs = (current: string, target: string, path: string[]): void => {
      if (paths.length >= maxPaths) return;
      
      if (current === target) {
        paths.push([...path, current]);
        return;
      }
      
      if (path.length > (this.config.maxDepth || 50)) return; // Prevent infinite loops
      
      const currentPath = [...path, current];
      const deps = graph.dependencies.get(current) || [];
      
      for (const dep of deps) {
        if (!path.includes(dep)) { // Avoid cycles in path finding
          dfs(dep, target, currentPath);
        }
      }
    };
    
    dfs(from, to, []);
    return paths;
  }
  
  /**
   * Get dependency depth for a service (longest path to a leaf)
   */
  getDependencyDepth(graph: DependencyGraph, token: string): number {
    const visited = new Set<string>();
    
    const calculateDepth = (current: string): number => {
      if (visited.has(current)) return 0; // Circular dependency protection
      
      visited.add(current);
      const deps = graph.dependencies.get(current) || [];
      
      if (deps.length === 0) return 0;
      
      let maxDepth = 0;
      for (const dep of deps) {
        const depth = calculateDepth(dep) + 1;
        maxDepth = Math.max(maxDepth, depth);
      }
      
      visited.delete(current);
      return maxDepth;
    };
    
    return calculateDepth(token);
  }
  
  /**
   * Get all services at a specific depth level
   */
  getServicesByDepth(graph: DependencyGraph): Map<number, string[]> {
    const depthMap = new Map<number, string[]>();
    
    for (const token of graph.nodes.keys()) {
      const depth = this.getDependencyDepth(graph, token);
      if (!depthMap.has(depth)) {
        depthMap.set(depth, []);
      }
      depthMap.get(depth)!.push(token);
    }
    
    return depthMap;
  }
  
  /**
   * Find orphaned services (no dependents and not roots)
   */
  findOrphanedServices(graph: DependencyGraph): string[] {
    const orphaned: string[] = [];
    
    for (const [token, node] of graph.nodes.entries()) {
      // A service is orphaned if it has dependencies but no dependents
      // (and it's not a root service that might be used directly)
      if (node.dependencies.length > 0 && node.dependents.length === 0) {
        // Check if it's likely to be a service used directly (like in React components)
        const isLikelyDirectUse = this.isLikelyDirectUseService(node);
        if (!isLikelyDirectUse) {
          orphaned.push(token);
        }
      }
    }
    
    return orphaned;
  }
  
  /**
   * Analyze dependency coupling (how interconnected services are)
   */
  analyzeCoupling(graph: DependencyGraph): {
    totalConnections: number;
    averageConnectionsPerService: number;
    highlyConnectedServices: Array<{token: string; connections: number}>;
    couplingScore: number; // 0-1, where 1 is highly coupled
  } {
    let totalConnections = 0;
    const connectionCounts: Array<{token: string; connections: number}> = [];
    
    for (const [token, node] of graph.nodes.entries()) {
      const connections = node.dependencies.length + node.dependents.length;
      totalConnections += connections;
      connectionCounts.push({ token, connections });
    }
    
    const averageConnectionsPerService = totalConnections / (graph.nodes.size * 2); // Divided by 2 because each connection is counted twice
    
    // Sort by connection count and get top 10% as highly connected
    connectionCounts.sort((a, b) => b.connections - a.connections);
    const topCount = Math.max(1, Math.floor(graph.nodes.size * 0.1));
    const highlyConnectedServices = connectionCounts.slice(0, topCount);
    
    // Calculate coupling score (normalized by maximum possible connections)
    const maxPossibleConnections = graph.nodes.size * (graph.nodes.size - 1);
    const actualConnections = Array.from(graph.dependencies.values()).flat().length;
    const couplingScore = actualConnections / maxPossibleConnections;
    
    return {
      totalConnections: actualConnections,
      averageConnectionsPerService,
      highlyConnectedServices,
      couplingScore
    };
  }
  
  // Helper methods
  
  private extractFilePath(className: string): string {
    // Enhanced file path extraction with common patterns
    const serviceName = className
      .replace(/Service$|Impl$|Interface$/, '')
      .replace(/([A-Z])/g, (match, offset) => offset > 0 ? `-${match.toLowerCase()}` : match.toLowerCase());
    
    if (className.endsWith('Service')) {
      return `/src/services/${serviceName}.ts`;
    } else if (className.endsWith('Repository')) {
      return `/src/repositories/${serviceName}.ts`;
    } else if (className.endsWith('Controller')) {
      return `/src/controllers/${serviceName}.ts`;
    } else {
      return `/src/${serviceName}.ts`;
    }
  }
  
  private formatCircularDependency(cycle: string[]): string {
    return `Circular dependency detected: ${cycle.join(' → ')}`;
  }
  
  private suggestCircularDependencyFix(cycle: string[], graph: DependencyGraph): string {
    // Analyze the cycle to suggest the best breaking point
    const suggestions: string[] = [];
    
    // Look for services that could use lazy loading
    for (let i = 0; i < cycle.length - 1; i++) {
      const from = cycle[i];
      const to = cycle[i + 1];
      const node = graph.nodes.get(from);
      
      if (node?.metadata.isInterface) {
        suggestions.push(`Consider using lazy loading for ${from} → ${to}`);
      }
    }
    
    // Look for services that could be refactored
    if (cycle.length <= 3) {
      suggestions.push(`Consider extracting shared logic into a separate service`);
    }
    
    return suggestions.length > 0 
      ? suggestions.join(', ') 
      : 'Consider using dependency injection patterns like lazy loading or event-driven communication';
  }
  
  private isLikelyDirectUseService(node: DependencyNode): boolean {
    // Heuristics to determine if a service is likely used directly
    const className = node.implementationClass.toLowerCase();
    
    // Services commonly used directly in React components
    return (
      className.includes('service') ||
      className.includes('store') ||
      className.includes('manager') ||
      className.includes('provider') ||
      node.metadata.isStateBased
    );
  }
}