// tools/enhanced-di-transformer.test.ts - COMPLETELY FIXED VERSION
import { describe, it, expect, beforeEach, mock, jest } from "bun:test";
import { EnhancedDITransformer } from "./enhanced-di-transformer";
import { Project } from "ts-morph";

// Mock dependencies
const createMockConfigManager = () => ({
  getConfigDir: mock(() => "/mock/config"),
  getBridgeDir: mock(() => "/mock/bridge"),
  getConfigHash: mock(() => "test-hash-456"),
  generateBridgeFiles: mock(),
  isConfigValid: mock(() => true),
  forceRegenerate: mock(),
  findExistingConfig: mock(() => "test-hash-456"),
});

const createMockTreeBuilder = () => ({
  buildDependencyTree: mock().mockResolvedValue(undefined),
  getConfigurations: mock(
    () =>
      new Map([
        [
          "LoggerInterface",
          {
            token: "LoggerInterface",
            implementation: {
              implementationClass: "ConsoleLogger",
              interfaceName: "LoggerInterface",
              filePath: "/src/services/ConsoleLogger.ts",
              isGeneric: false,
            },
            dependencies: [],
            factory: "createConsoleLogger",
            scope: "singleton",
          },
        ],
        [
          "ApiInterface",
          {
            token: "ApiInterface",
            implementation: {
              implementationClass: "RestApiService",
              interfaceName: "ApiInterface",
              filePath: "/src/services/RestApiService.ts",
              isGeneric: false,
            },
            dependencies: ["LoggerInterface"],
            factory: "createRestApiService",
            scope: "singleton",
          },
        ],
      ])
  ),
  getInterfaceResolver: mock(() => ({
    getInterfaceImplementations: mock(
      () =>
        new Map([
          [
            "LoggerInterface",
            {
              interfaceName: "LoggerInterface",
              implementationClass: "ConsoleLogger",
              filePath: "/src/services/ConsoleLogger.ts",
              sanitizedKey: "LoggerInterface",
            },
          ],
          [
            "ApiInterface",
            {
              interfaceName: "ApiInterface",
              implementationClass: "RestApiService",
              filePath: "/src/services/RestApiService.ts",
              sanitizedKey: "ApiInterface",
            },
          ],
        ])
    ),
    getServiceDependencies: mock(
      () =>
        new Map([
          [
            "RestApiService",
            {
              serviceClass: "RestApiService",
              constructorParams: [
                {
                  paramName: "logger",
                  interfaceType: "LoggerInterface",
                  isOptional: false,
                },
              ],
            },
          ],
        ])
    ),
  })),
});

const createMockProject = () => {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
  });

  // Add mock TypeScript files
  project.createSourceFile(
    "src/services/ConsoleLogger.ts",
    `
import { Service } from '../di/decorators';
import type { LoggerInterface } from '../interfaces/LoggerInterface';

@Service()
export class ConsoleLogger implements LoggerInterface {
  log(message: string): void {
    console.log(message);
  }
}
  `
  );

  project.createSourceFile(
    "src/services/RestApiService.ts",
    `
import { Service, Inject } from '../di/decorators';
import type { ApiInterface } from '../interfaces/ApiInterface';
import type { LoggerInterface } from '../interfaces/LoggerInterface';

@Service()
export class RestApiService implements ApiInterface {
  constructor(@Inject() private logger: LoggerInterface) {}
  
  async getData(): Promise<string[]> {
    this.logger.log('Fetching data');
    return ['data1', 'data2'];
  }
}
  `
  );

  return project;
};

