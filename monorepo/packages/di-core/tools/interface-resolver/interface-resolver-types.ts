// tools/interface-resolver-types.ts - Type definitions for interface resolution

/**
 * Service lifecycle scope determining instance creation behavior
 */
export type ServiceScope = 'singleton' | 'transient' | 'scoped';

/**
 * How a service is registered and resolved in the DI system
 */
export type RegistrationType = 'interface' | 'inheritance' | 'class';

/**
 * Base interface containing common fields for all service-related data structures.
 * Use this as a building block for more specialized interfaces.
 */
export interface ServiceImplementationBase {
  /** 
   * The interface name this implementation provides (e.g., 'UserServiceInterface')
   */
  interfaceName: string;
  
  /** 
   * The concrete implementation class name (e.g., 'UserService')
   */
  implementationClass: string;
  
  /** 
   * Absolute file path where the implementation is defined
   */
  filePath: string;
  
  /** 
   * Unique identifier for this implementation including location info
   */
  sanitizedKey: string;
}

/**
 * Base interface for dependency-related data structures.
 * Contains common fields used across different dependency representations.
 */
export interface DependencyBase {
  /** 
   * The TypeScript interface type this dependency requires
   * @example 'LoggerInterface'
   */
  interfaceType: string;
  
  /** 
   * Unique key for resolving this dependency type
   * Generated to handle interface name collisions
   */
  sanitizedKey: string;
  
  /** 
   * Whether this dependency is optional
   * Affects dependency resolution failure behavior
   */
  isOptional: boolean;
}

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

/**
 * Represents a service implementation that provides an interface in the DI system.
 * This is the primary data structure for interface-to-implementation resolution.
 * 
 * @example
 * ```typescript
 * const impl: InterfaceImplementation = {
 *   interfaceName: 'UserServiceInterface',
 *   implementationClass: 'UserService', 
 *   filePath: '/src/services/UserService.ts',
 *   isGeneric: false,
 *   typeParameters: [],
 *   sanitizedKey: 'UserServiceInterface__src_services_UserService_ts_line_15',
 *   scope: 'singleton',
 *   registrationType: 'interface'
 * };
 * ```
 */
export interface InterfaceImplementation extends ServiceImplementationBase {
  /** 
   * Whether this interface/implementation uses TypeScript generics
   * Affects key generation and type resolution strategies
   */
  isGeneric: boolean;
  
  /** 
   * Generic type parameter names if isGeneric is true
   * Empty array for non-generic implementations
   * @example ['T', 'K'] for interface MyInterface<T, K>
   */
  typeParameters: string[];
  
  /** 
   * Structured location information for precise source tracking
   * Used for unique key generation and debugging
   */
  location?: SourceLocation;
  
  /** 
   * Service lifecycle scope determining instance creation behavior
   * - singleton: One instance per container (default)
   * - transient: New instance per resolution
   * - scoped: One instance per scope (e.g., per request)
   */
  scope?: ServiceScope;
  
  /** 
   * How this service is registered and resolved in the DI system
   * - interface: Resolved via interface-to-implementation mapping  
   * - inheritance: Resolved via class inheritance hierarchy
   * - class: Resolved directly by class name
   */
  registrationType: RegistrationType;
  
  /** 
   * Whether this is a class-based registration (legacy pattern)
   * @deprecated Use registrationType instead
   */
  isClassBased?: boolean;
  
  /** 
   * Whether this uses inheritance-based resolution
   * @deprecated Use registrationType instead  
   */
  isInheritanceBased?: boolean;
  
  /** 
   * Full inheritance chain from base class to this implementation
   * Only populated for inheritance-based registrations
   * @example ['BaseService', 'AbstractUserService', 'UserService']
   */
  inheritanceChain?: string[];
  
  /** 
   * Direct base class name for inheritance-based services
   * Only populated when isInheritanceBased is true
   */
  baseClass?: string;
  
  /** 
   * Parameterized base class name for generic inheritance
   * @example 'BaseService<User>' for class UserService extends BaseService<User>
   */
  baseClassGeneric?: string;
}

/**
 * Represents the dependency requirements of a service class.
 * Contains all information needed to resolve and inject dependencies.
 */
export interface ServiceDependency {
  /** 
   * The service class that has dependencies (e.g., 'UserService')
   * Must match implementationClass in corresponding InterfaceImplementation
   */
  serviceClass: string;
  
  /** 
   * List of interface names this service depends on
   * Used for dependency resolution and circular dependency detection
   * @example ['LoggerInterface', 'DatabaseInterface']
   */
  interfaceDependencies: string[];
  
  /** 
   * Absolute file path where the service class is defined
   * Should match filePath in corresponding InterfaceImplementation
   */
  filePath: string;
  
  /** 
   * Detailed information about each constructor parameter
   * Includes parameter names, types, and optionality
   */
  constructorParams: ConstructorParam[];
}

/**
 * Represents a single constructor parameter that requires dependency injection.
 */
export interface ConstructorParam extends DependencyBase {
  /** 
   * The parameter name in the constructor signature
   * @example 'logger' for constructor(logger: LoggerInterface)
   */
  paramName: string;
}

/**
 * Result of dependency validation checks.
 * Indicates whether the DI configuration is valid and what issues exist.
 */
export interface ValidationResult {
  /** 
   * Whether the overall dependency configuration is valid
   * False if any missing implementations or circular dependencies exist
   */
  isValid: boolean;
  
  /** 
   * List of interface names that have no registered implementations
   * Each entry represents a dependency that cannot be resolved
   */
  missingImplementations: string[];
  
  /** 
   * List of circular dependency chains detected
   * Each entry describes a cycle in the dependency graph
   * @example ['ServiceA -> ServiceB -> ServiceA']
   */
  circularDependencies: string[];
}

/**
 * Represents a node in the dependency resolution graph.
 * Used for circular dependency detection and resolution ordering.
 */
export interface DependencyNode {
  /** 
   * Unique identifier for this node (typically the service class name)
   */
  id: string;
  
  /** 
   * List of dependency identifiers this node requires
   * @example ['LoggerInterface', 'DatabaseInterface']
   */
  dependencies: string[];
  
  /** 
   * List of dependencies that have been successfully resolved
   * Subset of dependencies array
   */
  resolved: string[];
}

/**
 * Precise source location information for interface definitions.
 * Used to generate unique keys and prevent interface name collisions.
 */
export interface SourceLocation {
  /** 
   * Absolute path to the source file
   */
  filePath: string;
  
  /** 
   * Line number where the interface is defined (1-based)
   */
  lineNumber: number;
}

// Interface information structures
export interface InterfaceInfo {
  name: string;
  fullType: string;
  isGeneric: boolean;
  typeParameters: string[];

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

