// src/di/markers.ts - Marker interface types for functional DI

/**
 * Marker interface for dependency injection in function parameters
 * Usage: function MyComponent(services: {logger: Inject<LoggerInterface>}) {}
 */
export type Inject<T> = T & {
  readonly __inject__: unique symbol;
};

/**
 * Marker type for optional dependency injection
 * Usage: function MyComponent(services: {logger?: InjectOptional<LoggerInterface>}) {}
 */
export type InjectOptional<T> = T & {
  readonly __injectOptional__: unique symbol;
};

/**
 * Service configuration for functional components
 * This would be detected by the transformer for functions with this parameter shape
 */
export interface ServiceDependencies {
  [key: string]: Inject<any> | InjectOptional<any>;
}

/**
 * Utility type to extract the actual types from Inject markers
 */
export type ExtractServices<T extends ServiceDependencies> = {
  [K in keyof T]: T[K] extends Inject<infer U> ? U : 
                  T[K] extends InjectOptional<infer U> ? U | undefined : 
                  never;
};

/**
 * Function component with DI support
 * This is what the transformer would look for and transform
 */
export interface DIFunction<TServices extends ServiceDependencies, TProps = object> {
  (props: TProps & { services?: ExtractServices<TServices> }): JSX.Element;
}

/**
 * Helper type for creating DI-enabled function components
 * Example:
 * const MyComponent: DIComponent<{logger: Inject<LoggerInterface>}, {title: string}> = 
 *   ({title, services}) => { ... }
 */
export type DIComponent<TServices extends ServiceDependencies, TProps = {}> = 
  DIFunction<TServices, TProps>;

/**
 * Transform a regular React component to support DI
 * This could be used as a higher-order function or detected by the transformer
 */
export function withDI<TServices extends ServiceDependencies, TProps = {}>(
  component: (props: TProps & { services: ExtractServices<TServices> }) => JSX.Element,
  serviceConfig: TServices
): React.ComponentType<TProps> {
  // This would be implemented by the runtime DI system
  throw new Error('withDI should be transformed at build time');
}

// Example usage types:
/*
interface MyServices {
  logger: Inject<LoggerInterface>;
  api: Inject<ApiInterface>;
  cache?: InjectOptional<CacheInterface>;
}

const MyComponent: DIComponent<MyServices, {title: string}> = ({title, services}) => {
  // services.logger is automatically injected
  // services.api is automatically injected  
  // services.cache might be undefined
  return <div>{title}</div>;
};
*/