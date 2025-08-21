// TDI2 Serve Module - Web dashboard for interactive DI analysis

export { TDI2Server } from './server.js';
export * from './types.js';

// Re-export for convenience
import { TDI2Server } from './server.js';
import type { ServerOptions } from './types.js';

/**
 * Create and start a TDI2 web server
 * 
 * @param options Server configuration options
 * @returns Promise that resolves when server is started
 * 
 * @example
 * ```typescript
 * import { createTDI2Server } from '@tdi2/di-core/serve';
 * 
 * const server = await createTDI2Server({
 *   srcPath: './src',
 *   port: 3001,
 *   verbose: true,
 *   watch: true,
 *   open: true
 * });
 * ```
 */
export async function createTDI2Server(options: ServerOptions): Promise<TDI2Server> {
  const server = new TDI2Server(options);
  await server.start();
  return server;
}

/**
 * Quick start function for common use cases
 * 
 * @param srcPath Source directory to analyze
 * @param port Port to serve on (default: 3001)  
 * @param options Additional options
 * @returns Promise that resolves when server is started
 * 
 * @example
 * ```typescript
 * import { serve } from '@tdi2/di-core/serve';
 * 
 * // Quick start with defaults
 * await serve('./src');
 * 
 * // With custom port and options
 * await serve('./src', 8080, { verbose: true, watch: true });
 * ```
 */
export async function serve(
  srcPath: string = './src',
  port: number = 3001,
  options: Partial<ServerOptions> = {}
): Promise<TDI2Server> {
  const serverOptions: ServerOptions = {
    srcPath,
    port,
    verbose: false,
    ...options
  };
  
  return createTDI2Server(serverOptions);
}