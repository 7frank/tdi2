// tools/logger.ts
import createDebug from "debug";

/**
 * Log levels in order of severity (higher = more critical)
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Parse LOG_LEVEL environment variable
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();

  switch (envLevel) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'SILENT': return LogLevel.SILENT;
    default: return LogLevel.WARN; // Default: only show warnings and errors
  }
}

const CURRENT_LOG_LEVEL = getLogLevel();

/**
 * Check if a message at the given level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return level >= CURRENT_LOG_LEVEL;
}

/**
 * Creates a namespaced logger for a specific file or module.
 *
 * Usage:
 *   const console = consoleFor("di-core:config-manager");
 *   console.debug("deep debugging info");   // Only shown with DEBUG=di-core:* AND LOG_LEVEL=DEBUG
 *   console.log("verbose info");            // Only shown with DEBUG=di-core:* AND LOG_LEVEL=DEBUG
 *   console.info("important operation");    // Shown with LOG_LEVEL=INFO or LOG_LEVEL=DEBUG
 *   console.warn("warning message");        // Shown with LOG_LEVEL=WARN, INFO, or DEBUG (default)
 *   console.error("error message");         // Always shown unless LOG_LEVEL=SILENT
 *
 * Environment variables:
 *   LOG_LEVEL=DEBUG   - Show all messages (debug, log, info, warn, error)
 *   LOG_LEVEL=INFO    - Show info, warn, error (not debug/log)
 *   LOG_LEVEL=WARN    - Show warn, error only (DEFAULT)
 *   LOG_LEVEL=ERROR   - Show errors only
 *   LOG_LEVEL=SILENT  - Show nothing
 *
 *   DEBUG=di-core:*   - Enable debug package namespaced logging (works with LOG_LEVEL)
 *   DEBUG=*           - Enable all debug package logging
 *
 * Examples:
 *   npm run dev                           // Only warnings and errors (clean)
 *   LOG_LEVEL=INFO npm run dev            // Important operations + warnings + errors
 *   LOG_LEVEL=DEBUG npm run dev           // All logs (very verbose)
 *   DEBUG=di-core:config-manager LOG_LEVEL=DEBUG npm run dev  // Specific module debug
 */
export function consoleFor(name: string) {
  const root = createDebug(name);
  const debugLogger = root.extend("debug");

  return {
    // Debug/verbose logs - only shown when DEBUG env var is set AND LOG_LEVEL allows it
    log: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.DEBUG)) {
        root(formatter, ...args);
      }
    },

    debug: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.DEBUG)) {
        debugLogger(formatter, ...args);
      }
    },

    // Info logs - important operations we want to see
    info: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.INFO)) {
        const message = typeof formatter === 'string' ? formatter : String(formatter);
        console.info(`[${name}] ${message}`, ...args);
      }
    },

    // Warnings - shown by default
    warn: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.WARN)) {
        const message = typeof formatter === 'string' ? formatter : String(formatter);
        console.warn(`[${name}] ${message}`, ...args);
      }
    },

    // Errors - always shown unless SILENT
    error: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.ERROR)) {
        const message = typeof formatter === 'string' ? formatter : String(formatter);
        console.error(`[${name}] ${message}`, ...args);
      }
    },
  };
}

// Export log level utilities for testing
export { getLogLevel, shouldLog };
