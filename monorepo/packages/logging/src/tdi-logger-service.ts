// src/logging/tdi-logger-service.ts - DI-integrated Logger Service

import { Service } from "@tdi2/di-core/decorators";
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
  static create(config?: LoggerConfig): LoggerInterface {
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

  // Private utility methods
  private mergeWithGlobalContext(context?: LogContext): LogContext {
    return { ...this.globalContext, ...context };
  }
}
