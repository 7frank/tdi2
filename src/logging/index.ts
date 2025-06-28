// src/logging/index.ts - Main logging module exports

// Core types
export type {
  LogLevel,
  LogEntry,
  LogContext,
  LoggerConfig,
  TDILogger,
  ConsolePatch,
  LoggerProvider as ILoggerProvider,
  LogProcessorConfig,
} from "./types";

// Main logger service and interface for DI
export { TDILoggerService } from "./tdi-logger-service";
export type { LoggerInterface } from "./tdi-logger-service";

// OpenTelemetry provider
export { OTelLoggerProvider } from "./otel-logger-provider";

// Logger implementation
export { TDILoggerImpl } from "./tdi-logger-impl";

// Initialization and convenience functions
import {
  initLogging,
  getLogger,
  shutdownLogging,
  logging,
  log,
  devLog,
  errorLog,
} from "./init";

export {
  initLogging,
  getLogger,
  shutdownLogging,
  logging,
  log,
  devLog,
  errorLog,
};

// Console monkey patch utilities
import {
  ConsoleMonkeyPatch,
  consoleMonkeyPatch,
  patchConsole,
  unpatchConsole,
  setConsoleLogLevel,
  withOriginalConsole,
  withConsoleContext,
} from "./console-monkey-patch";

export {
  ConsoleMonkeyPatch,
  consoleMonkeyPatch,
  patchConsole,
  unpatchConsole,
  setConsoleLogLevel,
  withOriginalConsole,
  withConsoleContext,
};

// Examples for reference
export { examples } from "./example-usage";

// Convenience re-exports for common patterns
export const Logger = {
  // Quick initialization
  init: initLogging,
  auto: logging.auto,
  forDev: logging.forDevelopment,
  forProd: logging.forProduction,
  forTest: logging.forTesting,

  // Quick logging
  trace: log.trace,
  debug: log.debug,
  info: log.info,
  warn: log.warn,
  error: log.error,
  fatal: log.fatal,

  // DI-specific logging
  diRegistration: log.diRegistration,
  diResolution: log.diResolution,
  serviceCreation: log.serviceCreation,
  componentTransformation: log.componentTransformation,

  // Performance logging
  performance: log.performance,
  memory: log.memoryUsage,

  // User and API logging
  userAction: log.userAction,
  apiCall: log.apiCall,

  // Development helpers
  withTiming: devLog.withTiming,
  diff: devLog.diff,
  debugInfo: devLog.debugInfo,

  // Console monkey patch
  patchConsole,
  unpatchConsole,
  setConsoleLevel: setConsoleLogLevel,
};

// Default export for easy importing
export default Logger;
