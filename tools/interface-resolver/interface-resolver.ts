// tools/interface-resolver/interface-resolver.ts - CRITICAL FIXES

import {
  Project,
  SourceFile,
  ClassDeclaration,
} from "ts-morph";
import * as path from "path";

// Import functional units
import type { InterfaceImplementation, ServiceDependency, ConstructorParam, ValidationResult, DependencyNode } from "./interface-resolver-types";
import { InterfaceExtractor } from "./interface-extractor";
import { InheritanceAnalyzer } from "./inheritance-analyzer";
import { StateTypeExtractor } from "./state-type-extractor";
import { DependencyAnalyzer } from "./dependency-analyzer";
import { KeySanitizer } from "./key-sanitizer";
import { ServiceValidator } from "./service-validator";

export interface InterfaceResolverOptions {
  verbose?: boolean;
  srcDir?: string;
  enableInheritanceDI?: boolean;
  enableStateDI?: boolean;
}

export class InterfaceResolver {
  private project: Project;
  private interfaces: Map<string, InterfaceImplementation> = new Map();
  private dependencies: Map<string, ServiceDependency> = new Map();
  private options: Required<InterfaceResolverOptions>;

  // Functional units
  private interfaceExtractor: InterfaceExtractor;
  private inheritanceAnalyzer: InheritanceAnalyzer;
  private stateTypeExtractor: StateTypeExtractor;
  private dependencyAnalyzer: DependencyAnalyzer;
  private keySanitizer: KeySanitizer;
  private serviceValidator: ServiceValidator;

  constructor(options: InterfaceResolverOptions = {}) {
    this.options = {
      verbose: false,
      srcDir: "./src",
      enableInheritanceDI: true,
      enableStateDI: true,
      ...options,
    };

    this.project = new Project({
      tsConfigFilePath: "./tsconfig.json",
    });

    // Initialize functional units
    this.keySanitizer = new KeySanitizer();
    this.interfaceExtractor = new InterfaceExtractor(this.keySanitizer, this.options.verbose);
    this.inheritanceAnalyzer = new InheritanceAnalyzer(this.keySanitizer, this.options.verbose);
    this.stateTypeExtractor = new StateTypeExtractor(this.keySanitizer, this.options.verbose);
    this.dependencyAnalyzer = new DependencyAnalyzer(this.keySanitizer, this.options.verbose);
    this.serviceValidator = new ServiceValidator(this.options.verbose);
  }

