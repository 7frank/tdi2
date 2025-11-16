// tools/functional-di-enhanced-transformer/enhanced-marker.test.ts - ENHANCED marker tests with AST validation

import { describe, it, expect, beforeEach } from "vitest";
import { Project } from "ts-morph";
import { EnhancedDependencyExtractor } from "./enhanced-dependency-extractor";
import { ADDITIONAL_MARKER_FIXTURES } from "./fixtures/marker-approach";

describe("Enhanced Marker Approach Tests", () => {
  let mockProject: Project;
  let dependencyExtractor: EnhancedDependencyExtractor;

  beforeEach(() => {
    mockProject = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        jsx: 1, // React JSX
      },
    });

    dependencyExtractor = new EnhancedDependencyExtractor({
      scanDirs: ["./src"],
      outputDir: "./src/generated",
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
        it("When using conditional types with services, Then should extract base service", () => {
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

        // TODO these kinds of structures should be handled differently, we want to give the user clear feedback that its, type is too complex, and their options to alias it.
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
        it("When type has circular references, Then should handle without infinite loops", () => {
          // Given - Configure for aggressive circular protection in tests
          const testExtractor = new EnhancedDependencyExtractor(
            {
              scanDirs: ["./src"],
              outputDir: "./src/generated",
            },
            undefined, // Use default source config
            {
              maxDepth: 5, // Lower max depth for faster test execution
              maxCircularReferences: 10, // Lower max circular refs
              enableCircularDetection: true,
            }
          );

          const sourceFile = mockProject.createSourceFile(
            "src/CircularTypes.tsx",
            ADDITIONAL_MARKER_FIXTURES.CIRCULAR_TYPE_REFERENCES
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When & Then - Should not hang or throw
          expect(() => {
            const dependencies = testExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

            // Should complete within reasonable time and return some result
            expect(Array.isArray(dependencies)).toBe(true);

            // Check that circular protection was triggered
            const stats = testExtractor.getExtractionStats();
            expect(stats.extractionStats.totalExtractions).toBeGreaterThan(0);

            console.log(`Extraction completed with stats:`, {
              totalExtractions: stats.extractionStats.totalExtractions,
              circularDetections: stats.extractionStats.circularDetections,
              maxDepthReached: stats.extractionStats.maxDepthReached,
            });
          }).not.toThrow();
        });

        it("When type has extremely deep nesting, Then should handle gracefully", () => {
          // Given - Configure with very low max depth for testing
          const testExtractor = new EnhancedDependencyExtractor(
            {
              scanDirs: ["./src"],
              outputDir: "./src/generated",
              
            },
            undefined,
            {
              maxDepth: 3, // Very low depth to trigger protection quickly
              maxCircularReferences: 5,
              enableCircularDetection: true,
            }
          );

          const sourceFile = mockProject.createSourceFile(
            "src/ExtremeNesting.tsx",
            ADDITIONAL_MARKER_FIXTURES.EXTREME_NESTING
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const startTime = Date.now();
          const dependencies = testExtractor.extractDependenciesFromParameter(
            param,
            sourceFile
          );
          const endTime = Date.now();

          // Then - Should find NO dependencies due to depth limit (maxDepth: 3)
          // The service is nested 10+ levels deep, which exceeds the depth limit
          expect(dependencies).toHaveLength(0);

          // Should complete quickly due to depth limiting
          expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second

          // Check that depth limiting was triggered
          const stats = testExtractor.getExtractionStats();
          expect(stats.extractionStats.maxDepthReached).toBeGreaterThan(0);

          console.log(
            `Deep nesting handled in ${endTime - startTime}ms with max depth reached: ${stats.extractionStats.maxDepthReached} times`
          );
        });

        it("When disabling circular detection, Then should rely only on depth limiting", () => {
          // Given - Configure with circular detection disabled
          const testExtractor = new EnhancedDependencyExtractor(
            {
              scanDirs: ["./src"],
              outputDir: "./src/generated",
              
            },
            undefined,
            {
              maxDepth: 8,
              maxCircularReferences: 100, // Won't matter since detection is disabled
              enableCircularDetection: false, // DISABLED
            }
          );

          const sourceFile = mockProject.createSourceFile(
            "src/NoCircularDetection.tsx",
            ADDITIONAL_MARKER_FIXTURES.EXTREME_NESTING
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When
          const dependencies = testExtractor.extractDependenciesFromParameter(
            param,
            sourceFile
          );

          // Then - Should find NO dependencies due to depth limit (maxDepth: 8)
          // The service is nested 10+ levels deep, which still exceeds the depth limit
          expect(dependencies).toHaveLength(0);

          const stats = testExtractor.getExtractionStats();
          expect(stats.circularProtectionConfig.enableCircularDetection).toBe(
            false
          );
          expect(stats.extractionStats.circularDetections).toBe(0); // No circular detection

          console.log(`Extraction without circular detection:`, {
            circularDetections: stats.extractionStats.circularDetections,
            maxDepthReached: stats.extractionStats.maxDepthReached,
          });
        });

        it("When updating circular protection config, Then should use new settings", () => {
          // Given
          const testExtractor = new EnhancedDependencyExtractor({
            scanDirs: ["./src"],
              outputDir: "./src/generated",
            
          });

          // When - Update config
          testExtractor.updateCircularProtectionConfig({
            maxDepth: 2,
            maxCircularReferences: 3,
            enableCircularDetection: true,
          });

          const config = testExtractor.getCircularProtectionConfig();

          // Then
          expect(config.maxDepth).toBe(2);
          expect(config.maxCircularReferences).toBe(3);
          expect(config.enableCircularDetection).toBe(true);
        });

        it("When using computed property names with services, Then should handle dynamic keys", () => {
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

          // Then - Both services should be extracted for comprehensive analysis
          expect(dependencies).toHaveLength(2);
          expect(dependencies[0].serviceKey).toBe("staticService");

          // The computed property maintains its structure for debugging
          const computedProperty = dependencies.find((d) =>
            d.serviceKey.includes("SERVICE_KEY")
          );
          expect(computedProperty).toBeDefined();
          expect(computedProperty?.serviceKey).toBe("[SERVICE_KEY]"); // Preserves computed property syntax
        });

        it("When extraction stats are reset, Then should clear all counters", () => {
          // Given
          const testExtractor = new EnhancedDependencyExtractor({
            scanDirs: ["./src"],
              outputDir: "./src/generated",
            
          });

          const sourceFile = mockProject.createSourceFile(
            "src/StatsReset.tsx",
            ADDITIONAL_MARKER_FIXTURES.DEEP_NESTED_OBJECTS
          );
          const func = sourceFile.getFunctions()[0];
          const param = func.getParameters()[0];

          // When - Extract to populate stats
          testExtractor.extractDependenciesFromParameter(param, sourceFile);
          const statsBefore = testExtractor.getExtractionStats();

          // Reset stats
          testExtractor.resetExtractionStats();
          const statsAfter = testExtractor.getExtractionStats();

          // Then
          expect(statsBefore.extractionStats.totalExtractions).toBeGreaterThan(
            0
          );
          expect(statsAfter.extractionStats.totalExtractions).toBe(0);
          expect(statsAfter.extractionStats.circularDetections).toBe(0);
          expect(statsAfter.extractionStats.maxDepthReached).toBe(0);
          expect(statsAfter.extractionStats.avgDepth).toBe(0);
        });
      });
    });
  });
});
