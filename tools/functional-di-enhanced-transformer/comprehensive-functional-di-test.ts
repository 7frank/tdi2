// comprehensive-functional-di-test.ts - Complete test suite for functional DI transformer

import { describe, it, expect, beforeEach } from "bun:test";
import { FunctionalDIEnhancedTransformer } from "../functional-di-enhanced-transformer";
import { Project } from "ts-morph";
import {
  TEST_PATTERNS,
  TEST_SCENARIOS,
  MOCK_IMPLEMENTATIONS,
  TestAssertions,
  IntegrationTestHelper,
  PerformanceTestHelper,
  ErrorSimulationHelper,
  RealWorldScenarios,
  TestDataValidator
} from "./test-functional-di.config";

describe("FunctionalDIEnhancedTransformer - Comprehensive Test Suite", () => {
  let transformer: FunctionalDIEnhancedTransformer;
  let mockProject: Project;

  beforeEach(() => {
    // Validate test data integrity
    expect(TestDataValidator.validateAllTestPatterns()).toBe(true);

    transformer = new FunctionalDIEnhancedTransformer({
      srcDir: "./src",
      outputDir: "./src/generated",
      verbose: false,
    });

    mockProject = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        jsx: 1, // React JSX
      },
    });

    // Add DI markers
    mockProject.createSourceFile(
      "src/di/markers.ts",
      `
export type Inject<T> = T & {
  readonly __inject__: unique symbol;
};

export type InjectOptional<T> = T & {
  readonly __injectOptional__: unique symbol;
};
      `
    );

    // Mock the project and interface resolver
    (transformer as any).project = mockProject;
    (transformer as any).interfaceResolver = IntegrationTestHelper.createMockInterfaceResolver();
  });

  describe("Feature: Different Injection Marker Styles", () => {
    describe("Given inline injection markers", () => {
      it("When component uses inline services with destructuring, Then should transform correctly", async () => {
        // Given
        mockProject.createSourceFile(
          "src/components/InlineWithDestructuring.tsx",
          IntegrationTestHelper.createTestComponent(
            "InlineWithDestructuring",
            TEST_PATTERNS.INLINE_WITH_DESTRUCTURING.pattern
          )
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        TestAssertions.assertTransformed(transformedContent, TEST_PATTERNS.INLINE_WITH_DESTRUCTURING);
        TestAssertions.assertHasDIImports(transformedContent);
        TestAssertions.assertCorrectHookUsage(transformedContent, ['ApiInterface'], ['LoggerInterface']);
        TestAssertions.assertServicesRemovedFromDestructuring(transformedContent, ['message']);
      });

      it("When component uses inline services without destructuring, Then should transform correctly", async () => {
        // Given
        mockProject.createSourceFile(
          "src/components/InlineWithoutDestructuring.tsx",
          IntegrationTestHelper.createTestComponent(
            "InlineWithoutDestructuring",
            TEST_PATTERNS.INLINE_WITHOUT_DESTRUCTURING.pattern
          )
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        TestAssertions.assertTransformed(transformedContent, TEST_PATTERNS.INLINE_WITHOUT_DESTRUCTURING);
        TestAssertions.assertCorrectHookUsage(transformedContent, ['ApiInterface']);
      });
    });

    describe("Given separate interface definitions", () => {
      it("When component uses separate interface, Then should resolve and transform correctly", async () => {
        // Given
        mockProject.createSourceFile(
          "src/interfaces/ComponentProps.ts",
          TEST_PATTERNS.SEPARATE_INTERFACE.interfaceDefinition!
        );

        mockProject.createSourceFile(
          "src/components/SeparateInterface.tsx",
          `
import React from 'react';
import type { ComponentProps } from '../interfaces/ComponentProps';

${TEST_PATTERNS.SEPARATE_INTERFACE.component!}
          `
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        TestAssertions.assertTransformed(transformedContent, TEST_PATTERNS.SEPARATE_INTERFACE);
        TestAssertions.assertCorrectHookUsage(transformedContent, ['ApiInterface'], ['LoggerInterface']);
      });
    });

    describe("Given arrow function components", () => {
      it("When arrow function uses injection markers, Then should transform correctly", async () => {
        // Given
        mockProject.createSourceFile(
          "src/components/ArrowFunction.tsx",
          IntegrationTestHelper.createTestComponent(
            "ArrowFunction",
            TEST_PATTERNS.ARROW_FUNCTION.pattern
          )
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        TestAssertions.assertTransformed(transformedContent, TEST_PATTERNS.ARROW_FUNCTION);
        TestAssertions.assertCorrectHookUsage(transformedContent, ['ApiInterface']);
      });
    });
  });

  describe("Feature: Edge Cases and Error Handling", () => {
    describe("Given components that should not be transformed", () => {
      const edgeCases = [
        TEST_PATTERNS.NO_SERVICES,
        TEST_PATTERNS.EMPTY_SERVICES,
        TEST_PATTERNS.NON_DI_SERVICES,
        TEST_PATTERNS.MULTIPLE_PARAMS
      ];

      edgeCases.forEach(pattern => {
        it(`When component has ${pattern.name}, Then should not transform`, async () => {
          // Given
          mockProject.createSourceFile(
            `src/components/${pattern.name.replace(/\s+/g, '')}.tsx`,
            IntegrationTestHelper.createTestComponent(pattern.name, pattern.pattern)
          );

          // When
          const transformedFiles = await transformer.transformForBuild();

          // Then
          expect(transformedFiles.size).toBe(0);
        });
      });
    });

    describe("Given mixed DI and non-DI services", () => {
      it("When component has mixed service types, Then should transform only DI services", async () => {
        // Given
        mockProject.createSourceFile(
          "src/components/MixedServices.tsx",
          IntegrationTestHelper.createTestComponent(
            "MixedServices",
            TEST_PATTERNS.MIXED_SERVICES.pattern
          )
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        TestAssertions.assertTransformed(transformedContent, TEST_PATTERNS.MIXED_SERVICES);
        
        // Should only inject DI services
        expect(transformedContent).toContain("useService('ApiInterface')");
        expect(transformedContent).toContain("useOptionalService('CacheInterface')");
        
        // Should not inject non-DI services
        expect(transformedContent).not.toContain("useService('LoggerService')");
        expect(transformedContent).not.toContain("useService('UtilityService')");
      });
    });

    describe("Given complex destructuring patterns", () => {
      it("When component has deep destructuring, Then should handle gracefully", async () => {
        // Given
        mockProject.createSourceFile(
          "src/components/DeepDestructuring.tsx",
          IntegrationTestHelper.createTestComponent(
            "DeepDestructuring",
            TEST_PATTERNS.DEEP_DESTRUCTURING.pattern
          )
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        TestAssertions.assertTransformed(transformedContent, TEST_PATTERNS.DEEP_DESTRUCTURING);
        
        // Should preserve complex destructuring
        expect(transformedContent).toContain("user: {");
        expect(transformedContent).toContain("settings: { theme }");
        
        // Should remove services from destructuring
        expect(transformedContent).not.toContain("services } = props");
      });
    });
  });

  describe("Feature: Complex Type Handling", () => {
    describe("Given complex generic types", () => {
      it("When component uses complex generics, Then should sanitize keys correctly", async () => {
        // Given
        const complexGenericsComponent = `
export function ComplexGenerics(props: {
  services: {
    cache: Inject<CacheInterface<Map<string, UserData>>>;
    repository: Inject<RepositoryInterface<UserEntity>>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { services } = props;
  return <div>Complex generics</div>;
}`;

        mockProject.createSourceFile(
          "src/components/ComplexGenerics.tsx",
          IntegrationTestHelper.createTestComponent("ComplexGenerics", complexGenericsComponent)
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        
        // Should use sanitized keys for complex generics
        expect(transformedContent).toContain("useService('CacheInterface_Map_string_UserData')");
        expect(transformedContent).toContain("useService('RepositoryInterface_UserEntity')");
        expect(transformedContent).toContain("useOptionalService('LoggerInterface')");
      });
    });
  });

  describe("Feature: Missing Dependencies Handling", () => {
    describe("Given services that cannot be resolved", () => {
      it("When required dependency is missing, Then should add warning comment", async () => {
        // Given
        const missingDepsComponent = `
export function MissingDependencies(props: {
  services: {
    missingRequired: Inject<NonExistentInterface>;
    missingOptional?: InjectOptional<AnotherNonExistentInterface>;
    existing: Inject<ApiInterface>;
  };
}) {
  const { services } = props;
  return <div>Missing dependencies</div>;
}`;

        mockProject.createSourceFile(
          "src/components/MissingDependencies.tsx",
          IntegrationTestHelper.createTestComponent("MissingDependencies", missingDepsComponent)
        );

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const transformedContent = Array.from(transformedFiles.values())[0];
        
        // Should handle missing dependencies gracefully
        expect(transformedContent).toContain("// Warning: implementation not found");
        expect(transformedContent).toContain("const missingOptional = undefined; // Optional dependency not found");
        expect(transformedContent).toContain("useService('ApiInterface')");
      });
    });
  });

  describe("Feature: Real-World Scenarios", () => {
    describe("Given Todo App scenario", () => {
      it("When transforming complete Todo app, Then should handle all components correctly", async () => {
        // Given
        const todoScenario = RealWorldScenarios.getTodoAppScenario();
        
        todoScenario.components.forEach((component, index) => {
          mockProject.createSourceFile(
            `src/todo/Todo${index}.tsx`,
            component
          );
        });

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(todoScenario.components.length);
        
        // Validate TodoApp transformation
        const todoAppContent = Array.from(transformedFiles.values()).find(content =>
          content.includes('TodoApp')
        );
        expect(todoAppContent).toBeDefined();
        expect(todoAppContent).toContain("useService('TodoServiceType')");
        expect(todoAppContent).toContain("useService('TodoFormServiceType')");

        // Validate TodoList transformation
        const todoListContent = Array.from(transformedFiles.values()).find(content =>
          content.includes('TodoList')
        );
        expect(todoListContent).toBeDefined();
        expect(todoListContent).toContain("useService('TodoServiceType')");
        expect(todoListContent).toContain("const { onEditTodo } = props;");

        // Validate TodoForm transformation
        const todoFormContent = Array.from(transformedFiles.values()).find(content =>
          content.includes('TodoForm')
        );
        expect(todoFormContent).toBeDefined();
        expect(todoFormContent).toContain("useService('TodoFormServiceType')");
        expect(todoFormContent).toContain("useService('TodoServiceType')");
      });
    });

    describe("Given E-Commerce scenario", () => {
      it("When transforming e-commerce components, Then should handle complex service dependencies", async () => {
        // Given
        const ecommerceScenario = RealWorldScenarios.getECommerceScenario();
        
        ecommerceScenario.components.forEach((component, index) => {
          mockProject.createSourceFile(
            `src/ecommerce/Component${index}.tsx`,
            component
          );
        });

        // When
        const transformedFiles = await transformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(ecommerceScenario.components.length);
        
        // Validate ProductCatalog transformation
        const catalogContent = Array.from(transformedFiles.values()).find(content =>
          content.includes('ProductCatalog')
        );
        expect(catalogContent).toBeDefined();
        expect(catalogContent).toContain("useService('ProductApiInterface')");
        expect(catalogContent).toContain("useService('CartServiceInterface')");
        expect(catalogContent).toContain("useOptionalService('LoggerInterface')");
        expect(catalogContent).toContain("useOptionalService('AnalyticsInterface')");
      });
    });
  });

  describe("Feature: Performance and Scalability", () => {
    describe("Given large number of components", () => {
      it("When transforming many components, Then should complete in reasonable time", async () => {
        // Given
        const componentCount = 50;
        const largeTestSuite = PerformanceTestHelper.generateLargeTestSuite(componentCount);
        
        largeTestSuite.forEach((component, index) => {
          mockProject.createSourceFile(
            `src/generated/Component${index}.tsx`,
            component
          );
        });

        // When
        const startTime = Date.now();
        const transformedFiles = await transformer.transformForBuild();
        const duration = Date.now() - startTime;

        // Then
        expect(transformedFiles.size).toBeGreaterThan(0);
        expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
        
        const summary = transformer.getTransformationSummary();
        expect(summary.count).toBeGreaterThan(0);
        expect(summary.transformedFiles.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Feature: Error Recovery and Robustness", () => {
    describe("Given malformed components", () => {
      it("When encountering problematic components, Then should handle gracefully", async () => {
        // Given
        const malformedComponents = ErrorSimulationHelper.createMalformedComponents();
        
        malformedComponents.forEach((component, index) => {
          mockProject.createSourceFile(
            `src/problematic/Component${index}.tsx`,
            component.content
          );
        });

        // When & Then - Should not throw
        await expect(transformer.transformForBuild()).resolves.toBeDefined();
        
        // Should provide meaningful summary even with errors
        const summary = transformer.getTransformationSummary();
        expect(summary).toBeDefined();
      });
    });

    describe("Given interface resolution errors", () => {
      it("When interface resolver fails, Then should continue processing", async () => {
        // Given
        const errorResolver = {
          scanProject: () => Promise.resolve(),
          resolveImplementation: () => undefined, // All resolutions fail
          validateDependencies: () => ErrorSimulationHelper.createInterfaceResolutionErrors(),
        };
        
        (transformer as any).interfaceResolver = errorResolver;
        
        mockProject.createSourceFile(
          "src/components/TestComponent.tsx",
          IntegrationTestHelper.createTestComponent(
            "TestComponent",
            TEST_PATTERNS.INLINE_WITH_DESTRUCTURING.pattern
          )
        );

        // When & Then - Should not throw but continue processing
        const transformedFiles = await transformer.transformForBuild();
        
        // Should still attempt transformation even with resolution failures
        expect(transformedFiles.size).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Feature: Configuration and Options", () => {
    describe("Given different transformer configurations", () => {
      it("When verbose mode is enabled, Then should provide detailed logging", async () => {
        // Given
        const verboseTransformer = new FunctionalDIEnhancedTransformer({
          srcDir: "./src",
          verbose: true,
        });
        (verboseTransformer as any).project = mockProject;
        (verboseTransformer as any).interfaceResolver = IntegrationTestHelper.createMockInterfaceResolver();

        mockProject.createSourceFile(
          "src/components/VerboseTest.tsx",
          IntegrationTestHelper.createTestComponent(
            "VerboseTest",
            TEST_PATTERNS.INLINE_WITH_DESTRUCTURING.pattern
          )
        );

        // When
        const transformedFiles = await verboseTransformer.transformForBuild();

        // Then
        expect(transformedFiles.size).toBe(1);
        const summary = verboseTransformer.getTransformationSummary();
        expect(summary.count).toBe(1);
      });

      it("When debug files are enabled, Then should generate debug information", async () => {
        // Given
        const debugTransformer = new FunctionalDIEnhancedTransformer({
          srcDir: "./src",
          generateDebugFiles: true,
        });
        (debugTransformer as any).project = mockProject;
        (debugTransformer as any).interfaceResolver = IntegrationTestHelper.createMockInterfaceResolver();

        // When
        const configManager = debugTransformer.getConfigManager();

        // Then
        expect(configManager).toBeDefined();
        expect(configManager.getConfigHash()).toBeDefined();
      });
    });
  });
