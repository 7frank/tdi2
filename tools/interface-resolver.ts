// tools/interface-resolver.ts - Automatic interface-to-implementation resolution

import { 
  Project, 
  SourceFile, 
  ClassDeclaration,
  InterfaceDeclaration,
  TypeParameterDeclaration,
  Node,
  SyntaxKind
} from 'ts-morph';
import * as path from 'path';

export interface InterfaceImplementation {
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  sanitizedKey: string;
}

export interface ServiceDependency {
  serviceClass: string;
  interfaceDependencies: string[];
  filePath: string;
  constructorParams: ConstructorParam[];
}

export interface ConstructorParam {
  paramName: string;
  interfaceType: string;
  isOptional: boolean;
  sanitizedKey: string;
}

export class InterfaceResolver {
  private project: Project;
  private interfaces: Map<string, InterfaceImplementation> = new Map();
  private dependencies: Map<string, ServiceDependency> = new Map();
  private options: { verbose: boolean; srcDir: string };

  constructor(options: { verbose?: boolean; srcDir?: string } = {}) {
    this.options = {
      verbose: false,
      srcDir: './src',
      ...options
    };

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json'
    });
  }

  async scanProject(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔍 Scanning project for interfaces and implementations...');
    }

    // Add source files
    this.project.addSourceFilesAtPaths(`${this.options.srcDir}/**/*.{ts,tsx}`);

    // First pass: collect all interface implementations
    await this.collectInterfaceImplementations();

    // Second pass: collect service dependencies
    await this.collectServiceDependencies();

    if (this.options.verbose) {
      console.log(`✅ Found ${this.interfaces.size} interface implementations`);
      console.log(`✅ Found ${this.dependencies.size} services with dependencies`);
    }
  }

  private async collectInterfaceImplementations(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();
      
      for (const classDecl of classes) {
        await this.processClassForInterfaces(classDecl, sourceFile);
      }
    }
  }

  private async processClassForInterfaces(classDecl: ClassDeclaration, sourceFile: SourceFile): Promise<void> {
    const className = classDecl.getName();
    if (!className) return;

    // Check if class has any service decorator (@Service, @AutoWireService, etc.)
    const hasServiceDecorator = classDecl.getDecorators().some(decorator => {
      const expression = decorator.getExpression();
      if (Node.isCallExpression(expression)) {
        const expressionText = expression.getExpression().getText();
        return expressionText === 'Service' || 
               expressionText === 'AutoWireService' ||
               expressionText.includes('Service');
      } else if (Node.isIdentifier(expression)) {
        // Handle decorators without parentheses like @Service
        const expressionText = expression.getText();
        return expressionText === 'Service' || 
               expressionText === 'AutoWireService' ||
               expressionText.includes('Service');
      }
      return false;
    });

    if (!hasServiceDecorator) return;

    // Get implemented interfaces
    const implementedInterfaces = this.getImplementedInterfaces(classDecl);
    
    for (const interfaceInfo of implementedInterfaces) {
      const sanitizedKey = this.sanitizeKey(interfaceInfo.fullType);
      
      const implementation: InterfaceImplementation = {
        interfaceName: interfaceInfo.name,
        implementationClass: className,
        filePath: sourceFile.getFilePath(),
        isGeneric: interfaceInfo.isGeneric,
        typeParameters: interfaceInfo.typeParameters,
        sanitizedKey
      };

      this.interfaces.set(sanitizedKey, implementation);

      if (this.options.verbose) {
        console.log(`📝 ${className} implements ${interfaceInfo.fullType} (key: ${sanitizedKey})`);
      }
    }
  }

  private getImplementedInterfaces(classDecl: ClassDeclaration): Array<{
    name: string;
    fullType: string;
    isGeneric: boolean;
    typeParameters: string[];
  }> {
    const interfaces: Array<{
      name: string;
      fullType: string;
      isGeneric: boolean;
      typeParameters: string[];
    }> = [];

    const heritageClauses = classDecl.getHeritageClauses();
    
    for (const heritage of heritageClauses) {
      // Check if this is an implements clause
      const token = heritage.getToken();
      const isImplementsClause = token === SyntaxKind.ImplementsKeyword || heritage.getText().includes('implements');
      
      if (isImplementsClause) {
        for (const type of heritage.getTypeNodes()) {
          const fullType = type.getText();
          const isGeneric = fullType.includes('<');
          
          let name = fullType;
          let typeParameters: string[] = [];
          
          if (isGeneric) {
            const match = fullType.match(/^([^<]+)<(.+)>$/);
            if (match) {
              name = match[1];
              typeParameters = match[2].split(',').map(p => p.trim());
            }
          }

          interfaces.push({
            name,
            fullType,
            isGeneric,
            typeParameters
          });
        }
      }
    }

    return interfaces;
  }

  private async collectServiceDependencies(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();
      
      for (const classDecl of classes) {
        await this.processClassForDependencies(classDecl, sourceFile);
      }
    }
  }

  private async processClassForDependencies(classDecl: ClassDeclaration, sourceFile: SourceFile): Promise<void> {
    const className = classDecl.getName();
    if (!className) return;

    // Check if class has any DI decorator (@Service, @AutoWireService, etc.)
    const hasServiceDecorator = classDecl.getDecorators().some(decorator => {
      const expression = decorator.getExpression();
      if (Node.isCallExpression(expression)) {
        const expressionText = expression.getExpression().getText();
        return expressionText === 'Service' || 
               expressionText === 'AutoWireService' ||
               expressionText.includes('Service');
      } else if (Node.isIdentifier(expression)) {
        // Handle decorators without parentheses like @Service
        const expressionText = expression.getText();
        return expressionText === 'Service' || 
               expressionText === 'AutoWireService' ||
               expressionText.includes('Service');
      }
      return false;
    });

    if (!hasServiceDecorator) return;

    const constructors = classDecl.getConstructors();
    if (constructors.length === 0) return;

    const constructor = constructors[0];
    const parameters = constructor.getParameters();
    
    const constructorParams: ConstructorParam[] = [];
    const interfaceDependencies: string[] = [];

    for (const param of parameters) {
      // Check if parameter has any inject decorator (@Inject, @AutoWireInject, etc.)
      const hasInjectDecorator = param.getDecorators().some(decorator => {
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const expressionText = expression.getExpression().getText();
          return expressionText === 'Inject' || 
                 expressionText === 'AutoWireInject' ||
                 expressionText === 'Autowired' ||
                 expressionText.includes('Inject');
        } else if (Node.isIdentifier(expression)) {
          // Handle decorators without parentheses
          const expressionText = expression.getText();
          return expressionText === 'Inject' || 
                 expressionText === 'AutoWireInject' ||
                 expressionText === 'Autowired' ||
                 expressionText.includes('Inject');
        }
        return false;
      });

      if (!hasInjectDecorator) continue;

      const paramType = param.getTypeNode()?.getText();
      if (!paramType) continue;

      const sanitizedKey = this.sanitizeKey(paramType);
      const paramName = param.getName();
      const isOptional = param.hasQuestionToken();

      constructorParams.push({
        paramName,
        interfaceType: paramType,
        isOptional,
        sanitizedKey
      });

      interfaceDependencies.push(sanitizedKey);

      if (this.options.verbose) {
        console.log(`🔗 ${className} depends on ${paramType} (key: ${sanitizedKey})`);
      }
    }

    if (constructorParams.length > 0) {
      this.dependencies.set(className, {
        serviceClass: className,
        interfaceDependencies,
        filePath: sourceFile.getFilePath(),
        constructorParams
      });
    }
  }

  private sanitizeKey(type: string): string {
    // First normalize generic parameters before removing special characters
    let normalized = type;
    
    // Replace common generic type parameters with 'any' to unify them
    // This allows CacheInterface<T> to match CacheInterface<any>
    normalized = normalized.replace(/<(T|U|V|K|any|string|number|boolean|\w+)>/g, '<any>');
    
    // Then remove special characters and convert to safe key
    const sanitized = normalized
      .replace(/[^\w\s]/gi, '_')
      .replace(/_+/g, '_') // Remove multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    return sanitized;
  }

  // Public API methods
  getInterfaceImplementations(): Map<string, InterfaceImplementation> {
    return this.interfaces;
  }

  getServiceDependencies(): Map<string, ServiceDependency> {
    return this.dependencies;
  }

  resolveImplementation(interfaceType: string): InterfaceImplementation | undefined {
    const sanitizedKey = this.sanitizeKey(interfaceType);
    return this.interfaces.get(sanitizedKey);
  }

  getDependencyTree(): DependencyNode[] {
    const nodes: DependencyNode[] = [];
    
    for (const [serviceClass, dependency] of this.dependencies) {
      const node: DependencyNode = {
        id: serviceClass,
        dependencies: dependency.interfaceDependencies,
        resolved: dependency.interfaceDependencies.map(dep => {
          const impl = this.interfaces.get(dep);
          return impl ? impl.implementationClass : null;
        }).filter(Boolean) as string[]
      };
      
      nodes.push(node);
    }
    
    return nodes;
  }

  validateDependencies(): ValidationResult {
    const missing: string[] = [];
    const circular: string[] = [];
    
    for (const [serviceClass, dependency] of this.dependencies) {
      for (const depKey of dependency.interfaceDependencies) {
        if (!this.interfaces.has(depKey)) {
          missing.push(`${serviceClass} -> ${depKey}`);
        }
      }
    }

    // Simple circular dependency detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        circular.push(node);
        return true;
      }
      
      if (visited.has(node)) return false;
      
      visited.add(node);
      recursionStack.add(node);
      
      const dependency = this.dependencies.get(node);
      if (dependency) {
        for (const depKey of dependency.interfaceDependencies) {
          const impl = this.interfaces.get(depKey);
          if (impl && hasCycle(impl.implementationClass)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    for (const serviceClass of this.dependencies.keys()) {
      if (!visited.has(serviceClass)) {
        hasCycle(serviceClass);
      }
    }

    return {
      isValid: missing.length === 0 && circular.length === 0,
      missingImplementations: missing,
      circularDependencies: circular
    };
  }
}

export interface DependencyNode {
  id: string;
  dependencies: string[];
  resolved: string[];
}

export interface ValidationResult {
  isValid: boolean;
  missingImplementations: string[];
  circularDependencies: string[];
}