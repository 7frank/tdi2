// __tests__/simple-di.test.tsx

import { describe, it, expect, beforeEach } from "bun:test";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DI_CONFIG } from "../src/.tdi2/di-config";
import type { TodoServiceInterface } from "../src/todo2/types";

describe("DI Container Service Resolution", () => {
  let container: CompileTimeDIContainer;

  beforeEach(() => {
    container = new CompileTimeDIContainer();

    const {
      TodoRepositoryInterface2,
      TodoServiceInterface,
      LoggerInterface,
      NotificationServiceInterface,
    } = DI_CONFIG;
    const TestConfig = {
      TodoRepositoryInterface2,
      TodoServiceInterface,
      LoggerInterface,
      NotificationServiceInterface,
    };

    container.loadConfiguration(TestConfig);
  });

  describe("TodoServiceInterface (todo2 services)", () => {
    it("should be registered and resolvable", () => {
      // Verify registration
      expect(container.has("TodoServiceInterface")).toBe(true);

      // Verify resolution
      const service = container.resolve<TodoServiceInterface>(
        "TodoServiceInterface"
      );
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe("TodoService2");

      console.log(
        "✅ TodoServiceInterface -> TodoService2 resolved successfully"
      );
    });

    it("should have correct initial state", () => {
      const service = container.resolve<TodoServiceInterface>(
        "TodoServiceInterface"
      );

      expect(service.state.todos).toEqual([]);
      expect(service.state.loading).toBe(false);
      expect(service.state.stats.total).toBe(0);
      expect(service.state.stats.active).toBe(0);
      expect(service.state.stats.completed).toBe(0);

      console.log("✅ TodoServiceInterface initial state is correct");
    });

    it("should handle service operations", async () => {
      const service = container.resolve<TodoServiceInterface>(
        "TodoServiceInterface"
      );

      // Add a todo
      await service.addTodo({ title: "Test Todo" });

      expect(service.state.todos.length).toBe(1);
      expect(service.state.todos[0].title).toBe("Test Todo");
      expect(service.state.stats.total).toBe(1);
      expect(service.state.stats.active).toBe(1);

      console.log("✅ TodoServiceInterface operations work correctly");
    });
  });

  describe("TodoServiceType (AsyncState pattern)", () => {
    it("should be registered and resolvable", () => {
      // Verify registration
      expect(container.has("TodoServiceType")).toBe(true);

      // Verify resolution
      const service = container.resolve("TodoServiceType");
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe("TodoService");

      console.log("✅ TodoServiceType -> TodoService resolved successfully");
    });

    it("should have correct initial state", () => {
      const service = container.resolve("TodoServiceType");

      const state = service.getCurrentData();
      expect(state?.todos || []).toEqual([]);
      expect(service.isLoading).toBe(false);
      expect(state?.stats?.total || 0).toBe(0);

      console.log("✅ TodoServiceType initial state is correct");
    });

    it("should handle AsyncState operations", async () => {
      const service = container.resolve("TodoServiceType");

      // Load todos first
      await service.loadTodos();

      // Add a todo
      await service.addTodo({
        title: "AsyncState Todo",
        description: "Test description",
        priority: "high",
        completed: false,
        tags: ["test"],
      });

      const state = service.getCurrentData();
      expect(state?.todos.length).toBe(1);
      expect(state?.todos[0].title).toBe("AsyncState Todo");
      expect(state?.stats?.total).toBe(1);
      expect(state?.stats?.pending).toBe(1);

      console.log("✅ TodoServiceType AsyncState operations work correctly");
    });
  });

  describe("Service comparison", () => {
    it("should resolve different service implementations", () => {
      const todoService2 = container.resolve<TodoServiceInterface>(
        "TodoServiceInterface"
      );
      const todoService = container.resolve("TodoServiceType");

      expect(todoService2.constructor.name).toBe("TodoService2");
      expect(todoService.constructor.name).toBe("TodoService");

      // They should be different instances
      expect(todoService2).not.toBe(todoService);

      console.log(
        "✅ Both services resolve to different implementations as expected"
      );
      console.log(
        `  - TodoServiceInterface -> ${todoService2.constructor.name}`
      );
      console.log(`  - TodoServiceType -> ${todoService.constructor.name}`);
    });

    it("should maintain singleton behavior within same token", () => {
      const service1 = container.resolve<TodoServiceInterface>(
        "TodoServiceInterface"
      );
      const service2 = container.resolve<TodoServiceInterface>(
        "TodoServiceInterface"
      );

      // Should be the same instance (singleton)
      expect(service1).toBe(service2);

      console.log("✅ Singleton behavior maintained for same service token");
    });
  });

  describe("Registration debugging", () => {
    it("should show all todo-related registrations", () => {
      const allTokens = container.getRegisteredTokens();
      const todoTokens = allTokens.filter((token) =>
        token.toLowerCase().includes("todo")
      );

      console.log("🔍 Todo-related service registrations:");
      todoTokens.forEach((token) => {
        try {
          const service = container.resolve(token);
          console.log(`  ✅ ${token} -> ${service.constructor.name}`);
        } catch (error) {
          console.log(`  ❌ ${token} -> FAILED: ${error.message}`);
        }
      });

      expect(todoTokens).toContain("TodoServiceInterface");
      expect(todoTokens).toContain("TodoServiceType");
    });
  });
});
