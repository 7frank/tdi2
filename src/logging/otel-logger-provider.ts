// src/logging/otel-logger-provider.ts - OpenTelemetry Logger Provider Implementation

import {
  LoggerProvider,
  ConsoleLogRecordExporter,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import {
  resourceFromAttributes,
  type Resource,
} from "@opentelemetry/resources";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import * as logsAPI from "@opentelemetry/api-logs";
import type {
  LoggerConfig,
  TDILogger,
  LogContext,
  LogLevel,
  ConsolePatch,
} from "./types";
import { TDILoggerImpl } from "./tdi-logger-impl";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export class OTelLoggerProvider {
  private loggerProvider: LoggerProvider;
  private resource: Resource;
  private config: Required<LoggerConfig>;
  private originalConsole: ConsolePatch | null = null;
  private isInitialized = false;
  private loggers = new Map<string, TDILogger>();

  constructor(config: LoggerConfig = {}) {
    this.config = {
      serviceName: "tdi2-app",
      serviceVersion: "1.0.0",
      consoleLogLevel: "WARN" as LogLevel, // Deprecated but kept for backward compatibility
      enableDiagnostics: false,
      diagnosticLevel: "ERROR",
      enableConsoleMonkeyPatch: false, // Deprecated but kept for backward compatibility
      consoleMonkeyPatch: {
        log: "otel",
        debug: "otel",
        info: "otel",
        warn: "otel",
        error: "otel",
        table: "otel",
      },
      resource: {},
      processors: [{ type: "console" }],
      ...config,
    };

    // Handle backward compatibility
    if (config.enableConsoleMonkeyPatch !== undefined) {
      console.warn(
        "enableConsoleMonkeyPatch is deprecated. Use consoleMonkeyPatch config instead."
      );
      if (config.enableConsoleMonkeyPatch && !config.consoleMonkeyPatch) {
        // Convert old consoleLogLevel to new format
        const legacyMode = this.shouldLogToConsole("WARN") ? "both" : "otel";
        this.config.consoleMonkeyPatch = {
          log: "otel",
          debug: "otel",
          info: "otel",
          warn: legacyMode,
          error: legacyMode,
          table: "otel",
        };
      }
    }

    this.setupDiagnostics();
    this.setupResource();
    this.setupLoggerProvider();
    this.setupProcessors();
  }

  private setupDiagnostics(): void {
    if (this.config.enableDiagnostics) {
      const diagLevel = this.mapDiagLevel(this.config.diagnosticLevel);
      diag.setLogger(new DiagConsoleLogger(), diagLevel);
    }
  }

  private mapDiagLevel(level: string): DiagLogLevel {
    switch (level) {
      case "NONE":
        return DiagLogLevel.NONE;
      case "ERROR":
        return DiagLogLevel.ERROR;
      case "WARN":
        return DiagLogLevel.WARN;
      case "INFO":
        return DiagLogLevel.INFO;
      case "DEBUG":
        return DiagLogLevel.DEBUG;
      case "VERBOSE":
        return DiagLogLevel.VERBOSE;
      case "ALL":
        return DiagLogLevel.ALL;
      default:
        return DiagLogLevel.ERROR;
    }
  }

  private setupResource(): void {
    this.resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: this.config.serviceName,
      [ATTR_SERVICE_VERSION]: this.config.serviceVersion,
      "telemetry.sdk.name": "@opentelemetry/sdk-logs",
      "telemetry.sdk.language": "javascript",
      "telemetry.sdk.version": "0.46.0",
      ...this.config.resource,
    });
  }

  private setupLoggerProvider(): void {
    this.loggerProvider = new LoggerProvider({
      resource: this.resource,
    });
  }

  private setupProcessors(): void {
    for (const processorConfig of this.config.processors) {
      switch (processorConfig.type) {
        case "console":
          this.loggerProvider.addLogRecordProcessor(
            new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
          );
          break;
        // Future: Add file and remote processors
        default:
          console.warn(
            `Unsupported log processor type: ${processorConfig.type}`
          );
      }
    }
  }

  public initialize(): void {
    if (this.isInitialized) {
      console.warn("OTelLoggerProvider is already initialized");
      return;
    }

    // Register global logger provider
    logsAPI.logs.setGlobalLoggerProvider(this.loggerProvider);

    // Setup console monkey patch if any console method is configured
    const hasMonkeyPatchConfig = Object.values(
      this.config.consoleMonkeyPatch || {}
    ).some((mode) => mode === "console" || mode === "both" || mode === "otel");

    if (hasMonkeyPatchConfig) {
      this.setupConsoleMonkeyPatch();
    }

    this.isInitialized = true;

    // Log initialization
    const logger = this.getLogger("otel-logger-provider");
    logger.info("OpenTelemetry Logger Provider initialized", {
      serviceName: this.config.serviceName,
      serviceVersion: this.config.serviceVersion,
      consoleMonkeyPatch: this.config.consoleMonkeyPatch,
      processors: this.config.processors.map((p) => p.type),
    });
  }

  private setupConsoleMonkeyPatch(): void {
    if (this.originalConsole) {
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

    const logger = this.getLogger("console-proxy");
    const config = this.config.consoleMonkeyPatch!;

    // Monkey patch console.log
    if (config.log) {
      console.log = (...args: any[]) => {
        const message = this.formatConsoleMessage(args);
        logger.info(message, { source: "console.log" });

        if (config.log === "console" || config.log === "both") {
          this.originalConsole!.log(...args);
        }
      };
    }

    // Monkey patch console.debug
    if (config.debug) {
      console.debug = (...args: any[]) => {
        const message = this.formatConsoleMessage(args);
        logger.debug(message, { source: "console.debug" });

        if (config.debug === "console" || config.debug === "both") {
          this.originalConsole!.debug(...args);
        }
      };
    }

    // Monkey patch console.info
    if (config.info) {
      console.info = (...args: any[]) => {
        const message = this.formatConsoleMessage(args);
        logger.info(message, { source: "console.info" });

        if (config.info === "console" || config.info === "both") {
          this.originalConsole!.info(...args);
        }
      };
    }

    // Monkey patch console.warn
    if (config.warn) {
      console.warn = (...args: any[]) => {
        const message = this.formatConsoleMessage(args);
        logger.warn(message, { source: "console.warn" });

        if (config.warn === "console" || config.warn === "both") {
          this.originalConsole!.warn(...args);
        }
      };
    }

    // Monkey patch console.error
    if (config.error) {
      console.error = (...args: any[]) => {
        const message = this.formatConsoleMessage(args);
        const error = args.find((arg) => arg instanceof Error);
        logger.error(message, error, { source: "console.error" });

        if (config.error === "console" || config.error === "both") {
          this.originalConsole!.error(...args);
        }
      };
    }

    // Monkey patch console.table
    if (config.table) {
      console.table = (...args: any[]) => {
        const message = `Table: ${this.formatConsoleMessage(args)}`;
        logger.info(message, { source: "console.table", tableData: args[0] });

        if (config.table === "console" || config.table === "both") {
          this.originalConsole!.table(...args);
        }
      };
    }
  }

  private formatConsoleMessage(args: any[]): string {
    return args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(" ");
  }

  private shouldLogToConsole(messageLevel: LogLevel): boolean {
    const levelPriority = {
      TRACE: 0,
      DEBUG: 1,
      INFO: 2,
      WARN: 3,
      ERROR: 4,
      FATAL: 5,
    };

    const configLevel = levelPriority[this.config.consoleLogLevel];
    const msgLevel = levelPriority[messageLevel];

    return msgLevel >= configLevel;
  }

  public getLogger(name: string = "default", context?: LogContext): TDILogger {
    const cacheKey = `${name}:${JSON.stringify(context || {})}`;

    if (this.loggers.has(cacheKey)) {
      return this.loggers.get(cacheKey)!;
    }

    // Use the correct API to get logger
    const otelLogger = logsAPI.logs.getLogger(name);
    const tdiLogger = new TDILoggerImpl(
      otelLogger,
      name,
      context,
      this.config.consoleLogLevel,
      this.originalConsole
    );

    this.loggers.set(cacheKey, tdiLogger);
    return tdiLogger;
  }

  public restoreConsole(): void {
    if (!this.originalConsole) {
      console.warn("Console was not monkey-patched");
      return;
    }

    console.log = this.originalConsole.log;
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.table = this.originalConsole.table;

    this.originalConsole = null;

    const logger = this.getLogger("otel-logger-provider");
    logger.info("Console methods restored to original implementations");
  }

  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    const logger = this.getLogger("otel-logger-provider");
    logger.info("Logger configuration updated", { newConfig });
  }

  public async shutdown(): Promise<void> {
    try {
      // Restore console if monkey-patched
      if (this.originalConsole) {
        this.restoreConsole();
      }

      // Clear logger cache
      this.loggers.clear();

      // Shutdown logger provider
      await this.loggerProvider.shutdown();

      this.isInitialized = false;
    } catch (error) {
      console.error("Error during logger provider shutdown:", error);
    }
  }

  public async forceFlush(): Promise<void> {
    try {
      await this.loggerProvider.forceFlush();
    } catch (error) {
      console.error("Error during force flush:", error);
    }
  }

  // Getters for debugging and testing
  public getConfig(): Required<LoggerConfig> {
    return { ...this.config };
  }

  public isConsolePatched(): boolean {
    return this.originalConsole !== null;
  }

  public getOriginalConsole(): ConsolePatch | null {
    return this.originalConsole;
  }

  public getLoggerCount(): number {
    return this.loggers.size;
  }

  public clearLoggerCache(): void {
    this.loggers.clear();
  }
}
