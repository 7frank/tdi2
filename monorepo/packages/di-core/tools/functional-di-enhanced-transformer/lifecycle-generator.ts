// tools/functional-di-enhanced-transformer/lifecycle-generator.ts - Generate React lifecycle hooks for DI services

import {
  FunctionDeclaration,
  ArrowFunction,
  SourceFile,
  SyntaxKind,
  StatementStructures,
  StructureKind
} from 'ts-morph';
import { ExtractedDependency } from '../shared/SharedDependencyExtractor';

export interface LifecycleGenerationOptions {
  verbose?: boolean;
  generateAbortController?: boolean;
  combineMultipleServices?: boolean;
}

export interface ServiceLifecycleInfo {
  serviceName: string;
  hasOnMount: boolean;
  hasOnUnmount: boolean;
  hasPostConstruct: boolean;
  hasPreDestroy: boolean;
  isAsync: boolean;
}

export class LifecycleGenerator {
  constructor(private options: LifecycleGenerationOptions = {}) {}

  /**
   * Generate useEffect hook for service lifecycle management
   */
  generateLifecycleHooks(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[],
    sourceFile: SourceFile
  ): void {
    // Analyze which services need lifecycle hooks
    const servicesWithLifecycle = this.analyzeServiceLifecycle(dependencies);
    
    if (servicesWithLifecycle.length === 0) {
      if (this.options.verbose) {
        console.log('🔄 No services with lifecycle hooks found');
      }
      return;
    }

    if (this.options.verbose) {
      console.log(`🔄 Generating lifecycle hooks for ${servicesWithLifecycle.length} services`);
    }

    // Generate the useEffect hook
    const useEffectCode = this.generateUseEffectCode(servicesWithLifecycle);
    
    // Add the useEffect to the function body
    this.insertUseEffectIntoFunction(func, useEffectCode);

    // Ensure React import is available
    this.ensureReactImport(sourceFile);
  }

  /**
   * Analyze dependencies to determine which have lifecycle hooks
   */
  private analyzeServiceLifecycle(dependencies: ExtractedDependency[]): ServiceLifecycleInfo[] {
    const servicesWithLifecycle: ServiceLifecycleInfo[] = [];

    for (const dep of dependencies) {
      // In a real implementation, we would analyze the service class to detect
      // @OnMount, @OnUnmount, @PostConstruct, @PreDestroy decorators
      // For now, we'll simulate this analysis
      const lifecycleInfo = this.detectServiceLifecycleMetadata(dep);
      
      if (this.hasAnyLifecycleHook(lifecycleInfo)) {
        servicesWithLifecycle.push(lifecycleInfo);
      }
    }

    return servicesWithLifecycle;
  }

  /**
   * Detect lifecycle metadata for a service (placeholder - would analyze actual service class)
   */
  private detectServiceLifecycleMetadata(dependency: ExtractedDependency): ServiceLifecycleInfo {
    // TODO: Implement actual analysis of service class for lifecycle decorators
    // This would involve:
    // 1. Reading the service implementation file
    // 2. Parsing the class for @OnMount, @OnUnmount, @PostConstruct, @PreDestroy
    // 3. Determining if methods are async
    
    // For now, return simulated data based on naming patterns
    const serviceName = dependency.localVariableName || dependency.interfaceName;
    
    return {
      serviceName,
      hasOnMount: this.serviceNameSuggestsLifecycle(serviceName, 'mount'),
      hasOnUnmount: this.serviceNameSuggestsLifecycle(serviceName, 'unmount'),
      hasPostConstruct: this.serviceNameSuggestsLifecycle(serviceName, 'init'),
      hasPreDestroy: this.serviceNameSuggestsLifecycle(serviceName, 'cleanup'),
      isAsync: this.serviceNameSuggestsAsync(serviceName)
    };
  }

  /**
   * Simple heuristic to detect if service name suggests lifecycle usage
   */
  private serviceNameSuggestsLifecycle(serviceName: string, type: string): boolean {
    const name = serviceName.toLowerCase();
    switch (type) {
      case 'mount':
        return name.includes('timer') || name.includes('polling') || name.includes('subscription');
      case 'unmount':
        return name.includes('timer') || name.includes('polling') || name.includes('subscription');
      case 'init':
        return name.includes('data') || name.includes('cache') || name.includes('api');
      case 'cleanup':
        return name.includes('connection') || name.includes('subscription') || name.includes('timer');
      default:
        return false;
    }
  }

  /**
   * Simple heuristic to detect if service might have async lifecycle methods
   */
  private serviceNameSuggestsAsync(serviceName: string): boolean {
    const name = serviceName.toLowerCase();
    return name.includes('api') || name.includes('data') || name.includes('fetch') || name.includes('load');
  }

