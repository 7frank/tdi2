// src/logging/init.ts - Logging System Initialization

import type { LoggerConfig, LogLevel, ConsoleMonkeyPatchConfig } from './types';
import { TDILoggerService } from './tdi-logger-service';

// Environment detection
const getEnvironment = (): 'development' | 'production' | 'test' => {
  if (typeof process !== 'undefined') {
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.NODE_ENV === 'test') return 'test';
  }
  
  // Browser detection
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
      return 'development';
    }
  }
  
  return 'development';
};

// Configuration presets by environment
const ENV_CONFIGS: Record<string, LoggerConfig> = {
  development: {
    serviceName: 'tdi2-dev',
    serviceVersion: '1.0.0-dev',
    enableDiagnostics: true,
    diagnosticLevel: 'DEBUG',
    consoleMonkeyPatch: {
      log: 'otel',
      debug: 'otel',
      info: 'otel',
      warn: 'both',
      error: 'both',
      table: 'otel'
    },
    resource: {
      'deployment.environment': 'development',
      'service.namespace': 'tdi2',
      'service.instance.id': `dev-${Date.now()}`
    },
    processors: [{ type: 'console' }]
  },
  
  production: {
    serviceName: 'tdi2-prod',
    serviceVersion: '1.0.0',
    enableDiagnostics: false,
    diagnosticLevel: 'ERROR',
    consoleMonkeyPatch: {
      log: 'otel',
      debug: 'otel',
      info: 'otel',
      warn: 'both',
      error: 'both',
      table: 'otel'
    },
    resource: {
      'deployment.environment': 'production',
      'service.namespace': 'tdi2',
      'service.instance.id': `prod-${Date.now()}`
    },
    processors: [{ type: 'console' }]
  },
  
  test: {
    serviceName: 'tdi2-test',
    serviceVersion: '1.0.0-test',
    enableDiagnostics: false,
    diagnosticLevel: 'NONE',
    consoleMonkeyPatch: {
      log: 'otel',
      debug: 'otel',
      info: 'otel',
      warn: 'otel',
      error: 'otel',
      table: 'otel'
    },
    resource: {
      'deployment.environment': 'test',
      'service.namespace': 'tdi2',
      'service.instance.id': `test-${Date.now()}`
    },
    processors: [{ type: 'console' }]
  }
};

export interface InitOptions {
  environment?: 'development' | 'production' | 'test' | 'auto';
  consoleLogLevel?: LogLevel; // Deprecated: use consoleMonkeyPatch instead
  serviceName?: string;
  serviceVersion?: string;
  enableConsoleMonkeyPatch?: boolean; // Deprecated: use consoleMonkeyPatch instead
  consoleMonkeyPatch?: ConsoleMonkeyPatchConfig;
  enableDiagnostics?: boolean;
  customConfig?: Partial<LoggerConfig>;
  autoDetectEnvironment?: boolean;
}

let globalLogger: TDILoggerService | null = null;

/**
 * Initialize the TDI2 logging system with environment-specific defaults
 */
export function initLogging(options: InitOptions = {}): TDILoggerService {
  // Determine environment
  const environment = options.environment === 'auto' || options.autoDetectEnvironment !== false
    ? getEnvironment()
    : options.environment || 'development';

  // Get base configuration for environment
  const baseConfig = ENV_CONFIGS[environment] || ENV_CONFIGS.development;

  // Merge with custom options
  const finalConfig: LoggerConfig = {
    ...baseConfig,
    ...options.customConfig,
    ...(options.serviceName && { serviceName: options.serviceName }),
    ...(options.serviceVersion && { serviceVersion: options.serviceVersion }),
    ...(options.enableDiagnostics !== undefined && { 
      enableDiagnostics: options.enableDiagnostics 
    })
  };

  // Handle backward compatibility for deprecated options
  if (options.consoleLogLevel !== undefined) {
    console.warn('consoleLogLevel is deprecated. Use consoleMonkeyPatch config instead.');
    if (!finalConfig.consoleMonkeyPatch) {
      const shouldShowInConsole = ['WARN', 'ERROR', 'FATAL'].includes(options.consoleLogLevel);
      finalConfig.consoleMonkeyPatch = {
        log: 'otel',
        debug: 'otel',
        info: 'otel',
        warn: shouldShowInConsole ? 'both' : 'otel',
        error: shouldShowInConsole ? 'both' : 'otel',
        table: 'otel'
      };
    }
  }

  if (options.enableConsoleMonkeyPatch !== undefined) {
    console.warn('enableConsoleMonkeyPatch is deprecated. Use consoleMonkeyPatch config instead.');
    if (options.enableConsoleMonkeyPatch && !finalConfig.consoleMonkeyPatch) {
      finalConfig.consoleMonkeyPatch = {
        log: 'otel',
        debug: 'otel',
        info: 'otel',
        warn: 'both',
        error: 'both',
        table: 'otel'
      };
    }
  }

  if (options.consoleMonkeyPatch) {
    finalConfig.consoleMonkeyPatch = {
      ...finalConfig.consoleMonkeyPatch,
      ...options.consoleMonkeyPatch
    };
  }

  // Create logger service
  globalLogger = TDILoggerService.create(finalConfig);

  // Log initialization
  globalLogger.info('TDI2 Logging System Initialized', {
    environment,
    serviceName: finalConfig.serviceName,
    consoleMonkeyPatch: finalConfig.consoleMonkeyPatch,
    enableDiagnostics: finalConfig.enableDiagnostics
  });

  return globalLogger;
}

