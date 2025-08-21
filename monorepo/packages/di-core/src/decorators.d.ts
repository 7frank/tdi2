import type { ServiceOptions, ConfigurationOptions } from "./types";
/**
 * Service decorator - marks a class as injectable
 * Now uses automatic interface resolution instead of manual tokens
 * Note: For scope management, use the separate @Scope decorator (Spring Boot convention)
 */
export declare function Service(options?: ServiceOptions): ClassDecorator;
/**
 * Inject decorator - marks a property or constructor parameter for injection
 * Now supports automatic interface resolution when no token is provided
 */
export declare function Inject(token?: string | symbol): any;
/**
 * AutoWired decorator - alias for Inject for Spring Boot familiarity
 * Supports both token-based and interface-based injection
 */
export declare const Autowired: typeof Inject;
/**
 * Profile decorator - marks a service for specific environments
 * Can be combined with interface resolution
 */
export declare function Profile(...profiles: string[]): ClassDecorator;
/**
 * Scope decorator - sets the lifecycle scope for a service (Spring Boot convention)
 * Use with @Service decorator: @Service @Scope("singleton|transient")
 * Follows Spring Boot's separation of concerns pattern
 */
export declare function Scope(scope: "singleton" | "transient" | "scoped"): ClassDecorator;
/**
 * Optional decorator - marks an injection as optional
 * Useful when combined with interface resolution
 */
export declare function Optional(target: any, propertyKey?: string | symbol, parameterIndex?: number): void;
/**
 * Primary decorator - marks a service as the primary implementation when multiple exist
 * Useful for interface resolution when multiple classes implement the same interface
 */
export declare function Primary(target: any): void;
/**
 * Qualifier decorator - provides a qualifier for disambiguation
 * Useful when multiple implementations exist for the same interface
 */
export declare function Qualifier(qualifier: string): any;
/**
 * Configuration decorator - marks a class as a configuration provider
 * Configuration classes contain @Bean methods that define external service factories
 * Integrates with existing interface resolution and scope management
 */
export declare function Configuration(options?: ConfigurationOptions): ClassDecorator;
/**
 * Bean decorator - marks a method as a factory for external services
 * Must be used inside @Configuration classes
 * Works with existing decorators: @Primary, @Scope, @Qualifier
 * Return type is automatically resolved to interface for DI registration
 */
export declare function Bean(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
export type { OnInit, OnDestroy, OnMount, OnUnmount } from './types';
export { Service as LegacyService, Inject as LegacyInject, Autowired as LegacyAutowired, };
