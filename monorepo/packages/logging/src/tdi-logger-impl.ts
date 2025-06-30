// src/logging/tdi-logger-impl.ts - TDI Logger Implementation

import type { Logger } from '@opentelemetry/api-logs';
import * as logsAPI from '@opentelemetry/api-logs';
import type { TDILogger, LogLevel, LogEntry, LogContext, ConsolePatch } from './types';

export class TDILoggerImpl implements TDILogger {
  private readonly otelLogger: Logger;
  private readonly name: string;
  private readonly context: LogContext;
  private readonly originalConsole: ConsolePatch | null;

  constructor(
    otelLogger: Logger,
    name: string,
    context: LogContext = {},
    originalConsole: ConsolePatch | null = null
  ) {
    this.otelLogger = otelLogger;
    this.name = name;
    this.context = { ...context };
    this.originalConsole = originalConsole;
  }

  trace(message: string, context?: LogContext): void {
    this.log({
      severityText: 'TRACE' as LogLevel,
      body: message,
      context: this.mergeContext(context)
    });
  }

  debug(message: string, context?: LogContext): void {
    this.log({
      severityText: 'DEBUG' as LogLevel,
      body: message,
      context: this.mergeContext(context)
    });
  }

  info(message: string, context?: LogContext): void {
    this.log({
      severityText: 'INFO' as LogLevel,
      body: message,
      context: this.mergeContext(context)
    });
  }

  warn(message: string, context?: LogContext): void {
    this.log({
      severityText: 'WARN' as LogLevel,
      body: message,
      context: this.mergeContext(context)
    });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const mergedContext = this.mergeContext(context);
    
    if (error) {
      mergedContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      };
    }

    this.log({
      severityText: 'ERROR' as LogLevel,
      body: message,
      context: mergedContext
    });
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    const mergedContext = this.mergeContext(context);
    
