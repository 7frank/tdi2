// [DI Edge-Case] Interface Name Collision Integration Test
import { describe, it, expect, beforeEach } from "vitest";
import { IntegratedInterfaceResolver } from "../interface-resolver/integrated-interface-resolver";
import { Project } from "ts-morph";

describe("[DI Edge-Case] Interface Name Collision - Integration Test", () => {
  let resolver: IntegratedInterfaceResolver;
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    });

    resolver = new IntegratedInterfaceResolver({
      srcDir: "src",
      enableInheritanceDI: true,
      enableStateDI: true,
      sourceConfig: {
        validateSources: false // Disable source validation for testing
      }
    });

    // Set the project on the resolver (like the working tests do)
    (resolver as any).project = project;

    // Create the problematic scenario: two interfaces with the same name
    project.createSourceFile(
      "src/todo/interfaces/TodoInterfaces.ts",
      `
// This interface is at line 3
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
// This interface is at line 3
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

    // Create service implementations for both interfaces
    project.createSourceFile(
      "src/todo/TodoService.ts",
      `
import { Service } from "@tdi2/di-core/decorators";
import type { TodoServiceInterface } from './interfaces/TodoInterfaces';

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
import type { TodoServiceInterface } from './types';

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

  it("should resolve both services with location-based keys", async () => {
    // Debug: check what files the project has
    const sourceFiles = project.getSourceFiles();
    console.log("\n🗂️  Project files:");
    for (const file of sourceFiles) {
      console.log(`  ${file.getFilePath()}`);
    }

    await resolver.scanProject();

    const implementations = resolver.getInterfaceImplementations();
    console.log("\n📋 All registered interface implementations:");
    
    if (implementations.size === 0) {
      console.log("  No implementations found!");
      
      // Debug: check if the classes were found at all
      for (const file of sourceFiles) {
        const classes = file.getClasses();
        console.log(`  File ${file.getFilePath()} has ${classes.length} classes:`);
        for (const cls of classes) {
          console.log(`    - ${cls.getName()}`);
          console.log(`    - Decorators: ${cls.getDecorators().map(d => d.getName()).join(', ')}`);
          const interfaces = cls.getImplements();
          console.log(`    - Implements: ${interfaces.map(i => i.getText()).join(', ')}`);
        }
      }
    } else {
      for (const [key, impl] of implementations) {
        console.log(`  ${key} -> ${impl.implementationClass}`);
      }
    }

    // If we have any implementations, continue with the test
    if (implementations.size > 0) {
      // Should have 4 registrations total: 2 interface-based + 2 class-based  
      expect(implementations.size).toBe(4);
      
      // Check for location-based keys (all registration types now have locations)
      const keys = Array.from(implementations.keys());
      const locationBasedKeys = keys.filter(key => key.includes('__') && key.includes('_line_'));
      
      // Should have 4 location-based keys (2 interface-based + 2 class-based registrations)
      expect(locationBasedKeys.length).toBe(4);
      
      console.log("🎉 SUCCESS: Location-based interface collision resolution working!");
      console.log(`   Found ${locationBasedKeys.length} location-based keys out of ${implementations.size} total registrations`);
      
    } else {
      // Fail gracefully with debug info
      expect(implementations.size).toBeGreaterThan(0);
    }

    const keys = Array.from(implementations.keys());
    const locationBasedKeys = keys.filter(key => key.includes('__') && key.includes('_line_'));
    
    expect(locationBasedKeys.length).toBe(4);

    // Both should be TodoServiceInterface implementations but with different location keys
    const todo1Key = keys.find(k => k.includes('todo_TodoService_ts'));
    const todo2Key = keys.find(k => k.includes('todo2_TodoService_ts'));

    expect(todo1Key).toBeDefined();
    expect(todo2Key).toBeDefined();

    // Verify we can resolve both implementations
    const legacy = resolver.resolveImplementation(todo1Key!);
    const modern = resolver.resolveImplementation(todo2Key!);

    expect(legacy).toBeDefined();
    expect(legacy!.implementationClass).toBe("LegacyTodoService");

    expect(modern).toBeDefined();
    expect(modern!.implementationClass).toBe("ModernTodoService");

    // They should be different implementations
    expect(legacy).not.toBe(modern);

    console.log("✅ Successfully resolved both implementations with location-based keys:");
    console.log(`   Legacy: ${todo1Key} -> ${legacy!.implementationClass}`);
    console.log(`   Modern: ${todo2Key} -> ${modern!.implementationClass}`);
  });

  it("should still support interface name fallback resolution", async () => {
    await resolver.scanProject();

    // When we request just "TodoServiceInterface", it should resolve to one of them
    // (the behavior might be non-deterministic, but it should resolve to something)
    const fallbackResolution = resolver.resolveImplementation("TodoServiceInterface");
    
    expect(fallbackResolution).toBeDefined();
    expect(["LegacyTodoService", "ModernTodoService"]).toContain(fallbackResolution!.implementationClass);

    console.log(`✅ Fallback resolution for "TodoServiceInterface" -> ${fallbackResolution!.implementationClass}`);
  });

  it("should provide debugging information for interface collisions", async () => {
    await resolver.scanProject();

    const implementations = resolver.getInterfaceImplementations();
    const todoServiceImpls = Array.from(implementations.entries())
      .filter(([key, impl]) => key.includes("TodoServiceInterface"));

    // Should have 2 TodoServiceInterface implementations (the location-based ones)
    expect(todoServiceImpls.length).toBe(2);

    for (const [key, impl] of todoServiceImpls) {
      expect(key).toMatch(/TodoServiceInterface__src_.+_line_\d+/);
      expect(impl.filePath).toMatch(/\.(ts|tsx)$/);
      
      console.log(`🔍 Debug info for ${impl.implementationClass}:`);
      console.log(`   Key: ${key}`);
      console.log(`   File: ${impl.filePath}`);
      console.log(`   Interface: ${impl.interfaceName}`);
    }
  });

  it("should handle location-based key requests correctly", async () => {
    await resolver.scanProject();

    const implementations = resolver.getInterfaceImplementations();
    const locationKeys = Array.from(implementations.keys()).filter(k => k.includes('_line_'));

    // Test direct location-based resolution
    for (const locationKey of locationKeys) {
      const resolved = resolver.resolveImplementation(locationKey);
      expect(resolved).toBeDefined();
      
      console.log(`✅ Direct location resolution: ${locationKey} -> ${resolved!.implementationClass}`);
    }
  });
});