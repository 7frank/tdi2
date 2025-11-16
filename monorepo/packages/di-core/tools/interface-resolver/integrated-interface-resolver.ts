// tools/interface-resolver/integrated-interface-resolver.ts - FIXED VERSION with enhanced generic resolution

import {
  Project,
  SourceFile,
  ClassDeclaration,
  Node,
  SyntaxKind,
} from "ts-morph";

// Import enhanced components
import { EnhancedInterfaceExtractor, type DISourceConfiguration } from "./enhanced-interface-extractor";
import { EnhancedServiceValidator } from "./enhanced-service-validator";
import { InheritanceAnalyzer } from "./inheritance-analyzer";
import { DependencyAnalyzer } from "./dependency-analyzer";
import { consoleFor } from "../logger";

const console = consoleFor('di-core:interface-resolver');
import { KeySanitizer } from "./key-sanitizer";

// Import types
import type { 
  InterfaceImplementation, 
  ServiceDependency, 
  ValidationResult, 
  DependencyNode,
  InterfaceInfo,
  InheritanceInfo,
  SourceLocation
} from "./interface-resolver-types";

export interface IntegratedResolverOptions {
  verbose?: boolean;

  scanDirs?: string[];
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
  private dependencyAnalyzer: DependencyAnalyzer;
  private keySanitizer: KeySanitizer;

  constructor(options: IntegratedResolverOptions = {}) {
    // Support both scanDirs (new) and srcDir (backward compat)
    const scanDirs = options.scanDirs || ['./src'];

    this.options = {
      verbose: false,
      srcDir: scanDirs[0], // Keep for backward compat
      scanDirs: scanDirs,
      enableInheritanceDI: true,
      enableStateDI: true,
      sourceConfig: {},
      ...options,
    } as Required<IntegratedResolverOptions>;

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
    this.dependencyAnalyzer = new DependencyAnalyzer(this.keySanitizer, this.options.verbose);
  }

