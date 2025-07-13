// tools/functional-di-enhanced-transformer/enhanced-marker.test.ts - ENHANCED marker tests with AST validation

import { describe, it, expect, beforeEach } from "bun:test";
import { Project } from "ts-morph";
import { EnhancedDependencyExtractor } from "./enhanced-dependency-extractor";
import { MARKER_FIXTURES,ADDITIONAL_MARKER_FIXTURES } from "./fixtures/marker-approach";

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
      srcDir: "./src",
      verbose: false,
    });
  });

  describe("Feature: Single Service Injection Patterns", () => {
    describe("Given function components with single service injection", () => {
      it("When function uses single service prop, Then should extract using AST", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/SingleServiceFunction.tsx",
          MARKER_FIXTURES.SINGLE_SERVICE_FUNCTION
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
        expect(dependencies[0].serviceKey).toBe("service");
        expect(dependencies[0].interfaceType).toBe("FooInterface");
        expect(dependencies[0].isOptional).toBe(false);
        expect(dependencies[0].sanitizedKey).toBe("FooInterface");
      });

      it("When arrow function uses generic service, Then should handle type parameters", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/SingleServiceArrow.tsx",
          MARKER_FIXTURES.SINGLE_SERVICE_ARROW
        );
        const variableStatement = sourceFile.getVariableStatements()[0];
        const declaration = variableStatement.getDeclarations()[0];
        const arrowFunc = declaration.getInitializer();

        if (arrowFunc && arrowFunc.getKind() === 218) {
          // ArrowFunction
          const param = arrowFunc.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("service");
          expect(dependencies[0].interfaceType).toBe(
            "FooInterface<string, number>"
          );
          expect(dependencies[0].isOptional).toBe(false);
          expect(dependencies[0].sanitizedKey).toBe(
            "FooInterface_string_number"
          );
        }
      });

      it("When using destructured parameter, Then should extract from destructuring", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/DestructuredSingle.tsx",
          MARKER_FIXTURES.DESTRUCTURED_SINGLE_SERVICE
        );
        const variableStatement = sourceFile.getVariableStatements()[0];
        const declaration = variableStatement.getDeclarations()[0];
        const arrowFunc = declaration.getInitializer();

        if (arrowFunc && arrowFunc.getKind() === 218) {
          // ArrowFunction
          const param = arrowFunc.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("service");
          expect(dependencies[0].interfaceType).toBe("FooInterface");
        }
      });
    });
  });

  describe("Feature: Multiple Services with Nested Objects", () => {
    describe("Given components with services object", () => {
      it("When using nested services object, Then should extract all services", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/MultipleServicesNested.tsx",
          MARKER_FIXTURES.MULTIPLE_SERVICES_NESTED
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

        const fooService = dependencies.find((d) => d.serviceKey === "foo");
        expect(fooService).toBeDefined();
        expect(fooService?.interfaceType).toBe("FooInterface");
        expect(fooService?.isOptional).toBe(false);

        const barService = dependencies.find((d) => d.serviceKey === "bar");
        expect(barService).toBeDefined();
        expect(barService?.interfaceType).toBe("BarInterface");
        expect(barService?.isOptional).toBe(false);
      });

      it("When using services with generics, Then should handle type parameters correctly", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/MultipleServicesGenerics.tsx",
          MARKER_FIXTURES.MULTIPLE_SERVICES_WITH_GENERICS
        );
        const variableStatement = sourceFile.getVariableStatements()[0];
        const declaration = variableStatement.getDeclarations()[0];
        const arrowFunc = declaration.getInitializer();

        if (arrowFunc && arrowFunc.getKind() === 218) {
          // ArrowFunction
          const param = arrowFunc.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(2);

          const fooService = dependencies.find((d) => d.serviceKey === "foo");
          expect(fooService?.interfaceType).toBe("FooInterface<string>");
          expect(fooService?.sanitizedKey).toBe("FooInterface_string");

          const barService = dependencies.find((d) => d.serviceKey === "bar");
          expect(barService?.interfaceType).toBe("BarInterface<number>");
          expect(barService?.sanitizedKey).toBe("BarInterface_number");
        }
      });
    });
  });

  describe("Feature: Complex Type Patterns", () => {
    describe("Given components with complex generic structures", () => {
      it("When using nested generic injection, Then should parse complex types", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/NestedGeneric.tsx",
          MARKER_FIXTURES.NESTED_GENERIC_INJECTION
        );
        const variableStatement = sourceFile.getVariableStatements()[0];
        const declaration = variableStatement.getDeclarations()[0];
        const arrowFunc = declaration.getInitializer();

        if (arrowFunc && arrowFunc.getKind() === 218) {
          // ArrowFunction
          const param = arrowFunc.getParameters()[0];

          // When
          const dependencies =
            dependencyExtractor.extractDependenciesFromParameter(
              param,
              sourceFile
            );

          // Then
          expect(dependencies).toHaveLength(1);
          expect(dependencies[0].serviceKey).toBe("service");
          expect(dependencies[0].interfaceType).toBe("FooInterface<Bar<Baz>>");
          expect(dependencies[0].sanitizedKey).toBe("FooInterface_Bar_Baz");
        }
      });

      it("When using complex nested generics, Then should handle all type levels", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ComplexNested.tsx",
          MARKER_FIXTURES.COMPLEX_NESTED_GENERICS
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
        expect(dependencies).toHaveLength(3);

        const userRepo = dependencies.find((d) => d.serviceKey === "userRepo");
        expect(userRepo?.interfaceType).toBe("Repository<UserEntity>");
        expect(userRepo?.sanitizedKey).toBe("Repository_UserEntity");

        const configCache = dependencies.find(
          (d) => d.serviceKey === "configCache"
        );
        expect(configCache?.interfaceType).toBe(
          "CacheInterface<Map<string, ConfigData>>"
        );
        expect(configCache?.sanitizedKey).toBe(
          "CacheInterface_Map_string_ConfigData"
        );

        const stateManager = dependencies.find(
          (d) => d.serviceKey === "stateManager"
        );
        expect(stateManager?.interfaceType).toContain("StateManager<{");
        expect(stateManager?.sanitizedKey).toMatch(/StateManager_/);
      });
    });
  });

  describe("Feature: Optional Dependencies", () => {
    describe("Given components with optional services", () => {
      it("When using InjectOptional markers, Then should mark as optional", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/OptionalServices.tsx",
          MARKER_FIXTURES.OPTIONAL_SERVICES
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
        expect(dependencies).toHaveLength(3);

        const fooService = dependencies.find((d) => d.serviceKey === "foo");
        expect(fooService?.isOptional).toBe(false); // Required

        const barService = dependencies.find((d) => d.serviceKey === "bar");
        expect(barService?.isOptional).toBe(true); // Optional

        const cacheService = dependencies.find((d) => d.serviceKey === "cache");
        expect(cacheService?.isOptional).toBe(true); // Optional
        expect(cacheService?.interfaceType).toBe("CacheInterface<any>");
      });
    });
  });

  describe("Feature: Separate Interface Resolution", () => {
    describe("Given components using external interfaces", () => {
      it.skip("When interface defined in separate file, Then should resolve correctly", () => {
        // Given - Create the interface file first
        mockProject.createSourceFile(
          "src/ComponentProps.ts",
          MARKER_FIXTURES.SEPARATE_INTERFACE_FILE
        );

        const componentFile = mockProject.createSourceFile(
          "src/SeparateInterface.tsx",
          MARKER_FIXTURES.SEPARATE_INTERFACE_DEFINITION
        );
        const func = componentFile.getFunctions()[0];
        const param = func.getParameters()[0];

        // When
        const dependencies =
          dependencyExtractor.extractDependenciesFromParameter(
            param,
            componentFile
          );

        // Then
        expect(dependencies).toHaveLength(2);

        const fooService = dependencies.find((d) => d.serviceKey === "foo");
        expect(fooService?.interfaceType).toBe("FooInterface");
        expect(fooService?.isOptional).toBe(false);

        const barService = dependencies.find((d) => d.serviceKey === "bar");
        expect(barService?.interfaceType).toBe("BarInterface");
        expect(barService?.isOptional).toBe(true);
      });
    });
  });

  describe("Feature: Source Validation", () => {
    describe("Given different marker sources", () => {
      it("When marker from valid source, Then should validate successfully", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ValidMarkerSource.tsx",
          MARKER_FIXTURES.SINGLE_SERVICE_FUNCTION
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
        expect(dependencies[0].serviceKey).toBe("service");
      });

      it("When marker from invalid source, Then should reject", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/InvalidMarkerSource.tsx",
          MARKER_FIXTURES.INVALID_MARKER_SOURCE
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
        expect(dependencies).toHaveLength(0); // Should be rejected due to invalid source
      });

      it("When updating source configuration, Then should affect validation", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/CustomSource.tsx",
          `
import React from 'react';
import type { Inject } from "custom-package/markers";

export interface FooInterface {
  foo(): string;
}

export function Component(props: { service: Inject<FooInterface> }) {
  return <div />;
}
          `
        );
        const func = sourceFile.getFunctions()[0];
        const param = func.getParameters()[0];

        // When - Before config update
        const beforeDeps = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Update config
        dependencyExtractor.updateSourceConfiguration({
          markerSources: ["custom-package/markers"],
        });

        const afterDeps = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(beforeDeps).toHaveLength(0); // Invalid with original config
        expect(afterDeps).toHaveLength(1); // Valid with updated config
      });
    });
  });

  describe("Feature: Edge Cases and Error Handling", () => {
    describe("Given problematic marker usage", () => {
      it("When no marker types present, Then should return empty", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/NoMarkers.tsx",
          MARKER_FIXTURES.NO_MARKER_TYPES
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
        expect(dependencies).toHaveLength(0);
      });

      it("When multiple parameters present, Then should handle gracefully", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/MultipleParams.tsx",
          MARKER_FIXTURES.MULTIPLE_PARAMETERS
        );
        const func = sourceFile.getFunctions()[0];
        const firstParam = func.getParameters()[0];

        // When
        const dependencies =
          dependencyExtractor.extractDependenciesFromParameter(
            firstParam,
            sourceFile
          );

        // Then
        expect(dependencies).toHaveLength(0); // Should not extract from multi-param functions
      });

      it("When complex destructuring present, Then should handle gracefully", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ComplexDestructuring.tsx",
          MARKER_FIXTURES.COMPLEX_PROPS_DESTRUCTURING
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
        expect(dependencies[0].serviceKey).toBe("api");
        expect(dependencies[0].interfaceType).toBe("ApiInterface");
      });
    });
  });

  describe("Feature: Mixed DI and Non-DI Services", () => {
    describe("Given components with mixed service types", () => {
      it("When mixing DI and non-DI services, Then should extract only DI services", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/MixedServices.tsx",
          MARKER_FIXTURES.MIXED_DI_AND_NON_DI
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
        expect(dependencies).toHaveLength(2); // Only api (Inject) and cache (InjectOptional)

        const apiService = dependencies.find((d) => d.serviceKey === "api");
        expect(apiService?.interfaceType).toBe("ApiInterface");
        expect(apiService?.isOptional).toBe(false);

        const cacheService = dependencies.find((d) => d.serviceKey === "cache");
        expect(cacheService?.interfaceType).toBe("CacheInterface<any>");
        expect(cacheService?.isOptional).toBe(true);

        // logger and utils should NOT be extracted (no Inject markers)
        const loggerService = dependencies.find(
          (d) => d.serviceKey === "logger"
        );
        expect(loggerService).toBeUndefined();

        const utilsService = dependencies.find((d) => d.serviceKey === "utils");
        expect(utilsService).toBeUndefined();
      });
    });
  });

  describe("Feature: State-Based and Inheritance Patterns", () => {
    describe("Given components using state-based DI", () => {
      it("When using AsyncState markers, Then should handle state types", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/AsyncStateMarkers.tsx",
          MARKER_FIXTURES.ASYNC_STATE_MARKERS
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

        const userState = dependencies.find(
          (d) => d.serviceKey === "userState"
        );
        expect(userState?.interfaceType).toBe("AsyncState<UserServiceState>");
        expect(userState?.sanitizedKey).toBe("AsyncState_UserServiceState");
        expect(userState?.isOptional).toBe(false);

        const productState = dependencies.find(
          (d) => d.serviceKey === "productState"
        );
        expect(productState?.interfaceType).toBe(
          "AsyncState<ProductServiceState>"
        );
        expect(productState?.sanitizedKey).toBe(
          "AsyncState_ProductServiceState"
        );
        expect(productState?.isOptional).toBe(true);
      });

      it("When using inheritance markers, Then should handle base class types", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/InheritanceMarkers.tsx",
          MARKER_FIXTURES.INHERITANCE_MARKERS
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

        const notifications = dependencies.find(
          (d) => d.serviceKey === "notifications"
        );
        expect(notifications?.interfaceType).toBe(
          "AsyncState<NotificationData[]>"
        );
        expect(notifications?.sanitizedKey).toBe(
          "AsyncState_NotificationData_Array"
        );

        const userService = dependencies.find(
          (d) => d.serviceKey === "userService"
        );
        expect(userService?.interfaceType).toBe(
          "BaseService<UserServiceState>"
        );
        expect(userService?.sanitizedKey).toBe("BaseService_UserServiceState");
      });
    });
  });

  describe("Feature: Configuration and Performance", () => {
    describe("Given configuration management", () => {
      it("When getting source configuration, Then should return current settings", () => {
        // When
        const config = dependencyExtractor.getSourceConfiguration();

        // Then
        expect(config.markerSources).toContain("@tdi2/di-core/markers");
        expect(config.decoratorSources).toContain("@tdi2/di-core/decorators");
        expect(config.validateSources).toBe(true);
      });

      it("When clearing validation cache, Then should reset cached results", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/CacheTest.tsx",
          MARKER_FIXTURES.SINGLE_SERVICE_FUNCTION
        );
        const func = sourceFile.getFunctions()[0];
        const param = func.getParameters()[0];

        // When
        dependencyExtractor.extractDependenciesFromParameter(param, sourceFile); // Populate cache
        dependencyExtractor.clearValidationCache(); // Clear cache

        const dependencies =
          dependencyExtractor.extractDependenciesFromParameter(
            param,
            sourceFile
          ); // Re-extract

        // Then
        expect(dependencies).toHaveLength(1); // Should still work after cache clear
      });
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(2);
        
        const authService = dependencies.find(d => d.serviceKey === "auth");
        expect(authService?.interfaceType).toBe("AuthInterface");
        expect(authService?.isOptional).toBe(false);
        
        const notificationService = dependencies.find(d => d.serviceKey === "notifications");
        expect(notificationService?.interfaceType).toBe("NotificationInterface");
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(3); // debug, logger, cache from both variants
        
        const debugService = dependencies.find(d => d.serviceKey === "debug");
        expect(debugService?.interfaceType).toBe("DebugInterface");
        
        const loggerService = dependencies.find(d => d.serviceKey === "logger");
        expect(loggerService?.interfaceType).toBe("LoggerInterface");
        
        const cacheService = dependencies.find(d => d.serviceKey === "cache");
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
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
      it.skip("When using intersection types, Then should merge all service definitions", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/IntersectionTypes.tsx",
          ADDITIONAL_MARKER_FIXTURES.INTERSECTION_TYPE_SERVICES
        );
        const func = sourceFile.getFunctions()[0];
        const param = func.getParameters()[0];

        // When
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(3); // logger, cache, api from different intersected types
        
        const serviceKeys = dependencies.map(d => d.serviceKey);
        expect(serviceKeys).toContain("logger");
        expect(serviceKeys).toContain("cache");
        expect(serviceKeys).toContain("api");
      });
    });
  });

  describe("Feature: Array Type Service Injection", () => {
    describe("Given components with array-based service definitions", () => {
      it.skip("When using array of service objects, Then should extract from element type", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ArrayServices.tsx",
          ADDITIONAL_MARKER_FIXTURES.ARRAY_TYPE_SERVICES
        );
        const func = sourceFile.getFunctions()[0];
        const param = func.getParameters()[0];

        // When
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(1);
        expect(dependencies[0].serviceKey).toBe("processor");
        expect(dependencies[0].interfaceType).toBe("ProcessorInterface");
      });

      it.skip("When using nested arrays, Then should handle multi-dimensional structures", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/NestedArrays.tsx",
          ADDITIONAL_MARKER_FIXTURES.NESTED_ARRAY_SERVICES
        );
        const func = sourceFile.getFunctions()[0];
        const param = func.getParameters()[0];

        // When
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(1);
        expect(dependencies[0].serviceKey).toBe("processor");
        expect(dependencies[0].interfaceType).toBe("ProcessorInterface<string>");
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(2);
        
        const userService = dependencies.find(d => d.serviceKey === "userService");
        expect(userService?.interfaceType).toBe("UserServiceInterface");
        
        const productService = dependencies.find(d => d.serviceKey === "productService");
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(4); // userAuth, notifications, analytics, payments
        
        const serviceKeys = dependencies.map(d => d.serviceKey);
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
          param,
          sourceFile
        );

        // Then
        expect(dependencies).toHaveLength(3); // Should extract from all flag variants
        
        const serviceKeys = dependencies.map(d => d.serviceKey);
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
          const dependencies = dependencyExtractor.extractDependenciesFromParameter(
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
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
        const dependencies = dependencyExtractor.extractDependenciesFromParameter(
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
