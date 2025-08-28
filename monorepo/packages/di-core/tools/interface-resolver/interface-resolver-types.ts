// tools/interface-resolver-types.ts - Type definitions for interface resolution

/**
 * Common interface for all resolver implementations
 */
export interface InterfaceResolverInterface {
  scanProject(): Promise<void>;
  resolveImplementation(
    interfaceType: string
  ): InterfaceImplementation | undefined;
  getInterfaceImplementations(): Map<string, InterfaceImplementation>;
  getServiceDependencies(): Map<string, ServiceDependency>;
  validateDependencies(): ValidationResult;
  getDependencyTree(): DependencyNode[];
}

export interface InterfaceImplementation {
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  sanitizedKey: string;
  location?: SourceLocation; // NEW: Structured location info
  isClassBased?: boolean;
  isInheritanceBased?: boolean;
  isStateBased?: boolean; // NEW: State-based registration
  inheritanceChain?: string[];
  baseClass?: string;
  baseClassGeneric?: string;
  stateType?: string; // NEW: The state type this service manages
  serviceInterface?: string; // NEW: The service interface (e.g., AsyncStateService<T>)
  scope?: "singleton" | "transient" | "scoped"; // NEW: Scope extracted from @Service decorator
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

export interface ValidationResult {
  isValid: boolean;
  missingImplementations: string[];
  circularDependencies: string[];
}

export interface DependencyNode {
  id: string;
  dependencies: string[];
  resolved: string[];
}

// Location information for unique key generation
export interface SourceLocation {
  filePath: string;
  lineNumber: number;
}

// Interface information structures
export interface InterfaceInfo {
  name: string;
  fullType: string;
  isGeneric: boolean;
  typeParameters: string[];
  // Location information for unique key generation
  sourceFilePath?: string;
  lineNumber?: number;
  location?: SourceLocation;
}

export interface InheritanceInfo {
  hasInheritance: boolean;
  inheritanceChain: string[];
  inheritanceMappings: InheritanceMapping[];
}

export interface InheritanceMapping {
  baseClass: string;
  baseClassGeneric: string;
  baseTypeName: string;
  sanitizedKey: string;
  isGeneric: boolean;
  typeParameters: string[];
}

export interface StateBasedRegistration {
  stateType: string;
  serviceInterface: string;
}
