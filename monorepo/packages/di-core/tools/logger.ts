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
 *   console.debug("deep debugging info");   // DEBUG=di-core:* + LOG_LEVEL=DEBUG → di-core:config-manager:debug
 *   console.log("verbose info");            // DEBUG=di-core:* + LOG_LEVEL=DEBUG → di-core:config-manager
 *   console.info("important operation");    // DEBUG=di-core:* + LOG_LEVEL=INFO → di-core:config-manager:info
 *   console.warn("warning message");        // DEBUG=di-core:* + LOG_LEVEL=WARN → di-core:config-manager:warn (default)
 *   console.error("error message");         // DEBUG=di-core:* + LOG_LEVEL=ERROR → di-core:config-manager:error
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
  const infoLogger = root.extend("info");
  const warnLogger = root.extend("warn");
  const errorLogger = root.extend("error");

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

    // Info logs - important operations we want to see (requires DEBUG to be set)
    info: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.INFO)) {
        infoLogger(formatter, ...args);
      }
    },

    // Warnings - always shown by default (bypasses DEBUG requirement)
    warn: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.WARN)) {
        // Force output via debug package OR use console.warn as fallback
        warnLogger.enabled = true;
        warnLogger(formatter, ...args);
      }
    },

    // Errors - always shown unless SILENT (bypasses DEBUG requirement)
    error: (formatter: any, ...args: any[]) => {
      if (shouldLog(LogLevel.ERROR)) {
        // Force output via debug package OR use console.error as fallback
        errorLogger.enabled = true;
        errorLogger(formatter, ...args);
      }
    },
  };
}

// Export log level utilities for testing
export { getLogLevel, shouldLog };
