import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import type { DIContainer, DIMap } from "@tdi2/di-core/types";

export interface TestOverride {
  token: string | symbol;
  implementation: any;
  scope?: "singleton" | "transient" | "scoped";
}

export class TestContainer extends CompileTimeDIContainer {
  private originalServices = new Map<string, any>();
  private testOverrides = new Map<string, TestOverride>();

  constructor(parent?: DIContainer) {
    super(parent);
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
    
    // Store original if not already stored
    if (!this.originalServices.has(tokenKey) && this.has(token)) {
      this.originalServices.set(tokenKey, this.getCurrentImplementation(token));
    }

    // Store the override
    this.testOverrides.set(tokenKey, { token, implementation, scope });

    // Register the mock - use any to bypass type issues
    (this as any).register(token, implementation, scope);
  }

  /**
   * Restore a service to its original implementation
   */
  restoreService(token: string | symbol): void {
    const tokenKey = this.getTokenKey(token);
    
    if (this.originalServices.has(tokenKey)) {
      const original = this.originalServices.get(tokenKey);
      (this as any).register(token, original);
      this.originalServices.delete(tokenKey);
      this.testOverrides.delete(tokenKey);
    }
  }

  /**
   * Restore all services to their original implementations
   */
  restoreAllServices(): void {
    for (const [tokenKey, original] of this.originalServices) {
      const token = this.tokenFromKey(tokenKey);
      (this as any).register(token, original);
    }
    this.originalServices.clear();
    this.testOverrides.clear();
  }

  /**
   * Reset the container - clear all instances to force recreation
   */
  reset(): void {
    this.clearInstances();
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
    const tokenKey = this.getTokenKey(token);
    
    // Try to get from factories first, then services, then instances
    if (this.factories && this.factories.has(tokenKey)) {
      return this.factories.get(tokenKey);
    }
    if (this.services && this.services.has(tokenKey)) {
      return this.services.get(tokenKey);
    }
    if (this.instances && this.instances.has(tokenKey)) {
      return this.instances.get(tokenKey);
    }
    
    return null;
  }

  private clearInstances(): void {
    // Clear singleton instances to force recreation
    if (this.instances) {
      this.instances.clear();
    }
  }

  private tokenFromKey(tokenKey: string): string | symbol {
    // Simple heuristic: if it looks like a symbol toString, treat as symbol
    if (tokenKey.startsWith('Symbol(') && tokenKey.endsWith(')')) {
      return Symbol(tokenKey.slice(7, -1));
    }
    return tokenKey;
  }

  // Expose private methods from parent for testing
  private get factories() {
    return (this as any).factories as Map<string, any>;
  }

  private get services() {
    return (this as any).services as Map<string, any>;
  }

  private get instances() {
    return (this as any).instances as Map<string, any>;
  }

  private getTokenKey(token: string | symbol): string {
    return typeof token === "symbol" ? token.toString() : token;
  }
}