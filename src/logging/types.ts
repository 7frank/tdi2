// src/logging/types.ts - OpenTelemetry Logger Types

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG', 
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogEntry {
  severityText: LogLevel;
  body: string;
  timestamp?: number;
  attributes?: Record<string, any>;
  context?: LogContext;
}

export interface LogContext {
  service?: string;
  module?: string;
  component?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  [key: string]: any;
}

export type ConsoleOutputMode = 'otel' | 'console' | 'both';

export interface ConsoleMonkeyPatchConfig {
  log?: ConsoleOutputMode;
  debug?: ConsoleOutputMode;
  info?: ConsoleOutputMode;
  warn?: ConsoleOutputMode;
  error?: ConsoleOutputMode;
  table?: ConsoleOutputMode;
}

export interface LoggerConfig {
  serviceName?: string;
  serviceVersion?: string;
  consoleLogLevel?: LogLevel; // Deprecated: use consoleMonkeyPatch instead
  enableDiagnostics?: boolean;
  diagnosticLevel?: 'NONE' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE' | 'ALL';
  enableConsoleMonkeyPatch?: boolean; // Deprecated: use consoleMonkeyPatch instead
  consoleMonkeyPatch?: ConsoleMonkeyPatchConfig;
  resource?: Record<string, any>;
  processors?: LogProcessorConfig[];
}

export interface LogProcessorConfig {
  type: 'console' | 'file' | 'remote';
  config?: any;
}

export interface TDILogger {
  trace(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  fatal(message: string, error?: Error, context?: LogContext): void;
  
  // Structured logging
  log(entry: LogEntry): void;
  
  // Context management
  withContext(context: LogContext): TDILogger;
  
  // Utility methods
  isLevelEnabled(level: LogLevel): boolean;
  getContext(): LogContext;
}

export interface ConsolePatch {
  log: typeof console.log;
  debug: typeof console.debug;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
  table: typeof console.table;
}

export interface LoggerProvider {
  getLogger(name?: string, context?: LogContext): TDILogger;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}