  async scanProject(): Promise<void> {
    if (this.options.verbose) {
      console.log("🔍 Scanning project for interfaces, implementations, inheritance, and state types...");
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

  // CRITICAL FIX: Updated processClassForInterfaces method
  private async processClassForInterfaces(
    classDecl: ClassDeclaration,
    sourceFile: SourceFile
  ): Promise<void> {
    const className = classDecl.getName();
    if (!className) return;

    try {
      // Check if class has service decorator
      const hasServiceDecorator = this.serviceValidator.hasServiceDecorator(classDecl);
      if (!hasServiceDecorator) return;

      // 1. Extract implemented interfaces
      const implementedInterfaces = this.interfaceExtractor.getImplementedInterfaces(classDecl);

      // 2. Analyze inheritance
      const inheritanceInfo = this.inheritanceAnalyzer.getInheritanceInfo(classDecl);

      // 3. Extract state-based registrations
      const stateBasedRegistrations = this.stateTypeExtractor.extractStateBasedRegistrations(
        implementedInterfaces, 
        inheritanceInfo
      );

      // Track what types of registrations we've made for this class
      let hasInterfaceRegistrations = false;
      let hasInheritanceRegistrations = false;
      let hasStateRegistrations = false;

      // 4. Register interface-based implementations
      if (implementedInterfaces.length > 0) {
        hasInterfaceRegistrations = true;
        for (const interfaceInfo of implementedInterfaces) {
          const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceInfo.fullType);

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
          };

          const uniqueKey = `${sanitizedKey}_${className}`;
          this.interfaces.set(uniqueKey, implementation);

          if (this.options.verbose) {
            console.log(
              `📝 ${className} implements ${interfaceInfo.fullType} (key: ${sanitizedKey})`
            );
          }
        }
      }

      // 5. ENHANCED: Register inheritance-based implementations with consistent keys
      if (this.options.enableInheritanceDI && inheritanceInfo.hasInheritance) {
        hasInheritanceRegistrations = true;
        for (const inheritanceMapping of inheritanceInfo.inheritanceMappings) {
          // CRITICAL: Use the SAME sanitization logic as the key sanitizer
          const sanitizedKey = this.keySanitizer.sanitizeKey(inheritanceMapping.baseClassGeneric);
          
          const implementation: InterfaceImplementation = {
            interfaceName: inheritanceMapping.baseTypeName,
            implementationClass: className,
            filePath: sourceFile.getFilePath(),
            isGeneric: inheritanceMapping.isGeneric,
            typeParameters: inheritanceMapping.typeParameters,
            sanitizedKey, // CRITICAL: Use consistent sanitization
            isClassBased: false,
            isInheritanceBased: true,
            isStateBased: false,
            inheritanceChain: inheritanceInfo.inheritanceChain,
            baseClass: inheritanceMapping.baseClass,
            baseClassGeneric: inheritanceMapping.baseClassGeneric,
          };

          // IMPORTANT: Use the sanitized key for consistent lookup
          const uniqueKey = `${sanitizedKey}_${className}`;
          this.interfaces.set(uniqueKey, implementation);

          if (this.options.verbose) {
            console.log(
              `🧬 ${className} extends ${inheritanceMapping.baseClassGeneric} (key: ${sanitizedKey})`
            );
          }
        }
      }

      // 6. ENHANCED: Register state-based implementations with correct keys
      if (this.options.enableStateDI && stateBasedRegistrations.length > 0) {
        hasStateRegistrations = true;
        for (const stateRegistration of stateBasedRegistrations) {
          // CRITICAL: Use the service interface (AsyncState<UserServiceState>) for key generation
          const sanitizedKey = this.keySanitizer.sanitizeKey(stateRegistration.serviceInterface);
          
          const implementation: InterfaceImplementation = {
            interfaceName: stateRegistration.serviceInterface, // Use full interface name
            implementationClass: className,
            filePath: sourceFile.getFilePath(),
            isGeneric: true,
            typeParameters: [stateRegistration.stateType],
            sanitizedKey, // CRITICAL: Use service interface key
            isClassBased: false,
            isInheritanceBased: false,
            isStateBased: true,
            stateType: stateRegistration.stateType,
            serviceInterface: stateRegistration.serviceInterface,
          };

          const uniqueKey = `${sanitizedKey}_${className}_state`;
          this.interfaces.set(uniqueKey, implementation);

          if (this.options.verbose) {
            console.log(
              `🎯 ${className} manages state ${stateRegistration.stateType} via ${stateRegistration.serviceInterface} (key: ${sanitizedKey})`
            );
          }
        }
      }

      // 7. IMPORTANT: Always register class-based lookup
      const shouldRegisterAsClass = !hasInterfaceRegistrations && !hasInheritanceRegistrations && !hasStateRegistrations;
      
      if (shouldRegisterAsClass) {
        // Primary class-based registration (only service with no interfaces/inheritance/state)
        const sanitizedKey = this.keySanitizer.sanitizeKey(className);

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
        };

        const uniqueKey = `${sanitizedKey}_${className}`;
        this.interfaces.set(uniqueKey, implementation);

        if (this.options.verbose) {
          console.log(
            `📝 ${className} registered as class-based service (key: ${sanitizedKey})`
          );
        }
      } else {
        // Secondary class-based registration for direct lookup (always available)
        const sanitizedKey = this.keySanitizer.sanitizeKey(className);

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
        };

        const uniqueKey = `${sanitizedKey}_${className}_direct`;
        this.interfaces.set(uniqueKey, implementation);

        if (this.options.verbose) {
          console.log(
            `📝 ${className} also registered for direct class lookup (key: ${sanitizedKey})`
          );
        }
      }

    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to process class ${className}:`, error);
      }
    }
  }

  private async collectServiceDependencies(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
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

  // ENHANCED: Updated resolution logic with AsyncState support
  resolveImplementation(interfaceType: string): InterfaceImplementation | undefined {
    const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceType);
    
    if (this.options.verbose) {
      console.log(`🔍 Resolving: ${interfaceType} -> key: ${sanitizedKey}`);
    }

    // 1. Exact match - highest priority
    for (const [key, implementation] of this.interfaces) {
      if (implementation.sanitizedKey === sanitizedKey) {
        if (this.options.verbose) {
          console.log(`✅ Found exact match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 2. Handle AsyncState<T> pattern specifically
    const asyncStateMatch = interfaceType.match(/^AsyncState<(.+)>$/);
    if (asyncStateMatch) {
      const stateType = asyncStateMatch[1];
      
      // Look for state-based registrations first
      for (const [key, implementation] of this.interfaces) {
        if (implementation.isStateBased && 
            implementation.stateType === stateType &&
            implementation.serviceInterface === interfaceType) {
          if (this.options.verbose) {
            console.log(`✅ Found AsyncState state-based match: ${implementation.implementationClass}`);
          }
          return implementation;
        }
      }
      
      // Look for inheritance-based registrations
      for (const [key, implementation] of this.interfaces) {
        if (implementation.isInheritanceBased && 
            implementation.baseClassGeneric === interfaceType) {
          if (this.options.verbose) {
            console.log(`✅ Found AsyncState inheritance match: ${implementation.implementationClass}`);
          }
          return implementation;
        }
      }

      // Look for any registration with matching sanitized key
      for (const [key, implementation] of this.interfaces) {
        if (implementation.sanitizedKey === sanitizedKey) {
          if (this.options.verbose) {
            console.log(`✅ Found AsyncState key match: ${implementation.implementationClass}`);
          }
          return implementation;
        }
      }
    }

