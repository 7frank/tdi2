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
  hasOnInit: boolean;
  hasOnDestroy: boolean;
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
   * Analyze dependencies - for now, assume all services might need lifecycle hooks
   * The actual interface checking will happen at runtime
   */
  private analyzeServiceLifecycle(dependencies: ExtractedDependency[]): ServiceLifecycleInfo[] {
    return dependencies.map(dep => ({
      serviceName: dep.serviceKey, // Use the service key (parameter name)
      hasOnMount: true, // Assume all services might have lifecycle hooks
      hasOnUnmount: true, // Runtime check will determine actual implementation
      hasOnInit: true,
      hasOnDestroy: true
    }));
  }

  /**
   * Generate the useEffect hook code - simple and clean pattern
   */
  private generateUseEffectCode(services: ServiceLifecycleInfo[]): string {
    const mountCalls: string[] = [];
    const unmountCalls: string[] = [];

    // Generate mount calls for all services (runtime will check if method exists)
    for (const service of services) {
      if (this.options.generateAbortController) {
        mountCalls.push(`    ${service.serviceName}?.onMount?.({ signal: abortController.signal });`);
      } else {
        mountCalls.push(`    ${service.serviceName}?.onMount?.();`);
      }
    }

    // Generate unmount calls
    for (const service of services) {
      unmountCalls.push(`      ${service.serviceName}?.onUnmount?.();`);
    }

    // Only generate if we have services to handle
    if (mountCalls.length === 0 && unmountCalls.length === 0) {
      return '';
    }

    // Build the clean useEffect code
    let useEffectCode = '';

    if (this.options.generateAbortController) {
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