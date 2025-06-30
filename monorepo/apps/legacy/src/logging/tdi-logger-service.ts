// src/logging/tdi-logger-service.ts - DI-integrated Logger Service

import { Service } from '@tdi2/di-core/decorators';
import type { TDILogger, LoggerConfig, LogContext, LogLevel } from "./types";
import { OTelLoggerProvider } from "./otel-logger-provider";

// Define the logger interface for DI
export interface LoggerInterface extends TDILogger {
  // Extend with service-specific methods
  createChildLogger(name: string, context?: LogContext): LoggerInterface;
  setGlobalContext(context: LogContext): void;
  getGlobalContext(): LogContext;
}

@Service()
export class TDILoggerService implements LoggerInterface {
  private static instance: TDILoggerService | null = null;
  private loggerProvider: OTelLoggerProvider;
  private globalContext: LogContext = {};
  private currentLogger: TDILogger;
  private loggerName: string;

  constructor(loggerName: string = "tdi-app", config?: LoggerConfig) {
    this.loggerName = loggerName;

    // Initialize OpenTelemetry logger provider
    this.loggerProvider = new OTelLoggerProvider(config);

    // Only initialize once globally
    if (!TDILoggerService.instance) {
      this.loggerProvider.initialize();
      TDILoggerService.instance = this;
    }

    // Get the current logger instance
    this.currentLogger = this.loggerProvider.getLogger(
      loggerName,
      this.globalContext
    );
  }

  // Static factory method for easy DI configuration
  static create(config?: LoggerConfig): TDILoggerService {
    if (TDILoggerService.instance) {
      return TDILoggerService.instance;
    }

    return new TDILoggerService("tdi-app", config);
  }

  // Static method to get singleton instance
  static getInstance(): TDILoggerService | null {
    return TDILoggerService.instance;
  }

  // Implement TDILogger interface by delegating to current logger
  trace(message: string, context?: LogContext): void {
    this.currentLogger.trace(message, this.mergeWithGlobalContext(context));
  }

