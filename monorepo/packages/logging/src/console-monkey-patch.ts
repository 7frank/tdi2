// src/logging/console-monkey-patch.ts - Recreated Console Monkey Patch Utility

import type {
  ConsoleOutputMode,
  ConsolePatch,
  LogContext,
  ConsoleMonkeyPatchConfig,
} from "./types";
import { getLogger } from "./init";

/**
 * Console monkey-patch utility with fine-grained control over output routing
 */
export class ConsoleMonkeyPatch {
  private originalConsole: ConsolePatch | null = null;
  private isPatched = false;
  private config: ConsoleMonkeyPatchConfig;
  private loggerName: string;
  private globalContext: LogContext;

  constructor(
    config: ConsoleMonkeyPatchConfig = {
      log: "otel",
      debug: "otel",
      info: "otel",
      warn: "otel",
      error: "otel",
      table: "otel",
    },
    loggerName: string = "console-proxy",
    globalContext: LogContext = {}
  ) {
    this.config = config;
    this.loggerName = loggerName;
    this.globalContext = globalContext;
  }

  /**
   * Apply monkey patch to console methods
   */
  // src/logging/console-monkey-patch.ts - Updated patch method

  patch(): void {
    if (this.isPatched) {
      console.warn("Console is already monkey-patched");
      return;
    }

    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      table: console.table.bind(console),
    };

    const logger = getLogger().createChildLogger(
      this.loggerName,
      this.globalContext
    );

    // Monkey patch console.log
    if (this.config.log) {
      console.log = (...args: any[]) => {
        // If console-only, just use original console
        if (this.config.log === "console") {
          this.originalConsole!.log(...args);
          return;
        }

        // Log to OpenTelemetry
        const message = this.formatMessage(args);
        logger.info(message, {
          source: "console.log",
          args: this.serializeArgs(args),
        });

        // Also log to console if 'both'
        if (this.config.log === "both") {
          this.originalConsole!.log(...args);
        }
      };
    }

    // Monkey patch console.debug
    if (this.config.debug) {
      console.debug = (...args: any[]) => {
        if (this.config.debug === "console") {
          this.originalConsole!.debug(...args);
          return;
        }

        const message = this.formatMessage(args);
        logger.debug(message, {
          source: "console.debug",
          args: this.serializeArgs(args),
        });

        if (this.config.debug === "both") {
          this.originalConsole!.debug(...args);
        }
      };
    }

    // Monkey patch console.info
    if (this.config.info) {
      console.info = (...args: any[]) => {
        if (this.config.info === "console") {
          this.originalConsole!.info(...args);
          return;
        }

        const message = this.formatMessage(args);
        logger.info(message, {
          source: "console.info",
          args: this.serializeArgs(args),
        });

        if (this.config.info === "both") {
          this.originalConsole!.info(...args);
        }
      };
    }

    // Monkey patch console.warn
    if (this.config.warn) {
      console.warn = (...args: any[]) => {
        if (this.config.warn === "console") {
          this.originalConsole!.warn(...args);
          return;
        }

        const message = this.formatMessage(args);
        logger.warn(message, {
          source: "console.warn",
          args: this.serializeArgs(args),
        });

        if (this.config.warn === "both") {
          this.originalConsole!.warn(...args);
        }
      };
    }

    // Monkey patch console.error
    if (this.config.error) {
      console.error = (...args: any[]) => {
        if (this.config.error === "console") {
          this.originalConsole!.error(...args);
          return;
        }

        const message = this.formatMessage(args);
        const error = args.find((arg) => arg instanceof Error);
        logger.error(message, error, {
          source: "console.error",
          args: this.serializeArgs(args),
        });

        if (this.config.error === "both") {
          this.originalConsole!.error(...args);
        }
      };
    }

    // Monkey patch console.table
    if (this.config.table) {
      console.table = (...args: any[]) => {
        if (this.config.table === "console") {
          this.originalConsole!.table(...args);
          return;
        }

        const message = `Table: ${this.formatMessage(args)}`;
        logger.info(message, {
          source: "console.table",
          tableData: args[0],
          args: this.serializeArgs(args),
        });

        if (this.config.table === "both") {
          this.originalConsole!.table(...args);
        }
      };
    }

    this.isPatched = true;

