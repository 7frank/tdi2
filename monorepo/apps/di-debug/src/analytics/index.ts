// Main analytics module - comprehensive DI debugging and analysis tools

import { DependencyAnalyzer } from './DependencyAnalyzer';
import { ServiceResolver } from './ServiceResolver';
import { ValidationEngine } from './ValidationEngine';
import { GraphVisualizer } from './GraphVisualizer';

export * from './types';
export { DependencyAnalyzer } from './DependencyAnalyzer';
export { ServiceResolver } from './ServiceResolver';
export { ValidationEngine } from './ValidationEngine';
export { GraphVisualizer } from './GraphVisualizer';

import type {
  AnalyticsConfig,
  DependencyGraph,
  ValidationResult,
  ResolutionPath,
  GraphVisualizationOptions,
  ContainerInspectionResult
} from './types';

/**
 * Main analytics facade providing comprehensive DI analysis capabilities
 * 
 * This class provides a unified interface for all DI analytics operations,
 * making it easy to analyze, validate, and debug dependency injection configurations.
 * 
 * Example usage:
 * ```typescript
 * const analytics = new DIAnalytics({ verbose: true });
 * 
 * // Comprehensive analysis
 * const result = analytics.analyzeConfiguration(DI_CONFIG);
 * console.log('Validation:', result.validation.isValid);
 * console.log('Graph:', result.graph.nodes.size, 'services');
 * 
 * // Specific debugging
 * const trace = analytics.traceService('TodoServiceType');
 * console.log('Resolution:', trace.success ? 'SUCCESS' : 'FAILED');
 * 
 * // Visualization
 * const ascii = analytics.visualizeGraph({ format: 'ascii' });
 * const json = analytics.visualizeGraph({ format: 'json' });
 * ```
 */