describe("EnhancedDITransformer", () => {
  let transformer: EnhancedDITransformer;
  let mockConfigManager: any;
  let mockTreeBuilder: any;
  let mockProject: Project;

  beforeEach(() => {
    mockConfigManager = createMockConfigManager();
    mockTreeBuilder = createMockTreeBuilder();
    mockProject = createMockProject();

    transformer = new EnhancedDITransformer({
      srcDir: "./src",
      outputDir: "./src/generated",
      verbose: false,
      enableInterfaceResolution: true,
    });

    // Mock internal dependencies
    (transformer as any).configManager = mockConfigManager;
    (transformer as any).treeBuilder = mockTreeBuilder;
    (transformer as any).project = mockProject;
  });

  describe("Feature: Transformer Initialization", () => {
    describe("Given transformer configuration options", () => {
      it("When creating with default options, Then should set reasonable defaults", () => {
        // Given & When
        const defaultTransformer = new EnhancedDITransformer();

        // Then
        const options = (defaultTransformer as any).options;
        expect(options.srcDir).toBe("./src");
        expect(options.verbose).toBe(false);
        expect(options.generateRegistry).toBe(true);
        expect(options.enableInterfaceResolution).toBe(true);
      });

      it("When creating with custom options, Then should respect provided values", () => {
        // Given & When
        const customTransformer = new EnhancedDITransformer({
          srcDir: "./custom/src",
          verbose: true,
          generateRegistry: false,
          enableInterfaceResolution: false,
          customSuffix: "test-suffix",
        });

        // Then
        const options = (customTransformer as any).options;
        expect(options.srcDir).toBe("./custom/src");
        expect(options.verbose).toBe(true);
        expect(options.generateRegistry).toBe(false);
        expect(options.enableInterfaceResolution).toBe(false);
        expect(options.customSuffix).toBe("test-suffix");
      });

      it("When initializing, Then should create config manager and tree builder", () => {
        // Given & When
        const newTransformer = new EnhancedDITransformer({ verbose: true });

        // Then
        expect((newTransformer as any).configManager).toBeDefined();
        expect((newTransformer as any).treeBuilder).toBeDefined();
        expect((newTransformer as any).project).toBeDefined();
      });
    });
  });

  describe("Feature: Interface-Based Transformation", () => {
    describe("Given interface resolution is enabled", () => {
      it("When transforming, Then should use dependency tree builder", async () => {
        // Given - Interface resolution enabled
        // Mock the generateServiceRegistry method to prevent file system access
        const generateRegistrySpy = jest
          .spyOn(transformer as any, "generateServiceRegistry")
          .mockResolvedValue(undefined);

        // When
        await transformer.transform();

        // Then
        expect(mockTreeBuilder.buildDependencyTree).toHaveBeenCalled();
        expect(mockConfigManager.generateBridgeFiles).toHaveBeenCalled();
        
        generateRegistrySpy.mockRestore();
      });

      it("When transformation succeeds, Then should generate service registry", async () => {
        // Given
        const generateRegistrySpy = jest
          .spyOn(transformer as any, "generateServiceRegistry")
          .mockResolvedValue(undefined);

        // When
        await transformer.transform();

        // Then
        expect(generateRegistrySpy).toHaveBeenCalled();

        generateRegistrySpy.mockRestore();
      });

      it("When transformation fails, Then should handle errors gracefully", async () => {
        // Given
        mockTreeBuilder.buildDependencyTree.mockRejectedValue(
          new Error("Tree building failed")
        );

        // When & Then
        await expect(transformer.transform()).rejects.toThrow(
          "Tree building failed"
        );
      });
    });

    describe("Given interface resolution is disabled", () => {
      it("When transforming, Then should throw error for unsupported mode", async () => {
        // Given
        const tokenTransformer = new EnhancedDITransformer({
          enableInterfaceResolution: false,
        });

        // When & Then
        await expect(tokenTransformer.transform()).rejects.toThrow(
          "Token-based resolution not implemented in enhanced transformer"
        );
      });
    });
  });

  describe("Feature: Configuration and Debug Methods", () => {
    describe("Given debug and validation methods", () => {
      it("When calling getDebugInfo, Then should return valid debug information", async () => {
        // Given
        const generateRegistrySpy = jest
          .spyOn(transformer as any, "generateServiceRegistry")
          .mockResolvedValue(undefined);

        // When
        const debugInfo = await transformer.getDebugInfo();

        // Then
        expect(debugInfo).toBeDefined();
        expect(debugInfo.configHash).toBe("test-hash-456");
        expect(Array.isArray(debugInfo.implementations)).toBe(true);
        expect(Array.isArray(debugInfo.dependencies)).toBe(true);
        expect(Array.isArray(debugInfo.configurations)).toBe(true);
        expect(debugInfo.validation).toBeDefined();

        generateRegistrySpy.mockRestore();
      });

      it("When calling validateConfiguration, Then should return boolean result", async () => {
        // Given
        const generateRegistrySpy = jest
          .spyOn(transformer as any, "generateServiceRegistry")
          .mockResolvedValue(undefined);

        // When
        const isValid = await transformer.validateConfiguration();

        // Then
        expect(typeof isValid).toBe("boolean");

        generateRegistrySpy.mockRestore();
      });

      it("When calling getTransformationSummary, Then should return summary object", () => {
        // Given & When
        const summary = transformer.getTransformationSummary();

        // Then
        expect(summary).toBeDefined();
        expect(typeof summary.configHash).toBe("string");
        expect(typeof summary.implementationCount).toBe("number");
        expect(typeof summary.dependencyCount).toBe("number");
        expect(typeof summary.hasValidConfiguration).toBe("boolean");
        expect(typeof summary.hasErrors).toBe("boolean");
      });
    });
  });

  describe("Feature: Error Handling and Robustness", () => {
    describe("Given error conditions", () => {
      it("When tree builder fails, Then should handle gracefully", async () => {
        // Given
        mockTreeBuilder.buildDependencyTree.mockRejectedValue(
          new Error("Dependency tree failed")
        );

        // When & Then
        await expect(transformer.transform()).rejects.toThrow();
      });

      it("When interface resolver is unavailable, Then should handle gracefully", async () => {
        // Given
        mockTreeBuilder.getInterfaceResolver.mockReturnValue(null);
        const generateRegistrySpy = jest
          .spyOn(transformer as any, "generateServiceRegistry")
          .mockResolvedValue(undefined);

        // When
        const debugInfo = await transformer.getDebugInfo();

        // Then
        expect(debugInfo).toBeDefined();
        expect(debugInfo.implementations).toEqual([]);
        expect(debugInfo.dependencies).toEqual([]);

        generateRegistrySpy.mockRestore();
      });

      it("When save fails, Then should throw appropriate error", async () => {
        // Given
        const mockSave = jest.spyOn((transformer as any).project, "save")
          .mockRejectedValue(new Error("Save failed"));

        // When & Then
        await expect(transformer.save()).rejects.toThrow("Save failed");

        mockSave.mockRestore();
      });
    });
  });

  describe("Feature: Manager Access", () => {
    describe("Given manager access methods", () => {
      it("When accessing config manager, Then should return manager instance", () => {
        // Given & When
        const configManager = transformer.getConfigManager();

        // Then
        expect(configManager).toBe(mockConfigManager);
      });

      it("When accessing tree builder, Then should return builder instance", () => {
        // Given & When
        const treeBuilder = transformer.getTreeBuilder();

        // Then
        expect(treeBuilder).toBe(mockTreeBuilder);
      });
    });
  });
});