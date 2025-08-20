// TDI2 DI-Core - Main entry point

export const TDI2_VERSION = "0.1.0";

// Export decorators (including new @Configuration and @Bean)
export * from './decorators.js';

// Export types for configuration
export type { 
  ConfigurationOptions, 
  ConfigurationMetadata, 
  BeanMetadata, 
  BeanParameterMetadata,
  ContainerConfiguration
} from './types.js';

// Export container with configuration support
export { CompileTimeDIContainer } from './container.js';
