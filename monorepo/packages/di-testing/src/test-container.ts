import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import type { DIContainer } from "@tdi2/di-core/types";

export interface TestOverride {
  interfaceName: string;
  implementation: any;
  scope?: "singleton" | "transient" | "scoped";
}

export class TestContainer implements DIContainer {
  private container: CompileTimeDIContainer;
  private originalServices = new Map<string, any>();
  private testOverrides = new Map<string, TestOverride>();

  constructor(parent?: DIContainer) {
    this.container = new CompileTimeDIContainer(parent);
  }

  /**
   * Override a service with a mock or test implementation using interface-based resolution
   */
  mockServiceByInterface<T>(
    interfaceName: string,
    implementation: T,
    scope: "singleton" | "transient" | "scoped" = "singleton"
  ): void {
    // Store original if it exists
    if (!this.originalServices.has(interfaceName) && this.container.hasInterface(interfaceName)) {
      this.originalServices.set(interfaceName, this.container.resolveByInterface(interfaceName));
    }
    
    // Store override
    this.testOverrides.set(interfaceName, {
      interfaceName,
      implementation,
      scope
    });
    
    // Register in container using interface-based resolution
    this.container.registerByInterface(interfaceName, implementation, scope);
  }

  /**
   * Restore a service to its original implementation using interface-based resolution
   */
  restoreServiceByInterface(interfaceName: string): void {
    if (this.originalServices.has(interfaceName)) {
      const original = this.originalServices.get(interfaceName);
      this.container.registerByInterface(interfaceName, original);
      this.originalServices.delete(interfaceName);
      this.testOverrides.delete(interfaceName);
    }
  }

  /**
   * Restore all services to their original implementations using interface-based resolution
   */
  restoreAllServices(): void {
    for (const [interfaceName, original] of this.originalServices) {
      this.container.registerByInterface(interfaceName, original);
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
    for (const [interfaceName, override] of this.testOverrides) {
      scope.mockServiceByInterface(override.interfaceName, override.implementation, override.scope);
    }
    
    return scope;
  }

  /**
   * Get information about current test overrides
   */
  getTestOverrides(): Array<{ interfaceName: string; hasOriginal: boolean }> {
    return Array.from(this.testOverrides.keys()).map(interfaceName => ({
      interfaceName,
      hasOriginal: this.originalServices.has(interfaceName)
    }));
  }

  private clearInstances(): void {
    // Reset the container by creating a new one with the same parent
    const parent = (this.container as any).parent;
    this.container = new CompileTimeDIContainer(parent);
    
    // Re-apply current test overrides using interface-based registration
    for (const [_interfaceName, override] of this.testOverrides) {
      this.container.registerByInterface(override.interfaceName, override.implementation, override.scope);
    }
  }
}