// src/di/decorators.ts - Updated for interface-based DI

import type { ServiceOptions } from "./types";

/**
 * Service decorator - marks a class as injectable
 * Now uses automatic interface resolution instead of manual tokens
 * Note: For scope management, use the separate @Scope decorator (Spring Boot convention)
 */
export function Service(options: ServiceOptions = {}): ClassDecorator {
  return function (target: any) {
    // Store metadata for compile-time processing
    target.__di_service__ = {
      // Token is now optional - will be auto-generated from interface name
      token: options.token || null, // null means auto-resolve from interface
      scope: "singleton", // Default scope - use @Scope decorator to override
      autoResolve: options.token === undefined, // true if no explicit token provided
      ...options,
    };
  };
}

/**
 * Inject decorator - marks a property or constructor parameter for injection
 * Now supports automatic interface resolution when no token is provided
 */
export function Inject(token?: string | symbol): any {
  return function (
    target: any,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ) {
    // Store metadata for compile-time processing
    if (!target.__di_inject__) {
      target.__di_inject__ = [];
    }

    target.__di_inject__.push({
      token, // undefined means auto-resolve from parameter type
      propertyKey,
      parameterIndex,
      target: target.constructor?.name || target.name,
      autoResolve: token === undefined, // true if no explicit token provided
    });
  };
}

/**
 * AutoWired decorator - alias for Inject for Spring Boot familiarity
 * Supports both token-based and interface-based injection
 */
export const Autowired = Inject;


/**
 * Profile decorator - marks a service for specific environments
 * Can be combined with interface resolution
 */
export function Profile(...profiles: string[]): ClassDecorator {
  return function (target: any) {
    if (!target.__di_service__) {
      target.__di_service__ = {};
    }
    target.__di_service__.profiles = profiles;
  };
}

/**
 * Scope decorator - sets the lifecycle scope for a service (Spring Boot convention)
 * Use with @Service decorator: @Service @Scope("singleton|transient")
 * Follows Spring Boot's separation of concerns pattern
 */
export function Scope(
  scope: "singleton" | "transient" | "scoped"
): ClassDecorator {
  return function (target: any) {
    if (!target.__di_service__) {
      target.__di_service__ = {};
    }
    target.__di_service__.scope = scope;
  };
}

/**
 * Optional decorator - marks an injection as optional
 * Useful when combined with interface resolution
 */
export function Optional(
  target: any,
  propertyKey?: string | symbol,
  parameterIndex?: number
): void {
  if (!target.__di_inject__) {
    target.__di_inject__ = [];
  }

  // Find the most recent inject metadata and mark it as optional
  const lastInject = target.__di_inject__[target.__di_inject__.length - 1];
  if (lastInject && lastInject.parameterIndex === parameterIndex) {
    lastInject.optional = true;
  }
}

/**
 * Primary decorator - marks a service as the primary implementation when multiple exist
 * Useful for interface resolution when multiple classes implement the same interface
 */
export function Primary(target: any): void {
  if (!target.__di_service__) {
    target.__di_service__ = {};
  }
  target.__di_service__.primary = true;
}

/**
 * Qualifier decorator - provides a qualifier for disambiguation
 * Useful when multiple implementations exist for the same interface
 */
export function Qualifier(qualifier: string): any {
  return function (
    target: any,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ) {
    if (propertyKey !== undefined || parameterIndex !== undefined) {
      // Parameter or property injection
      if (!target.__di_inject__) {
        target.__di_inject__ = [];
      }

      const lastInject = target.__di_inject__[target.__di_inject__.length - 1];
      if (lastInject) {
        lastInject.qualifier = qualifier;
      }
    } else {
      // Class decoration
      if (!target.__di_service__) {
        target.__di_service__ = {};
      }
      target.__di_service__.qualifier = qualifier;
    }
  };
}

/**
 * PostConstruct decorator - marks a method to be called after dependency injection
 * Inspired by JSR-250 and Spring Boot's @PostConstruct
 * 
 * Usage:
 * @Service()
 * class UserService {
 *   @PostConstruct
 *   async initialize() {
 *     // Called after all dependencies are injected
 *     await this.loadInitialData();
 *   }
 * }
 */
export function PostConstruct(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  if (!target.constructor.__di_lifecycle__) {
    target.constructor.__di_lifecycle__ = {};
  }
  
  target.constructor.__di_lifecycle__.postConstruct = {
    methodName: propertyKey,
    method: descriptor.value,
    async: descriptor.value?.constructor?.name === 'AsyncFunction' || 
           descriptor.value?.toString().includes('async ')
  };
}

/**
 * PreDestroy decorator - marks a method to be called before service destruction
 * Inspired by JSR-250 and Spring Boot's @PreDestroy
 * 
 * Usage:
 * @Service()
 * class UserService {
 *   @PreDestroy
 *   cleanup() {
 *     // Called before service is destroyed
 *     this.closeConnections();
 *   }
 * }
 */
export function PreDestroy(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  if (!target.constructor.__di_lifecycle__) {
    target.constructor.__di_lifecycle__ = {};
  }
  
  target.constructor.__di_lifecycle__.preDestroy = {
    methodName: propertyKey,
    method: descriptor.value,
    async: descriptor.value?.constructor?.name === 'AsyncFunction' || 
           descriptor.value?.toString().includes('async ')
  };
}

/**
 * OnMount decorator - marks a method to be called when component mounts (component scope)
 * Provides AbortSignal for cancellation on unmount
 * 
 * Usage:
 * @Service()
 * @Scope("transient")
 * class ComponentService {
 *   @OnMount
 *   initialize({ signal }: { signal: AbortSignal }) {
 *     // Called when component mounts
 *     this.startPolling(signal);
 *   }
 * }
 */
export function OnMount(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  if (!target.constructor.__di_lifecycle__) {
    target.constructor.__di_lifecycle__ = {};
  }
  
  target.constructor.__di_lifecycle__.onMount = {
    methodName: propertyKey,
    method: descriptor.value,
    async: descriptor.value?.constructor?.name === 'AsyncFunction' || 
           descriptor.value?.toString().includes('async ')
  };
}

/**
 * OnUnmount decorator - marks a method to be called when component unmounts (component scope)
 * 
 * Usage:
 * @Service()
 * @Scope("transient")
 * class ComponentService {
 *   @OnUnmount
 *   cleanup() {
 *     // Called when component unmounts
 *     this.stopPolling();
 *   }
 * }
 */
export function OnUnmount(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void {
  if (!target.constructor.__di_lifecycle__) {
    target.constructor.__di_lifecycle__ = {};
  }
  
  target.constructor.__di_lifecycle__.onUnmount = {
    methodName: propertyKey,
    method: descriptor.value,
    async: descriptor.value?.constructor?.name === 'AsyncFunction' || 
           descriptor.value?.toString().includes('async ')
  };
}

// Legacy support - these will be deprecated in favor of interface resolution
export {
  Service as LegacyService,
  Inject as LegacyInject,
  Autowired as LegacyAutowired,
};
