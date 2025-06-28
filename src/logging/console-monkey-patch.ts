// src/logging/console-monkey-patch.ts - Standalone Console Monkey Patch Utility

import type { LogLevel, ConsolePatch, LogContext } from './types';
import { getLogger } from './init';

/**
 * Standalone console monkey-patch utility that can be used independently
 * or integrated with the full TDI2 logging system
 */
export class ConsoleMonkeyPatch {
  private originalConsole: ConsolePatch | null = null;
  private isPatched = false;
  private logLevel: LogLevel;
  private loggerName: string;
  private globalContext: LogContext;

  constructor(
    logLevel: LogLevel = 'WARN' as LogLevel,
    loggerName: string = 'console-proxy',
    globalContext: LogContext = {}
  ) {
    this.logLevel = logLevel;
    this.loggerName = loggerName;
    this.globalContext = globalContext;
  }

  /**
   * Apply monkey patch to console methods
   */
  patch(): void {
    if (this.isPatched) {
      console.warn('Console is already monkey-patched');
      return;
    }

    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };

    const logger = getLogger().createChildLogger(this.loggerName, this.globalContext);

    // Monkey patch console methods
    console.log = (...args: any[]) => {
      const message = this.formatMessage(args);
      logger.info(message, { source: 'console.log', args: this.serializeArgs(args) });
      
      // Also log to original console if level allows
      if (this.shouldLogToConsole('INFO')) {
        this.originalConsole!.log(...args);
      }
    };

    console.debug = (...args: any[]) => {
      const message = this.formatMessage(args);
      logger.debug(message, { source: 'console.debug', args: this.serializeArgs(args) });
      
      if (this.shouldLogToConsole('DEBUG')) {
        this.originalConsole!.debug(...args);
      }
    };

    console.info = (...args: any[]) => {
      const message = this.formatMessage(args);
      logger.info(message, { source: 'console.info', args: this.serializeArgs(args) });
      
      if (this.shouldLogToConsole('INFO')) {
        this.originalConsole!.info(...args);
      }
    };

    console.warn = (...args: any[]) => {
      const message = this.formatMessage(args);
      logger.warn(message, { source: 'console.warn', args: this.serializeArgs(args) });
      
      if (this.shouldLogToConsole('WARN')) {
        this.originalConsole!.warn(...args);
      }
    };

    console.error = (...args: any[]) => {
      const message = this.formatMessage(args);
      const error = args.find(arg => arg instanceof Error);
      logger.error(message, error, { source: 'console.error', args: this.serializeArgs(args) });
      
      if (this.shouldLogToConsole('ERROR')) {
        this.originalConsole!.error(...args);
      }
    };

    this.isPatched = true;

    // Log the monkey patch activation
    logger.info('Console monkey patch activated', {
      logLevel: this.logLevel,
      loggerName: this.loggerName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Remove monkey patch and restore original console methods
   */
  unpatch(): void {
    if (!this.isPatched || !this.originalConsole) {
      console.warn('Console is not monkey-patched');
      return;
    }

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;

    // Log restoration using original console
    this.originalConsole.info('Console monkey patch removed, original methods restored');

    this.originalConsole = null;
    this.isPatched = false;
  }

  /**
   * Update the log level for console output
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    
    if (this.isPatched) {
      const logger = getLogger().createChildLogger(this.loggerName, this.globalContext);
      logger.info('Console monkey patch log level updated', { 
        newLogLevel: level,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update global context for all console logs
   */
  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
    
    if (this.isPatched) {
      const logger = getLogger().createChildLogger(this.loggerName, this.globalContext);
      logger.debug('Console monkey patch context updated', { 
        newContext: context,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check if console is currently patched
   */
  isPatchedStatus(): boolean {
    return this.isPatched;
  }

  /**
   * Get current configuration
   */
  getConfig(): {
    logLevel: LogLevel;
    loggerName: string;
    globalContext: LogContext;
    isPatched: boolean;
  } {
    return {
      logLevel: this.logLevel,
      loggerName: this.loggerName,
      globalContext: { ...this.globalContext },
      isPatched: this.isPatched
    };
  }

  /**
   * Temporarily disable console monkey patch for a function execution
   */
  withOriginalConsole<T>(fn: () => T): T {
    if (!this.isPatched || !this.originalConsole) {
      return fn();
    }

    const currentConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    try {
      // Temporarily restore original console
      console.log = this.originalConsole.log;
      console.debug = this.originalConsole.debug;
      console.info = this.originalConsole.info;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;

      return fn();
    } finally {
      // Restore monkey-patched console
      console.log = currentConsole.log;
      console.debug = currentConsole.debug;
      console.info = currentConsole.info;
      console.warn = currentConsole.warn;
      console.error = currentConsole.error;
    }
  }

  /**
   * Execute a function with enhanced logging context
   */
  withContext<T>(context: LogContext, fn: () => T): T {
    const oldContext = this.globalContext;
    this.globalContext = { ...this.globalContext, ...context };

    try {
      return fn();
    } finally {
      this.globalContext = oldContext;
    }
  }

  private formatMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }).join(' ');
  }

  private serializeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
          cause: arg.cause
        };
      }
      if (arg === null || arg === undefined) {
        return arg;
      }
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return '[Non-serializable Object]';
      }
    });
  }

  private shouldLogToConsole(messageLevel: LogLevel): boolean {
    const levelPriority = {
      TRACE: 0,
      DEBUG: 1,
      INFO: 2,
      WARN: 3,
      ERROR: 4,
      FATAL: 5
    };

    const configLevel = levelPriority[this.logLevel];
    const msgLevel = levelPriority[messageLevel];

    return msgLevel >= configLevel;
  }
}

