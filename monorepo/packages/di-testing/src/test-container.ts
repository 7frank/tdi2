import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import type { DIContainer } from "@tdi2/di-core/types";

export interface TestOverride {
  token: string | symbol;
  implementation: any;
  scope?: "singleton" | "transient" | "scoped";
}

export class TestContainer implements DIContainer {
  private container: CompileTimeDIContainer;
  private originalServices = new Map<string, any>();
  private testOverrides = new Map<string, TestOverride>();
  private tokenMap = new Map<string, string | symbol>(); // Maps tokenKey back to original token

  constructor(parent?: DIContainer) {
    this.container = new CompileTimeDIContainer(parent);
  }

  /**
   * Override a service with a mock or test implementation
   */
  mockService<T>(
    token: string | symbol,
    implementation: T,
    scope: "singleton" | "transient" | "scoped" = "singleton"
  ): void {
    const tokenKey = this.getTokenKey(token);
    
    // Store token mapping
    this.tokenMap.set(tokenKey, token);
    
    // Store original if not already stored
    if (!this.originalServices.has(tokenKey) && this.container.has(token)) {
      this.originalServices.set(tokenKey, this.getCurrentImplementation(token));
    }

    // Store the override
    this.testOverrides.set(tokenKey, { token, implementation, scope });

    // Register the mock
    this.container.register(token, implementation, scope);
  }

  /**
   * Restore a service to its original implementation
   */
  restoreService(token: string | symbol): void {
    const tokenKey = this.getTokenKey(token);
    
    if (this.originalServices.has(tokenKey)) {
      const original = this.originalServices.get(tokenKey);
      this.container.register(token, original);
      this.originalServices.delete(tokenKey);
      this.testOverrides.delete(tokenKey);
      this.tokenMap.delete(tokenKey);
    }
  }

  /**
   * Restore all services to their original implementations
   */
  restoreAllServices(): void {
    for (const [tokenKey, original] of this.originalServices) {
      const token = this.tokenFromKey(tokenKey);
      this.container.register(token, original);
    }
    this.originalServices.clear();
    this.testOverrides.clear();
    this.tokenMap.clear();
  }

  /**
   * Reset the container - clear all instances to force recreation
   */
  reset(): void {
    this.clearInstances();
  }

  // Implement DIContainer interface
  register<T>(
    token: string | symbol,
    implementation: any,
    scope?: "singleton" | "transient" | "scoped"
  ): void {
    this.container.register(token, implementation, scope);
  }

  resolve<T>(token: string | symbol): T {
    return this.container.resolve<T>(token);
  }

  has(token: string | symbol): boolean {
    return this.container.has(token);
  }

  createScope(): DIContainer {
    return new TestContainer(this.container);
  }

  registerByInterface<T>(
    interfaceName: string,
    implementation: () => T,
    scope?: "singleton" | "transient" | "scoped"
  ): void {
    this.container.registerByInterface(interfaceName, implementation, scope);
  }

  resolveByInterface<T>(interfaceName: string): T {
    return this.container.resolveByInterface<T>(interfaceName);
  }

  hasInterface(interfaceName: string): boolean {
    return this.container.hasInterface(interfaceName);
  }

  // Expose container methods for testing
  loadConfiguration(diMap: any): void {
    this.container.loadConfiguration(diMap);
  }

  /**
   * Create a fresh test scope with all current overrides
   */
  createTestScope(): TestContainer {
    const scope = new TestContainer(this);
    
    // Copy current overrides to the new scope
    for (const [tokenKey, override] of this.testOverrides) {
      scope.mockService(override.token, override.implementation, override.scope);
    }
    
    return scope;
  }

  /**
   * Get information about current test overrides
   */
  getTestOverrides(): Array<{ token: string | symbol; hasOriginal: boolean }> {
    return Array.from(this.testOverrides.keys()).map(tokenKey => ({
      token: this.tokenFromKey(tokenKey),
      hasOriginal: this.originalServices.has(tokenKey)
    }));
  }

  private getCurrentImplementation(token: string | symbol): any {
    // Since we can't access private properties, we'll try to resolve and catch errors
    try {
      return this.container.resolve(token);
    } catch {
      return null;
    }
  }

  private clearInstances(): void {
    // Reset the container by creating a new one with the same parent
    const parent = (this.container as any).parent;
    this.container = new CompileTimeDIContainer(parent);
    
    // Re-apply current test overrides
    for (const [_tokenKey, override] of this.testOverrides) {
      this.container.register(override.token, override.implementation, override.scope);
    }
  }

  private tokenFromKey(tokenKey: string): string | symbol {
    // Use the stored token mapping if available
    return this.tokenMap.get(tokenKey) || tokenKey;
  }

  private getTokenKey(token: string | symbol): string {
    return typeof token === "symbol" ? token.toString() : token;
  }
}