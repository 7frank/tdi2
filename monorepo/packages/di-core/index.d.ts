interface ServiceOptions {
    scope?: "singleton" | "transient" | "scoped";
    token?: string | symbol;
    profiles?: string[];
    primary?: boolean;
    qualifier?: string;
}

/**
 * Service decorator - marks a class as injectable
 * Now uses automatic interface resolution instead of manual tokens
 */
declare function Service(options?: ServiceOptions): ClassDecorator;
/**
 * Inject decorator - marks a property or constructor parameter for injection
 * Now supports automatic interface resolution when no token is provided
 */
declare function Inject(token?: string | symbol): any;
/**
 * AutoWired decorator - alias for Inject for Spring Boot familiarity
 * Supports both token-based and interface-based injection
 */
declare const Autowired: typeof Inject;
/**
 * AutoWireService decorator - alias for Service with auto-resolution enabled
 * This matches the naming from your TDI proof-of-concept
 */
declare function AutoWireService(options?: ServiceOptions): ClassDecorator;
/**
 * AutoWireInject decorator - alias for Inject with auto-resolution
 * This matches the naming from your TDI proof-of-concept
 */
declare function AutoWireInject(token?: string | symbol): any;
/**
 * Profile decorator - marks a service for specific environments
 * Can be combined with interface resolution
 */
declare function Profile(...profiles: string[]): ClassDecorator;
/**
 * Scope decorator - sets the lifecycle scope for a service
 */
declare function Scope(scope: "singleton" | "transient" | "scoped"): ClassDecorator;
/**
 * Optional decorator - marks an injection as optional
 * Useful when combined with interface resolution
 */
declare function Optional(target: any, propertyKey?: string | symbol, parameterIndex?: number): void;
/**
 * Primary decorator - marks a service as the primary implementation when multiple exist
 * Useful for interface resolution when multiple classes implement the same interface
 */
declare function Primary(target: any): void;
/**
 * Qualifier decorator - provides a qualifier for disambiguation
 * Useful when multiple implementations exist for the same interface
 */
declare function Qualifier(qualifier: string): any;

declare const TDI2_VERSION = "0.1.0";

export { AutoWireInject, AutoWireService, Autowired, Inject, Autowired as LegacyAutowired, Inject as LegacyInject, Service as LegacyService, Optional, Primary, Profile, Qualifier, Scope, Service, TDI2_VERSION };
