// __tests__/scope-functionality.test.ts - Tests for @Scope decorator functionality

import { describe, it, expect, beforeEach } from "bun:test";
import { CompileTimeDIContainer } from "../../src/container";
import { Service, Scope, Inject } from "../../src/decorators";

describe("@Scope Functionality", () => {
  let container: CompileTimeDIContainer;

  beforeEach(() => {
    container = new CompileTimeDIContainer();
  });

  describe("Singleton Scope (default)", () => {
    it("should return the same instance for singleton services", () => {
      // Given - A singleton service
      @Service()
      class SingletonService {
        value = Math.random();
      }

      // Register the service
      container.register("SingletonService", SingletonService, "singleton");

      // When - Resolving multiple times
      const instance1 = container.resolve<SingletonService>("SingletonService");
      const instance2 = container.resolve<SingletonService>("SingletonService");

      // Then - Should be the same instance
      expect(instance1).toBe(instance2);
      expect(instance1.value).toBe(instance2.value);
    });

    it("should work with @Service() decorator without explicit scope", () => {
      @Service()
      class DefaultService {
        id = "default-service";
      }

      container.register("DefaultService", DefaultService);

      const instance1 = container.resolve<DefaultService>("DefaultService");
      const instance2 = container.resolve<DefaultService>("DefaultService");

      expect(instance1).toBe(instance2);
    });
  });

  describe("Transient Scope", () => {
    it("should return different instances for transient services", () => {
      // Given - A transient service (Spring Boot style)
      @Service()
      @Scope("transient")
      class TransientService {
        value = Math.random();
      }

      container.register("TransientService", TransientService, "transient");

      // When - Resolving multiple times
      const instance1 = container.resolve<TransientService>("TransientService");
      const instance2 = container.resolve<TransientService>("TransientService");

      // Then - Should be different instances
      expect(instance1).not.toBe(instance2);
      expect(instance1.value).not.toBe(instance2.value);
    });

    it("should work with @Scope decorator", async () => {
      @Service()
      @Scope("transient")
      class TransientWithScopeDecorator {
        timestamp = Date.now();
      }

      container.register("TransientWithScopeDecorator", TransientWithScopeDecorator, "transient");

      const instance1 = container.resolve<TransientWithScopeDecorator>("TransientWithScopeDecorator");
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const instance2 = container.resolve<TransientWithScopeDecorator>("TransientWithScopeDecorator");

      expect(instance1).not.toBe(instance2);
      expect(instance1.timestamp).not.toBe(instance2.timestamp);
    });
  });

  describe("Scope Focus: Singleton and Transient", () => {
    it("should demonstrate singleton vs transient behavior clearly", () => {
      // Given - Both singleton and transient services (Spring Boot style)
      @Service()
      @Scope("singleton")
      class SingletonCounter {
        static instanceCount = 0;
        instanceId: number;
        constructor() {
          SingletonCounter.instanceCount++;
          this.instanceId = SingletonCounter.instanceCount;
        }
      }

      @Service()
      @Scope("transient")
      class TransientCounter {
        static instanceCount = 0;
        instanceId: number;
        constructor() {
          TransientCounter.instanceCount++;
          this.instanceId = TransientCounter.instanceCount;
        }
      }

      // Register services
      container.register("SingletonCounter", SingletonCounter, "singleton");
      container.register("TransientCounter", TransientCounter, "transient");

      // When - Resolving multiple times
      const singleton1 = container.resolve<SingletonCounter>("SingletonCounter");
      const singleton2 = container.resolve<SingletonCounter>("SingletonCounter");
      const transient1 = container.resolve<TransientCounter>("TransientCounter");
      const transient2 = container.resolve<TransientCounter>("TransientCounter");

      // Then - Verify behavior
      expect(singleton1).toBe(singleton2); // Same instance
      expect(singleton1.instanceId).toBe(singleton2.instanceId); // Same ID
      expect(SingletonCounter.instanceCount).toBe(1); // Only one instance created

      expect(transient1).not.toBe(transient2); // Different instances
      expect(transient1.instanceId).not.toBe(transient2.instanceId); // Different IDs
      expect(TransientCounter.instanceCount).toBe(2); // Two instances created
    });
  });

  describe("Mixed Scope Behavior", () => {
    it("should handle services with different scopes correctly", () => {
      @Service()
      @Scope("singleton")
      class SingletonRepository {
        static instanceCount = 0;
        instanceId: number;
        constructor() {
          SingletonRepository.instanceCount++;
          this.instanceId = SingletonRepository.instanceCount;
        }
      }

      @Service()
      @Scope("transient")
      class TransientLogger {
        static instanceCount = 0;
        instanceId: number;
        constructor() {
          TransientLogger.instanceCount++;
          this.instanceId = TransientLogger.instanceCount;
        }
      }

      // Register services
      container.register("SingletonRepository", SingletonRepository, "singleton");
      container.register("TransientLogger", TransientLogger, "transient");

      // Resolve multiple times
      const logger1 = container.resolve<TransientLogger>("TransientLogger");
      const logger2 = container.resolve<TransientLogger>("TransientLogger");

      // Verify behavior
      expect(logger1).not.toBe(logger2); // Transient loggers should be different
      expect(TransientLogger.instanceCount).toBe(2); // Two instances created
      
      // Repository should be singleton (same across all)
      const repo1 = container.resolve<SingletonRepository>("SingletonRepository");
      const repo2 = container.resolve<SingletonRepository>("SingletonRepository");
      expect(repo1).toBe(repo2);
      expect(SingletonRepository.instanceCount).toBe(1); // Only one instance created
    });
  });

  describe("Container Hierarchy", () => {
    it("should respect singleton inheritance in parent-child relationships", () => {
      @Service()
      @Scope("singleton")
      class SharedService {
        value = "shared";
      }

      // Register in parent
      container.register("SharedService", SharedService, "singleton");

      // Create child containers
      const child1 = container.createScope();
      const child2 = container.createScope();

      // Resolve from children
      const parentInstance = container.resolve<SharedService>("SharedService");
      const child1Instance = child1.resolve<SharedService>("SharedService");
      const child2Instance = child2.resolve<SharedService>("SharedService");

      // All should be the same singleton instance
      expect(parentInstance).toBe(child1Instance);
      expect(parentInstance).toBe(child2Instance);
      expect(child1Instance).toBe(child2Instance);
    });

    it("should handle transient services from parent definitions", () => {
      @Service()
      @Scope("transient")
      class TransientService {
        id = Math.random();
      }

      container.register("TransientService", TransientService, "transient");

      const child1 = container.createScope();
      const child2 = container.createScope();

      const child1Instance1 = child1.resolve<TransientService>("TransientService");
      const child1Instance2 = child1.resolve<TransientService>("TransientService");
      const child2Instance = child2.resolve<TransientService>("TransientService");

      // All should be different instances (transient behavior)
      expect(child1Instance1).not.toBe(child1Instance2);
      expect(child1Instance1).not.toBe(child2Instance);
      expect(child1Instance2).not.toBe(child2Instance);
    });
  });

  describe("Error Handling", () => {
    it("should throw error for unregistered service regardless of scope", () => {
      expect(() => {
        container.resolve("UnregisteredService");
      }).toThrow("Service not registered: UnregisteredService");
    });

    it("should handle invalid scope values gracefully", () => {
      @Service()
      @Scope("invalid" as any)
      class InvalidScopeService {}

      // Should default to singleton behavior
      container.register("InvalidScopeService", InvalidScopeService, "singleton");
      
      const instance1 = container.resolve<InvalidScopeService>("InvalidScopeService");
      const instance2 = container.resolve<InvalidScopeService>("InvalidScopeService");
      
      expect(instance1).toBe(instance2);
    });
  });

  describe("Scope Integration with Interface Resolution", () => {
    it("should preserve scope when resolving through interfaces", () => {
      interface LoggerInterface {
        log(message: string): void;
      }

      @Service({ scope: "transient" })
      class TransientLogger implements LoggerInterface {
        id = Math.random();
        log(message: string) {
          console.log(`[${this.id}] ${message}`);
        }
      }

      container.register("LoggerInterface", TransientLogger, "transient");

      const logger1 = container.resolve<LoggerInterface>("LoggerInterface");
      const logger2 = container.resolve<LoggerInterface>("LoggerInterface");

      expect(logger1).not.toBe(logger2);
      expect((logger1 as any).id).not.toBe((logger2 as any).id);
    });
  });
});