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
import { initLogging, getLogger } from "./init";

export { initLogging, getLogger };

// Console monkey patch utilities
import {
  ConsoleMonkeyPatch,
  consoleMonkeyPatch,
  patchConsole,
  unpatchConsole,
  updateConsoleConfig,
  withOriginalConsole,
  withConsoleContext,
} from "./console-monkey-patch";

export {
  ConsoleMonkeyPatch,
  consoleMonkeyPatch,
  patchConsole,
  unpatchConsole,
  updateConsoleConfig,
  withOriginalConsole,
  withConsoleContext,
};