    // Log the monkey patch activation (only to OpenTelemetry)
    logger.info("Console monkey patch activated", {
      config: this.config,
      loggerName: this.loggerName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove monkey patch and restore original console methods
   */
  unpatch(): void {
    if (!this.isPatched || !this.originalConsole) {
      console.warn("Console is not monkey-patched");
      return;
    }

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.table = this.originalConsole.table;

    // Log restoration using original console
    this.originalConsole.info(
      "Console monkey patch removed, original methods restored"
    );

    this.originalConsole = null;
    this.isPatched = false;
  }

  /**
   * Update the monkey patch configuration
   */
  updateConfig(config: Partial<ConsoleMonkeyPatchConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.isPatched) {
      const logger = getLogger().createChildLogger(
        this.loggerName,
        this.globalContext
      );
      logger.info("Console monkey patch configuration updated", {
        newConfig: config,
        fullConfig: this.config,
        timestamp: new Date().toISOString(),
      });

      // Re-patch with new configuration
      this.unpatch();
      this.patch();
    }
  }

  /**
   * Update global context for all console logs
   */
  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };

    if (this.isPatched) {
      const logger = getLogger().createChildLogger(
        this.loggerName,
        this.globalContext
      );
      logger.debug("Console monkey patch context updated", {
        newContext: context,
        timestamp: new Date().toISOString(),
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
    config: ConsoleMonkeyPatchConfig;
    loggerName: string;
    globalContext: LogContext;
    isPatched: boolean;
  } {
    return {
      config: { ...this.config },
      loggerName: this.loggerName,
      globalContext: { ...this.globalContext },
      isPatched: this.isPatched,
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
      error: console.error,
      table: console.table,
    };

    try {
      // Temporarily restore original console
      console.log = this.originalConsole.log;
      console.debug = this.originalConsole.debug;
      console.info = this.originalConsole.info;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.table = this.originalConsole.table;

      return fn();
    } finally {
      // Restore monkey-patched console
      console.log = currentConsole.log;
      console.debug = currentConsole.debug;
      console.info = currentConsole.info;
      console.warn = currentConsole.warn;
      console.error = currentConsole.error;
      console.table = currentConsole.table;
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

  /**
   * Get original console methods (for manual usage)
   */
  getOriginalConsole(): ConsolePatch | null {
    return this.originalConsole;
  }

  /**
   * Check what methods are currently patched
   */
  getPatchedMethods(): string[] {
    const patched: string[] = [];
    if (this.config.log) patched.push("log");
    if (this.config.debug) patched.push("debug");
    if (this.config.info) patched.push("info");
    if (this.config.warn) patched.push("warn");
    if (this.config.error) patched.push("error");
    if (this.config.table) patched.push("table");
    return patched;
  }

  /**
   * Get routing configuration for a specific method
   */
  getMethodRouting(
    method: keyof ConsoleMonkeyPatchConfig
  ): ConsoleOutputMode | undefined {
    return this.config[method];
  }

  /**
   * Set routing for a specific console method
   */
  setMethodRouting(
    method: keyof ConsoleMonkeyPatchConfig,
    mode: ConsoleOutputMode
  ): void {
    this.updateConfig({ [method]: mode });
  }

  private formatMessage(args: any[]): string {
    return args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        if (arg === null) return "null";
        if (arg === undefined) return "undefined";
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(" ");
  }

  private serializeArgs(args: any[]): any[] {
    return args.map((arg) => {
      if (
        typeof arg === "string" ||
        typeof arg === "number" ||
        typeof arg === "boolean"
      ) {
        return arg;
      }
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
          cause: arg.cause,
        };
      }
      if (arg === null || arg === undefined) {
        return arg;
      }
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return "[Non-serializable Object]";
      }
    });
  }
}

// Global instance for convenience
let globalMonkeyPatch: ConsoleMonkeyPatch | null = null;

/**
 * Quick setup functions for console monkey patching
 */
export const consoleMonkeyPatch = {
  /**
   * Initialize and apply console monkey patch with specified configuration
   */
  init: (
    config: ConsoleMonkeyPatchConfig,
    loggerName?: string,
    context?: LogContext
  ) => {
    if (globalMonkeyPatch) {
      console.warn(
        "Console monkey patch already initialized. Use updateConfig() to modify."
      );
      return globalMonkeyPatch;
    }

    globalMonkeyPatch = new ConsoleMonkeyPatch(config, loggerName, context);
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
    } else {
      console.warn("Console monkey patch not initialized");
    }
  },

