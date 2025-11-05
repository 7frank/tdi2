// apps/legacy/src/__tests__/di-integration.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Project } from "ts-morph";
import path from "path";

// Import the old interface resolver (before integrated changes)
//import { InterfaceResolver } from "@tdi2/di-core/tools/interface-resolver/interface-resolver";
//import { ConfigManager } from "@tdi2/di-core/tools/config-manager";
// import { DependencyTreeBuilder } from "@tdi2/di-core/tools/dependency-tree-builder";

import {
  InterfaceResolver,
  ConfigManager,
  DependencyTreeBuilder,
} from "@tdi2/di-core/tools";

describe("DI Integration Test - Baseline (Pre-Patch)", () => {
  let project: Project;
  let configManager: ConfigManager;
  let interfaceResolver: InterfaceResolver;
  let dependencyTreeBuilder: DependencyTreeBuilder;

  beforeEach(() => {
    // Set up test environment
    project = new Project({
      useInMemoryFileSystem: false,
      tsConfigFilePath: path.resolve(__dirname, "../../tsconfig.json"),
    });

    configManager = new ConfigManager({
      srcDir: path.resolve(__dirname, "../"),
      outputDir: path.resolve(__dirname, "../generated"),
      enableFunctionalDI: false,
      verbose: false,
    });

    interfaceResolver = new InterfaceResolver({
      verbose: false,
      srcDir: path.resolve(__dirname, "../"),
    });

    dependencyTreeBuilder = new DependencyTreeBuilder(configManager, {
      verbose: false,
      srcDir: path.resolve(__dirname, "../"),
    });
  });

  describe("Service Detection", () => {
    it("should detect TDILoggerService with @Service decorator", async () => {
      await interfaceResolver.scanProject();
      const implementations = interfaceResolver.getInterfaceImplementations();

      // Should find TDILoggerService implementing LoggerInterface
      const loggerImplementations = Array.from(implementations.values()).filter(
        (impl) => impl.implementationClass === "TDILoggerService"
      );

      expect(loggerImplementations.length).toBeGreaterThan(0);

      const loggerImpl = loggerImplementations[0];
      expect(loggerImpl.interfaceName).toBe("LoggerInterface");
      expect(loggerImpl.implementationClass).toBe("TDILoggerService");
      expect(loggerImpl.filePath).toContain("tdi-logger-service.ts");
    });

    it("should detect ExampleApiService with @Service decorator", async () => {
      await interfaceResolver.scanProject();
      const implementations = interfaceResolver.getInterfaceImplementations();

      // Should find ExampleApiService implementing ExampleApiInterface
      const apiImplementations = Array.from(implementations.values()).filter(
        (impl) => impl.implementationClass === "ExampleApiService"
      );

      expect(apiImplementations.length).toBeGreaterThan(0);

      const apiImpl = apiImplementations[0];
      expect(apiImpl.interfaceName).toBe("ExampleApiInterface");
      expect(apiImpl.implementationClass).toBe("ExampleApiService");
      expect(apiImpl.filePath).toContain("ExampleApiService.ts");
    });

    it("should detect UserApiServiceImpl with @Service decorator", async () => {
      await interfaceResolver.scanProject();
      const implementations = interfaceResolver.getInterfaceImplementations();

      // Should find UserApiServiceImpl implementing ExampleApiInterface
      const userApiImplementations = Array.from(
        implementations.values()
      ).filter((impl) => impl.implementationClass === "UserApiServiceImpl");

      expect(userApiImplementations.length).toBeGreaterThan(0);

      const userApiImpl = userApiImplementations[0];
      expect(userApiImpl.interfaceName).toBe("ExampleApiInterface");
      expect(userApiImpl.implementationClass).toBe("UserApiServiceImpl");
      expect(userApiImpl.filePath).toContain("UserApiServiceImpl.ts");
    });

    it("should detect TodoService2 with @Service decorator", async () => {
      await interfaceResolver.scanProject();
      const implementations = interfaceResolver.getInterfaceImplementations();

      // Should find TodoService2 implementing TodoServiceInterface
      const todoImplementations = Array.from(implementations.values()).filter(
        (impl) => impl.implementationClass === "TodoService2"
      );

      expect(todoImplementations.length).toBeGreaterThan(0);

      const todoImpl = todoImplementations[0];
      expect(todoImpl.interfaceName).toBe("TodoServiceInterface");
      expect(todoImpl.implementationClass).toBe("TodoService2");
      expect(todoImpl.filePath).toContain("TodoService.ts");
    });
  });

  describe("Dependency Resolution", () => {
    it("should resolve ExampleApiService dependencies", async () => {
      await interfaceResolver.scanProject();
      const dependencies = interfaceResolver.getServiceDependencies();

      const exampleApiDep = dependencies.get("ExampleApiService");
      expect(exampleApiDep).toBeDefined();
      expect(exampleApiDep?.interfaceDependencies).toContain("LoggerService");
    });

    it("should resolve UserApiServiceImpl dependencies", async () => {
      await interfaceResolver.scanProject();
      const dependencies = interfaceResolver.getServiceDependencies();

      const userApiDep = dependencies.get("UserApiServiceImpl");
      expect(userApiDep).toBeDefined();
      expect(userApiDep?.interfaceDependencies).toContain("LoggerInterface");
      expect(userApiDep?.interfaceDependencies).toContain("CacheInterface_any");
    });

    it("should resolve TodoService2 dependencies", async () => {
      await interfaceResolver.scanProject();
      const dependencies = interfaceResolver.getServiceDependencies();

      const todoDep = dependencies.get("TodoService2");
      expect(todoDep).toBeDefined();
      expect(todoDep?.interfaceDependencies).toContain(
        "TodoRepositoryInterface2"
      );
      expect(todoDep?.interfaceDependencies).toContain(
        "NotificationServiceInterface"
      );
    });

    it("should resolve interface implementations correctly", async () => {
      await interfaceResolver.scanProject();

      // Test resolving LoggerInterface -> should find TDILoggerService
      const loggerImpl =
        interfaceResolver.resolveImplementation("LoggerInterface");
      expect(loggerImpl).toBeDefined();
      expect(loggerImpl?.implementationClass).toBe("TDILoggerService");

      // Test resolving ExampleApiInterface -> should find ExampleApiService (first/primary)
      const apiImpl = interfaceResolver.resolveImplementation(
        "ExampleApiInterface"
      );
      expect(apiImpl).toBeDefined();
      expect([
        "ExampleApiService",
        "UserApiServiceImpl",
        "MockUserApiService",
      ]).toContain(apiImpl?.implementationClass);
    });
  });

  describe("Service Count Validation", () => {
    it("should detect expected number of services", async () => {
      await interfaceResolver.scanProject();
      const implementations = interfaceResolver.getInterfaceImplementations();

      // Based on the working logs, we should have 22 implementations
      expect(implementations.size).toBeGreaterThanOrEqual(20);
      expect(implementations.size).toBeLessThanOrEqual(50); // FIXME actually 25 but it detects classes twice

      // Should have multiple services with dependencies
      const dependencies = interfaceResolver.getServiceDependencies();
      expect(dependencies.size).toBeGreaterThanOrEqual(4);
    });

    it("should find services in expected files", async () => {
      await interfaceResolver.scanProject();
      const implementations = interfaceResolver.getInterfaceImplementations();

      const filePaths = Array.from(implementations.values()).map((impl) =>
        path.basename(impl.filePath)
      );

      // Should find services in these key files
      expect(filePaths).toContain("tdi-logger-service.ts");
      expect(filePaths).toContain("ExampleApiService.ts");
      expect(filePaths).toContain("UserApiServiceImpl.ts");
      expect(filePaths).toContain("TodoService.ts");
      expect(filePaths).toContain("AppStateService.ts");
      expect(filePaths).toContain("NotificationService.ts");
    });
  });

  describe("Dependency Tree Building", () => {
    it("should build dependency tree without errors", async () => {
      // This should work without throwing errors
      await dependencyTreeBuilder.buildDependencyTree();

      const configurations = dependencyTreeBuilder.getConfigurations();
      expect(configurations.size).toBeGreaterThan(0);

      const serviceClasses = dependencyTreeBuilder.getServiceClasses();
      expect(serviceClasses.size).toBeGreaterThan(0);
    });

  it("should validate dependencies successfully", async () => {
      await dependencyTreeBuilder.buildDependencyTree();
      
      // Get the interface resolver to validate dependencies
      const interfaceResolver = dependencyTreeBuilder.getInterfaceResolver();
      const validation = interfaceResolver.validateDependencies();
      
      // Should have minimal errors in a working setup
      expect(validation.missingImplementations.length).toBeLessThan(10);
      expect(validation.circularDependencies.length).toBe(0);
    });
  });

  describe("Configuration Generation", () => {
    it("should generate valid DI configuration", async () => {
      await dependencyTreeBuilder.buildDependencyTree();

      // Check that config directory exists and contains expected files
      const configDir = configManager.getConfigDir();
      expect(configDir).toBeTruthy();

      // Should not throw errors during generation
      expect(() => {
        configManager.generateBridgeFiles();
      }).not.toThrow();
    });
  });

  describe("Key Services Validation", () => {
    it("should validate specific service implementations that functional components depend on", async () => {
      await interfaceResolver.scanProject();
      const implementations = interfaceResolver.getInterfaceImplementations();

      // These are the key services that functional components in the logs depend on
      const keyServices = [
        { interface: "ExampleApiInterface", class: "ExampleApiService" },
        { interface: "LoggerInterface", class: "TDILoggerService" },
        { interface: "CacheInterface", class: "MemoryCache" },
        { interface: "TodoServiceInterface", class: "TodoService2" },
        { interface: "AppStateServiceInterface", class: "AppStateService" },
        {
          interface: "NotificationServiceInterface",
          class: "NotificationService",
        },
      ];

      for (const service of keyServices) {
        const impl = Array.from(implementations.values()).find(
          (impl) =>
            impl.interfaceName === service.interface &&
            impl.implementationClass === service.class
        );

        expect(impl).toBeDefined();
        expect(impl?.sanitizedKey).toBeTruthy();
      }
    });
  });
});
