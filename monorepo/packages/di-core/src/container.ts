// src/di/container.ts - FIXED to properly load all services

import type { DIContainer, ServiceFactory, DIMap } from '@tdi2/di-core/types';

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

    if (typeof implementation === "function") {
      // Check if it's a factory function (returns another function) or a constructor
      try {
        const result = implementation(this);
        if (typeof result === "function") {
          // It's a factory function
          this.factories.set(tokenKey, result);
        } else {
          // It's a constructor or direct instance
          this.services.set(tokenKey, implementation);
        }
      } catch (e) {
        // Fallback to treating as constructor
        this.services.set(tokenKey, implementation);
      }
    } else {
      // Direct instance
      this.instances.set(tokenKey, implementation);
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
      // Use constructor
      const constructor = this.services.get(tokenKey);
      if (typeof constructor === "function") {
        instance = new constructor();
      } else {
        instance = constructor;
      }
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
      this.instances.has(tokenKey) ||
      (this.parent?.has(token) ?? false)
    );
  }

  createScope(): DIContainer {
    return new CompileTimeDIContainer(this);
  }

  // FIXED: Enhanced loadConfiguration method with better logging
  loadConfiguration(diMap: DIMap): void {
    console.log("🔧 Loading DI configuration...");
    console.log("📋 DI_CONFIG keys:", Object.keys(diMap));

    for (const [token, config] of Object.entries(diMap)) {
      try {
        if (!config.factory) {
          console.warn(`⚠️  No factory found for token: ${token}`);
          continue;
        }

        console.log(
          `🔗 Registering: ${token} -> ${
            config.implementationClass || "unknown"
          }`
        );

        const factory = config.factory(this);
        this.factories.set(token, factory);
        this.scopes.set(token, config.scope);
      } catch (error) {
        console.error(`❌ Failed to register ${token}:`, error);
        // Continue with other services
      }
    }

    console.log("✅ DI configuration loaded");
  }

  private getTokenKey(token: string | symbol): string {
    return typeof token === "symbol" ? token.toString() : token;
  }

  // Enhanced debug method to see what's registered
  getRegisteredTokens(): string[] {
    const tokens = new Set<string>();
    this.factories.forEach((_, key) => tokens.add(this.getTokenKey(key)));
    this.services.forEach((_, key) => tokens.add(this.getTokenKey(key)));
    this.instances.forEach((_, key) => tokens.add(this.getTokenKey(key)));
    return Array.from(tokens);
  }

  // NEW: Debug method to inspect the current state
  debugContainer(): void {
    console.log("🔍 Container Debug Info:");
    console.log("📋 Factories:", Array.from(this.factories.keys()));
    console.log("🏗️  Services:", Array.from(this.services.keys()));
    console.log("📦 Instances:", Array.from(this.instances.keys()));
    console.log("🎯 Scopes:", Array.from(this.scopes.entries()));
  }

  // NEW: Method to register by interface (for enhanced interface-based DI)
  registerByInterface<T>(
    interfaceName: string,
    implementation: () => T,
    scope: "singleton" | "transient" | "scoped" = "singleton"
  ): void {
    this.register(interfaceName, implementation, scope);
  }

  // NEW: Method to resolve by interface
  resolveByInterface<T>(interfaceName: string): T {
    return this.resolve<T>(interfaceName);
  }

  // NEW: Method to check if interface is registered
  hasInterface(interfaceName: string): boolean {
    return this.has(interfaceName);
  }
}
