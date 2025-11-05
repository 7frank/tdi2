// TDI2 Web Server - Express server with WebSocket support for interactive DI analysis

import express, { Express, Request, Response } from "express";
import { createServer, Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { watch, FSWatcher } from "chokidar";
import { join, resolve, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import open from "open";

import { DIAnalytics } from "../analytics/index.js";
import { setupRoutes } from "./api/routes.js";
import type { ServerOptions, WebSocketMessage } from "./types.js";

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TDI2Server {
  private app: Express;
  private server: HttpServer;
  private wss!: WebSocketServer; // Will be initialized in constructor
  private analytics: DIAnalytics;
  private options: ServerOptions;
  private watcher?: FSWatcher;
  private clients: Set<WebSocket> = new Set();

  constructor(options: ServerOptions) {
    this.options = options;
    this.analytics = new DIAnalytics({
      verbose: options.verbose,
      includePerformance: true,
    });

    this.app = express();
    this.server = createServer(this.app);
    this.setupExpress();
    this.setupWebSocket();
    this.setupRoutes();
  }

  private setupExpress(): void {
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // JSON parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Serve React dashboard build files
    // Try multiple possible dashboard locations
    const possibleDashboardPaths = [
      join(__dirname, "..", "dashboard"), // Built CLI: dist/serve/../dashboard = dist/dashboard
      join(__dirname, "..", "dist", "dashboard"), // Source: src/serve/../../dist/dashboard
       join(__dirname, "..","..","dist", "dashboard"),
    ];

    console.log(
      "Looking in paths for dashboard index.html",
      possibleDashboardPaths
    );

    let dashboardPath: string | null = null;
    for (const path of possibleDashboardPaths) {
      if (existsSync(path)) {
        dashboardPath = path;
        break;
      }
    }

    if (dashboardPath) {
      if (this.options.verbose) {
        console.log(`📱 Serving React dashboard from: ${dashboardPath}`);
      }
      this.app.use(express.static(dashboardPath));
    } else {
      if (this.options.verbose) {
        console.log("⚠️  No React dashboard found, using fallback template");
      }
      // Fallback to legacy template directory for development
      const frontendPath = join(__dirname, "frontend");
      this.app.use(express.static(frontendPath));
    }

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        analytics: "ready",
      });
    });

    // Error handling
    this.app.use((error: Error, _req: Request, res: Response, _next: any) => {
      console.error("Server error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: this.options.dev ? error.message : "Something went wrong",
      });
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({
      server: this.server,
      path: "/ws",
    });

    this.wss.on("connection", (ws: WebSocket) => {
      this.clients.add(ws);

      if (this.options.verbose) {
        console.log("📱 WebSocket client connected");
      }

      // Send initial connection message
      this.sendMessage(ws, {
        type: "analysis_update",
        data: { connected: true },
        timestamp: new Date().toISOString(),
      });

      ws.on("close", () => {
        this.clients.delete(ws);
        if (this.options.verbose) {
          console.log("📱 WebSocket client disconnected");
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
      });
    });
  }

  private setupRoutes(): void {
    setupRoutes(this.app, this.analytics, this.options);
  }

  private setupFileWatcher(): void {
    if (!this.options.watch) return;

    const watchPaths = [
      join(this.options.srcPath, "**/*.ts"),
      join(this.options.srcPath, "**/*.tsx"),
      join(this.options.srcPath, "**/*di-config*"),
    ];

    this.watcher = watch(watchPaths, {
      ignored: /node_modules|\.git/,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on("change", (path) => {
      if (this.options.verbose) {
        console.log(`📄 File changed: ${path}`);
      }
      this.handleConfigChange("File changed", path);
    });

    this.watcher.on("add", (path) => {
      if (this.options.verbose) {
        console.log(`📄 File added: ${path}`);
      }
      this.handleConfigChange("File added", path);
    });

    this.watcher.on("unlink", (path) => {
      if (this.options.verbose) {
        console.log(`📄 File removed: ${path}`);
      }
      this.handleConfigChange("File removed", path);
    });
  }

  private handleConfigChange(event: string, filePath: string): void {
    // Debounce rapid changes
    setTimeout(() => {
      this.broadcast({
        type: "config_reload",
        data: {
          event,
          filePath,
          message: "Configuration updated, reloading analysis...",
        },
        timestamp: new Date().toISOString(),
      });
    }, 500);
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error("Failed to send WebSocket message:", error);
      this.clients.delete(ws);
    }
  }

  public broadcast(message: WebSocketMessage): void {
    this.clients.forEach((client) => {
      this.sendMessage(client, message);
    });
  }

  public async start(): Promise<void> {
    return new Promise((promiseResolve, reject) => {
      this.server.listen(
        this.options.port,
        this.options.host || "localhost",
        () => {
          const address = `http://${this.options.host || "localhost"}:${this.options.port}`;

          console.log("🌐 TDI2 Dashboard started successfully!");
          console.log(`📍 Dashboard: ${address}`);
          console.log(`📁 Source: ${resolve(this.options.srcPath)}`);

          if (this.options.watch) {
            console.log("👀 File watching enabled");
            this.setupFileWatcher();
          }

          if (this.options.open) {
            open(address).catch((err) => {
              console.warn(
                "Could not open browser automatically:",
                err.message
              );
            });
          }

          console.log("\n💡 Available endpoints:");
          console.log(`   • Dashboard: ${address}`);
          console.log(`   • Health: ${address}/health`);
          console.log(`   • API: ${address}/api/*`);
          console.log(
            `   • WebSocket: ws://${this.options.host || "localhost"}:${this.options.port}/ws`
          );
          console.log("\n🛑 Press Ctrl+C to stop the server");

          promiseResolve();
        }
      );

      this.server.on("error", (error) => {
        reject(error);
      });
    });
  }

  public async stop(): Promise<void> {
    console.log("\n🛑 Shutting down TDI2 server...");

    // Close WebSocket connections
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.wss.close();

    // Stop file watcher
    if (this.watcher) {
      await this.watcher.close();
    }

    // Close HTTP server
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        console.log("✅ Server stopped gracefully");
        resolve();
      });
    });
  }

  public getAnalytics(): DIAnalytics {
    return this.analytics;
  }

  public getClients(): Set<WebSocket> {
    return this.clients;
  }
}
