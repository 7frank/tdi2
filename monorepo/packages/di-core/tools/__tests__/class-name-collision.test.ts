// [DI Edge-Case] Class Name Collision Test  
import { describe, it, expect, beforeEach } from "bun:test";
import { IntegratedInterfaceResolver } from "../interface-resolver/integrated-interface-resolver";
import { Project } from "ts-morph";

describe("[DI Edge-Case] Class Name Collision Resolution", () => {
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
      verbose: true,
      srcDir: "src",
      enableInheritanceDI: true,
      enableStateDI: true,
      sourceConfig: {
        validateSources: false // Disable source validation for testing
      }
    });

    // Set the project on the resolver (like the working tests do)
    (resolver as any).project = project;

    // Create the problematic scenario: two classes with the same name in different files
    
    // First TodoService in todo1 directory
    project.createSourceFile(
      "src/todo1/interfaces.ts",
      `
export interface TodoServiceInterface {
  loadTodos(): Promise<void>;
  addTodo(todo: any): Promise<void>;
  getTodos(): any[];
}
      `
    );

    project.createSourceFile(
      "src/todo1/TodoService.ts",
      `
import { Service } from "@tdi2/di-core/decorators";
import type { TodoServiceInterface } from './interfaces';

@Service()
export class TodoService implements TodoServiceInterface {
  private todos: any[] = [];
  
  async loadTodos() {
    console.log("TodoService1: Loading todos");
  }
  
  async addTodo(todo: any) {
    this.todos.push(todo);
  }
  
  getTodos() {
    return this.todos;
  }
}
      `
    );

    // Second TodoService in todo2 directory 
    project.createSourceFile(
      "src/todo2/types.ts",
      `
export interface TodoServiceType {
  state: {
    todos: any[];
    loading: boolean;
  };
  addTodo(request: any): Promise<void>;
  updateTodo(request: any): Promise<void>;
}
      `
    );

    project.createSourceFile(
      "src/todo2/TodoService.ts",
      `
import { Service } from "@tdi2/di-core/decorators";
import type { TodoServiceType } from './types';

@Service()  
export class TodoService implements TodoServiceType {
  state = {
    todos: [],
    loading: false
  };
  
  async addTodo(request: any) {
    console.log("TodoService2: Adding todo");
    this.state.todos.push(request);
  }
  
  async updateTodo(request: any) {
    console.log("TodoService2: Updating todo");
  }
}
      `
    );
  });

  it("should resolve both classes with same name but different implementations", async () => {
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

    // Should have both TodoService classes registered
    expect(implementations.size).toBeGreaterThan(0);
    
    // Look for registrations with TodoService class name
    const todoServiceImpls = Array.from(implementations.entries())
      .filter(([key, impl]) => impl.implementationClass === "TodoService");
      
    console.log(`\n🔍 Found ${todoServiceImpls.length} TodoService implementations:`);
    for (const [key, impl] of todoServiceImpls) {
      console.log(`  Key: ${key}`);
      console.log(`  Interface: ${impl.interfaceName}`);
      console.log(`  File: ${impl.filePath}`);
      console.log(`  Sanitized Key: ${impl.sanitizedKey}`);
    }

    // We should have at least 2 TodoService implementations (interface-based registrations)
    // Plus potentially 2 more class-based registrations
    expect(todoServiceImpls.length).toBeGreaterThanOrEqual(2);
    
    // Verify they have different interface names
    const interfaceNames = todoServiceImpls.map(([key, impl]) => impl.interfaceName);
    expect(interfaceNames).toContain("TodoServiceInterface");
    expect(interfaceNames).toContain("TodoServiceType");
    
    // Verify they have different file paths
    const filePaths = todoServiceImpls.map(([key, impl]) => impl.filePath);
    expect(filePaths.some(path => path.includes("todo1"))).toBe(true);
    expect(filePaths.some(path => path.includes("todo2"))).toBe(true);
    
    console.log("🎉 SUCCESS: Both TodoService classes are registered separately!");
  });

  it("should resolve specific TodoService by interface type", async () => {
    await resolver.scanProject();

    // Try to resolve TodoServiceInterface - should get the first TodoService
    const todoServiceInterface = resolver.resolveImplementation("TodoServiceInterface");
    expect(todoServiceInterface).toBeDefined();
    expect(todoServiceInterface!.implementationClass).toBe("TodoService");
    expect(todoServiceInterface!.interfaceName).toBe("TodoServiceInterface");
    
    // Try to resolve TodoServiceType - should get the second TodoService
    const todoServiceType = resolver.resolveImplementation("TodoServiceType");
    expect(todoServiceType).toBeDefined();
    expect(todoServiceType!.implementationClass).toBe("TodoService");
    expect(todoServiceType!.interfaceName).toBe("TodoServiceType");
    
    // They should be different registrations (different keys/files)
    expect(todoServiceInterface!.sanitizedKey).not.toBe(todoServiceType!.sanitizedKey);
    expect(todoServiceInterface!.filePath).not.toBe(todoServiceType!.filePath);
    
    console.log("✅ Both TodoService classes can be resolved by their respective interface types!");
    console.log(`  TodoServiceInterface -> ${todoServiceInterface!.implementationClass} (${todoServiceInterface!.filePath})`);
    console.log(`  TodoServiceType -> ${todoServiceType!.implementationClass} (${todoServiceType!.filePath})`);
  });

  it("should handle location-based resolution for same class names", async () => {
    await resolver.scanProject();

    const implementations = resolver.getInterfaceImplementations();
    
    // Find location-based keys for both TodoService classes
    const locationBasedKeys = Array.from(implementations.keys())
      .filter(key => key.includes('__') && key.includes('_line_') && key.includes('TodoService'));
      
    console.log(`\n🔍 Location-based keys for TodoService classes:`);
    for (const key of locationBasedKeys) {
      const impl = implementations.get(key)!;
      console.log(`  ${key}`);
      console.log(`    -> ${impl.implementationClass} (${impl.interfaceName})`);
      console.log(`    -> File: ${impl.filePath}`);
    }

    // Should have location-based keys for both classes
    expect(locationBasedKeys.length).toBeGreaterThanOrEqual(2);
    
    // Test direct location-based resolution
    for (const locationKey of locationBasedKeys) {
      const resolved = resolver.resolveImplementation(locationKey);
      expect(resolved).toBeDefined();
      expect(resolved!.implementationClass).toBe("TodoService");
      
      console.log(`✅ Direct location resolution: ${locationKey.substring(0, 50)}... -> ${resolved!.implementationClass}`);
    }
  });
});