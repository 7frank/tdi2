// src/di/types.ts - Updated for interface-based DI

export type Constructor<T = object> = new (...args: any[]) => T;

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
    implementation: () => T,
    scope?: "singleton" | "transient" | "scoped"
  ): void;
  resolveByInterface<T>(interfaceName: string): T;
  hasInterface(interfaceName: string): boolean;

  // Helper methods for parent-child scope resolution
  getScope(token: string | symbol): "singleton" | "transient" | "scoped" | undefined;
  hasFactory(token: string | symbol): boolean;
  getFactory(token: string | symbol): any;
  hasService(token: string | symbol): boolean;
  getService(token: string | symbol): any;

  // Lifecycle methods
  hasLifecycleHooks(instance: any): { onMount: boolean; onUnmount: boolean; onInit: boolean; onDestroy: boolean };
  executeOnMountLifecycle<T>(instance: T, options?: { signal?: AbortSignal }): Promise<void>;
  executeOnUnmountLifecycle<T>(instance: T): Promise<void>;
}

// Service decorator options - now supports interface resolution
export interface ServiceOptions {
  token?: string | symbol; // Optional - auto-resolved if not provided
  profiles?: string[]; // Environment profiles
  primary?: boolean; // Mark as primary implementation
  qualifier?: string; // Qualifier for disambiguation
}

// Configuration decorator options
export interface ConfigurationOptions {
  profiles?: string[]; // Environment profiles when configuration applies
  priority?: number; // Loading priority when multiple configurations exist
}

// Configuration class metadata
export interface ConfigurationMetadata {
  profiles: string[];
  priority: number;
  beans: BeanMetadata[];
  className: string;
  filePath: string;
}

// Bean method metadata
export interface BeanMetadata {
  methodName: string | symbol;
  returnType: string; // Interface name from return type
  parameters: BeanParameterMetadata[];
  scope: "singleton" | "transient" | "scoped";
  primary: boolean;
  qualifier?: string;
  autoResolve: boolean;
  profiles?: string[]; // Profiles specific to this bean method
}

// Bean method parameter metadata
export interface BeanParameterMetadata {
  parameterName: string;
  parameterType: string; // Interface name from parameter type
  isOptional: boolean;
  qualifier?: string;
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

export type ServiceFactory<T> = (container?: any) => T;
type ServiceFactoryFactory<T> = (container?: any) => () => T;

// Enhanced dependency injection map with interface support
export interface DIMap {
  [token: string]: {
    factory: ServiceFactory<any> | ServiceFactoryFactory<any>;
    scope: "singleton" | "transient" | "scoped";
    dependencies: string[];
    interfaceName?: string; // The interface this service implements
    implementationClass: string; // The actual implementation class or configuration class
    isAutoResolved: boolean; // True if resolved automatically from interface
    qualifier?: string; // Qualifier if multiple implementations exist
    isBean?: boolean; // True if this service comes from @Bean method
    beanMethodName?: string; // Method name if this is a bean
    configurationClass?: string; // Configuration class name if this is a bean
    profiles?: string[]; // Profiles required for this service
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
  configurations: ConfigurationMetadata[]; // Configuration classes with @Bean methods
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

// Lifecycle Interfaces (Angular-style)
// Service-level lifecycle hooks
export interface OnInit {
  onInit(): void | Promise<void>;
}

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}

// Component-level lifecycle hooks  
export interface OnMount {
  onMount(options?: { signal?: AbortSignal }): void | Promise<void>;
}

export interface OnUnmount {
  onUnmount(): void | Promise<void>;
}

// Lifecycle hook options for component-scoped services
export interface ComponentLifecycleOptions {
  signal?: AbortSignal; // For cancellation on unmount
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