  debug(message: string, context?: LogContext): void {
    this.currentLogger.debug(message, this.mergeWithGlobalContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.currentLogger.info(message, this.mergeWithGlobalContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.currentLogger.warn(message, this.mergeWithGlobalContext(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.currentLogger.error(
      message,
      error,
      this.mergeWithGlobalContext(context)
    );
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.currentLogger.fatal(
      message,
      error,
      this.mergeWithGlobalContext(context)
    );
  }

  log(entry: import("./types").LogEntry): void {
    const entryWithContext = {
      ...entry,
      context: this.mergeWithGlobalContext(entry.context),
    };
    this.currentLogger.log(entryWithContext);
  }

  withContext(context: LogContext): TDILogger {
    return this.currentLogger.withContext(this.mergeWithGlobalContext(context));
  }

  getContext(): LogContext {
    return { ...this.globalContext, ...this.currentLogger.getContext() };
  }

  // Service-specific methods
  createChildLogger(name: string, context?: LogContext): LoggerInterface {
    const childContext = this.mergeWithGlobalContext(context);

    return new TDILoggerService(name, undefined);
  }

  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };

    // Update current logger with new global context
    this.currentLogger = this.loggerProvider.getLogger(
      this.loggerName,
      this.globalContext
    );
  }

  getGlobalContext(): LogContext {
    return { ...this.globalContext };
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.loggerProvider.updateConfig(config);
  }

  isConsolePatched(): boolean {
    return this.loggerProvider.isConsolePatched();
  }

  // Lifecycle management
  async shutdown(): Promise<void> {
    await this.loggerProvider.shutdown();
    TDILoggerService.instance = null;
  }

  async forceFlush(): Promise<void> {
    await this.loggerProvider.forceFlush();
  }

  // Advanced logging patterns for TDI2
  logDIRegistration(
    interfaceName: string,
    implementationClass: string,
    registrationType: "interface" | "class" | "inheritance" | "state",
    context?: LogContext
  ): void {
    this.debug(`DI Registration: ${interfaceName} -> ${implementationClass}`, {
      ...context,
      interfaceName,
      implementationClass,
      registrationType,
      type: "di_registration",
    });
  }

  logDIResolution(
    token: string,
    resolvedClass: string,
    success: boolean,
    duration?: number,
    context?: LogContext
  ): void {
    const level = success ? "debug" : "warn";
    this[level](
      `DI Resolution: ${token} -> ${success ? resolvedClass : "FAILED"}`,
      undefined,
      {
        ...context,
        token,
        resolvedClass,
        success,
        duration,
        type: "di_resolution",
      }
    );
  }

  logServiceCreation(
    serviceClass: string,
    dependencies: string[],
    duration?: number,
    context?: LogContext
  ): void {
    this.debug(`Service Created: ${serviceClass}`, {
      ...context,
      serviceClass,
      dependencies,
      dependencyCount: dependencies.length,
      duration,
      type: "service_creation",
    });
  }

  logComponentTransformation(
    componentName: string,
    transformationType: "functional" | "class",
    dependenciesInjected: string[],
    context?: LogContext
  ): void {
    this.debug(`Component Transformed: ${componentName}`, {
      ...context,
      componentName,
      transformationType,
      dependenciesInjected,
      injectionCount: dependenciesInjected.length,
      type: "component_transformation",
    });
  }

  logInterfaceResolution(
    interfaceType: string,
    implementationFound: boolean,
    candidateCount: number,
    selectedImplementation?: string,
    context?: LogContext
  ): void {
    const level = implementationFound ? "debug" : "warn";
    this[level](`Interface Resolution: ${interfaceType}`, undefined, {
      ...context,
      interfaceType,
      implementationFound,
      candidateCount,
      selectedImplementation,
      type: "interface_resolution",
    });
  }

  logConfigurationChange(
    configKey: string,
    oldValue: any,
    newValue: any,
    context?: LogContext
  ): void {
    this.info(`Configuration Changed: ${configKey}`, {
      ...context,
      configKey,
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify(newValue),
      type: "configuration_change",
    });
  }

  // Performance logging for TDI2 operations
  logTransformationPerformance(
    phase: "scan" | "resolve" | "generate" | "write",
    duration: number,
    filesProcessed?: number,
    context?: LogContext
  ): void {
    this.logPerformance(`transformation_${phase}`, duration, "ms", {
      ...context,
      phase,
      filesProcessed,
      type: "transformation_performance",
    });
  }

  logContainerPerformance(
    operation: "resolve" | "create" | "cache_hit" | "cache_miss",
    serviceToken: string,
    duration: number,
    context?: LogContext
  ): void {
    this.logPerformance(`container_${operation}`, duration, "ms", {
      ...context,
      operation,
      serviceToken,
      type: "container_performance",
    });
  }

  // Error logging with categorization
  logDIError(
    errorType:
      | "resolution_failed"
      | "circular_dependency"
      | "missing_implementation"
      | "instantiation_failed",
    errorMessage: string,
    error?: Error,
    context?: LogContext
  ): void {
    this.error(`DI Error [${errorType}]: ${errorMessage}`, error, {
      ...context,
      errorType,
      category: "di_error",
      type: "error",
    });
  }

  logTransformationError(
    errorType: "parse_error" | "generation_error" | "file_write_error",
    fileName: string,
    errorMessage: string,
    error?: Error,
    context?: LogContext
  ): void {
    this.error(`Transformation Error [${errorType}]: ${errorMessage}`, error, {
      ...context,
      errorType,
      fileName,
      category: "transformation_error",
      type: "error",
    });
  }

  // Development and debugging helpers
  logDebugInfo(
    category: string,
    info: Record<string, any>,
    context?: LogContext
  ): void {
    this.debug(`Debug Info [${category}]`, {
      ...context,
      category,
      debugInfo: info,
      type: "debug_info",
    });
  }

  logMemoryUsage(context?: LogContext): void {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.info("Memory Usage", {
        ...context,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        type: "memory_usage",
      });
    }
  }

  // Private utility methods
  private mergeWithGlobalContext(context?: LogContext): LogContext {
    return { ...this.globalContext, ...context };
  }

  // Static utility methods for easy access
  static log = {
    trace: (message: string, context?: LogContext) => {
      TDILoggerService.instance?.trace(message, context);
    },
    debug: (message: string, context?: LogContext) => {
      TDILoggerService.instance?.debug(message, context);
    },
    info: (message: string, context?: LogContext) => {
      TDILoggerService.instance?.info(message, context);
    },
    warn: (message: string, context?: LogContext) => {
      TDILoggerService.instance?.warn(message, context);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      TDILoggerService.instance?.error(message, error, context);
    },
    fatal: (message: string, error?: Error, context?: LogContext) => {
      TDILoggerService.instance?.fatal(message, error, context);
    },
  };

  // Configuration presets
  static createDevelopmentLogger(): TDILoggerService {
    return TDILoggerService.create({
      serviceName: "tdi2-dev",
      serviceVersion: "1.0.0-dev",
      enableDiagnostics: true,
      diagnosticLevel: "DEBUG",
      processors: [{ type: "console" }],
    });
  }

  static createProductionLogger(): TDILoggerService {
    return TDILoggerService.create({
      serviceName: "tdi2-prod",
      serviceVersion: "1.0.0",
      enableDiagnostics: false,
      diagnosticLevel: "ERROR",
      processors: [{ type: "console" }],
    });
  }

  static createTestLogger(): TDILoggerService {
    return TDILoggerService.create({
      serviceName: "tdi2-test",
      serviceVersion: "1.0.0-test",
      enableDiagnostics: false,
      diagnosticLevel: "NONE",
      processors: [{ type: "console" }],
    });
  }
}
