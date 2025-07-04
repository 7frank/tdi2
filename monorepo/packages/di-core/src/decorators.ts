// src/di/decorators.ts - Updated for interface-based DI

import type { ServiceOptions } from "./types";

/**
 * Service decorator - marks a class as injectable
 * Now uses automatic interface resolution instead of manual tokens
 */
export function Service(options: ServiceOptions = {}): ClassDecorator {
  return function (target: any) {
    // Store metadata for compile-time processing
    target.__di_service__ = {
      // Token is now optional - will be auto-generated from interface name
      token: options.token || null, // null means auto-resolve from interface
      scope: options.scope || "singleton",
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
 * AutoWireService decorator - alias for Service with auto-resolution enabled
 * This matches the naming from your TDI proof-of-concept
 */
export function AutoWireService(options: ServiceOptions = {}): ClassDecorator {
  return Service({
    ...options,
    // Force auto-resolution for AutoWireService
    token: options.token || undefined,
  });
}

/**
 * AutoWireInject decorator - alias for Inject with auto-resolution
 * This matches the naming from your TDI proof-of-concept
 */
export function AutoWireInject(token?: string | symbol): any {
  return Inject(token);
}

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
 * Scope decorator - sets the lifecycle scope for a service
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

// Legacy support - these will be deprecated in favor of interface resolution
export {
  Service as LegacyService,
  Inject as LegacyInject,
  Autowired as LegacyAutowired,
};
