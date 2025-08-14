// tools/interface-resolver/integrated-interface-resolver.ts - FIXED VERSION with enhanced generic resolution

import {
  Project,
  SourceFile,
  ClassDeclaration,
  Node,
} from "ts-morph";
import * as path from "path";

// Import enhanced components
import { EnhancedInterfaceExtractor, type DISourceConfiguration } from "./enhanced-interface-extractor";
import { EnhancedServiceValidator } from "./enhanced-service-validator";
import { InheritanceAnalyzer } from "./inheritance-analyzer";
import { StateTypeExtractor } from "./state-type-extractor";
import { DependencyAnalyzer } from "./dependency-analyzer";
import { KeySanitizer } from "./key-sanitizer";

// Import types
import type { 
  InterfaceImplementation, 
  ServiceDependency, 
  ValidationResult, 
  DependencyNode,
  InterfaceInfo,
  InheritanceInfo
} from "./interface-resolver-types";

export interface IntegratedResolverOptions {
  verbose?: boolean;
  srcDir?: string;
  enableInheritanceDI?: boolean;
  enableStateDI?: boolean;
  sourceConfig?: Partial<DISourceConfiguration>;
}

export class IntegratedInterfaceResolver {
  private project: Project;
  private interfaces: Map<string, InterfaceImplementation> = new Map();
  private dependencies: Map<string, ServiceDependency> = new Map();
  private options: Required<IntegratedResolverOptions>;

  // Enhanced components
  private interfaceExtractor: EnhancedInterfaceExtractor;
  private serviceValidator: EnhancedServiceValidator;
  private inheritanceAnalyzer: InheritanceAnalyzer;
  private stateTypeExtractor: StateTypeExtractor;
  private dependencyAnalyzer: DependencyAnalyzer;
  private keySanitizer: KeySanitizer;

  constructor(options: IntegratedResolverOptions = {}) {
    this.options = {
      verbose: false,
      srcDir: "./src",
      enableInheritanceDI: true,
      enableStateDI: true,
      sourceConfig: {},
      ...options,
    };

    this.project = new Project({
      tsConfigFilePath: "./tsconfig.json",
    });

    // Initialize components with source configuration
    this.keySanitizer = new KeySanitizer();
    
    this.interfaceExtractor = new EnhancedInterfaceExtractor(
      this.keySanitizer, 
      this.options.verbose, 
      this.options.sourceConfig
    );
    
    this.serviceValidator = new EnhancedServiceValidator(
      this.options.verbose, 
      this.options.sourceConfig
    );
    
    this.inheritanceAnalyzer = new InheritanceAnalyzer(this.keySanitizer, this.options.verbose);
    this.stateTypeExtractor = new StateTypeExtractor(this.keySanitizer, this.options.verbose);
    this.dependencyAnalyzer = new DependencyAnalyzer(this.keySanitizer, this.options.verbose);
  }

  async scanProject(): Promise<void> {
    if (this.options.verbose) {
      console.log("🔍 Scanning project with enhanced AST-based components...");
    }

    // Clear previous results
    this.interfaces.clear();
    this.dependencies.clear();

    try {
      // Add source files
      this.project.addSourceFilesAtPaths(
        `${this.options.srcDir}/**/*.{ts,tsx}`
      );

      // First pass: collect all interface implementations with enhanced extraction
      await this.collectInterfaceImplementationsEnhanced();

      // Second pass: collect service dependencies with enhanced validation
      await this.collectServiceDependenciesEnhanced();

      if (this.options.verbose) {
        console.log(
          `✅ Enhanced scan completed: ${this.interfaces.size} implementations, ${this.dependencies.size} services with dependencies`
        );
        this.logRegistrationSummary();
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn("⚠️  Error during enhanced project scanning:", error);
      }
      // Continue with partial results
    }
  }

