// types/tdi2.d.ts - Global type definitions for TDI2 DI markers

declare module '*.di-transformed.ts' {
  const content: any;
  export = content;
}

declare module '*.di-transformed.tsx' {
  const content: any;
  export = content;
}

// Global augmentations for DI marker types
declare global {
  namespace TDI2 {
    // Marker interface for dependency injection in function parameters
    interface Inject<T> extends T {
      readonly __inject__: unique symbol;
    }

    // Marker type for optional dependency injection
    interface InjectOptional<T> extends T {
      readonly __injectOptional__: unique symbol;
    }

    // Service configuration for functional components
    interface ServiceDependencies {
      [key: string]: Inject<any> | InjectOptional<any>;
    }

    // Utility type to extract the actual types from Inject markers
    type ExtractServices<T extends ServiceDependencies> = {
      [K in keyof T]: T[K] extends Inject<infer U> ? U : 
                      T[K] extends InjectOptional<infer U> ? U | undefined : 
                      never;
    };

    // Function component with DI support
    interface DIFunction<TServices extends ServiceDependencies, TProps = object> {
      (props: TProps & { services?: ExtractServices<TServices> }): JSX.Element;
    }

    // Helper type for creating DI-enabled function components
    type DIComponent<TServices extends ServiceDependencies, TProps = {}> = 
      DIFunction<TServices, TProps>;

    // Component props with automatic DI services
    interface DIComponentProps<TServices extends ServiceDependencies, TProps = {}> 
      extends TProps {
      services?: ExtractServices<TServices>;
    }

    // Transformer metadata (attached to components during build)
    interface TransformerMetadata {
      readonly __tdi2_transformed__: true;
      readonly __tdi2_config_hash__: string;
      readonly __tdi2_services__: string[];
    }
  }

  // Augment React namespace for better DI component typing
  namespace React {
    interface FunctionComponent<P = {}> {
      // Allow DI components to omit services prop
      (props: P extends TDI2.DIComponentProps<infer S, infer T> 
        ? Omit<P, 'services'> & { services?: TDI2.ExtractServices<S> }
        : P, 
       context?: any): ReactElement<any, any> | null;
    }
  }

  // Global DI container interface (for debugging)
  interface Window {
    __TDI2_DEBUG__?: {
      container: any;
      configHash: string;
      implementations: Map<string, any>;
      dependencies: Map<string, any>;
    };
  }
}

// Re-export marker types for convenience
export type Inject<T> = TDI2.Inject<T>;
export type InjectOptional<T> = TDI2.InjectOptional<T>;
export type ServiceDependencies = TDI2.ServiceDependencies;
export type ExtractServices<T extends ServiceDependencies> = TDI2.ExtractServices<T>;
export type DIComponent<TServices extends ServiceDependencies, TProps = {}> = 
  TDI2.DIComponent<TServices, TProps>;
export type DIComponentProps<TServices extends ServiceDependencies, TProps = {}> = 
  TDI2.DIComponentProps<TServices, TProps>;

// Utility types for common DI patterns
export interface DIService {
  readonly __di_service__: true;
}

export interface DIInjectable {
  readonly __di_injectable__: true;
}

// Conditional type to check if a component uses DI
export type UsesDI<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0] extends { services: TDI2.ServiceDependencies }
    ? true
    : false
  : false;

// Type guard for DI components
export function isDIComponent<T extends (...args: any[]) => any>(
  component: T
): component is T & { __tdi2_component__: true } {
  return '__tdi2_component__' in component;
}

// Helper type for service interface resolution
export type ResolveService<T> = T extends TDI2.Inject<infer U> 
  ? U 
  : T extends TDI2.InjectOptional<infer U> 
    ? U | undefined 
    : never;

// Advanced DI patterns
export namespace Advanced {
  // Scoped DI services
  export interface ScopedService extends DIService {
    readonly __di_scope__: 'singleton' | 'transient' | 'scoped';
  }

  // Conditional service injection based on environment
  export interface ConditionalService<T, TCondition = boolean> 
    extends DIService {
    readonly __di_conditional__: TCondition;
    readonly __di_service_type__: T;
  }

  // Service factory type
  export interface ServiceFactory<T> {
    create(...args: any[]): T;
    readonly __di_factory__: true;
  }

  // Generic service interface
  export interface GenericService<T> extends DIService {
    readonly __di_generic_type__: T;
  }
}

// Module declaration for ESLint integration
declare module 'eslint' {
  namespace Rule {
    interface RuleContext {
      parserServices?: {
        diComponents?: Set<string>;
        hasTypeInformation?: boolean;
      };
    }
  }
}