  /**
   * Update configuration for existing monkey patch
   */
  updateConfig: (config: Partial<ConsoleMonkeyPatchConfig>) => {
    if (globalMonkeyPatch) {
      globalMonkeyPatch.updateConfig(config);
    } else {
      console.warn("Console monkey patch not initialized. Use init() first.");
    }
  },

  /**
   * Update global context for existing monkey patch
   */
  setContext: (context: LogContext) => {
    if (globalMonkeyPatch) {
      globalMonkeyPatch.setGlobalContext(context);
    } else {
      console.warn("Console monkey patch not initialized");
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
  },

  /**
   * Get list of currently patched methods
   */
  getPatchedMethods: (): string[] => {
    return globalMonkeyPatch?.getPatchedMethods() ?? [];
  },

  /**
   * Set routing for a specific console method
   */
  setMethodRouting: (
    method: keyof ConsoleMonkeyPatchConfig,
    mode: ConsoleOutputMode
  ) => {
    if (globalMonkeyPatch) {
      globalMonkeyPatch.setMethodRouting(method, mode);
    } else {
      console.warn("Console monkey patch not initialized");
    }
  },

  /**
   * Get routing configuration for a specific method
   */
  getMethodRouting: (
    method: keyof ConsoleMonkeyPatchConfig
  ): ConsoleOutputMode | undefined => {
    return globalMonkeyPatch?.getMethodRouting(method);
  },
};

// Convenience functions for immediate use
export const patchConsole = (config: ConsoleMonkeyPatchConfig) =>
  consoleMonkeyPatch.init(config);

export const unpatchConsole = () => consoleMonkeyPatch.remove();

export const updateConsoleConfig = (
  config: Partial<ConsoleMonkeyPatchConfig>
) => consoleMonkeyPatch.updateConfig(config);

export const withOriginalConsole = <T>(fn: () => T): T =>
  consoleMonkeyPatch.withOriginal(fn);

export const withConsoleContext = <T>(context: LogContext, fn: () => T): T =>
  consoleMonkeyPatch.withContext(context, fn);

// Specific method routing shortcuts
export const setConsoleRouting = {
  log: (mode: ConsoleOutputMode) =>
    consoleMonkeyPatch.setMethodRouting("log", mode),
  debug: (mode: ConsoleOutputMode) =>
    consoleMonkeyPatch.setMethodRouting("debug", mode),
  info: (mode: ConsoleOutputMode) =>
    consoleMonkeyPatch.setMethodRouting("info", mode),
  warn: (mode: ConsoleOutputMode) =>
    consoleMonkeyPatch.setMethodRouting("warn", mode),
  error: (mode: ConsoleOutputMode) =>
    consoleMonkeyPatch.setMethodRouting("error", mode),
  table: (mode: ConsoleOutputMode) =>
    consoleMonkeyPatch.setMethodRouting("table", mode),
};

// Preset configurations
export const consolePresets = {
  /**
   * Silent mode - everything to OpenTelemetry only
   */
  silent: (): ConsoleMonkeyPatchConfig => ({
    log: "otel",
    debug: "otel",
    info: "otel",
    warn: "otel",
    error: "otel",
    table: "otel",
  }),

  /**
   * Development mode - warnings and errors to console
   */
  development: (): ConsoleMonkeyPatchConfig => ({
    log: "otel",
    debug: "otel",
    info: "otel",
    warn: "both",
    error: "both",
    table: "otel",
  }),

  /**
   * Production mode - only errors to console
   */
  production: (): ConsoleMonkeyPatchConfig => ({
    log: "otel",
    debug: "otel",
    info: "otel",
    warn: "otel",
    error: "both",
    table: "otel",
  }),

  /**
   * Debug mode - everything to both
   */
  debug: (): ConsoleMonkeyPatchConfig => ({
    log: "both",
    debug: "both",
    info: "both",
    warn: "both",
    error: "both",
    table: "both",
  }),

  /**
   * Console only mode - everything to console only (bypass OpenTelemetry)
   */
  consoleOnly: (): ConsoleMonkeyPatchConfig => ({
    log: "console",
    debug: "console",
    info: "console",
    warn: "console",
    error: "console",
    table: "console",
  }),
};