/**
 * Get the global logger instance
 */
export function getLogger(): TDILoggerService {
  if (!globalLogger) {
    globalLogger = initLogging();
  }
  return globalLogger;
}

/**
 * Shutdown the logging system gracefully
 */
export async function shutdownLogging(): Promise<void> {
  if (globalLogger) {
    await globalLogger.shutdown();
    globalLogger = null;
  }
}

/**
 * Quick setup functions for common scenarios
 */
export const logging = {
  /**
   * Initialize with development settings (verbose logging, console monkey-patch)
   */
  forDevelopment: (customConfig?: Partial<LoggerConfig>) => {
    return initLogging({
      environment: 'development',
      customConfig
    });
  },

  /**
   * Initialize with production settings (minimal logging, error-only console)
   */
  forProduction: (customConfig?: Partial<LoggerConfig>) => {
    return initLogging({
      environment: 'production',
      customConfig
    });
  },

  /**
   * Initialize with test settings (silent logging, no console monkey-patch)
   */
  forTesting: (customConfig?: Partial<LoggerConfig>) => {
    return initLogging({
      environment: 'test',
      customConfig
    });
  },

  /**
   * Initialize with custom console log level only (deprecated - use withConsoleMonkeyPatch)
   */
  withConsoleLevel: (level: LogLevel) => {
    console.warn('withConsoleLevel is deprecated. Use withConsoleMonkeyPatch instead.');
    const showInConsole = ['WARN', 'ERROR', 'FATAL'].includes(level);
    return initLogging({
      consoleMonkeyPatch: {
        log: 'otel',
        debug: 'otel',
        info: 'otel',
        warn: showInConsole ? 'both' : 'otel',
        error: showInConsole ? 'both' : 'otel',
        table: 'otel'
      }
    });
  },

  /**
   * Initialize with fine-grained console monkey patch control
   */
  withConsoleMonkeyPatch: (config: ConsoleMonkeyPatchConfig) => {
    return initLogging({
      consoleMonkeyPatch: config
    });
  },

  /**
   * Initialize with monkey-patching enabled/disabled (deprecated)
   */
  withMonkeyPatch: (enabled: boolean = true) => {
    console.warn('withMonkeyPatch is deprecated. Use withConsoleMonkeyPatch instead.');
    return initLogging({
      consoleMonkeyPatch: enabled ? {
        log: 'otel',
        debug: 'otel',
        info: 'otel',
        warn: 'both',
        error: 'both',
        table: 'otel'
      } : undefined
    });
  },

  /**
   * Auto-detect environment and use appropriate settings
   */
  auto: (customConfig?: Partial<LoggerConfig>) => {
    return initLogging({
      environment: 'auto',
      customConfig
    });
  }
};

/**
 * Convenience functions for immediate logging without explicit logger instance
 */
export const log = {
  trace: (message: string, context?: any) => getLogger().trace(message, context),
  debug: (message: string, context?: any) => getLogger().debug(message, context),
  info: (message: string, context?: any) => getLogger().info(message, context),
  warn: (message: string, context?: any) => getLogger().warn(message, context),
  error: (message: string, error?: Error, context?: any) => getLogger().error(message, error, context),
  fatal: (message: string, error?: Error, context?: any) => getLogger().fatal(message, error, context),

  // TDI2-specific logging
  diRegistration: (interfaceName: string, implementationClass: string, type: string) => 
    getLogger().logDIRegistration(interfaceName, implementationClass, type as any),
  
  diResolution: (token: string, resolvedClass: string, success: boolean, duration?: number) =>
    getLogger().logDIResolution(token, resolvedClass, success, duration),

  serviceCreation: (serviceClass: string, dependencies: string[], duration?: number) =>
    getLogger().logServiceCreation(serviceClass, dependencies, duration),

  componentTransformation: (componentName: string, type: 'functional' | 'class', dependencies: string[]) =>
    getLogger().logComponentTransformation(componentName, type, dependencies),

  performance: (metric: string, value: number, unit: string = 'ms') =>
    getLogger().logPerformance(metric, value, unit),

  memoryUsage: () => getLogger().logMemoryUsage(),

  userAction: (action: string, userId?: string) =>
    getLogger().logUserAction(action, userId),

  apiCall: (method: string, url: string, statusCode?: number, duration?: number) =>
    getLogger().logAPICall(method, url, statusCode, duration)
};

/**
 * Development helpers
 */
export const devLog = {
  /**
   * Log with timing wrapper
   */
  withTiming: <T>(operation: string, fn: () => T | Promise<T>, context?: any): T | Promise<T> => {
    return getLogger().logWithTiming(operation, fn, context);
  },

  /**
   * Log object differences
   */
  diff: (operation: string, before: any, after: any) => {
    getLogger().logObjectDiff(operation, before, after);
  },

  /**
   * Debug information logging
   */
  debugInfo: (category: string, info: Record<string, any>) => {
    getLogger().logDebugInfo(category, info);
  }
};

/**
 * Error helpers with categorization
 */
export const errorLog = {
  diError: (type: string, message: string, error?: Error) =>
    getLogger().logDIError(type as any, message, error),

  transformationError: (type: string, fileName: string, message: string, error?: Error) =>
    getLogger().logTransformationError(type as any, fileName, message, error)
};

// Export logger service class for DI registration
export { TDILoggerService } from './tdi-logger-service';
export type { LoggerInterface } from './tdi-logger-service';

// Re-export types for convenience
export type { LogLevel, LogContext, LogEntry, LoggerConfig } from './types';