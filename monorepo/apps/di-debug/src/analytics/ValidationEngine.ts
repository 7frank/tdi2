// Comprehensive validation engine for detecting DI configuration issues

import type { 
  ValidationResult, 
  ValidationIssue, 
  DependencyGraph,
  AnalyticsConfig 
} from './types';
import { DependencyAnalyzer } from './DependencyAnalyzer';
import { ServiceResolver } from './ServiceResolver';

export class ValidationEngine {
  private config: AnalyticsConfig;
  private dependencyAnalyzer: DependencyAnalyzer;
  // private serviceResolver: ServiceResolver; // Reserved for future use
  
  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      verbose: false,
      ...config
    };
    this.dependencyAnalyzer = new DependencyAnalyzer(config);
    // this.serviceResolver = new ServiceResolver(config); // Reserved for future use
  }
  
  /**
   * Perform comprehensive validation of DI configuration
   */
  validateConfiguration(diConfig: Record<string, any>): ValidationResult {
    const startTime = Date.now();
    const issues: ValidationIssue[] = [];
    
    if (this.config.verbose) {
      console.log('🔍 Starting comprehensive DI configuration validation...');
    }
    
    // Build dependency graph for analysis
    const graph = this.dependencyAnalyzer.buildDependencyGraph(diConfig);
    
    // Run all validation checks
    issues.push(...this.validateMissingServices(diConfig));
    issues.push(...this.validateCircularDependencies(graph));
    issues.push(...this.validateScopeMismatches(graph));
    issues.push(...this.validateOrphanedServices(graph));
    issues.push(...this.validateInterfaceConsistency(diConfig));
    issues.push(...this.validateProfileConsistency(diConfig));
    
    // Categorize issues by severity
    const errors = issues.filter(issue => issue.severity === 'error');
    const warnings = issues.filter(issue => issue.severity === 'warning');
    const info = issues.filter(issue => issue.severity === 'info');
    
    const isValid = errors.length === 0;
    const duration = Date.now() - startTime;
    
    const result: ValidationResult = {
      isValid,
      totalServices: Object.keys(diConfig).length,
      issues: { errors, warnings, info },
      summary: {
        missingServices: this.countIssuesByType(issues, 'missing-service'),
        circularDependencies: this.countIssuesByType(issues, 'circular-dependency'),
        scopeMismatches: this.countIssuesByType(issues, 'scope-mismatch'),
        orphanedServices: this.countIssuesByType(issues, 'orphaned-service')
      },
      duration
    };
    
    if (this.config.verbose) {
      console.log(`✅ Validation completed in ${duration}ms: ${isValid ? 'VALID' : 'INVALID'}`);
      console.log(`   Errors: ${errors.length}, Warnings: ${warnings.length}, Info: ${info.length}`);
    }
    
    return result;
  }
  
  /**
   * Quick validation check for specific issue types
   */
  validateSpecific(
    diConfig: Record<string, any>, 
    type: 'circular' | 'missing' | 'scopes' | 'orphaned' | 'all'
  ): ValidationIssue[] {
    const graph = this.dependencyAnalyzer.buildDependencyGraph(diConfig);
    
    switch (type) {
      case 'circular':
        return this.validateCircularDependencies(graph);
      case 'missing':
        return this.validateMissingServices(diConfig);
      case 'scopes':
        return this.validateScopeMismatches(graph);
      case 'orphaned':
        return this.validateOrphanedServices(graph);
      case 'all':
        return this.validateConfiguration(diConfig).issues.errors
          .concat(this.validateConfiguration(diConfig).issues.warnings)
          .concat(this.validateConfiguration(diConfig).issues.info);
      default:
        return [];
    }
  }
  
  // Private validation methods
  
  private validateMissingServices(diConfig: Record<string, any>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const availableTokens = new Set(Object.keys(diConfig));
    
    for (const [token, config] of Object.entries(diConfig)) {
      if (config.dependencies) {
        for (const dep of config.dependencies) {
          // Check for exact match first
          if (availableTokens.has(dep)) {
            continue; // Dependency is satisfied
          }
          
          // Extract interface name from location-based key and check for interface implementations
          const interfaceName = dep.split('__')[0];
          const hasImplementation = Array.from(availableTokens).some(token => {
            const tokenConfig = diConfig[token];
            return tokenConfig.interfaceName === interfaceName;
          });
          
          // Only report as missing if no implementation of the interface exists
          if (!hasImplementation) {
            issues.push({
              type: 'missing-service',
              severity: 'error',
              token: dep,
              message: `Missing service dependency '${dep}' required by '${token}'`,
              details: `Service '${token}' depends on '${dep}' but no implementation is registered`,
              suggestion: this.suggestMissingServiceFix(dep, availableTokens),
              filePath: this.estimateFilePath(config.implementationClass || token),
              relatedTokens: [token]
            });
          }
        }
      }
      
      // Check for missing implementation class
      if (!config.implementationClass) {
        issues.push({
          type: 'missing-service',
          severity: 'warning',
          token,
          message: `Service '${token}' has no implementation class specified`,
          details: 'Service configuration should specify an implementation class',
          suggestion: 'Add implementationClass property to service configuration'
        });
      }
    }
    
    return issues;
  }
  
  private validateCircularDependencies(graph: DependencyGraph): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const circularDeps = this.dependencyAnalyzer.findCircularDependencies(graph);
    
    for (const circular of circularDeps) {
      // Create issue for each service in the cycle
      for (const token of circular.cycle.slice(0, -1)) { // Remove duplicate last element
        issues.push({
          type: 'circular-dependency',
          severity: circular.severity,
          token,
          message: `Circular dependency detected involving '${token}'`,
          details: circular.description,
          suggestion: circular.suggestion || 'Consider using lazy loading or refactoring service dependencies',
          relatedTokens: circular.cycle.slice(0, -1)
        });
      }
    }
    
    return issues;
  }
  
  private validateScopeMismatches(graph: DependencyGraph): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const [token, node] of graph.nodes.entries()) {
      for (const depToken of node.dependencies) {
        const depNode = graph.nodes.get(depToken);
        if (!depNode) continue;
        
        // Check for problematic scope combinations
        if (node.scope === 'singleton' && depNode.scope === 'transient') {
          issues.push({
            type: 'scope-mismatch',
            severity: 'warning',
            token,
            message: `Singleton service '${token}' depends on transient service '${depToken}'`,
            details: 'Singleton services will keep the same instance of transient dependencies, potentially causing memory leaks',
            suggestion: 'Consider making the dependency singleton or using a factory pattern',
            relatedTokens: [depToken]
          });
        }
        
        if (node.scope === 'scoped' && depNode.scope === 'singleton') {
          issues.push({
            type: 'scope-mismatch',
            severity: 'info',
            token,
            message: `Scoped service '${token}' depends on singleton service '${depToken}'`,
            details: 'Scoped services depending on singletons may cause unexpected behavior across different scopes',
            suggestion: 'Verify that this dependency pattern is intentional'
          });
        }
      }
    }
    
    return issues;
  }
  
  private validateOrphanedServices(graph: DependencyGraph): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const orphaned = this.dependencyAnalyzer.findOrphanedServices(graph);
    
    for (const token of orphaned) {
      const node = graph.nodes.get(token);
      if (!node) continue;
      
      issues.push({
        type: 'orphaned-service',
        severity: 'info',
        token,
        message: `Service '${token}' appears to be orphaned`,
        details: `Service has dependencies but no other services depend on it. It may be unused or only used directly in components.`,
        suggestion: 'Verify this service is actually needed, or ensure it\'s being used correctly',
        filePath: node.filePath
      });
    }
    
    return issues;
  }
  
  private validateInterfaceConsistency(diConfig: Record<string, any>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const interfaceToImplementations = new Map<string, string[]>();
    
    // Group implementations by interface
    for (const [token, config] of Object.entries(diConfig)) {
      const interfaceName = config.interfaceName || token;
      if (!interfaceToImplementations.has(interfaceName)) {
        interfaceToImplementations.set(interfaceName, []);
      }
      interfaceToImplementations.get(interfaceName)!.push(token);
    }
    
    // Check for interfaces with multiple implementations but no primary
    for (const [interfaceName, implementations] of interfaceToImplementations.entries()) {
      if (implementations.length > 1) {
        const primaries = implementations.filter(token => diConfig[token].primary);
        
        if (primaries.length === 0) {
          issues.push({
            type: 'invalid-interface',
            severity: 'warning',
            token: interfaceName,
            message: `Interface '${interfaceName}' has multiple implementations but no primary`,
            details: `Implementations: ${implementations.join(', ')}. When multiple implementations exist, one should be marked as @Primary`,
            suggestion: 'Mark one implementation as @Primary or use @Qualifier for disambiguation',
            relatedTokens: implementations
          });
        } else if (primaries.length > 1) {
          issues.push({
            type: 'invalid-interface',
            severity: 'error',
            token: interfaceName,
            message: `Interface '${interfaceName}' has multiple primary implementations`,
            details: `Primary implementations: ${primaries.join(', ')}. Only one implementation should be marked as @Primary`,
            suggestion: 'Remove @Primary from all but one implementation',
            relatedTokens: primaries
          });
        }
      }
    }
    
    return issues;
  }
  
  private validateProfileConsistency(diConfig: Record<string, any>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const profileServices = new Map<string, string[]>();
    
    // Group services by profile
    for (const [token, config] of Object.entries(diConfig)) {
      const profiles = config.profiles || ['default'];
      for (const profile of profiles) {
        if (!profileServices.has(profile)) {
          profileServices.set(profile, []);
        }
        profileServices.get(profile)!.push(token);
      }
    }
    
    // Check for services that depend on services from inactive profiles
    if (this.config.activeProfiles) {
      const activeProfiles = new Set(this.config.activeProfiles);
      
      for (const [token, config] of Object.entries(diConfig)) {
        const tokenProfiles = config.profiles || ['default'];
        const isTokenActive = tokenProfiles.some((p: string) => activeProfiles.has(p));
        
        if (isTokenActive && config.dependencies) {
          for (const dep of config.dependencies) {
            const depConfig = diConfig[dep];
            if (depConfig) {
              const depProfiles = depConfig.profiles || ['default'];
              const isDepActive = depProfiles.some((p: string) => activeProfiles.has(p));
              
              if (!isDepActive) {
                issues.push({
                  type: 'invalid-interface',
                  severity: 'error',
                  token,
                  message: `Active service '${token}' depends on inactive service '${dep}'`,
                  details: `Service '${dep}' profiles [${depProfiles.join(', ')}] are not active [${Array.from(activeProfiles).join(', ')}]`,
                  suggestion: 'Ensure all service dependencies have compatible profiles',
                  relatedTokens: [dep]
                });
              }
            }
          }
        }
      }
    }
    
    return issues;
  }
  
  // Helper methods
  
  private countIssuesByType(issues: ValidationIssue[], type: ValidationIssue['type']): number {
    return issues.filter(issue => issue.type === type).length;
  }
  
  private suggestMissingServiceFix(missingToken: string, availableTokens: Set<string>): string {
    // Look for similar tokens
    const similar = Array.from(availableTokens).filter(token => {
      const tokenLower = token.toLowerCase();
      const missingLower = missingToken.toLowerCase();
      return tokenLower.includes(missingLower.substring(0, 4)) || 
             missingLower.includes(tokenLower.substring(0, 4));
    });
    
    if (similar.length > 0) {
      return `Did you mean: ${similar.slice(0, 3).join(', ')}?`;
    }
    
    // Suggest creating the service
    const className = this.tokenToClassName(missingToken);
    return `Create a service class '${className}' that implements '${missingToken}' and add @Service() decorator`;
  }
  
  private tokenToClassName(token: string): string {
    if (token.endsWith('Interface')) {
      return token.replace('Interface', '');
    }
    if (token.endsWith('Type')) {
      return token.replace('Type', '');
    }
    return token + 'Impl';
  }
  
  private estimateFilePath(className: string): string {
    if (!className) return '';
    
    const fileName = className
      .replace(/([A-Z])/g, (match, offset) => offset > 0 ? `-${match.toLowerCase()}` : match.toLowerCase())
      .replace(/^-/, '');
    
    if (className.includes('Service')) return `/src/services/${fileName}.ts`;
    if (className.includes('Repository')) return `/src/repositories/${fileName}.ts`;
    if (className.includes('Controller')) return `/src/controllers/${fileName}.ts`;
    
    return `/src/${fileName}.ts`;
  }
}