export class DIAnalytics {
  private dependencyAnalyzer: DependencyAnalyzer;
  private serviceResolver: ServiceResolver;
  private validationEngine: ValidationEngine;
  private graphVisualizer: GraphVisualizer;
  private config: AnalyticsConfig;
  private cachedGraph?: DependencyGraph;
  
  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      verbose: false,
      includePerformance: false,
      maxDepth: 50,
      ...config
    };
    
    this.dependencyAnalyzer = new DependencyAnalyzer(this.config);
    this.serviceResolver = new ServiceResolver(this.config);
    this.validationEngine = new ValidationEngine(this.config);
    this.graphVisualizer = new GraphVisualizer();
  }
  
  /**
   * Perform comprehensive analysis of DI configuration
   * Returns all analytics data in one call - perfect for CLI/web dashboard
   */
  analyzeConfiguration(diConfig: Record<string, any>): {
    graph: DependencyGraph;
    validation: ValidationResult;
    summary: {
      totalServices: number;
      missingDependencies: string[];
      circularDependencies: string[][];
      orphanedServices: string[];
      couplingAnalysis: any;
    };
    performance?: {
      analysisTime: number;
      memoryUsage?: number;
    };
  } {
    const startTime = Date.now();
    
    if (this.config.verbose) {
      console.log('🔍 Starting comprehensive DI configuration analysis...');
    }
    
    // Build dependency graph (cached for performance)
    const graph = this.dependencyAnalyzer.buildDependencyGraph(diConfig);
    this.cachedGraph = graph;
    
    // Run validation
    const validation = this.validationEngine.validateConfiguration(diConfig);
    
    // Generate summary
    const missingDependencies = this.serviceResolver.findUnresolvedTokens(diConfig);
    const circularDependencies = this.dependencyAnalyzer.findCircularDependencies(graph);
    const orphanedServices = this.dependencyAnalyzer.findOrphanedServices(graph);
    const couplingAnalysis = this.dependencyAnalyzer.analyzeCoupling(graph);
    
    const analysisTime = Date.now() - startTime;
    
    const result = {
      graph,
      validation,
      summary: {
        totalServices: graph.nodes.size,
        missingDependencies,
        circularDependencies: circularDependencies.map(cd => cd.cycle),
        orphanedServices,
        couplingAnalysis
      },
      ...(this.config.includePerformance && {
        performance: {
          analysisTime,
          memoryUsage: this.getMemoryUsage()
        }
      })
    };
    
    if (this.config.verbose) {
      console.log(`✅ Analysis completed in ${analysisTime}ms`);
      console.log(`   Services: ${graph.nodes.size}, Issues: ${validation.issues.errors.length + validation.issues.warnings.length}`);
    }
    
    return result;
  }
  
  /**
   * Trace resolution path for a specific service
   * Perfect for debugging why a service like TodoServiceType isn't working
   */
  traceService(token: string, diConfig?: Record<string, any>): ResolutionPath {
    if (!diConfig && !this.cachedGraph) {
      throw new Error('No DI configuration provided and no cached configuration available');
    }
    
    return this.serviceResolver.traceResolution(token, diConfig || {});
  }
  
  /**
   * Validate DI configuration for specific issues
   */
  validate(diConfig: Record<string, any>, type: 'all' | 'circular' | 'missing' | 'scopes' | 'orphaned' = 'all'): ValidationResult | import('./types').ValidationIssue[] {
    if (type === 'all') {
      return this.validationEngine.validateConfiguration(diConfig);
    } else {
      return this.validationEngine.validateSpecific(diConfig, type);
    }
  }
  
  /**
   * Generate visual representation of dependency graph
   * Supports ASCII (CLI), JSON (web/tooling), DOT (Graphviz), Mermaid formats
   */
  visualizeGraph(options: GraphVisualizationOptions, diConfig?: Record<string, any>): string {
    let graph = this.cachedGraph;
    
    if (!graph && diConfig) {
      graph = this.dependencyAnalyzer.buildDependencyGraph(diConfig);
      this.cachedGraph = graph;
    }
    
    if (!graph) {
      throw new Error('No dependency graph available - call analyzeConfiguration() first or provide diConfig');
    }
    
    return this.graphVisualizer.visualize(graph, options, diConfig);
  }
  
  /**
   * Find all services that aren't resolving properly
   * Useful for identifying configuration gaps
   */
  findProblematicServices(diConfig: Record<string, any>): {
    unresolved: string[];
    circular: string[];
    orphaned: string[];
    scopeIssues: string[];
  } {
    const graph = this.cachedGraph || this.dependencyAnalyzer.buildDependencyGraph(diConfig);
    
    const unresolved = this.serviceResolver.findUnresolvedTokens(diConfig);
    const circularDeps = this.dependencyAnalyzer.findCircularDependencies(graph);
    const circular = [...new Set(circularDeps.flatMap(cd => cd.cycle))];
    const orphaned = this.dependencyAnalyzer.findOrphanedServices(graph);
    
    // Find scope issues
    const scopeIssues: string[] = [];
    const validation = this.validationEngine.validateSpecific(diConfig, 'scopes');
    for (const issue of validation) {
      scopeIssues.push(issue.token);
    }
    
    return {
      unresolved,
      circular,
      orphaned,
      scopeIssues: [...new Set(scopeIssues)]
    };
  }
  
  /**
   * Diagnose why specific services aren't being discovered
   * Perfect for the TodoService in App.tsx issue
   */
  diagnoseDiscoveryIssues(expectedServices: string[], diConfig: Record<string, any>, srcDir?: string) {
    return this.serviceResolver.diagnoseServiceDiscovery(expectedServices, diConfig, srcDir);
  }
  
  /**
   * Get dependency path between two services
   */
  findDependencyPath(from: string, to: string, diConfig?: Record<string, any>): string[][] {
    const graph = this.cachedGraph || (diConfig ? this.dependencyAnalyzer.buildDependencyGraph(diConfig) : null);
    
    if (!graph) {
      throw new Error('No dependency graph available');
    }
    
    return this.dependencyAnalyzer.findPathsBetween(graph, from, to);
  }
  
  /**
   * Analyze coupling metrics for architectural insights
   */
  analyzeCoupling(diConfig?: Record<string, any>) {
    const graph = this.cachedGraph || (diConfig ? this.dependencyAnalyzer.buildDependencyGraph(diConfig) : null);
    
    if (!graph) {
      throw new Error('No dependency graph available');
    }
    
    return this.dependencyAnalyzer.analyzeCoupling(graph);
  }
  
  /**
   * Generate quick health report for dashboard/CI
   */
  getHealthReport(diConfig: Record<string, any>): {
    status: 'healthy' | 'warning' | 'error';
    score: number; // 0-100
    summary: string;
    issues: {
      critical: number;
      warnings: number;
      info: number;
    };
    recommendations: string[];
  } {
    const validation = this.validationEngine.validateConfiguration(diConfig);
    const problems = this.findProblematicServices(diConfig);
    
    const criticalIssues = validation.issues.errors.length;
    const warnings = validation.issues.warnings.length;
    const info = validation.issues.info.length;
    
    let status: 'healthy' | 'warning' | 'error';
    let score: number;
    
    if (criticalIssues > 0) {
      status = 'error';
      score = Math.max(0, 50 - (criticalIssues * 10));
    } else if (warnings > 0) {
      status = 'warning';
      score = Math.max(50, 85 - (warnings * 5));
    } else {
      status = 'healthy';
      score = Math.max(85, 100 - (info * 2));
    }
    
    const recommendations: string[] = [];
    if (problems.unresolved.length > 0) {
      recommendations.push(`Resolve ${problems.unresolved.length} missing dependencies`);
    }
    if (problems.circular.length > 0) {
      recommendations.push(`Fix ${problems.circular.length} circular dependency issues`);
    }
    if (problems.orphaned.length > 5) {
      recommendations.push(`Review ${problems.orphaned.length} potentially unused services`);
    }
    
    return {
      status,
      score,
      summary: `${validation.totalServices} services analyzed: ${criticalIssues} errors, ${warnings} warnings`,
      issues: {
        critical: criticalIssues,
        warnings,
        info
      },
      recommendations
    };
  }
  
  /**
   * Clear cached data (useful for memory management in long-running processes)
   */
  clearCache(): void {
    this.cachedGraph = undefined;
  }
  
  // Private helpers
  
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
}