    // 3. Handle inheritance-based lookups
    const inheritanceSanitizedKey = this.keySanitizer.sanitizeInheritanceKey(interfaceType);
    for (const [key, implementation] of this.interfaces) {
      if (implementation.isInheritanceBased && 
          (implementation.sanitizedKey === sanitizedKey || implementation.sanitizedKey === inheritanceSanitizedKey)) {
        if (this.options.verbose) {
          console.log(`✅ Found inheritance match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 4. Handle state-based lookups
    for (const [key, implementation] of this.interfaces) {
      if (implementation.isStateBased && implementation.sanitizedKey === sanitizedKey) {
        if (this.options.verbose) {
          console.log(`✅ Found state-based match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 5. Handle class-based lookups (exact class name match)
    for (const [key, implementation] of this.interfaces) {
      if (implementation.sanitizedKey === sanitizedKey && implementation.isClassBased) {
        if (this.options.verbose) {
          console.log(`✅ Found class-based match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 6. Fallback to partial matches by interface name
    for (const [key, implementation] of this.interfaces) {
      if (implementation.interfaceName === interfaceType) {
        if (this.options.verbose) {
          console.log(`⚠️  Using interface name fallback match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    // 7. Final fallback to any implementation with matching key
    for (const [key, implementation] of this.interfaces) {
      if (key.includes(sanitizedKey)) {
        if (this.options.verbose) {
          console.log(`⚠️  Using partial key fallback match: ${implementation.implementationClass}`);
        }
        return implementation;
      }
    }

    if (this.options.verbose) {
      console.log(`❌ No implementation found for: ${interfaceType}`);
      console.log(`🔍 Searched for key: ${sanitizedKey}`);
      console.log(`📋 Available keys:`, Array.from(this.interfaces.keys()).slice(0, 10));
      console.log(`📋 Available implementations:`, Array.from(this.interfaces.values()).map(i => `${i.interfaceName} -> ${i.implementationClass}`).slice(0, 10));
    }

    return undefined;
  }

  // Helper methods
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

  getImplementationsByBaseClass(baseClassName: string): InterfaceImplementation[] {
    const implementations: InterfaceImplementation[] = [];
    
    for (const [key, implementation] of this.interfaces) {
      if (implementation.isInheritanceBased && 
          implementation.baseClass === baseClassName) {
        implementations.push(implementation);
      }
    }
    
    return implementations;
  }

  getImplementationsByStateType(stateType: string): InterfaceImplementation[] {
    const implementations: InterfaceImplementation[] = [];
    
    for (const [key, implementation] of this.interfaces) {
      if (implementation.isStateBased && 
          implementation.stateType === stateType) {
        implementations.push(implementation);
      }
    }
    
    return implementations;
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
    return this.serviceValidator.validateDependencies(this.dependencies, this.interfaces);
  }
}

// Re-export types for convenience
export type { InterfaceImplementation, ServiceDependency, ConstructorParam, ValidationResult, DependencyNode };