  async scanProject(): Promise<void> {
    console.log("🔍 Scanning project with enhanced AST-based components...");

    // Clear previous results
    this.interfaces.clear();
    this.dependencies.clear();

    try {
      // Add source files from all scan directories
      const scanDirs = this.options.scanDirs;
      for (const dir of scanDirs) {
        this.project.addSourceFilesAtPaths(`${dir}/**/*.{ts,tsx}`);
      }

      // First pass: collect all interface implementations with enhanced extraction
      await this.collectInterfaceImplementationsEnhanced();

      // Second pass: collect service dependencies with enhanced validation
      await this.collectServiceDependenciesEnhanced();

      console.log(
        `✅ Enhanced scan completed: ${this.interfaces.size} implementations, ${this.dependencies.size} services with dependencies`
      );
      this.logRegistrationSummary();
    } catch (error) {
      console.warn("⚠️  Error during enhanced project scanning:", error);
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
        console.warn(
          `⚠️  Failed to process ${sourceFile.getBaseName()}:`,
          error
        );
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
        console.log(`⏭️  Skipping ${className} - no valid @Service decorator`);
        return;
      }

      if (!serviceValidation.isValid) {
        console.warn(`⚠️  Service validation issues for ${className}:`);
        serviceValidation.issues.forEach(issue => console.warn(`    - ${issue}`));
        // Continue processing despite validation issues
      }

      // Enhanced interface extraction using AST methods
      const implementedInterfaces = this.interfaceExtractor.getImplementedInterfaces(classDecl, sourceFile);

      // Enhanced inheritance analysis
      const inheritanceInfo = this.inheritanceAnalyzer.getInheritanceInfo(classDecl);


      // Track registration types
      let hasInterfaceRegistrations = false;
      let hasInheritanceRegistrations = false;

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


      // Always register class-based lookup (primary or secondary)
      await this.registerClassImplementation(
        className, 
        sourceFile, 
        !hasInterfaceRegistrations && !hasInheritanceRegistrations
      );

    } catch (error) {
      console.warn(`⚠️  Failed to process class ${className}:`, error);
    }
  }

  private async registerInterfaceImplementation(
    interfaceInfo: InterfaceInfo,
    className: string,
    sourceFile: SourceFile
  ): Promise<void> {
    // Use location-based key generation to prevent interface name collisions
    const sanitizedKey = this.keySanitizer.createLocationBasedKey(
      interfaceInfo.fullType,
      interfaceInfo.location?.filePath,
      interfaceInfo.location?.lineNumber
    );

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
      location: interfaceInfo.location,
      registrationType: 'interface',
      isClassBased: false,
      isInheritanceBased: false,
      scope,
    };


    this.interfaces.set(sanitizedKey, implementation);

    console.log(
      `🔌 ${className} implements ${interfaceInfo.fullType} (key: ${sanitizedKey})`
    );
  }

  private async registerInheritanceImplementation(
    inheritanceMapping: any,
    className: string,
    sourceFile: SourceFile,
    inheritanceInfo: InheritanceInfo
  ): Promise<void> {
    // Extract location info from inheritance heritage clause
    const location = this.extractLocationFromInheritance(className, sourceFile);
    
    // Use location-based key generation if location is available
    const sanitizedKey = location 
      ? this.keySanitizer.createLocationBasedKeyFromLocation(inheritanceMapping.baseTypeName, location)
      : this.keySanitizer.sanitizeInheritanceKey(inheritanceMapping.baseClassGeneric);

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
      location,
      registrationType: 'inheritance',
      isClassBased: false,
      isInheritanceBased: true,
      inheritanceChain: inheritanceInfo.inheritanceChain,
      baseClass: inheritanceMapping.baseClass,
      baseClassGeneric: inheritanceMapping.baseClassGeneric,
      scope,
    };

    this.interfaces.set(sanitizedKey, implementation);

    console.log(
      `🧬 ${className} extends ${inheritanceMapping.baseClassGeneric} (key: ${sanitizedKey})`
    );
  }


  private async registerClassImplementation(
    className: string,
    sourceFile: SourceFile,
    isPrimary: boolean
  ): Promise<void> {
    // Extract location info from class declaration
    const location = this.extractLocationFromClass(className, sourceFile);
    
    // Use location-based key generation if location is available
    const sanitizedKey = location 
      ? this.keySanitizer.createLocationBasedKeyFromLocation(className, location)
      : this.keySanitizer.sanitizeKey(className);

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
      location,
      registrationType: 'class',
      isClassBased: true,
      isInheritanceBased: false,
      scope,
    };

    this.interfaces.set(sanitizedKey, implementation);

    console.log(
      `📦 ${className} registered as ${isPrimary ? 'primary' : 'secondary'} class-based service (key: ${sanitizedKey})`
    );
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
        console.warn(
          `⚠️  Failed to process dependencies in ${sourceFile.getBaseName()}:`,
          error
        );
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
      class: 0
    };

    for (const [, impl] of this.interfaces) {
      if (impl.isInheritanceBased) stats.inheritance++;
      else if (impl.isClassBased) stats.class++;
      else stats.interface++;
    }

    console.log('\n📊 Registration Summary:');
    console.log(`  🔌 Interface-based: ${stats.interface}`);
    console.log(`  🧬 Inheritance-based: ${stats.inheritance}`);
    console.log(`  📦 Class-based: ${stats.class}`);
    console.log(`  📋 Total: ${this.interfaces.size}\n`);
  }

  // ENHANCED: Resolution with location-based key support and interface name collision handling
  resolveImplementation(interfaceType: string): InterfaceImplementation | undefined {
    // Check if this is a location-based key request
    const isLocationBasedRequest = this.keySanitizer.isLocationBasedKey(interfaceType);
    let sanitizedKey: string;
    
    if (isLocationBasedRequest) {
      // Use the location-based key directly
      sanitizedKey = interfaceType;
    } else {
      // Create standard sanitized key for fallback
      sanitizedKey = this.keySanitizer.sanitizeKey(interfaceType);
    }
    
    console.log(`🔍 Enhanced resolution: ${interfaceType} -> key: ${sanitizedKey} (location-based: ${isLocationBasedRequest})`);

    // 1. Exact key match (highest priority) - handles both location-based and standard keys  
    for (const [storedKey, implementation] of this.interfaces) {
      // Check for exact stored key match
      if (storedKey === sanitizedKey || storedKey === interfaceType) {
        console.log(`✅ Exact stored key match: ${implementation.implementationClass} (${implementation.registrationType})`);
        return implementation;
      }
      
      // For location-based keys, check if the stored key starts with the requested location-based key
      if (isLocationBasedRequest && storedKey.startsWith(sanitizedKey + '_')) {
        console.log(`✅ Location-based key prefix match: ${implementation.implementationClass} (${implementation.registrationType})`);
        return implementation;
      }
      
      // Check sanitizedKey match (for backward compatibility)
      if (implementation.sanitizedKey === sanitizedKey || implementation.sanitizedKey === interfaceType) {
        console.log(`✅ Sanitized key match: ${implementation.implementationClass} (${implementation.registrationType})`);
        return implementation;
      }
    }
    
    // 1b. If this was a location-based request but no exact match, extract interface name and try interface matching
    if (isLocationBasedRequest) {
      const extractedInterfaceName = this.keySanitizer.extractInterfaceNameFromLocationKey(interfaceType);
      console.log(`🔄 Location-based key failed, trying interface name: ${extractedInterfaceName}`);
      // Recursively try with just the interface name
      return this.resolveImplementation(extractedInterfaceName);
    }

    // 2. FIXED: Generic interface matching - handle type parameter substitution
    const requestedInterfaceName = this.keySanitizer.extractBaseTypeName(interfaceType);
    const isRequestedGeneric = this.keySanitizer.isGenericType(interfaceType);
    
    if (isRequestedGeneric) {
      for (const [, implementation] of this.interfaces) {
        // Match by interface name and generic capability
        if (implementation.interfaceName === requestedInterfaceName && implementation.isGeneric) {
          console.log(`✅ Generic interface match: ${implementation.implementationClass} for ${interfaceType}`);
          return implementation;
        }
      }
    }


    // 4. Inheritance-based lookups
    const inheritanceSanitizedKey = this.keySanitizer.sanitizeInheritanceKey(interfaceType);
    for (const [, implementation] of this.interfaces) {
      if (implementation.isInheritanceBased && 
          (implementation.sanitizedKey === sanitizedKey || implementation.sanitizedKey === inheritanceSanitizedKey)) {
        console.log(`✅ Inheritance match: ${implementation.implementationClass}`);
        return implementation;
      }
    }


    // 5. Class-based lookups
    for (const [, implementation] of this.interfaces) {
      if (implementation.isClassBased && implementation.sanitizedKey === sanitizedKey) {
        console.log(`✅ Class-based match: ${implementation.implementationClass}`);
        return implementation;
      }
    }

    // 6. Fallback to interface name matching
    for (const [, implementation] of this.interfaces) {
      if (implementation.interfaceName === interfaceType || implementation.interfaceName === requestedInterfaceName) {
        console.log(`⚠️  Interface name fallback: ${implementation.implementationClass}`);
        return implementation;
      }
    }

    console.log(`❌ No implementation found for: ${interfaceType}`);
    console.log(`🔍 Searched for key: ${sanitizedKey}`);
    console.log(`🔍 Interface name: ${requestedInterfaceName}`);
    if (this.interfaces.size <= 10) {
      console.log(`📋 Available implementations:`, Array.from(this.interfaces.values()).map(i => `${i.interfaceName} -> ${i.implementationClass} (key: ${i.sanitizedKey})`));
    }

    return undefined;
  }

  // Enhanced validation with comprehensive checks
  validateDependencies(): ValidationResult {
    return this.serviceValidator.validateDependencies(this.dependencies, this.interfaces);
  }

  // Helper methods with enhanced functionality
  getImplementationsByInterface(interfaceName: string): InterfaceImplementation[] {
    const implementations: InterfaceImplementation[] = [];
    const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceName);

    for (const [, implementation] of this.interfaces) {
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
    for (const [, implementation] of this.interfaces) {
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
        for (const [, implementation] of this.interfaces) {
          // Handle both location-based and standard key matching
          if (implementation.sanitizedKey === depKey) {
            // Exact match (backward compatibility)
            resolved.push(implementation.implementationClass);
            break;
          } else if (this.keySanitizer.isLocationBasedKey(implementation.sanitizedKey)) {
            // For location-based keys, check if they start with the dependency key
            const interfaceName = this.keySanitizer.extractInterfaceNameFromLocationKey(implementation.sanitizedKey);
            if (interfaceName === depKey) {
              resolved.push(implementation.implementationClass);
              break;
            }
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
      class: 0
    };

    for (const [, impl] of this.interfaces) {
      const type = impl.registrationType;
      (registrationTypes as any)[type]++;
    }

    // Test resolution for common patterns
    const testPatterns = [
      'LoggerInterface',
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

  /**
   * Extract location information from an AST node
   */
  private extractLocationFromNode(node: Node, sourceFile: SourceFile): SourceLocation | undefined {
    if (!node || !sourceFile) {
      return undefined;
    }

    try {
      const startPos = node.getStart();
      if (startPos === undefined) {
        return undefined;
      }

      const { line } = sourceFile.getLineAndColumnAtPos(startPos);
      return {
        filePath: sourceFile.getFilePath(),
        lineNumber: line
      };
    } catch (error) {
      console.warn(`⚠️  Could not extract location from AST node:`, error);
      return undefined;
    }
  }

  /**
   * Extract location information from a class declaration
   */
  private extractLocationFromClass(className: string, sourceFile: SourceFile): SourceLocation | undefined {
    try {
      const classDecl = sourceFile.getClass(className);
      if (!classDecl) {
        return undefined;
      }

      return this.extractLocationFromNode(classDecl, sourceFile);
    } catch (error) {
      console.warn(`⚠️  Could not extract location from class ${className}:`, error);
      return undefined;
    }
  }

  /**
   * Extract location information from inheritance heritage clause
   */
  private extractLocationFromInheritance(className: string, sourceFile: SourceFile): SourceLocation | undefined {
    try {
      const classDecl = sourceFile.getClass(className);
      if (!classDecl) {
        return undefined;
      }

      // Find the extends heritage clause
      const heritageClauses = classDecl.getHeritageClauses();
      for (const heritageClause of heritageClauses) {
        if (heritageClause.getToken() === SyntaxKind.ExtendsKeyword) {
          const types = heritageClause.getTypeNodes();
          if (types.length > 0) {
            return this.extractLocationFromNode(types[0], sourceFile);
          }
        }
      }

      // Fallback to class declaration location
      return this.extractLocationFromNode(classDecl, sourceFile);
    } catch (error) {
      console.warn(`⚠️  Could not extract inheritance location from class ${className}:`, error);
      return undefined;
    }
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