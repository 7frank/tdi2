// @tdi2/logging - Initialization and convenience functions

import type {
  LoggerConfig,
  LogLevel,
  ConsoleMonkeyPatchConfig,
  LogContext,
} from "./types";
import { TDILoggerService, type LoggerInterface } from "./tdi-logger-service";

// Environment detection
const getEnvironment = (): "development" | "production" | "test" => {
  if (typeof process !== "undefined") {
    if (process.env.NODE_ENV === "production") return "production";
    if (process.env.NODE_ENV === "test") return "test";
  }

  // Browser detection
  if (typeof window !== "undefined") {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("dev")
    ) {
      return "development";
    }
  }

  return "development";
};

// Configuration presets by environment
const ENV_CONFIGS: Record<string, LoggerConfig> = {
  development: {
    serviceName: "tdi2-dev",
    serviceVersion: "1.0.0-dev",
    enableDiagnostics: true,
    diagnosticLevel: "DEBUG",
    consoleMonkeyPatch: {
      log: "otel",
      debug: "otel",
      info: "otel",
      warn: "both",
      error: "both",
      table: "otel",
    },
    resource: {
      "deployment.environment": "development",
      "service.namespace": "tdi2",
      "service.instance.id": `dev-${Date.now()}`,
    },
    processors: [{ type: "console" }],
  },

  production: {
    serviceName: "tdi2-prod",
    serviceVersion: "1.0.0",
    enableDiagnostics: false,
    diagnosticLevel: "ERROR",
    consoleMonkeyPatch: {
      log: "otel",
      debug: "otel",
      info: "otel",
      warn: "both",
      error: "both",
      table: "otel",
    },
    resource: {
      "deployment.environment": "production",
      "service.namespace": "tdi2",
      "service.instance.id": `prod-${Date.now()}`,
    },
    processors: [{ type: "console" }],
  },

  test: {
    serviceName: "tdi2-test",
    serviceVersion: "1.0.0-test",
    enableDiagnostics: false,
    diagnosticLevel: "NONE",
    consoleMonkeyPatch: {
      log: "otel",
      debug: "otel",
      info: "otel",
      warn: "otel",
      error: "otel",
      table: "otel",
    },
    resource: {
      "deployment.environment": "test",
      "service.namespace": "tdi2",
      "service.instance.id": `test-${Date.now()}`,
    },
    processors: [{ type: "console" }],
  },
};

export interface InitOptions {
  environment?: "development" | "production" | "test" | "auto";
  serviceName?: string;
  serviceVersion?: string;
  consoleMonkeyPatch?: ConsoleMonkeyPatchConfig;
  enableDiagnostics?: boolean;
  customConfig?: Partial<LoggerConfig>;
  autoDetectEnvironment?: boolean;
}

let globalLogger: LoggerInterface | null = null;

/**
 * Initialize the TDI2 logging system with environment-specific defaults
 */
export function initLogging(options: InitOptions = {}): LoggerInterface {
  // Determine environment
  const environment =
    options.environment === "auto" || options.autoDetectEnvironment !== false
      ? getEnvironment()
      : options.environment || "development";

  // Get base configuration for environment
  const baseConfig = ENV_CONFIGS[environment] || ENV_CONFIGS.development;

  // Merge with custom options
  const finalConfig: LoggerConfig = {
    ...baseConfig,
    ...options.customConfig,
    ...(options.serviceName && { serviceName: options.serviceName }),
    ...(options.serviceVersion && { serviceVersion: options.serviceVersion }),
    ...(options.enableDiagnostics !== undefined && {
      enableDiagnostics: options.enableDiagnostics,
    }),
  };

  if (options.consoleMonkeyPatch) {
    finalConfig.consoleMonkeyPatch = {
      ...finalConfig.consoleMonkeyPatch,
      ...options.consoleMonkeyPatch,
    };
  }

  // Create logger service
  globalLogger = TDILoggerService.create(finalConfig);

  // Log initialization
  globalLogger.info("TDI2 Logging System Initialized", {
    environment,
    serviceName: finalConfig.serviceName,
    consoleMonkeyPatch: finalConfig.consoleMonkeyPatch,
    enableDiagnostics: finalConfig.enableDiagnostics,
  });

  return globalLogger;
}

/**
 * Get the global logger instance
 */
export function getLogger(): LoggerInterface {
  if (!globalLogger) {
    globalLogger = initLogging();
  }
  return globalLogger;
}
