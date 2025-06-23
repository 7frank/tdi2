// src/di/decorators.ts

// import { Constructor, ServiceOptions } from './types';
import type { ServiceOptions } from "./types";
// These decorators are purely for marking - the actual DI logic is generated at compile time

/**
 * Service decorator - marks a class as injectable
 * This is processed at compile time by the transformer
 */
export function Service(options: ServiceOptions = {}): ClassDecorator {
  return function (target: any) {
    // Store metadata for compile-time processing
    target.__di_service__ = {
      token: options.token || target.name,
      scope: options.scope || "singleton",
      ...options,
    };
  };
}

/**
 * Inject decorator - marks a property or constructor parameter for injection
 * This is processed at compile time by the transformer
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
      token,
      propertyKey,
      parameterIndex,
      target: target.constructor?.name || target.name,
    });
  };
}

/**
 * Autowired decorator - alias for Inject for Spring Boot familiarity
 */
export const Autowired = Inject;