    if (error) {
      mergedContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      };
    }

    this.log({
      severityText: 'FATAL' as LogLevel,
      body: message,
      context: mergedContext
    });
  }

  log(entry: LogEntry): void {
    // Add default timestamp if not provided
    const timestamp = entry.timestamp || Date.now();
    
    // Merge contexts
    const finalContext = this.mergeContext(entry.context);
    
    // Create attributes for OpenTelemetry
    const attributes: Record<string, any> = {
      'logger.name': this.name,
      'log.timestamp': timestamp,
      'log.severity': entry.severityText,
      ...this.flattenContext(finalContext),
      ...entry.attributes
    };

    // Map severity to OpenTelemetry severity number
    const severityNumber = this.mapSeverityToNumber(entry.severityText);

    // Emit to OpenTelemetry with correct API
    this.otelLogger.emit({
      severityNumber,
      severityText: entry.severityText,
      body: entry.body,
      timestamp,
      attributes
    });

    // Also log to original console if available (for backwards compatibility)
    if (this.originalConsole) {
      this.logToOriginalConsole(entry);
    }
  }

  withContext(context: LogContext): TDILogger {
    const mergedContext = this.mergeContext(context);
    return new TDILoggerImpl(
      this.otelLogger,
      this.name,
      mergedContext,
      this.originalConsole
    );
  }

  isLevelEnabled(level: LogLevel): boolean {
    const levelPriority = {
      TRACE: 0,
      DEBUG: 1,
      INFO: 2,
      WARN: 3,
      ERROR: 4,
      FATAL: 5
    };

    // For now, all levels are enabled for OpenTelemetry
    // This could be made configurable in the future
    return true;
  }

  getContext(): LogContext {
    return { ...this.context };
  }

  private mergeContext(additionalContext?: LogContext): LogContext {
    return {
      ...this.context,
      ...additionalContext
    };
  }

  private flattenContext(context: LogContext, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively flatten nested objects
        Object.assign(flattened, this.flattenContext(value as LogContext, fullKey));
      } else {
        // Serialize complex values
        if (typeof value === 'function') {
          flattened[fullKey] = '[Function]';
        } else if (value instanceof Date) {
          flattened[fullKey] = value.toISOString();
        } else if (typeof value === 'object' && value !== null) {
          try {
            flattened[fullKey] = JSON.stringify(value);
          } catch {
            flattened[fullKey] = '[Object]';
          }
        } else {
          flattened[fullKey] = value;
        }
      }
    }
    
    return flattened;
  }

  private mapSeverityToNumber(severityText: LogLevel): number {
    // Map severity text to OpenTelemetry severity numbers
    switch (severityText) {
      case 'TRACE': return logsAPI.SeverityNumber.TRACE;
      case 'DEBUG': return logsAPI.SeverityNumber.DEBUG;
      case 'INFO': return logsAPI.SeverityNumber.INFO;
      case 'WARN': return logsAPI.SeverityNumber.WARN;
      case 'ERROR': return logsAPI.SeverityNumber.ERROR;
      case 'FATAL': return logsAPI.SeverityNumber.FATAL;
      default: return logsAPI.SeverityNumber.INFO;
    }
  }

  private logToOriginalConsole(entry: LogEntry): void {
    if (!this.originalConsole) return;

    const timestamp = new Date(entry.timestamp || Date.now()).toISOString();
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    const formattedMessage = `[${timestamp}] [${entry.severityText}] [${this.name}] ${entry.body}${contextStr}`;

    switch (entry.severityText) {
      case 'TRACE':
      case 'DEBUG':
        this.originalConsole.debug(formattedMessage);
        break;
      case 'INFO':
        this.originalConsole.info(formattedMessage);
        break;
      case 'WARN':
        this.originalConsole.warn(formattedMessage);
        break;
      case 'ERROR':
      case 'FATAL':
        this.originalConsole.error(formattedMessage);
        break;
      default:
        this.originalConsole.log(formattedMessage);
    }
  }

  public logWithTiming<T>(
    operation: string,
    fn: () => T | Promise<T>,
    context?: LogContext
  ): T | Promise<T> {
    const startTime = Date.now();
    const operationId = Math.random().toString(36).substr(2, 9);
    
    this.debug(`Starting operation: ${operation}`, {
      ...context,
      operationId,
      operation,
      startTime
    });

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime;
            this.info(`Operation completed: ${operation}`, {
              ...context,
              operationId,
              operation,
              duration,
              success: true
            });
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            this.error(`Operation failed: ${operation}`, error, {
              ...context,
              operationId,
              operation,
              duration,
              success: false
            });
            throw error;
          });
      } else {
        const duration = Date.now() - startTime;
        this.info(`Operation completed: ${operation}`, {
          ...context,
          operationId,
          operation,
          duration,
          success: true
        });
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Operation failed: ${operation}`, error as Error, {
        ...context,
        operationId,
        operation,
        duration,
        success: false
      });
      throw error;
    }
  }

  public logObjectDiff(
    operation: string,
    before: any,
    after: any,
    context?: LogContext
  ): void {
    this.debug(`Object diff for operation: ${operation}`, {
      ...context,
      operation,
      before: JSON.stringify(before),
      after: JSON.stringify(after),
      changed: JSON.stringify(before) !== JSON.stringify(after)
    });
  }

  public logPerformance(
    metric: string,
    value: number,
    unit: string = 'ms',
    context?: LogContext
  ): void {
    this.info(`Performance metric: ${metric}`, {
      ...context,
      metric,
      value,
      unit,
      type: 'performance'
    });
  }

  public logUserAction(
    action: string,
    userId?: string,
    context?: LogContext
  ): void {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      userId,
      type: 'user_action',
      timestamp: new Date().toISOString()
    });
  }

  public logAPICall(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext
  ): void {
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    
    this[level](`API call: ${method} ${url}`, undefined, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      type: 'api_call'
    });
  }
}