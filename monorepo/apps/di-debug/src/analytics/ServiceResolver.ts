// Service resolution tracing to debug why services aren't being discovered or resolved

import type { 
  ResolutionPath, 
  ResolutionStep, 
  ServiceDiscoveryIssue,
  AnalyticsConfig 
} from './types';

export class ServiceResolver {
  private config: AnalyticsConfig;
  
  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      verbose: false,
      ...config
    };
  }
  
  /**
   * Trace the complete resolution path for a service token
   */
  traceResolution(
    token: string, 
    diConfig: Record<string, any>, 
    interfaceResolver?: any
  ): ResolutionPath {
    const steps: ResolutionStep[] = [];
    let success = false;
    let error: string | undefined;
    
    try {
      // Step 1: Check if token exists in DI config
      steps.push(this.checkDIConfigStep(token, diConfig, 1));
      
      if (diConfig[token]) {
        // Step 2: Verify implementation class
        const config = diConfig[token];
        steps.push(this.verifyImplementationStep(token, config, 2));
        
        // Step 3: Trace dependencies
        if (config.dependencies && config.dependencies.length > 0) {
          steps.push(this.traceDependenciesStep(token, config, diConfig, 3));
        }
        
        success = true;
      } else {
        // Try to understand why the token is missing
        steps.push(...this.diagnoseMissingTokenSteps(token, diConfig, interfaceResolver, 2));
        error = `Service token '${token}' not found in DI configuration`;
      }
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error during resolution';
      steps.push({
        step: steps.length + 1,
        token,
        strategy: 'factory',
        status: 'failed',
        details: error
      });
    }
    
    if (this.config.verbose) {
      console.log(`🔍 Resolution trace for '${token}': ${success ? 'SUCCESS' : 'FAILED'}`);
      steps.forEach(step => {
        console.log(`  Step ${step.step}: ${step.status.toUpperCase()} - ${step.details || step.token}`);
      });
    }
    
    return {
      target: token,
      steps,
      success,
      error
    };
  }
  
  /**
   * Find all unresolved service tokens
   */
  findUnresolvedTokens(diConfig: Record<string, any>): string[] {
    const unresolved: string[] = [];
    const availableTokens = new Set(Object.keys(diConfig));
    
    for (const [token, config] of Object.entries(diConfig)) {
      if (config.dependencies) {
        for (const dep of config.dependencies) {
          if (!availableTokens.has(dep)) {
            unresolved.push(dep);
          }
        }
      }
    }
    
    return [...new Set(unresolved)]; // Remove duplicates
  }
  
  /**
   * Diagnose service discovery issues (like the TodoService problem)
   */
  diagnoseServiceDiscovery(
    expectedServices: string[], 
    diConfig: Record<string, any>,
    srcDir?: string
  ): ServiceDiscoveryIssue[] {
    const issues: ServiceDiscoveryIssue[] = [];
    const foundTokens = new Set(Object.keys(diConfig));
    
    for (const expectedToken of expectedServices) {
      if (!foundTokens.has(expectedToken)) {
        // Try to diagnose why this service wasn't discovered
        const issue = this.analyzeDiscoveryFailure(expectedToken, srcDir);
        issues.push(issue);
      }
    }
    
    return issues;
  }
  
  /**
   * Trace all dependency chains for a service
   */
  traceAllDependencyChains(
    token: string, 
    diConfig: Record<string, any>, 
    maxDepth: number = 10
  ): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();
    
    const traceDependencies = (current: string, chain: string[], depth: number): void => {
      if (depth > maxDepth || visited.has(current)) {
        if (visited.has(current)) {
          chains.push([...chain, `${current} (circular)`]);
        }
        return;
      }
      
      const currentChain = [...chain, current];
      const config = diConfig[current];
      
      if (!config || !config.dependencies || config.dependencies.length === 0) {
        chains.push(currentChain);
        return;
      }
      
      visited.add(current);
      
      for (const dep of config.dependencies) {
        traceDependencies(dep, currentChain, depth + 1);
      }
      
      visited.delete(current);
    };
    
    traceDependencies(token, [], 0);
    return chains;
  }
  
  /**
   * Generate resolution summary for all services
   */
  generateResolutionSummary(diConfig: Record<string, any>): {
    totalServices: number;
    resolvedServices: number;
    unresolvedDependencies: string[];
    circularDependencies: string[][];
    orphanedServices: string[];
    resolutionStrategies: Record<string, number>;
  } {
    const totalServices = Object.keys(diConfig).length;
    const unresolvedDependencies = this.findUnresolvedTokens(diConfig);
    const circularDependencies: string[][] = [];
    const orphanedServices: string[] = [];
    const resolutionStrategies: Record<string, number> = {
      interface: 0,
      class: 0,
      inheritance: 0,
      state: 0,
      factory: 0
    };
    
    // Analyze each service
    for (const [token, config] of Object.entries(diConfig)) {
      // Count resolution strategy
      const strategy = this.determineResolutionStrategy(config);
      resolutionStrategies[strategy]++;
      
      // Check if service is orphaned (has dependencies but no dependents)
      if (this.isOrphanedService(token, diConfig)) {
        orphanedServices.push(token);
      }
      
      // Check for circular dependencies
      const chains = this.traceAllDependencyChains(token, diConfig, 5);
      for (const chain of chains) {
        if (chain.some(step => step.includes('circular'))) {
          const circularChain = chain.map(step => step.replace(' (circular)', ''));
          if (!circularDependencies.some(existing => this.arraysEqual(existing, circularChain))) {
            circularDependencies.push(circularChain);
          }
        }
      }
    }
    
    const resolvedServices = totalServices - unresolvedDependencies.length;
    
    return {
      totalServices,
      resolvedServices,
      unresolvedDependencies,
      circularDependencies,
      orphanedServices,
      resolutionStrategies
    };
  }
  
  // Private helper methods
  
  private checkDIConfigStep(token: string, diConfig: Record<string, any>, stepNumber: number): ResolutionStep {
    const found = diConfig[token];
    return {
      step: stepNumber,
      token,
      strategy: 'interface',
      status: found ? 'success' : 'failed',
      details: found 
        ? `Found '${token}' in DI configuration` 
        : `Token '${token}' not found in DI configuration`
    };
  }
  
  private verifyImplementationStep(token: string, config: any, stepNumber: number): ResolutionStep {
    const implementationClass = config.implementationClass;
    return {
      step: stepNumber,
      token,
      strategy: this.determineResolutionStrategy(config),
      implementation: implementationClass,
      filePath: this.estimateFilePath(implementationClass),
      status: implementationClass ? 'success' : 'failed',
      details: implementationClass 
        ? `Implementation: ${implementationClass} (${config.registrationType})` 
        : 'No implementation class found'
    };
  }
  
  private traceDependenciesStep(token: string, config: any, diConfig: Record<string, any>, stepNumber: number): ResolutionStep {
    const dependencies = config.dependencies || [];
    const unresolvedDeps = dependencies.filter((dep: string) => !diConfig[dep]);
    
    return {
      step: stepNumber,
      token,
      strategy: 'factory',
      status: unresolvedDeps.length === 0 ? 'success' : 'failed',
      details: unresolvedDeps.length === 0 
        ? `All ${dependencies.length} dependencies resolved: ${dependencies.join(', ')}` 
        : `Unresolved dependencies: ${unresolvedDeps.join(', ')}`
    };
  }
  
  private diagnoseMissingTokenSteps(
    token: string, 
    diConfig: Record<string, any>, 
    interfaceResolver: any, 
    startStep: number
  ): ResolutionStep[] {
    const steps: ResolutionStep[] = [];
    
    // Check if there are similar tokens
    const similarTokens = this.findSimilarTokens(token, Object.keys(diConfig));
    steps.push({
      step: startStep,
      token,
      strategy: 'interface',
      status: 'failed',
      details: similarTokens.length > 0 
        ? `Similar tokens found: ${similarTokens.join(', ')}` 
        : 'No similar tokens found'
    });
    
    // Try to find the expected service class
    const expectedClassName = this.tokenToClassName(token);
    steps.push({
      step: startStep + 1,
      token,
      strategy: 'class',
      status: 'failed',
      details: `Expected class: ${expectedClassName} - check if class exists and has @Service decorator`
    });
    
    return steps;
  }
  
  private analyzeDiscoveryFailure(expectedToken: string, srcDir?: string): ServiceDiscoveryIssue {
    const expectedClassName = this.tokenToClassName(expectedToken);
    const estimatedFilePath = this.estimateFilePath(expectedClassName, srcDir);
    
    return {
      type: 'decorator-not-detected',
      filePath: estimatedFilePath,
      className: expectedClassName,
      expectedToken,
      diagnostic: `Service '${expectedClassName}' not discovered. Check: 1) File exists at expected path, 2) Class has @Service() decorator, 3) Class implements the expected interface, 4) File is included in source scanning.`,
      fixes: [
        `Verify ${expectedClassName} class exists`,
        `Add @Service() decorator to ${expectedClassName}`,
        `Ensure ${expectedClassName} implements ${expectedToken}`,
        `Check if file ${estimatedFilePath} is being scanned`,
        `Verify interface resolution is working for ${expectedToken}`
      ]
    };
  }
  
  private determineResolutionStrategy(config: any):  ResolutionStep['strategy'] {
    if (config.registrationType === 'interface') return 'interface';
    if (config.isInheritanceBased) return 'inheritance';
    if (config.isClassBased) return 'class';
    return 'factory';
  }
  
  private isOrphanedService(token: string, diConfig: Record<string, any>): boolean {
    const config = diConfig[token];
    if (!config || !config.dependencies || config.dependencies.length === 0) return false;
    
    // Check if any other service depends on this token
    for (const [otherToken, otherConfig] of Object.entries(diConfig)) {
      if (otherToken !== token && otherConfig.dependencies && otherConfig.dependencies.includes(token)) {
        return false;
      }
    }
    
    return true;
  }
  
  private findSimilarTokens(target: string, tokens: string[]): string[] {
    const targetLower = target.toLowerCase();
    return tokens
      .filter(token => {
        const tokenLower = token.toLowerCase();
        return tokenLower.includes(targetLower.substring(0, 5)) || 
               targetLower.includes(tokenLower.substring(0, 5));
      })
      .slice(0, 3); // Return top 3 similar tokens
  }
  
  private tokenToClassName(token: string): string {
    // Convert token to expected class name
    if (token.endsWith('Interface')) {
      return token.replace('Interface', '');
    }
    if (token.endsWith('Type')) {
      return token.replace('Type', '');
    }
    return token;
  }
  
  private estimateFilePath(className: string, srcDir: string = '/src'): string {
    const fileName = className
      .replace(/([A-Z])/g, (match, offset) => offset > 0 ? `-${match.toLowerCase()}` : match.toLowerCase())
      .replace(/^-/, '');
    
    if (className.includes('Service')) {
      return `${srcDir}/services/${fileName}.ts`;
    }
    if (className.includes('Repository')) {
      return `${srcDir}/repositories/${fileName}.ts`;
    }
    if (className.includes('Controller')) {
      return `${srcDir}/controllers/${fileName}.ts`;
    }
    
    return `${srcDir}/${fileName}.ts`;
  }
  
  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
}