// src/di/container.ts

import type { DIContainer, ServiceFactory, DIMap } from "./types";

export class CompileTimeDIContainer implements DIContainer {
  private services = new Map<string | symbol, any>();
  private instances = new Map<string | symbol, any>();
  private factories = new Map<string | symbol, ServiceFactory<any>>();
  private scopes = new Map<
    string | symbol,
    "singleton" | "transient" | "scoped"
  >();
  private parent?: DIContainer;

  constructor(parent?: DIContainer) {
    this.parent = parent;
  }

  register<T>(
    token: string | symbol,
    implementation: any, // This will be a factory function generated at compile time
    scope: "singleton" | "transient" | "scoped" = "singleton"
  ): void {
    const tokenKey = this.getTokenKey(token);

    if (typeof implementation === "function" && implementation.length === 0) {
      // It's a factory function
      this.factories.set(tokenKey, implementation);
    } else {
      // It's a constructor
      this.services.set(tokenKey, implementation);
    }

    this.scopes.set(tokenKey, scope);
  }

  resolve<T>(token: string | symbol): T {
    const tokenKey = this.getTokenKey(token);

    // Check if already instantiated for singletons
    if (
      this.scopes.get(tokenKey) === "singleton" &&
      this.instances.has(tokenKey)
    ) {
      return this.instances.get(tokenKey);
    }

    // Check parent container if not found locally
    if (!this.has(token) && this.parent) {
      return this.parent.resolve(token);
    }

    let instance: T;

    if (this.factories.has(tokenKey)) {
      // Use generated factory
      const factory = this.factories.get(tokenKey)!;
      instance = factory();
    } else if (this.services.has(tokenKey)) {
      // Fallback to constructor (shouldn't happen with compile-time generation)
      const constructor = this.services.get(tokenKey);
      instance = new constructor();
    } else {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    // Store singleton instances
    if (this.scopes.get(tokenKey) === "singleton") {
      this.instances.set(tokenKey, instance);
    }

    return instance;
  }

  has(token: string | symbol): boolean {
    const tokenKey = this.getTokenKey(token);
    return (
      this.factories.has(tokenKey) ||
      this.services.has(tokenKey) ||
      (this.parent?.has(token) ?? false)
    );
  }

  createScope(): DIContainer {
    return new CompileTimeDIContainer(this);
  }

  // Load generated DI configuration
  loadConfiguration(diMap: DIMap): void {
    for (const [token, config] of Object.entries(diMap)) {
      this.factories.set(token, config.factory);
      this.scopes.set(token, config.scope);
    }
  }

  private getTokenKey(token: string | symbol): string {
    return typeof token === "symbol" ? token.toString() : token;
  }
}
