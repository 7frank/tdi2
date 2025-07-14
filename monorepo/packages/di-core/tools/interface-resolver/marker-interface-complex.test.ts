// tools/functional-di-enhanced-transformer/enhanced-marker.test.ts - ENHANCED marker tests with AST validation

import { describe, it, expect, beforeEach } from "bun:test";
import { Project } from "ts-morph";
import { EnhancedDependencyExtractor } from "./enhanced-dependency-extractor";
import { ADDITIONAL_MARKER_FIXTURES } from "./fixtures/marker-approach";


const verbose=true
describe("Enhanced Marker Approach Tests", () => {
  let mockProject: Project;
  let dependencyExtractor: EnhancedDependencyExtractor;

  beforeEach(() => {

    if (verbose) {
      console.log("\n ---- Next Test\n")
    }

    mockProject = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        jsx: 1, // React JSX
      },
    });

    dependencyExtractor = new EnhancedDependencyExtractor({
      srcDir: "./src",
      verbose,
    });
  });

  // TODO previous AST implementation was working but might need more test fixing
  describe("More complex Structures", () => {
    describe("Feature: Deep Nested Object Structures", () => {
      describe("Given components with deeply nested service definitions", () => {
        it("When using multi-level nesting, Then should extract all services", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/DeepNested.tsx",
            ADDITIONAL_MARKER_FIXTURES.DEEP_NESTED_OBJECTS
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(2);

          const authService = dependencies.find((d) => d.serviceKey === "auth");
          expect(authService?.interfaceType).toBe("AuthInterface");
          expect(authService?.isOptional).toBe(false);

          const notificationService = dependencies.find(
            (d) => d.serviceKey === "notifications"
          );
          expect(notificationService?.interfaceType).toBe(
            "NotificationInterface"
          );
          expect(notificationService?.isOptional).toBe(true);
        });

        it("When using 4+ levels deep nesting, Then should handle gracefully", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/VeryDeepNested.tsx",
            ADDITIONAL_MARKER_FIXTURES.VERY_DEEP_NESTED
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("deepService");
          expect(dependencies[0].interfaceType).toBe("DeepServiceInterface");
        });
      });
    });

    describe("Feature: Union Type Service Injection", () => {
      describe("Given components with union type props", () => {
        it("When using union with different service configurations, Then should extract from all variants", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/UnionTypes.tsx",
            ADDITIONAL_MARKER_FIXTURES.UNION_TYPE_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(3); // debug, logger, cache from both variants

          const debugService = dependencies.find(
            (d) => d.serviceKey === "debug"
          );
          expect(debugService?.interfaceType).toBe("DebugInterface");

          const loggerService = dependencies.find(
            (d) => d.serviceKey === "logger"
          );
          expect(loggerService?.interfaceType).toBe("LoggerInterface");

          const cacheService = dependencies.find(
            (d) => d.serviceKey === "cache"
          );
          expect(cacheService?.interfaceType).toBe("CacheInterface<any>");
        });

        it("When union includes non-service variants, Then should only extract DI services", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/MixedUnion.tsx",
            ADDITIONAL_MARKER_FIXTURES.MIXED_UNION_TYPES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1); // Only the api service
          expect(dependencies[0].serviceKey).toBe("api");
          expect(dependencies[0].interfaceType).toBe("ApiInterface");
        });
      });
    });

    describe("Feature: Intersection Type Service Injection", () => {
      describe("Given components with intersection type props", () => {
        it("When using intersection types, Then should merge all service definitions", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/IntersectionTypes.tsx",
            ADDITIONAL_MARKER_FIXTURES.INTERSECTION_TYPE_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(3); // logger, cache, api from different intersected types

          const serviceKeys = dependencies.map((d) => d.serviceKey);
          expect(serviceKeys).toContain("logger");
          expect(serviceKeys).toContain("cache");
          expect(serviceKeys).toContain("api");
        });
      });
    });

    describe("Feature: Array Type Service Injection", () => {
      describe("Given components with array-based service definitions", () => {
        it("When using array of service objects, Then should extract from element type", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/ArrayServices.tsx",
            ADDITIONAL_MARKER_FIXTURES.ARRAY_TYPE_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("processor");
          expect(dependencies[0].interfaceType).toBe("ProcessorInterface");
        });

        it("When using nested arrays, Then should handle multi-dimensional structures", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/NestedArrays.tsx",
            ADDITIONAL_MARKER_FIXTURES.NESTED_ARRAY_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("validator");
          expect(dependencies[0].interfaceType).toBe("ValidatorInterface");
        });
      });
    });

    describe("Feature: Complex Generic Type Patterns", () => {
      describe("Given components with advanced generic patterns", () => {
        it.skip("When using conditional types with services, Then should extract base service", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/ConditionalTypes.tsx",
            ADDITIONAL_MARKER_FIXTURES.CONDITIONAL_TYPE_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("processor");
          expect(dependencies[0].interfaceType).toBe(
            "ProcessorInterface<string>"
          );
        });

        it.skip("When using mapped types with services, Then should extract from mapped structure", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/MappedTypes.tsx",
            ADDITIONAL_MARKER_FIXTURES.MAPPED_TYPE_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(2);

          const userService = dependencies.find(
            (d) => d.serviceKey === "userService"
          );
          expect(userService?.interfaceType).toBe("UserServiceInterface");

          const productService = dependencies.find(
            (d) => d.serviceKey === "productService"
          );
          expect(productService?.interfaceType).toBe("ProductServiceInterface");
        });
      });
    });

    describe("Feature: Real-World Enterprise Patterns", () => {
      describe("Given enterprise-level component patterns", () => {
        it("When using micro-frontend service composition, Then should handle complex structure", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/MicroFrontend.tsx",
            ADDITIONAL_MARKER_FIXTURES.MICRO_FRONTEND_PATTERN
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(4); // userAuth, notifications, analytics, payments

          const serviceKeys = dependencies.map((d) => d.serviceKey);
          expect(serviceKeys).toContain("userAuth");
          expect(serviceKeys).toContain("notifications");
          expect(serviceKeys).toContain("analytics");
          expect(serviceKeys).toContain("payments");
        });

        it("When using feature flag controlled services, Then should extract all potential services", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/FeatureFlags.tsx",
            ADDITIONAL_MARKER_FIXTURES.FEATURE_FLAG_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(3); // Should extract from all flag variants

          const serviceKeys = dependencies.map((d) => d.serviceKey);
          expect(serviceKeys).toContain("legacyService");
          expect(serviceKeys).toContain("newService");
          expect(serviceKeys).toContain("experimentalService");
        });
      });
    });

    describe("Feature: Error Recovery and Edge Cases", () => {
      describe("Given malformed or edge case type definitions", () => {
        it.skip("When type has circular references, Then should handle without infinite loops", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/CircularTypes.tsx",
            ADDITIONAL_MARKER_FIXTURES.CIRCULAR_TYPE_REFERENCES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When & Then - Should not hang or throw
          expect(() => {
            const dependencies =
              dependencyExtractor.extractDependenciesFromParameter(
                param,
                sourceFile
              );
          }).not.toThrow();
        });

        it("When type has extremely deep nesting, Then should handle gracefully", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/ExtremeNesting.tsx",
            ADDITIONAL_MARKER_FIXTURES.EXTREME_NESTING
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("deepService");
        });

        it.skip("When using computed property names with services, Then should handle dynamic keys", () => {
          // Given
          const sourceFile = mockProject.createSourceFile(
            "src/ComputedProperties.tsx",
            ADDITIONAL_MARKER_FIXTURES.COMPUTED_PROPERTY_SERVICES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1); // Should extract the statically analyzable service
          expect(dependencies[0].serviceKey).toBe("staticService");
        });
      });
    });
  });
});
