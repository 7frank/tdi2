// tools/functional-di-enhanced-transformer/enhanced-marker.test.ts - ENHANCED marker tests with AST validation

import { describe, it, expect, beforeEach } from "vitest";
import { Project } from "ts-morph";
import { EnhancedDependencyExtractor } from "./enhanced-dependency-extractor";
import {
  MARKER_FIXTURES,
  ADDITIONAL_MARKER_FIXTURES,
} from "./fixtures/marker-approach";

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
      it("When interface defined in separate file, Then should resolve correctly", () => {
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
});
