// tools/functional-di-enhanced-transformer/lifecycle-generator.ts - Generate React lifecycle hooks for DI services

import {
  FunctionDeclaration,
  ArrowFunction,
  SourceFile,
  SyntaxKind,
  StatementStructures,
  StructureKind,
  Project,
  ClassDeclaration
} from 'ts-morph';
import { ExtractedDependency } from '../shared/SharedDependencyExtractor';
import type { IntegratedInterfaceResolver } from '../interface-resolver/integrated-interface-resolver';

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
  constructor(
    private options: LifecycleGenerationOptions = {},
    private interfaceResolver?: IntegratedInterfaceResolver
  ) {}

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
   * Analyze dependencies to check which ones actually implement lifecycle interfaces
   * Only generate hooks for services that implement OnMount/OnUnmount/OnInit/OnDestroy
   */
  private analyzeServiceLifecycle(dependencies: ExtractedDependency[]): ServiceLifecycleInfo[] {
    const servicesWithLifecycle: ServiceLifecycleInfo[] = [];

    for (const dep of dependencies) {
      const lifecycleInfo = this.checkServiceLifecycleInterfaces(dep);
      
      // Only include services that actually implement lifecycle interfaces
      if (lifecycleInfo.hasOnMount || lifecycleInfo.hasOnUnmount || lifecycleInfo.hasOnInit || lifecycleInfo.hasOnDestroy) {
        servicesWithLifecycle.push(lifecycleInfo);
        
        if (this.options.verbose) {
          const implementedInterfaces = [];
          if (lifecycleInfo.hasOnMount) implementedInterfaces.push('OnMount');
          if (lifecycleInfo.hasOnUnmount) implementedInterfaces.push('OnUnmount');
          if (lifecycleInfo.hasOnInit) implementedInterfaces.push('OnInit');
          if (lifecycleInfo.hasOnDestroy) implementedInterfaces.push('OnDestroy');
          
          console.log(`🔄 ${dep.serviceKey} implements: ${implementedInterfaces.join(', ')}`);
        }
      } else {
        if (this.options.verbose) {
          console.log(`⏭️  Skipping ${dep.serviceKey} - no lifecycle interfaces`);
        }
      }
    }

    return servicesWithLifecycle;
  }

  /**
   * Check if a service implementation actually implements lifecycle interfaces
   * This integrates with the interface resolver to check the actual service class
   */
  private checkServiceLifecycleInterfaces(dependency: ExtractedDependency): ServiceLifecycleInfo {
    // Default: no lifecycle interfaces
    let hasOnMount = false;
    let hasOnUnmount = false;  
    let hasOnInit = false;
    let hasOnDestroy = false;

    // If we have resolved implementation information and interface resolver, check the actual service class
    if (dependency.resolvedImplementation && dependency.resolvedImplementation.filePath && this.interfaceResolver) {
      try {
        const implementationClass = dependency.resolvedImplementation.implementationClass;
        const filePath = dependency.resolvedImplementation.filePath;
        
        if (this.options.verbose) {
          console.log(`🔍 Checking lifecycle interfaces for ${implementationClass} in ${filePath}`);
        }

        // Use the interface resolver to analyze the service class
        const lifecycleInterfaces = this.analyzeServiceClassForLifecycleInterfaces(filePath, implementationClass);
        
        hasOnMount = lifecycleInterfaces.hasOnMount;
        hasOnUnmount = lifecycleInterfaces.hasOnUnmount;
        hasOnInit = lifecycleInterfaces.hasOnInit;
        hasOnDestroy = lifecycleInterfaces.hasOnDestroy;
        
      } catch (error) {
        if (this.options.verbose) {
          console.warn(`⚠️  Could not analyze lifecycle interfaces for ${dependency.serviceKey}:`, error);
        }
        
        // Fallback to pattern-based detection
        const hasLifecyclePatterns = this.hasLifecyclePatterns(dependency);
        if (hasLifecyclePatterns) {
          hasOnMount = true;
          hasOnUnmount = true;
          hasOnInit = true; 
          hasOnDestroy = true;
        }
      }
    } else if (dependency.resolvedImplementation) {
      // Fallback to pattern-based detection when interface resolver is not available
      if (this.options.verbose) {
        console.log(`⚠️  No interface resolver available, using pattern-based detection for ${dependency.serviceKey}`);
      }
      
      const hasLifecyclePatterns = this.hasLifecyclePatterns(dependency);
      if (hasLifecyclePatterns) {
        hasOnMount = true;
        hasOnUnmount = true;
        hasOnInit = true; 
        hasOnDestroy = true;
      }
    }

    return {
      serviceName: dependency.serviceKey,
      hasOnMount,
      hasOnUnmount,
      hasOnInit,
      hasOnDestroy
    };
  }

  /**
   * Analyze a service class file to check for lifecycle interface implementations
   * Returns which lifecycle interfaces are actually implemented
   */
  private analyzeServiceClassForLifecycleInterfaces(filePath: string, className: string): {
    hasOnMount: boolean;
    hasOnUnmount: boolean;
    hasOnInit: boolean;
    hasOnDestroy: boolean;
  } {
    let hasOnMount = false;
    let hasOnUnmount = false;
    let hasOnInit = false;
    let hasOnDestroy = false;

    try {
      // Create a temporary project to analyze the specific file
      const project = new Project();
      const sourceFile = project.addSourceFileAtPath(filePath);
      
      // Find the class declaration
      const classDecl = sourceFile.getClass(className);
      if (!classDecl) {
        if (this.options.verbose) {
          console.warn(`⚠️  Could not find class ${className} in ${filePath}`);
        }
        return { hasOnMount, hasOnUnmount, hasOnInit, hasOnDestroy };
      }

      // Check implemented interfaces
      const implementsClause = classDecl.getImplements();
      for (const implementsExpr of implementsClause) {
        const interfaceName = implementsExpr.getText();
        
        // Check for lifecycle interfaces
        if (interfaceName.includes('OnMount')) {
          hasOnMount = true;
        }
        if (interfaceName.includes('OnUnmount')) {
          hasOnUnmount = true;
        }
        if (interfaceName.includes('OnInit')) {
          hasOnInit = true;
        }
        if (interfaceName.includes('OnDestroy')) {
          hasOnDestroy = true;
        }
      }

      // Also check if the class has the actual methods (even if interface is not explicitly declared)
      const methods = classDecl.getMethods();
      for (const method of methods) {
        const methodName = method.getName();
        
        if (methodName === 'onMount') {
          hasOnMount = true;
        }
        if (methodName === 'onUnmount') {
          hasOnUnmount = true;
        }
        if (methodName === 'onInit') {
          hasOnInit = true;
        }
        if (methodName === 'onDestroy') {
          hasOnDestroy = true;
        }
      }

      if (this.options.verbose) {
        const implemented = [];
        if (hasOnMount) implemented.push('OnMount');
        if (hasOnUnmount) implemented.push('OnUnmount');
        if (hasOnInit) implemented.push('OnInit');  
        if (hasOnDestroy) implemented.push('OnDestroy');
        
        if (implemented.length > 0) {
          console.log(`✅ ${className} implements: ${implemented.join(', ')}`);
        } else {
          console.log(`⏭️  ${className} has no lifecycle interfaces`);
        }
      }

    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Error analyzing ${className} in ${filePath}:`, error);
      }
    }

    return { hasOnMount, hasOnUnmount, hasOnInit, hasOnDestroy };
  }

  /**
   * Temporary method to detect lifecycle patterns until full interface resolver integration
   */
  private hasLifecyclePatterns(dependency: ExtractedDependency): boolean {
    // Check for common service patterns that typically implement lifecycle
    const interfaceType = dependency.interfaceType.toLowerCase();
    const serviceKey = dependency.serviceKey.toLowerCase();
    
    // Common patterns that suggest lifecycle usage
    const lifecyclePatterns = [
      'service', 'manager', 'controller', 'handler', 'processor', 
      'timer', 'subscription', 'websocket', 'api', 'cache', 'store'
    ];
    
    return lifecyclePatterns.some(pattern => 
      interfaceType.includes(pattern) || serviceKey.includes(pattern)
    );
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

    // Find the best insertion point (after ALL variable declarations, before JSX return)
    const statements = body.getStatements();
    let insertIndex = statements.length; // Default to end if no return found

    // Find the return statement (JSX) and insert before it
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.getKind() === SyntaxKind.ReturnStatement) {
        insertIndex = i;
        break;
      }
    }

    // Insert the useEffect before the return statement
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