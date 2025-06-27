// tools/interface-resolver-types.ts - Type definitions for interface resolution

export interface InterfaceImplementation {
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  sanitizedKey: string;
  isClassBased?: boolean;
  isInheritanceBased?: boolean;
  isStateBased?: boolean; // NEW: State-based registration
  inheritanceChain?: string[];
  baseClass?: string;
  baseClassGeneric?: string;
  stateType?: string; // NEW: The state type this service manages
  serviceInterface?: string; // NEW: The service interface (e.g., AsyncStateService<T>)
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

// Interface information structures
export interface InterfaceInfo {
  name: string;
  fullType: string;
  isGeneric: boolean;
  typeParameters: string[];
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