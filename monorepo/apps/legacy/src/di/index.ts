// src/di/index.ts

// Export core DI functionality
export * from './types';

export * from './container';
export * from './context.tsx';

// Re-export for convenience
export { CompileTimeDIContainer as DIContainer } from './container';