  private async collectInterfaceImplementationsEnhanced(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      if (this.shouldSkipFile(sourceFile)) continue;

      try {
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
          await this.processClassWithEnhancedExtraction(classDecl, sourceFile);
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

  private async processClassWithEnhancedExtraction(
    classDecl: ClassDeclaration,
    sourceFile: SourceFile
  ): Promise<void> {
    const className = classDecl.getName();
    if (!className) return;

    try {
      // Enhanced service validation with source checking
      const serviceValidation = this.serviceValidator.validateServiceWithSources(classDecl);
      if (!serviceValidation.hasServiceDecorator) {
        if (this.options.verbose) {
          console.log(`⏭️  Skipping ${className} - no valid @Service decorator`);
        }
        return;
      }

      if (!serviceValidation.isValid) {
        if (this.options.verbose) {
          console.warn(`⚠️  Service validation issues for ${className}:`);
          serviceValidation.issues.forEach(issue => console.warn(`    - ${issue}`));
        }
        // Continue processing despite validation issues
      }

      // Enhanced interface extraction using AST methods
      const implementedInterfaces = this.interfaceExtractor.getImplementedInterfaces(classDecl);
      const extendedClasses = this.interfaceExtractor.getExtendedClasses(classDecl);
      const allHeritage = [...implementedInterfaces, ...extendedClasses];

      // Enhanced inheritance analysis
      const inheritanceInfo = this.inheritanceAnalyzer.getInheritanceInfo(classDecl);

      // Enhanced state-based registration extraction
      const stateBasedRegistrations = this.stateTypeExtractor.extractStateBasedRegistrations(
        implementedInterfaces,
        inheritanceInfo
      );

      // Track registration types
      let hasInterfaceRegistrations = false;
      let hasInheritanceRegistrations = false;
      let hasStateRegistrations = false;

      // Register interface-based implementations
      if (implementedInterfaces.length > 0) {
        hasInterfaceRegistrations = true;
        for (const interfaceInfo of implementedInterfaces) {
          await this.registerInterfaceImplementation(interfaceInfo, className, sourceFile);
        }
      }

      // Register inheritance-based implementations
      if (this.options.enableInheritanceDI && inheritanceInfo.hasInheritance) {
        hasInheritanceRegistrations = true;
        for (const inheritanceMapping of inheritanceInfo.inheritanceMappings) {
          await this.registerInheritanceImplementation(inheritanceMapping, className, sourceFile, inheritanceInfo);
        }
      }

      // Register state-based implementations  
      if (this.options.enableStateDI && stateBasedRegistrations.length > 0) {
        hasStateRegistrations = true;
        for (const stateRegistration of stateBasedRegistrations) {
          await this.registerStateImplementation(stateRegistration, className, sourceFile);
        }
      }

      // Always register class-based lookup (primary or secondary)
      await this.registerClassImplementation(
        className, 
        sourceFile, 
        !hasInterfaceRegistrations && !hasInheritanceRegistrations && !hasStateRegistrations
      );

    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to process class ${className}:`, error);
      }
    }
  }

  private async registerInterfaceImplementation(
    interfaceInfo: InterfaceInfo,
    className: string,
    sourceFile: SourceFile
  ): Promise<void> {
    const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceInfo.fullType);

    // Extract scope from @Service decorator
    const classDecl = sourceFile.getClass(className);
    const scope = classDecl ? this.extractScopeFromDecorator(classDecl) : "singleton";

    const implementation: InterfaceImplementation = {
      interfaceName: interfaceInfo.name,
      implementationClass: className,
      filePath: sourceFile.getFilePath(),
      isGeneric: interfaceInfo.isGeneric,
      typeParameters: interfaceInfo.typeParameters,
      sanitizedKey,
      isClassBased: false,
      isInheritanceBased: false,
      isStateBased: false,
      scope,
    };

    const uniqueKey = `${sanitizedKey}_${className}`;
    this.interfaces.set(uniqueKey, implementation);

    if (this.options.verbose) {
      console.log(
        `🔌 ${className} implements ${interfaceInfo.fullType} (key: ${sanitizedKey})`
      );
    }
  }

  private async registerInheritanceImplementation(
    inheritanceMapping: any,
    className: string,
    sourceFile: SourceFile,
    inheritanceInfo: InheritanceInfo
  ): Promise<void> {
    const sanitizedKey = this.keySanitizer.sanitizeInheritanceKey(inheritanceMapping.baseClassGeneric);

    // Extract scope from @Service decorator
    const classDecl = sourceFile.getClass(className);
    const scope = classDecl ? this.extractScopeFromDecorator(classDecl) : "singleton";

    const implementation: InterfaceImplementation = {
      interfaceName: inheritanceMapping.baseTypeName,
      implementationClass: className,
      filePath: sourceFile.getFilePath(),
      isGeneric: inheritanceMapping.isGeneric,
      typeParameters: inheritanceMapping.typeParameters,
      sanitizedKey,
      isClassBased: false,
      isInheritanceBased: true,
      isStateBased: false,
      inheritanceChain: inheritanceInfo.inheritanceChain,
      baseClass: inheritanceMapping.baseClass,
      baseClassGeneric: inheritanceMapping.baseClassGeneric,
      scope,
    };

    const uniqueKey = `${sanitizedKey}_${className}`;
    this.interfaces.set(uniqueKey, implementation);

    if (this.options.verbose) {
      console.log(
        `🧬 ${className} extends ${inheritanceMapping.baseClassGeneric} (key: ${sanitizedKey})`
      );
    }
  }

  private async registerStateImplementation(
    stateRegistration: any,
    className: string,
    sourceFile: SourceFile
  ): Promise<void> {
    const sanitizedKey = this.keySanitizer.sanitizeKey(stateRegistration.serviceInterface);

    // Extract scope from @Service decorator
    const classDecl = sourceFile.getClass(className);
    const scope = classDecl ? this.extractScopeFromDecorator(classDecl) : "singleton";

    const implementation: InterfaceImplementation = {
      interfaceName: stateRegistration.serviceInterface,
      implementationClass: className,
      filePath: sourceFile.getFilePath(),
      isGeneric: true,
      typeParameters: [stateRegistration.stateType],
      sanitizedKey,
      isClassBased: false,
      isInheritanceBased: false,
      isStateBased: true,
      stateType: stateRegistration.stateType,
      serviceInterface: stateRegistration.serviceInterface,
      scope,
    };

    const uniqueKey = `${sanitizedKey}_${className}_state`;
    this.interfaces.set(uniqueKey, implementation);

    if (this.options.verbose) {
      console.log(
        `🎯 ${className} manages state ${stateRegistration.stateType} via ${stateRegistration.serviceInterface} (key: ${sanitizedKey})`
      );
    }
  }

  private async registerClassImplementation(
    className: string,
    sourceFile: SourceFile,
    isPrimary: boolean
  ): Promise<void> {
    const sanitizedKey = this.keySanitizer.sanitizeKey(className);

    // Extract scope from @Service decorator
    const classDecl = sourceFile.getClass(className);
    const scope = classDecl ? this.extractScopeFromDecorator(classDecl) : "singleton";

    const implementation: InterfaceImplementation = {
      interfaceName: className,
      implementationClass: className,
      filePath: sourceFile.getFilePath(),
      isGeneric: false,
      typeParameters: [],
      sanitizedKey,
      isClassBased: true,
      isInheritanceBased: false,
      isStateBased: false,
      scope,
    };

    const uniqueKey = isPrimary 
      ? `${sanitizedKey}_${className}`
      : `${sanitizedKey}_${className}_direct`;
    
    this.interfaces.set(uniqueKey, implementation);

    if (this.options.verbose) {
      console.log(
        `📦 ${className} registered as ${isPrimary ? 'primary' : 'secondary'} class-based service (key: ${sanitizedKey})`
      );
    }
  }

  private async collectServiceDependenciesEnhanced(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      if (this.shouldSkipFile(sourceFile)) continue;

      try {
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
          await this.dependencyAnalyzer.processClassForDependencies(
            classDecl, 
            sourceFile, 
            this.dependencies,
            this.serviceValidator
          );
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

  private shouldSkipFile(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();
    return filePath.includes('generated') || 
           filePath.includes('node_modules') ||
           filePath.includes('.d.ts') ||
           filePath.includes('.tdi2');
  }

  private logRegistrationSummary(): void {
    const stats = {
      interface: 0,
      inheritance: 0,
      state: 0,
      class: 0
    };

    for (const [, impl] of this.interfaces) {
      if (impl.isStateBased) stats.state++;
      else if (impl.isInheritanceBased) stats.inheritance++;
      else if (impl.isClassBased) stats.class++;
      else stats.interface++;
    }

    console.log('\n📊 Registration Summary:');
    console.log(`  🔌 Interface-based: ${stats.interface}`);
    console.log(`  🧬 Inheritance-based: ${stats.inheritance}`);
    console.log(`  🎯 State-based: ${stats.state}`);
    console.log(`  📦 Class-based: ${stats.class}`);
    console.log(`  📋 Total: ${this.interfaces.size}\n`);
  }

  // FIXED: Enhanced resolution with comprehensive generic matching
  resolveImplementation(interfaceType: string): InterfaceImplementation | undefined {
    const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceType);
    
    if (this.options.verbose) {
      console.log(`🔍 Enhanced resolution: ${interfaceType} -> key: ${sanitizedKey}`);
    }

    // 1. Exact sanitized key match (highest priority)
    for (const [key, implementation] of this.interfaces) {
      if (implementation.sanitizedKey === sanitizedKey) {
        if (this.options.verbose) {
          console.log(`✅ Exact match: ${implementation.implementationClass} (${this.getRegistrationType(implementation)})`);
        }
        return implementation;
      }
    }

    // 2. FIXED: Generic interface matching - handle type parameter substitution
    const requestedInterfaceName = this.keySanitizer.extractBaseTypeName(interfaceType);
    const isRequestedGeneric = this.keySanitizer.isGenericType(interfaceType);
    
    if (isRequestedGeneric) {
      for (const [key, implementation] of this.interfaces) {
        // Match by interface name and generic capability
        if (implementation.interfaceName === requestedInterfaceName && implementation.isGeneric) {
          if (this.options.verbose) {
            console.log(`✅ Generic interface match: ${implementation.implementationClass} for ${interfaceType}`);
          }
          return implementation;
        }
      }
    }

    // 3. AsyncState pattern matching
    const asyncStateMatch = interfaceType.match(/^AsyncState<(.+)>$/);
    if (asyncStateMatch) {
      const stateType = asyncStateMatch[1];
      
      // Look for state-based registrations first
      for (const [key, implementation] of this.interfaces) {
        if (implementation.isStateBased && 
            implementation.stateType === stateType &&
            implementation.serviceInterface === interfaceType) {
          if (this.options.verbose) {
            console.log(`✅ AsyncState state-based match: ${implementation.implementationClass}`);
          }
          return implementation;
        }
      }
      
      // Look for inheritance-based registrations
      for (const [key, implementation] of this.interfaces) {
        if (implementation.isInheritanceBased && 
            implementation.baseClassGeneric === interfaceType) {
          if (this.options.verbose) {
            console.log(`✅ AsyncState inheritance match: ${implementation.implementationClass}`);
          }
          return implementation;
        }
      }
    }

    // 4. Inheritance-based lookups
    const inheritanceSanitizedKey = this.keySanitizer.sanitizeInheritanceKey(interfaceType);
    for (const [key, implementation] of this.interfaces) {
      if (implementation.isInheritanceBased && 
          (implementation.sanitizedKey === sanitizedKey || implementation.sanitizedKey === inheritanceSanitizedKey)) {
        if (this.options.verbose) {
          console.log(`✅ Inheritance match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 5. State-based lookups
    for (const [key, implementation] of this.interfaces) {
      if (implementation.isStateBased && implementation.sanitizedKey === sanitizedKey) {
        if (this.options.verbose) {
          console.log(`✅ State-based match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 6. Class-based lookups
    for (const [key, implementation] of this.interfaces) {
      if (implementation.isClassBased && implementation.sanitizedKey === sanitizedKey) {
        if (this.options.verbose) {
          console.log(`✅ Class-based match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 7. Fallback to interface name matching
    for (const [key, implementation] of this.interfaces) {
      if (implementation.interfaceName === interfaceType || implementation.interfaceName === requestedInterfaceName) {
        if (this.options.verbose) {
          console.log(`⚠️  Interface name fallback: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    if (this.options.verbose) {
      console.log(`❌ No implementation found for: ${interfaceType}`);
      console.log(`🔍 Searched for key: ${sanitizedKey}`);
      console.log(`🔍 Interface name: ${requestedInterfaceName}`);
      if (this.interfaces.size <= 10) {
        console.log(`📋 Available implementations:`, Array.from(this.interfaces.values()).map(i => `${i.interfaceName} -> ${i.implementationClass} (key: ${i.sanitizedKey})`));
      }
    }

    return undefined;
  }

  private getRegistrationType(implementation: InterfaceImplementation): string {
    if (implementation.isStateBased) return 'state';
    if (implementation.isInheritanceBased) return 'inheritance';
    if (implementation.isClassBased) return 'class';
    return 'interface';
  }

  // Enhanced validation with comprehensive checks
  validateDependencies(): ValidationResult {
    return this.serviceValidator.validateDependencies(this.dependencies, this.interfaces);
  }

  // Helper methods with enhanced functionality
  getImplementationsByInterface(interfaceName: string): InterfaceImplementation[] {
    const implementations: InterfaceImplementation[] = [];
    const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceName);

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

  getImplementationByClass(className: string): InterfaceImplementation | undefined {
    for (const [key, implementation] of this.interfaces) {
      if (implementation.implementationClass === className) {
        return implementation;
      }
    }
    return undefined;
  }

  getInterfaceImplementations(): Map<string, InterfaceImplementation> {
    return new Map(this.interfaces);
  }

  getServiceDependencies(): Map<string, ServiceDependency> {
    return new Map(this.dependencies);
  }

  getDependencyTree(): DependencyNode[] {
    const nodes: DependencyNode[] = [];

    for (const [serviceClass, dependency] of this.dependencies) {
      const resolved: string[] = [];

      for (const depKey of dependency.interfaceDependencies) {
        for (const [key, implementation] of this.interfaces) {
          if (implementation.sanitizedKey === depKey) {
            resolved.push(implementation.implementationClass);
            break;
          }
        }
      }

      nodes.push({
        id: serviceClass,
        dependencies: dependency.interfaceDependencies,
        resolved,
      });
    }

    return nodes;
  }

  // Configuration management
  updateSourceConfiguration(config: Partial<DISourceConfiguration>): void {
    this.interfaceExtractor.updateSourceConfiguration(config);
    this.serviceValidator.updateSourceConfiguration(config);
  }

  getSourceConfiguration(): DISourceConfiguration {
    return this.interfaceExtractor.getSourceConfiguration();
  }

  clearCaches(): void {
    this.interfaceExtractor.clearSourceCache();
    this.serviceValidator.clearValidationCache();
  }

  // Enhanced debug information
  getEnhancedDebugInfo(): {
    interfaceCount: number;
    dependencyCount: number;
    registrationTypes: Record<string, number>;
    validationStats: any;
    sourceConfig: DISourceConfiguration;
    resolutionSamples: Array<{input: string; result: string | null}>;
  } {
    const registrationTypes = {
      interface: 0,
      inheritance: 0,
      state: 0,
      class: 0
    };

    for (const [, impl] of this.interfaces) {
      const type = this.getRegistrationType(impl);
      (registrationTypes as any)[type]++;
    }

    // Test resolution for common patterns
    const testPatterns = [
      'LoggerInterface',
      'AsyncState<UserServiceState>',
      'Repository<User>',
      'CacheInterface<any>'
    ];

    const resolutionSamples = testPatterns.map(pattern => ({
      input: pattern,
      result: this.resolveImplementation(pattern)?.implementationClass || null
    }));

    return {
      interfaceCount: this.interfaces.size,
      dependencyCount: this.dependencies.size,
      registrationTypes,
      validationStats: this.serviceValidator.getValidationStats(),
      sourceConfig: this.getSourceConfiguration(),
      resolutionSamples
    };
  }

  /**
   * Extract scope from @Service decorator on a class
   */
  private extractScopeFromDecorator(classDecl: ClassDeclaration): "singleton" | "transient" | "scoped" {
    const decorators = classDecl.getDecorators();

    for (const decorator of decorators) {
      try {
        const expression = decorator.getExpression();
        const decoratorName = this.getDecoratorName(decorator);

        if (decoratorName && this.isServiceDecoratorName(decoratorName)) {
          // Check if decorator has arguments: @Service({scope: "transient"})
          if (Node.isCallExpression(expression)) {
            const args = expression.getArguments();
            if (args.length > 0) {
              const optionsArg = args[0];
              if (Node.isObjectLiteralExpression(optionsArg)) {
                const scopeProperty = optionsArg.getProperty("scope");
                if (scopeProperty && Node.isPropertyAssignment(scopeProperty)) {
                  const initializer = scopeProperty.getInitializer();
                  if (Node.isStringLiteral(initializer)) {
                    const scopeValue = initializer.getLiteralValue();
                    if (scopeValue === "singleton" || scopeValue === "transient" || scopeValue === "scoped") {
                      return scopeValue;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Continue searching other decorators
      }
    }

    // Also check for @Scope decorator
    for (const decorator of decorators) {
      try {
        const decoratorName = this.getDecoratorName(decorator);
        if (decoratorName === "Scope") {
          const expression = decorator.getExpression();
          if (Node.isCallExpression(expression)) {
            const args = expression.getArguments();
            if (args.length > 0) {
              const scopeArg = args[0];
              if (Node.isStringLiteral(scopeArg)) {
                const scopeValue = scopeArg.getLiteralValue();
                if (scopeValue === "singleton" || scopeValue === "transient" || scopeValue === "scoped") {
                  return scopeValue;
                }
              }
            }
          }
        }
      } catch (error) {
        // Continue searching
      }
    }

    return "singleton"; // Default scope
  }

  private getDecoratorName(decorator: any): string | null {
    try {
      const expression = decorator.getExpression();
      
      if (Node.isCallExpression(expression)) {
        const expr = expression.getExpression();
        if (Node.isIdentifier(expr)) {
          return expr.getText();
        }
      } else if (Node.isIdentifier(expression)) {
        return expression.getText();
      }
    } catch (error) {
      // Return null if extraction fails
    }
    return null;
  }

  private isServiceDecoratorName(decoratorName: string): boolean {
    return [
      'Service',
      'Component',
      'Injectable'
    ].includes(decoratorName);
  }
}