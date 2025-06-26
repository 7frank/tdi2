// src/di/types.ts - Updated for interface-based DI

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface ServiceMetadata {
  token?: string | symbol; // Optional - auto-resolved from interface if not provided
  scope?: "singleton" | "transient" | "scoped";
  implementation: Constructor;
  autoResolve?: boolean; // True if token should be auto-resolved
  profiles?: string[]; // Environment profiles
  primary?: boolean; // Primary implementation when multiple exist
  qualifier?: string; // Qualifier for disambiguation
}

export interface DIContainer {
  register<T>(
    token: string | symbol,
    implementation: Constructor<T>,
    scope?: "singleton" | "transient" | "scoped"
  ): void;
  resolve<T>(token: string | symbol): T;
  has(token: string | symbol): boolean;
  createScope(): DIContainer;

  // Enhanced methods for interface resolution
  registerByInterface<T>(
    interfaceName: string,
    implementation: Constructor<T>,
    scope?: "singleton" | "transient" | "scoped"
  ): void;
  resolveByInterface<T>(interfaceName: string): T;
  hasInterface(interfaceName: string): boolean;
}

// Service decorator options - now supports interface resolution
export interface ServiceOptions {
  scope?: "singleton" | "transient" | "scoped";
  token?: string | symbol; // Optional - auto-resolved if not provided
  profiles?: string[]; // Environment profiles
  primary?: boolean; // Mark as primary implementation
  qualifier?: string; // Qualifier for disambiguation
}

// Injection metadata - enhanced for interface resolution
export interface InjectMetadata {
  token?: string | symbol; // Optional - auto-resolved from parameter type
  propertyKey?: string | symbol;
  parameterIndex?: number;
  target: string;
  autoResolve?: boolean; // True if should auto-resolve from type
  optional?: boolean; // True if injection is optional
  qualifier?: string; // Qualifier for disambiguation
}

// Generated service factory type
export type ServiceFactory<T> = () => T;

// Enhanced dependency injection map with interface support
export interface DIMap {
  [token: string]: {
    factory: ServiceFactory<any>;
    scope: "singleton" | "transient" | "scoped";
    dependencies: string[];
    interfaceName?: string; // The interface this service implements
    implementationClass: string; // The actual implementation class
    isAutoResolved: boolean; // True if resolved automatically from interface
    qualifier?: string; // Qualifier if multiple implementations exist
  };
}

// Interface to implementation mapping
export interface InterfaceMapping {
  [interfaceName: string]: {
    implementations: string[]; // List of implementation class names
    primary?: string; // Primary implementation if multiple exist
    tokens: string[]; // Corresponding DI tokens
  };
}

// Enhanced container configuration
export interface ContainerConfiguration {
  diMap: DIMap;
  interfaceMapping: InterfaceMapping;
  profiles?: string[]; // Active profiles
  environment?: string; // Current environment (dev, test, prod)
}

// Validation result for dependency checking
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type:
    | "missing-implementation"
    | "circular-dependency"
    | "ambiguous-implementation";
  message: string;
  details: any;
}

export interface ValidationWarning {
  type: "optional-missing" | "multiple-implementations" | "unused-service";
  message: string;
  details: any;
}

// Interface resolution metadata
export interface InterfaceResolutionData {
  interfaceName: string;
  sanitizedKey: string;
  implementations: Array<{
    className: string;
    filePath: string;
    isPrimary: boolean;
    qualifier?: string;
    scope: string;
  }>;
  isGeneric: boolean;
  typeParameters: string[];
}

// Dependency graph node
export interface DependencyNode {
  id: string; // Service class name
  interfaceName?: string; // Interface it implements
  dependencies: DependencyEdge[];
  scope: string;
  isAutoResolved: boolean;
}

export interface DependencyEdge {
  targetInterface: string;
  targetImplementation?: string;
  isOptional: boolean;
  qualifier?: string;
}

// Configuration for different environments
export interface EnvironmentConfig {
  name: string; // dev, test, prod, etc.
  profiles: string[];
  overrides: { [interfaceName: string]: string }; // Interface -> implementation overrides
  mocks: { [interfaceName: string]: any }; // Interface -> mock implementation
}

// Debug information structure
export interface DebugInfo {
  configHash: string;
  environment: string;
  activeProfiles: string[];
  interfaceResolutions: InterfaceResolutionData[];
  dependencyGraph: DependencyNode[];
  validation: ValidationResult;
  containerStats: {
    totalServices: number;
    autoResolvedServices: number;
    manualTokenServices: number;
    interfacesWithMultipleImpls: number;
  };
}
