// tools/logger.ts
import createDebug from "debug";

/**
 * Creates a namespaced logger for a specific file or module.
 *
 * Usage:
 *   const console = consoleFor("di-core:config-manager");
 *   console.log("verbose info");       // Only shown with DEBUG=di-core:*
 *   console.warn("warning message");   // Always shown with namespace prefix
 *   console.error("error message");    // Always shown with namespace prefix
 *
 * Enable debug logs:
 *   DEBUG=di-core:* npm run dev           // All di-core logs
 *   DEBUG=di-core:config-manager npm run dev  // Specific file
 *   DEBUG=* npm run dev                   // All debug logs
 */
export function consoleFor(name: string) {
  const root = createDebug(name);
  const debugLogger = root.extend("debug");

  return {
    // Debug/verbose logs - only shown when DEBUG env var is set
    log: (formatter: any, ...args: any[]) => root(formatter, ...args),
    debug: (formatter: any, ...args: any[]) => debugLogger(formatter, ...args),

    // Warnings and errors - always shown with namespace prefix for transparency
    warn: (formatter: any, ...args: any[]) => {
      const message = typeof formatter === 'string' ? formatter : String(formatter);
      console.warn(`[${name}] ${message}`, ...args);
    },
    error: (formatter: any, ...args: any[]) => {
      const message = typeof formatter === 'string' ? formatter : String(formatter);
      console.error(`[${name}] ${message}`, ...args);
    },
  };
}
