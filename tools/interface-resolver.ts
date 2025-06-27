// tools/interface-resolver.ts - FIXED to support both interface-based and class-based DI

import {
  Project,
  SourceFile,
  ClassDeclaration,
  InterfaceDeclaration,
  TypeParameterDeclaration,
  Node,
  SyntaxKind,
} from "ts-morph";
import * as path from "path";

export interface InterfaceImplementation {
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  sanitizedKey: string;
  isClassBased?: boolean; // NEW: Indicates if this is a class-based registration
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
      srcDir: "./src",
      ...options,
    };

    this.project = new Project({
      tsConfigFilePath: "./tsconfig.json",
    });
  }

  async scanProject(): Promise<void> {
    if (this.options.verbose) {
      console.log("🔍 Scanning project for interfaces and implementations...");
    }

    // Clear previous results
    this.interfaces.clear();
    this.dependencies.clear();

    try {
      // Add source files
      this.project.addSourceFilesAtPaths(
        `${this.options.srcDir}/**/*.{ts,tsx}`
      );

      // First pass: collect all interface implementations AND standalone services
      await this.collectInterfaceImplementations();

      // Second pass: collect service dependencies
      await this.collectServiceDependencies();

      if (this.options.verbose) {
        console.log(
          `✅ Found ${this.interfaces.size} interface implementations`
        );
        console.log(
          `✅ Found ${this.dependencies.size} services with dependencies`
        );
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn("⚠️  Error during project scanning:", error);
      }
      // Continue with partial results
    }
  }

  private async collectInterfaceImplementations(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      try {
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
          await this.processClassForInterfaces(classDecl, sourceFile);
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn(
            `⚠️  Failed to process ${sourceFile.getBaseName()}:`,
            error
          );
        }
        // Continue processing other files
      }
    }
  }

  private async processClassForInterfaces(
    classDecl: ClassDeclaration,
    sourceFile: SourceFile
  ): Promise<void> {
    const className = classDecl.getName();
    if (!className) return;

    try {
      // Check if class has any service decorator (@Service, @AutoWireService, etc.)
      const hasServiceDecorator = classDecl
        .getDecorators()
        .some((decorator) => {
          try {
            const expression = decorator.getExpression();
            if (Node.isCallExpression(expression)) {
              const expressionText = expression.getExpression().getText();
              return (
                expressionText === "Service" ||
                expressionText === "AutoWireService" ||
                expressionText.includes("Service")
              );
            } else if (Node.isIdentifier(expression)) {
              // Handle decorators without parentheses like @Service
              const expressionText = expression.getText();
              return (
                expressionText === "Service" ||
                expressionText === "AutoWireService" ||
                expressionText.includes("Service")
              );
            }
          } catch (error) {
            // Ignore malformed decorators
          }
          return false;
        });

      if (!hasServiceDecorator) return;

      // Get implemented interfaces
      const implementedInterfaces = this.getImplementedInterfaces(classDecl);

      if (implementedInterfaces.length > 0) {
        // EXISTING: Register interface-based implementations
        for (const interfaceInfo of implementedInterfaces) {
          const sanitizedKey = this.sanitizeKey(interfaceInfo.fullType);

          const implementation: InterfaceImplementation = {
            interfaceName: interfaceInfo.name,
            implementationClass: className,
            filePath: sourceFile.getFilePath(),
            isGeneric: interfaceInfo.isGeneric,
            typeParameters: interfaceInfo.typeParameters,
            sanitizedKey,
            isClassBased: false,
          };

          // Use interface name + class name as unique key to allow multiple implementations
          const uniqueKey = `${sanitizedKey}_${className}`;
          this.interfaces.set(uniqueKey, implementation);

          if (this.options.verbose) {
            console.log(
              `📝 ${className} implements ${interfaceInfo.fullType} (key: ${sanitizedKey})`
            );
          }
        }
      } else {
        // NEW: Register class-based implementation (class acts as its own interface)
        const sanitizedKey = this.sanitizeKey(className);

        const implementation: InterfaceImplementation = {
          interfaceName: className, // Class name acts as interface name
          implementationClass: className,
          filePath: sourceFile.getFilePath(),
          isGeneric: false, // Classes are typically not generic for DI purposes
          typeParameters: [],
          sanitizedKey,
          isClassBased: true, // Mark as class-based
        };

        const uniqueKey = `${sanitizedKey}_${className}`;
        this.interfaces.set(uniqueKey, implementation);

        if (this.options.verbose) {
          console.log(
            `📝 ${className} registered as class-based service (key: ${sanitizedKey})`
          );
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to process class ${className}:`, error);
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

    try {
      const heritageClauses = classDecl.getHeritageClauses();

      for (const heritage of heritageClauses) {
        // Check if this is an implements clause
        const token = heritage.getToken();
        if (token === SyntaxKind.ImplementsKeyword) {
          for (const type of heritage.getTypeNodes()) {
            const fullType = type.getText();
            const isGeneric = fullType.includes("<");

            let name = fullType;
            let typeParameters: string[] = [];

            if (isGeneric) {
              const match = fullType.match(/^([^<]+)<(.+)>$/);
              if (match) {
                name = match[1];
                typeParameters = match[2].split(",").map((p) => p.trim());
              }
            }

            interfaces.push({
              name,
              fullType,
              isGeneric,
              typeParameters,
            });
          }
        }
      }
    } catch (error) {
      // Handle malformed heritage clauses gracefully
      if (this.options.verbose) {
        console.warn(
          `⚠️  Failed to parse interfaces for ${classDecl.getName()}:`,
          error
        );
      }
    }

    return interfaces;
  }

  private async collectServiceDependencies(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      try {
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
          await this.processClassForDependencies(classDecl, sourceFile);
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn(
            `⚠️  Failed to process dependencies in ${sourceFile.getBaseName()}:`,
            error
          );
        }
        // Continue processing other files
      }
    }
  }

  private async processClassForDependencies(
    classDecl: ClassDeclaration,
    sourceFile: SourceFile
  ): Promise<void> {
    const className = classDecl.getName();
    if (!className) return;

    try {
      // Check if class has any DI decorator (@Service, @AutoWireService, etc.)
      const hasServiceDecorator = classDecl
        .getDecorators()
        .some((decorator) => {
          try {
            const expression = decorator.getExpression();
            if (Node.isCallExpression(expression)) {
              const expressionText = expression.getExpression().getText();
              return (
                expressionText === "Service" ||
                expressionText === "AutoWireService" ||
                expressionText.includes("Service")
              );
            } else if (Node.isIdentifier(expression)) {
              // Handle decorators without parentheses like @Service
              const expressionText = expression.getText();
              return (
                expressionText === "Service" ||
                expressionText === "AutoWireService" ||
                expressionText.includes("Service")
              );
            }
          } catch (error) {
            // Ignore malformed decorators
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
        try {
          // Check if parameter has any inject decorator (@Inject, @AutoWireInject, etc.)
          const hasInjectDecorator = param.getDecorators().some((decorator) => {
            try {
              const expression = decorator.getExpression();
              if (Node.isCallExpression(expression)) {
                const expressionText = expression.getExpression().getText();
                return (
                  expressionText === "Inject" ||
                  expressionText === "AutoWireInject" ||
                  expressionText === "Autowired" ||
                  expressionText.includes("Inject")
                );
              } else if (Node.isIdentifier(expression)) {
                // Handle decorators without parentheses
                const expressionText = expression.getText();
                return (
                  expressionText === "Inject" ||
                  expressionText === "AutoWireInject" ||
                  expressionText === "Autowired" ||
                  expressionText.includes("Inject")
                );
              }
            } catch (error) {
              // Ignore malformed decorators
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
            sanitizedKey,
          });

          interfaceDependencies.push(sanitizedKey);

          if (this.options.verbose) {
            console.log(
              `🔗 ${className} depends on ${paramType} (key: ${sanitizedKey})`
            );
          }
        } catch (error) {
          // Skip malformed parameters
          if (this.options.verbose) {
            console.warn(
              `⚠️  Failed to process parameter in ${className}:`,
              error
            );
          }
        }
      }

      if (constructorParams.length > 0) {
        this.dependencies.set(className, {
          serviceClass: className,
          interfaceDependencies,
          filePath: sourceFile.getFilePath(),
          constructorParams,
        });
      }
    } catch (error) {
      // Handle malformed class gracefully
      if (this.options.verbose) {
        console.warn(
          `⚠️  Failed to process dependencies for ${className}:`,
          error
        );
      }
    }
  }

  // Enhanced resolution that supports both interface and class-based lookup
  resolveImplementation(
    interfaceType: string
  ): InterfaceImplementation | undefined {
    const sanitizedKey = this.sanitizeKey(interfaceType);

    // First try: Find interface-based implementation
    for (const [key, implementation] of this.interfaces) {
      if (implementation.sanitizedKey === sanitizedKey && !implementation.isClassBased) {
        return implementation;
      }
    }

    // Second try: Find class-based implementation (exact class name match)
    for (const [key, implementation] of this.interfaces) {
      if (implementation.sanitizedKey === sanitizedKey && implementation.isClassBased) {
        return implementation;
      }
    }

    // Third try: Fallback to any implementation with matching key
    for (const [key, implementation] of this.interfaces) {
      if (implementation.sanitizedKey === sanitizedKey) {
        return implementation;
      }
    }

    return undefined;
  }

  // Alternative approach: Create a method to normalize generic types consistently
  private normalizeGenericType(type: string): string {
    // Strategy: All generic type parameters become 'any' for matching purposes
    // CacheInterface<T> -> CacheInterface<any>
    // CacheInterface<string> -> CacheInterface<any>
    // CacheInterface<User> -> CacheInterface<any>
    // This allows any implementation to match any usage

    return type.replace(/<[^>]*>/g, "<any>");
  }

  // Enhanced sanitizeKey that uses normalization
  private sanitizeKey(type: string): string {
    try {
      // Step 1: Normalize generic types to use 'any'
      const normalized = this.normalizeGenericType(type.trim());

      // Step 2: Convert to safe identifier
      const sanitized = normalized
        .replace(/<any>/g, "_any") // CacheInterface<any> -> CacheInterface_any
        .replace(/[^\w]/g, "_") // Replace remaining special chars
        .replace(/_+/g, "_") // Remove multiple underscores
        .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

      return sanitized || type.replace(/[^\w]/g, "_");
    } catch (error) {
      return type.replace(/[^\w]/g, "_");
    }
  }

  // Helper method to get implementations by interface name
  getImplementationsByInterface(
    interfaceName: string
  ): InterfaceImplementation[] {
    const implementations: InterfaceImplementation[] = [];
    const sanitizedKey = this.sanitizeKey(interfaceName);

    for (const [key, implementation] of this.interfaces) {
      if (
        implementation.sanitizedKey === sanitizedKey ||
        implementation.interfaceName === interfaceName
      ) {
        implementations.push(implementation);
      }
    }

    return implementations;
  }

  // Helper method to get implementation by class name
  getImplementationByClass(
    className: string
  ): InterfaceImplementation | undefined {
    for (const [key, implementation] of this.interfaces) {
      if (implementation.implementationClass === className) {
        return implementation;
      }
    }
    return undefined;
  }

  // Public API methods
  getInterfaceImplementations(): Map<string, InterfaceImplementation> {
    return this.interfaces;
  }

  getServiceDependencies(): Map<string, ServiceDependency> {
    return this.dependencies;
  }

  getDependencyTree(): DependencyNode[] {
    const nodes: DependencyNode[] = [];

    for (const [serviceClass, dependency] of this.dependencies) {
      const resolved: string[] = [];

      for (const depKey of dependency.interfaceDependencies) {
        for (const [key, implementation] of this.interfaces) {
          if (implementation.sanitizedKey === depKey) {
            resolved.push(implementation.implementationClass);
            break; // Take first match
          }
        }
      }

      const node: DependencyNode = {
        id: serviceClass,
        dependencies: dependency.interfaceDependencies,
        resolved,
      };

      nodes.push(node);
    }

    return nodes;
  }

  validateDependencies(): ValidationResult {
    const missing: string[] = [];
    const circular: string[] = [];

    // Check for missing implementations
    for (const [serviceClass, dependency] of this.dependencies) {
      for (const depKey of dependency.interfaceDependencies) {
        let found = false;
        for (const [key, implementation] of this.interfaces) {
          if (implementation.sanitizedKey === depKey) {
            found = true;
            break;
          }
        }
        if (!found) {
          missing.push(`${serviceClass} -> ${depKey}`);
        }
      }
    }

    // Improved circular dependency detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string, path: string[] = []): boolean => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0) {
          const cycle = path.slice(cycleStart).concat([node]);
          circular.push(cycle.join(" -> "));
        }
        return true;
      }

      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const dependency = this.dependencies.get(node);
      if (dependency) {
        for (const depKey of dependency.interfaceDependencies) {
          // Find implementation for this dependency
          for (const [key, implementation] of this.interfaces) {
            if (implementation.sanitizedKey === depKey) {
              if (
                hasCycle(implementation.implementationClass, [...path, node])
              ) {
                recursionStack.delete(node);
                return true;
              }
              break;
            }
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
      circularDependencies: circular,
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