  /**
   * Check if service has any lifecycle hooks
   */
  private hasAnyLifecycleHook(info: ServiceLifecycleInfo): boolean {
    return info.hasOnMount || info.hasOnUnmount || info.hasPostConstruct || info.hasPreDestroy;
  }

  /**
   * Generate the useEffect hook code
   */
  private generateUseEffectCode(services: ServiceLifecycleInfo[]): string {
    const mountCalls: string[] = [];
    const unmountCalls: string[] = [];
    const hasAsyncCalls = services.some(s => s.isAsync);

    // Generate mount calls
    for (const service of services) {
      if (service.hasOnMount) {
        if (hasAsyncCalls && this.options.generateAbortController) {
          mountCalls.push(
            `    ${service.serviceName}.onMount?.({ signal: abortController.signal });`
          );
        } else {
          mountCalls.push(`    ${service.serviceName}.onMount?.();`);
        }
      }
      
      if (service.hasPostConstruct) {
        // PostConstruct is typically called during service creation, not in useEffect
        // But for component-scoped services, we might call it here
        mountCalls.push(`    ${service.serviceName}.__postConstruct?.();`);
      }
    }

    // Generate unmount calls
    for (const service of services) {
      if (service.hasOnUnmount) {
        unmountCalls.push(`      ${service.serviceName}.onUnmount?.();`);
      }
      
      if (service.hasPreDestroy) {
        unmountCalls.push(`      ${service.serviceName}.__preDestroy?.();`);
      }
    }

    // Build the useEffect code
    let useEffectCode = '';

    if (hasAsyncCalls && this.options.generateAbortController) {
      useEffectCode = `
  React.useEffect(() => {
    const abortController = new AbortController();
    
${mountCalls.join('\n')}

    return () => {
      abortController.abort();
${unmountCalls.join('\n')}
    };
  }, []);`;
    } else {
      useEffectCode = `
  React.useEffect(() => {
${mountCalls.join('\n')}

    return () => {
${unmountCalls.join('\n')}
    };
  }, []);`;
    }

    return useEffectCode.trim();
  }

  /**
   * Insert useEffect into function body
   */
  private insertUseEffectIntoFunction(
    func: FunctionDeclaration | ArrowFunction,
    useEffectCode: string
  ): void {
    const body = func.getBody();
    
    if (!body) {
      if (this.options.verbose) {
        console.warn('⚠️  Function has no body, cannot insert useEffect');
      }
      return;
    }

    // Find the best insertion point (after variable declarations, before JSX return)
    const statements = body.getStatements();
    let insertIndex = 0;

    // Skip variable declarations and other setup code
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.getKind() === SyntaxKind.VariableStatement ||
          statement.getKind() === SyntaxKind.ExpressionStatement) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    // Insert the useEffect
    body.insertStatements(insertIndex, useEffectCode);

    if (this.options.verbose) {
      console.log(`✅ Inserted useEffect at position ${insertIndex}`);
    }
  }

  /**
   * Ensure React import is available for useEffect
   */
  private ensureReactImport(sourceFile: SourceFile): void {
    const imports = sourceFile.getImportDeclarations();
    const hasReactImport = imports.some(imp => 
      imp.getModuleSpecifierValue() === 'react' ||
      imp.getNamedImports().some(named => named.getName() === 'useEffect')
    );

    if (!hasReactImport) {
      // Check if there's already a React namespace import
      const hasReactNamespace = imports.some(imp => 
        imp.getNamespaceImport()?.getText() === 'React' ||
        imp.getModuleSpecifierValue() === 'react'
      );

      if (!hasReactNamespace) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: 'react',
          namespaceImport: 'React'
        });
        
        if (this.options.verbose) {
          console.log('✅ Added React import for useEffect');
        }
      }
    }
  }

  /**
   * Generate lifecycle hooks for specific service types
   */
  generateServiceTypeSpecificHooks(
    serviceType: 'timer' | 'subscription' | 'api' | 'websocket',
    serviceName: string
  ): string {
    switch (serviceType) {
      case 'timer':
        return `
  React.useEffect(() => {
    ${serviceName}.startTimer?.();
    return () => ${serviceName}.stopTimer?.();
  }, []);`;

      case 'subscription':
        return `
  React.useEffect(() => {
    const subscription = ${serviceName}.subscribe?.();
    return () => subscription?.unsubscribe();
  }, []);`;

      case 'api':
        return `
  React.useEffect(() => {
    const abortController = new AbortController();
    ${serviceName}.initialize?.({ signal: abortController.signal });
    
    return () => {
      abortController.abort();
      ${serviceName}.cleanup?.();
    };
  }, []);`;

      case 'websocket':
        return `
  React.useEffect(() => {
    ${serviceName}.connect?.();
    return () => ${serviceName}.disconnect?.();
  }, []);`;

      default:
        return '';
    }
  }
}