// Global instance for convenience
let globalMonkeyPatch: ConsoleMonkeyPatch | null = null;

/**
 * Quick setup functions for console monkey patching
 */
export const consoleMonkeyPatch = {
  /**
   * Initialize and apply console monkey patch with specified log level
   */
  init: (logLevel: LogLevel = 'WARN' as LogLevel, loggerName?: string, context?: LogContext) => {
    if (globalMonkeyPatch) {
      console.warn('Console monkey patch already initialized');
      return globalMonkeyPatch;
    }

    globalMonkeyPatch = new ConsoleMonkeyPatch(logLevel, loggerName, context);
    globalMonkeyPatch.patch();
    return globalMonkeyPatch;
  },

  /**
   * Remove console monkey patch
   */
  remove: () => {
    if (globalMonkeyPatch) {
      globalMonkeyPatch.unpatch();
      globalMonkeyPatch = null;
    }
  },

  /**
   * Update log level for existing monkey patch
   */
  setLogLevel: (level: LogLevel) => {
    if (globalMonkeyPatch) {
      globalMonkeyPatch.setLogLevel(level);
    } else {
      console.warn('Console monkey patch not initialized');
    }
  },

  /**
   * Update global context for existing monkey patch
   */
  setContext: (context: LogContext) => {
    if (globalMonkeyPatch) {
      globalMonkeyPatch.setGlobalContext(context);
    } else {
      console.warn('Console monkey patch not initialized');
    }
  },

  /**
   * Check if monkey patch is active
   */
  isActive: () => {
    return globalMonkeyPatch?.isPatchedStatus() ?? false;
  },

  /**
   * Get current configuration
   */
  getConfig: () => {
    return globalMonkeyPatch?.getConfig() ?? null;
  },

  /**
   * Execute function with original console temporarily
   */
  withOriginal: <T>(fn: () => T): T => {
    if (globalMonkeyPatch) {
      return globalMonkeyPatch.withOriginalConsole(fn);
    }
    return fn();
  },

  /**
   * Execute function with additional context
   */
  withContext: <T>(context: LogContext, fn: () => T): T => {
    if (globalMonkeyPatch) {
      return globalMonkeyPatch.withContext(context, fn);
    }
    return fn();
  }
};

// Convenience functions for immediate use
export const patchConsole = (logLevel: LogLevel = 'WARN' as LogLevel) => 
  consoleMonkeyPatch.init(logLevel);

export const unpatchConsole = () => 
  consoleMonkeyPatch.remove();

export const setConsoleLogLevel = (level: LogLevel) => 
  consoleMonkeyPatch.setLogLevel(level);

export const withOriginalConsole = <T>(fn: () => T): T => 
  consoleMonkeyPatch.withOriginal(fn);

export const withConsoleContext = <T>(context: LogContext, fn: () => T): T => 
  consoleMonkeyPatch.withContext(context, fn);