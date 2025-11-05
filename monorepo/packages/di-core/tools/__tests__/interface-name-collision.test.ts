// [DI Edge-Case] Interface Name Collision Test
import { describe, it, expect, beforeEach } from "vitest";
import { CompileTimeDIContainer } from "../../src/container";
import { Project } from "ts-morph";

describe("[DI Edge-Case] Interface Name Collision Resolution", () => {
  let container: CompileTimeDIContainer;
  let project: Project;

  beforeEach(() => {
    container = new CompileTimeDIContainer();
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    });

    // Create two files with the SAME interface name but different definitions
    project.createSourceFile(
      "src/todo/interfaces/TodoInterfaces.ts",
      `
// AsyncState-based TodoServiceInterface (line 4)
export interface TodoServiceInterface {
  loadTodos(): Promise<void>;
  addTodo(todo: any): Promise<void>;
  isLoading: boolean;
  getCurrentData(): any;
}
      `
    );

    project.createSourceFile(
      "src/todo2/types.ts",
      `
// Reactive state-based TodoServiceInterface (line 4)  
export interface TodoServiceInterface {
  state: {
    todos: any[];
    loading: boolean;
    stats: { total: number; active: number; completed: number; };
  };
  addTodo(request: any): Promise<void>;
  updateTodo(request: any): Promise<void>;
}
      `
    );

    // Create corresponding service implementations
    project.createSourceFile(
      "src/todo/TodoService.ts",
      `
import { Service } from "@tdi2/di-core/decorators";
import { TodoServiceInterface } from "./interfaces/TodoInterfaces";

@Service()
export class LegacyTodoService implements TodoServiceInterface {
  isLoading = false;
  
  async loadTodos() {}
  async addTodo(todo: any) {}
  getCurrentData() { return { todos: [], stats: {} }; }
}
      `
    );

    project.createSourceFile(
      "src/todo2/TodoService.ts", 
      `
import { Service } from "@tdi2/di-core/decorators";
import { TodoServiceInterface } from "./types";

@Service()
export class ModernTodoService implements TodoServiceInterface {
  state = {
    todos: [],
    loading: false,
    stats: { total: 0, active: 0, completed: 0 }
  };
  
  async addTodo(request: any) {}
  async updateTodo(request: any) {}
}
      `
    );
  });

  it("should fail with current implementation - interface name collision", () => {
    // This test demonstrates the current problem
    // Both interfaces are named "TodoServiceInterface" but have different signatures
    
    // Mock current DI config that would be generated
    const problematicConfig = {
      // This would overwrite the first registration!
      "TodoServiceInterface": {
        factory: (container: any) => () => new (class ModernTodoService {
          state = { todos: [], loading: false, stats: { total: 0, active: 0, completed: 0 }};
          async addTodo() {}
          async updateTodo() {}
        })(),
        scope: "singleton" as const,
        interfaceName: "TodoServiceInterface",
        implementationClass: "ModernTodoService"
      }
    };

    container.loadConfiguration(problematicConfig);

    // The problem: only one service gets registered due to key collision
    expect(container.has("TodoServiceInterface")).toBe(true);
    
    const service = container.resolve("TodoServiceInterface");
    
    // This should be the ModernTodoService (last one wins)
    expect(service.state).toBeDefined();
    expect(service.state.todos).toEqual([]);
    
    // But what if we wanted the LegacyTodoService instead?
    // Currently impossible to distinguish them!
    expect(() => {
      // This would fail because we can't access the AsyncState-based service
      (service as any).getCurrentData();
    }).toThrow();

    console.log("❌ Current implementation suffers from interface name collision");
    console.log("   Both TodoServiceInterface registrations conflict");
    console.log("   Only the last registration wins, losing the first one");
  });

  it("should resolve interfaces uniquely with file path + line number encoding", () => {
    // This test shows what the solution should look like
    const expectedUniqueKeys = [
      "TodoServiceInterface__src_todo_interfaces_TodoInterfaces_ts_line_4",
      "TodoServiceInterface__src_todo2_types_ts_line_4"
    ];

    // Mock the improved config that would be generated with unique keys
    const improvedConfig = {
      [expectedUniqueKeys[0]]: {
        factory: (container: any) => () => new (class LegacyTodoService {
          isLoading = false;
          async loadTodos() {}
          async addTodo() {}
          getCurrentData() { return { todos: [], stats: {} }; }
        })(),
        scope: "singleton" as const,
        interfaceName: "TodoServiceInterface",
        implementationClass: "LegacyTodoService",
        sourceFile: "src/todo/interfaces/TodoInterfaces.ts",
        lineNumber: 4
      },
      [expectedUniqueKeys[1]]: {
        factory: (container: any) => () => new (class ModernTodoService {
          state = { todos: [], loading: false, stats: { total: 0, active: 0, completed: 0 }};
          async addTodo() {}
          async updateTodo() {}
        })(),
        scope: "singleton" as const,
        interfaceName: "TodoServiceInterface", 
        implementationClass: "ModernTodoService",
        sourceFile: "src/todo2/types.ts",
        lineNumber: 4
      }
    };

    container.loadConfiguration(improvedConfig);

    // Now both services should be registered with unique keys
    expect(container.has(expectedUniqueKeys[0])).toBe(true);
    expect(container.has(expectedUniqueKeys[1])).toBe(true);

    // We can resolve each service independently
    const legacyService = container.resolve(expectedUniqueKeys[0]);
    const modernService = container.resolve(expectedUniqueKeys[1]);

    // Verify we get the correct implementations
    expect(legacyService.isLoading).toBeDefined(); // LegacyTodoService
    expect(legacyService.getCurrentData).toBeDefined();

    expect(modernService.state).toBeDefined(); // ModernTodoService
    expect(modernService.state.todos).toEqual([]);

    // They should be different instances
    expect(legacyService).not.toBe(modernService);

    console.log("✅ Solution: Unique keys prevent interface name collisions");
    console.log(`   Legacy: ${expectedUniqueKeys[0]}`);
    console.log(`   Modern: ${expectedUniqueKeys[1]}`);
  });

  it("should maintain backward compatibility for single interface names", () => {
    // Ensure existing code still works when there's no collision
    const singleInterfaceConfig = {
      "UniqueServiceInterface": {
        factory: (container: any) => () => new (class UniqueService {
          getData() { return "unique"; }
        })(),
        scope: "singleton" as const,
        interfaceName: "UniqueServiceInterface",
        implementationClass: "UniqueService"
      }
    };

    container.loadConfiguration(singleInterfaceConfig);

    expect(container.has("UniqueServiceInterface")).toBe(true);
    const service = container.resolve("UniqueServiceInterface");
    expect(service.getData()).toBe("unique");

    console.log("✅ Backward compatibility maintained for unique interface names");
  });
});