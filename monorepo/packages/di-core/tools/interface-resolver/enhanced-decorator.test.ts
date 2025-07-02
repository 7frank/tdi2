// tools/interface-resolver/enhanced-decorator.test.ts - RECREATED with comprehensive coverage

import { describe, it, expect, beforeEach } from "bun:test";
import { Project } from "ts-morph";
import { EnhancedInterfaceExtractor } from "./enhanced-interface-extractor";
import { EnhancedServiceValidator } from "./enhanced-service-validator";
import { KeySanitizer } from "./key-sanitizer";
import { DECORATOR_FIXTURES } from "./fixtures/decorator-approach";

describe("Enhanced Decorator Approach - Comprehensive Tests", () => {
  let mockProject: Project;
  let interfaceExtractor: EnhancedInterfaceExtractor;
  let serviceValidator: EnhancedServiceValidator;
  let keySanitizer: KeySanitizer;

  beforeEach(() => {
    mockProject = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: 99, // Latest
      },
    });

    keySanitizer = new KeySanitizer();
    interfaceExtractor = new EnhancedInterfaceExtractor(keySanitizer, false);
    serviceValidator = new EnhancedServiceValidator(false);
  });

  describe("Feature: Standalone Service Classes", () => {
    describe("Given class with @Service decorator only", () => {
      it("When class has no interfaces or inheritance, Then should validate as standalone service", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/StandaloneService.ts",
          DECORATOR_FIXTURES.STANDALONE_CLASS
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasServiceDecorator = serviceValidator.hasServiceDecorator(classDecl);
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);

        // Then
        expect(hasServiceDecorator).toBe(true);
        expect(heritage.implements).toHaveLength(0);
        expect(heritage.extends).toHaveLength(0);
        expect(heritage.all).toHaveLength(0);
      });
    });
  });

  describe("Feature: Simple Interface Implementation", () => {
    describe("Given class implementing single interface", () => {
      it("When using implements clause, Then should extract interface via AST", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/SimpleInterface.ts",
          DECORATOR_FIXTURES.SIMPLE_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("FooInterface");
        expect(interfaces[0].fullType).toBe("FooInterface");
        expect(interfaces[0].isGeneric).toBe(false);
        expect(interfaces[0].typeParameters).toEqual([]);
      });

      it("When validating service with interface, Then should pass all validations", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/SimpleInterface.ts",
          DECORATOR_FIXTURES.SIMPLE_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const validation = serviceValidator.validateServiceWithSources(classDecl);

        // Then
        expect(validation.isValid).toBe(true);
        expect(validation.hasServiceDecorator).toBe(true);
        expect(validation.decoratorFromValidSource).toBe(true);
        expect(validation.issues).toHaveLength(0);
      });
    });
  });

  describe("Feature: Generic Interface Implementation", () => {
    describe("Given class implementing generic interface", () => {
      it("When interface has type parameters, Then should extract using AST type arguments", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/GenericInterface.ts",
          DECORATOR_FIXTURES.GENERIC_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("FooInterface");
        expect(interfaces[0].fullType).toBe("FooInterface<string, number>");
        expect(interfaces[0].isGeneric).toBe(true);
        expect(interfaces[0].typeParameters).toEqual(["string", "number"]);
      });

      it("When sanitizing generic interface key, Then should handle type parameters correctly", () => {
        // Given
        const interfaceType = "FooInterface<string, number>";

        // When
        const sanitizedKey = keySanitizer.sanitizeKey(interfaceType);

        // Then
        expect(sanitizedKey).toBe("FooInterface_string_number");
      });
    });
  });

  describe("Feature: Base Class Extension", () => {
    describe("Given class extending base class", () => {
      it("When using extends clause, Then should extract extended class via AST", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/BaseClassExtension.ts",
          DECORATOR_FIXTURES.BASE_CLASS_EXTENDS
        );
        const classDecl = sourceFile.getClasses()[1]; // Second class (extending)

        // When
        const extendedClasses = interfaceExtractor.getExtendedClasses(classDecl);

        // Then
        expect(extendedClasses).toHaveLength(1);
        expect(extendedClasses[0].name).toBe("BaseClass");
        expect(extendedClasses[0].fullType).toBe("BaseClass");
        expect(extendedClasses[0].isGeneric).toBe(false);
      });
    });
  });

  describe("Feature: Generic Base Class Extension", () => {
    describe("Given class extending generic base class", () => {
      it("When base class has type parameters, Then should extract type arguments", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/GenericBaseClass.ts",
          DECORATOR_FIXTURES.GENERIC_BASE_CLASS
        );
        const classDecl = sourceFile.getClasses()[1]; // Second class (extending)

        // When
        const extendedClasses = interfaceExtractor.getExtendedClasses(classDecl);

        // Then
        expect(extendedClasses).toHaveLength(1);
        expect(extendedClasses[0].name).toBe("BaseClass");
        expect(extendedClasses[0].fullType).toBe("BaseClass<string, number>");
        expect(extendedClasses[0].isGeneric).toBe(true);
        expect(extendedClasses[0].typeParameters).toEqual(["string", "number"]);
      });

      it("When sanitizing inheritance key, Then should use inheritance-specific logic", () => {
        // Given
        const inheritanceType = "BaseClass<string, number>";

        // When
        const sanitizedKey = keySanitizer.sanitizeInheritanceKey(inheritanceType);

        // Then
        expect(sanitizedKey).toMatch(/^[a-zA-Z0-9_]+$/);
        expect(sanitizedKey).toContain("BaseClass");
        expect(sanitizedKey).toContain("string");
        expect(sanitizedKey).toContain("number");
      });
    });
  });

  describe("Feature: Combined Implements and Extends", () => {
    describe("Given class with both implements and extends", () => {
      it("When class has both heritage types, Then should extract all via AST", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ImplementsAndExtends.ts",
          DECORATOR_FIXTURES.IMPLEMENTS_AND_EXTENDS
        );
        const classDecl = sourceFile.getClasses()[1]; // Service class

        // When
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);

        // Then
        expect(heritage.implements).toHaveLength(1);
        expect(heritage.extends).toHaveLength(1);
        expect(heritage.all).toHaveLength(2);
        
        expect(heritage.implements[0].name).toBe("FooInterface");
        expect(heritage.implements[0].fullType).toBe("FooInterface<number>");
        
        expect(heritage.extends[0].name).toBe("BaseClass");
        expect(heritage.extends[0].fullType).toBe("BaseClass<string>");
      });

      it("When checking extraction metadata, Then should report comprehensive information", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ImplementsAndExtends.ts",
          DECORATOR_FIXTURES.IMPLEMENTS_AND_EXTENDS
        );
        const classDecl = sourceFile.getClasses()[1]; // Service class

        // When
        const metadata = interfaceExtractor.getExtractionMetadata(classDecl);

        // Then
        expect(metadata.className).toBe("ImplementsAndExtendsService");
        expect(metadata.implementsCount).toBe(1);
        expect(metadata.extendsCount).toBe(1);
        expect(metadata.totalInterfaces).toBe(2);
        expect(metadata.hasValidSources).toBe(true);
      });
    });
  });

  describe("Feature: Multiple Interface Implementation", () => {
    describe("Given class implementing multiple interfaces", () => {
      it("When multiple implements clauses, Then should extract all interfaces", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/MultipleInterfaces.ts",
          DECORATOR_FIXTURES.MULTIPLE_INTERFACES
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(2);
        
        const interfaceNames = interfaces.map(i => i.name);
        expect(interfaceNames).toContain("FooInterface");
        expect(interfaceNames).toContain("BarInterface");
        
        expect(interfaces.every(i => !i.isGeneric)).toBe(true);
      });
    });
  });

  describe("Feature: Nested Generic Interface Implementation", () => {
    describe("Given class implementing complex nested generics", () => {
      it("When interface has nested type parameters, Then should handle complex AST structure", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/NestedGeneric.ts",
          DECORATOR_FIXTURES.NESTED_GENERIC_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("FooInterface");
        expect(interfaces[0].fullType).toBe("FooInterface<string>");
        expect(interfaces[0].isGeneric).toBe(true);
        expect(interfaces[0].typeParameters).toEqual(["string"]);
      });

      it("When using complex nested pattern matching, Then should identify patterns correctly", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/NestedGeneric.ts",
          DECORATOR_FIXTURES.NESTED_GENERIC_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasComplexPattern = interfaceExtractor.hasInterfaceMatching(classDecl, /Foo.*Interface/);

        // Then
        expect(hasComplexPattern).toBe(true);
      });
    });
  });

  describe("Feature: AsyncState Inheritance Pattern", () => {
    describe("Given class extending AsyncState with state type", () => {
      it("When AsyncState pattern detected, Then should extract state information via AST", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/AsyncStateInheritance.ts",
          DECORATOR_FIXTURES.ASYNC_STATE_INHERITANCE
        );
        const classDecl = sourceFile.getClasses()[1]; // UserService

        // When
        const extendedClasses = interfaceExtractor.getExtendedClasses(classDecl);

        // Then
        expect(extendedClasses).toHaveLength(1);
        expect(extendedClasses[0].name).toBe("AsyncState");
        expect(extendedClasses[0].fullType).toBe("AsyncState<UserServiceState>");
        expect(extendedClasses[0].isGeneric).toBe(true);
        expect(extendedClasses[0].typeParameters).toEqual(["UserServiceState"]);
      });

      it("When sanitizing AsyncState key, Then should handle state type correctly", () => {
        // Given
        const asyncStateType = "AsyncState<UserServiceState>";

        // When
        const sanitizedKey = keySanitizer.sanitizeKey(asyncStateType);

        // Then
        expect(sanitizedKey).toBe("AsyncState_UserServiceState");
      });

      it("When checking for AsyncState pattern, Then should match via pattern matching", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/AsyncStateInheritance.ts",
          DECORATOR_FIXTURES.ASYNC_STATE_INHERITANCE
        );
        const classDecl = sourceFile.getClasses()[1]; // UserService

        // When
        const matchesAsyncState = interfaceExtractor.matchesInterfacePattern(
          interfaceExtractor.getExtendedClasses(classDecl)[0],
          ["AsyncState*", "*State*"]
        );

        // Then
        expect(matchesAsyncState).toBe(true);
      });
    });
  });

  describe("Feature: Complex State Service Pattern", () => {
    describe("Given state service with complex state types", () => {
      it("When state type contains object structures, Then should handle via AST", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ComplexStateService.ts",
          DECORATOR_FIXTURES.COMPLEX_STATE_SERVICE
        );
        const classDecl = sourceFile.getClasses()[1]; // CartService

        // When
        const extendedClasses = interfaceExtractor.getExtendedClasses(classDecl);

        // Then
        expect(extendedClasses).toHaveLength(1);
        expect(extendedClasses[0].name).toBe("AsyncState");
        expect(extendedClasses[0].fullType).toBe("AsyncState<CartState>");
        expect(extendedClasses[0].isGeneric).toBe(true);
        expect(extendedClasses[0].typeParameters).toEqual(["CartState"]);
      });
    });
  });

  describe("Feature: Service Dependencies with @Inject", () => {
    describe("Given constructor parameters with @Inject decorators", () => {
      it("When parameters have valid @Inject decorators, Then should validate via AST", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ServiceWithDependencies.ts",
          DECORATOR_FIXTURES.WITH_DEPENDENCIES
        );
        const classDecl = sourceFile.getClasses()[0];
        const constructor = classDecl.getConstructors()[0];
        const params = constructor.getParameters();

        // When
        const firstParamValid = serviceValidator.hasInjectDecorator(params[0]);
        const secondParamValid = serviceValidator.hasInjectDecorator(params[1]);

        // Then
        expect(firstParamValid).toBe(true);
        expect(secondParamValid).toBe(true);
      });

      it("When validating parameter with sources, Then should provide detailed feedback", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ServiceWithDependencies.ts",
          DECORATOR_FIXTURES.WITH_DEPENDENCIES
        );
        const classDecl = sourceFile.getClasses()[0];
        const constructor = classDecl.getConstructors()[0];
        const firstParam = constructor.getParameters()[0];

        // When
        const paramValidation = serviceValidator.validateInjectParameterWithSources(firstParam);

        // Then
        expect(paramValidation.isValid).toBe(true);
        expect(paramValidation.hasInjectDecorator).toBe(true);
        expect(paramValidation.decoratorFromValidSource).toBe(true);
        expect(paramValidation.issues).toHaveLength(0);
      });

      it("When validating full service with dependencies, Then should pass comprehensive validation", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ServiceWithDependencies.ts",
          DECORATOR_FIXTURES.WITH_DEPENDENCIES
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const validation = serviceValidator.validateServiceWithSources(classDecl);

        // Then
        expect(validation.isValid).toBe(true);
        expect(validation.hasServiceDecorator).toBe(true);
        expect(validation.decoratorFromValidSource).toBe(true);
        expect(validation.issues).toHaveLength(0);
        expect(validation.suggestions).toHaveLength(0);
      });
    });
  });

  describe("Feature: Source Validation", () => {
    describe("Given decorators from different sources", () => {
      it("When decorator from valid source, Then should validate successfully", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ValidSource.ts",
          DECORATOR_FIXTURES.SIMPLE_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasValidDecorator = serviceValidator.hasServiceDecorator(classDecl);

        // Then
        expect(hasValidDecorator).toBe(true);
      });

      it("When decorator from invalid source, Then should reject", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/InvalidSource.ts",
          DECORATOR_FIXTURES.INVALID_SOURCE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasValidDecorator = serviceValidator.hasServiceDecorator(classDecl);

        // Then
        expect(hasValidDecorator).toBe(false);
      });

      it("When no decorator present, Then should return false", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/NoDecorator.ts",
          DECORATOR_FIXTURES.NO_DECORATOR
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasValidDecorator = serviceValidator.hasServiceDecorator(classDecl);

        // Then
        expect(hasValidDecorator).toBe(false);
      });

      it("When updating source configuration, Then should affect validation", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/CustomSource.ts",
          `
import { Service } from "custom-package/decorators";

@Service()
export class CustomSourceService {}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When - Before config update
        const beforeUpdate = serviceValidator.hasServiceDecorator(classDecl);
        
        // Update config to include new source
        serviceValidator.updateSourceConfiguration({
          decoratorSources: ["custom-package/decorators"]
        });
        
        const afterUpdate = serviceValidator.hasServiceDecorator(classDecl);

        // Then
        expect(beforeUpdate).toBe(false); // Not valid with original config
        expect(afterUpdate).toBe(true);   // Valid with updated config
      });

      it("When disabling source validation, Then should accept any source", () => {
        // Given
        const permissiveValidator = new EnhancedServiceValidator(false, {
          validateSources: false
        });

        const sourceFile = mockProject.createSourceFile(
          "src/AnySource.ts",
          DECORATOR_FIXTURES.INVALID_SOURCE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasValidDecorator = permissiveValidator.hasServiceDecorator(classDecl);

        // Then
        expect(hasValidDecorator).toBe(true);
      });
    });
  });

  describe("Feature: Error Handling and Edge Cases", () => {
    describe("Given problematic constructor scenarios", () => {
      it("When class has multiple constructors, Then should flag as issue", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/MultipleConstructors.ts",
          DECORATOR_FIXTURES.MULTIPLE_CONSTRUCTORS
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const validation = serviceValidator.validateServiceWithSources(classDecl);

        // Then
        expect(validation.isValid).toBe(false);
        expect(validation.issues.some(issue => 
          issue.includes('multiple constructors')
        )).toBe(true);
      });
    });

    describe("Given malformed or problematic classes", () => {
      it("When class has syntax issues, Then should handle gracefully", () => {
        // Given - Create a class with potential parsing issues
        const sourceFile = mockProject.createSourceFile(
          "src/ProblematicClass.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

@Service()
export class ProblematicClass {
  // Intentionally incomplete for testing
}
          `
        );

        // When & Then - Should not throw
        expect(() => {
          const classDecl = sourceFile.getClasses()[0];
          const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);
          const hasDecorator = serviceValidator.hasServiceDecorator(classDecl);
        }).not.toThrow();
      });

      it("When processing empty heritage clauses, Then should return empty results", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/StandaloneClass.ts",
          DECORATOR_FIXTURES.STANDALONE_CLASS
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);

        // Then
        expect(heritage.implements).toHaveLength(0);
        expect(heritage.extends).toHaveLength(0);
        expect(heritage.all).toHaveLength(0);
      });
    });
  });

  describe("Feature: Performance and Caching", () => {
    describe("Given repeated validation operations", () => {
      it("When validating same decorator multiple times, Then should use cache", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/CachingTest.ts",
          DECORATOR_FIXTURES.SIMPLE_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When - Validate multiple times
        const result1 = serviceValidator.hasServiceDecorator(classDecl);
        const result2 = serviceValidator.hasServiceDecorator(classDecl);
        const result3 = serviceValidator.hasServiceDecorator(classDecl);

        // Then
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
        expect(result1).toBe(true);

        // Check cache stats
        const stats = serviceValidator.getValidationStats();
        expect(stats.cacheSize).toBeGreaterThan(0);
        expect(stats.sourceValidationEnabled).toBe(true);
      });

      it("When clearing cache, Then should rebuild validation results", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/CacheClearTest.ts",
          DECORATOR_FIXTURES.SIMPLE_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        serviceValidator.hasServiceDecorator(classDecl); // Populate cache
        const statsBefore = serviceValidator.getValidationStats();
        
        serviceValidator.clearValidationCache(); // Clear cache
        const statsAfter = serviceValidator.getValidationStats();

        // Then
        expect(statsBefore.cacheSize).toBeGreaterThan(0);
        expect(statsAfter.cacheSize).toBe(0);
      });
    });
  });

  describe("Feature: Configuration Management", () => {
    describe("Given source configuration scenarios", () => {
      it("When getting source configuration, Then should return current settings", () => {
        // When
        const config = serviceValidator.getSourceConfiguration();

        // Then
        expect(config.decoratorSources).toContain("@tdi2/di-core/decorators");
        expect(config.markerSources).toContain("@tdi2/di-core/markers");
        expect(config.validateSources).toBe(true);
      });

      it("When updating extractor source config, Then should affect validation", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ExtractorConfigTest.ts",
          `
import { Service } from "custom-extractor-package/decorators";

@Service()
export class ExtractorConfigTestService {}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When - Update extractor config
        interfaceExtractor.updateSourceConfiguration({
          decoratorSources: ["custom-extractor-package/decorators"]
        });
        
        const extUpdatedConfig = interfaceExtractor.getSourceConfiguration();
        const hasValidDecorator = serviceValidator.hasServiceDecorator(classDecl);

        // Then
        expect(extUpdatedConfig.decoratorSources).toContain("custom-extractor-package/decorators");
        // Note: serviceValidator still has old config, so this should be false
        expect(hasValidDecorator).toBe(false);
      });
    });
  });

  describe("Feature: Key Sanitization Integration", () => {
    describe("Given complex type names", () => {
      it("When sanitizing interface names from AST, Then should handle all patterns", () => {
        // Given
        const testCases = [
          { input: "FooInterface", expected: "FooInterface" },
          { input: "FooInterface<string, number>", expected: "FooInterface_string_number" },
          { input: "AsyncState<UserServiceState>", expected: "AsyncState_UserServiceState" },
          { input: "Repository<User>", expected: "Repository_User" },
          { input: "CacheInterface<Map<string, Data>>", expected: "CacheInterface_Map_string_Data" }
        ];

        // When & Then
        testCases.forEach(({ input, expected }) => {
          const sanitized = keySanitizer.sanitizeKey(input);
          expect(sanitized).toBe(expected);
        });
      });

      it("When handling inheritance keys, Then should use appropriate sanitization", () => {
        // Given
        const testCases = [
          "AsyncState<UserServiceState>",
          "BaseService<ConfigData>",
          "Repository<ProductEntity>"
        ];

        // When & Then
        testCases.forEach(inheritanceType => {
          const sanitized = keySanitizer.sanitizeInheritanceKey(inheritanceType);
          expect(sanitized).toMatch(/^[a-zA-Z0-9_]+$/); // Valid identifier
          expect(sanitized.length).toBeGreaterThan(0);
        });
      });

      it("When validating sanitized keys, Then should ensure valid identifiers", () => {
        // Given
        const testKeys = [
          "ValidName",
          "_validName",
          "valid123",
          "123invalid", // Should be fixed
          "invalid-name", // Should be fixed
          "" // Should be fixed
        ];

        // When & Then
        testKeys.forEach(key => {
          const ensuredValid = keySanitizer.ensureValidIdentifier(key);
          expect(keySanitizer.isValidIdentifier(ensuredValid)).toBe(true);
        });
      });
    });
  });

  describe("Feature: Pattern Matching", () => {
    describe("Given interface pattern matching capabilities", () => {
      it("When using wildcard patterns, Then should match correctly", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/PatternTest.ts",
          DECORATOR_FIXTURES.SIMPLE_INTERFACE
        );
        const classDecl = sourceFile.getClasses()[0];
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // When & Then
        expect(interfaceExtractor.matchesInterfacePattern(interfaces[0], ["Foo*"])).toBe(true);
        expect(interfaceExtractor.matchesInterfacePattern(interfaces[0], ["*Interface"])).toBe(true);
        expect(interfaceExtractor.matchesInterfacePattern(interfaces[0], ["Bar*"])).toBe(false);
      });

      it("When using regex patterns, Then should match correctly", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/RegexPatternTest.ts",
          DECORATOR_FIXTURES.ASYNC_STATE_INHERITANCE
        );
        const classDecl = sourceFile.getClasses()[1]; // UserService
        const extendedClasses = interfaceExtractor.getExtendedClasses(classDecl);

        // When & Then
        expect(interfaceExtractor.matchesInterfacePattern(extendedClasses[0], ["^Async.*State.*$"])).toBe(true);
        expect(interfaceExtractor.matchesInterfacePattern(extendedClasses[0], ["^Base.*$"])).toBe(false);
      });
    });
  });

//   describe("Feature: Comprehensive Service Analysis", () => {
//     describe("Given full-featured services", () => {
//       it("When analyzing service with all features, Then should provide complete information", () => {
//         // Given
//         const sourceFile = mockProject.createSourceFile(
//           "src/FullFeatured.ts",
//           DECORATOR_FIXTURES.IMPLEMENTS_AND_EXTENDS
//         );
//         const classDecl = sourceFile.getClasses()[1]; // ImplementsAndExtendsService

//         // When
//         const serviceValidation = serviceValidator.validateServiceWithSources(classDecl);
//         const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);
//         const metadata = interfaceExtractor.getExtractionMetadata(classDecl);

//         // Then
//         expect(serviceValidation.isValid).toBe(true);
//         expect(serviceValidation.hasServiceDecorator).toBe(true);
        
//         expect(heritage.implements).toHaveLength(1);
//         expect(heritage.extends).toHaveLength(1);
//         expect(heritage.all).toHaveLength(2);
        
//         expect(metadata.className).toBe("ImplementsAndExtendsService");
//         expect(metadata.implementsCount).toBe(1);
//         expect(metadata.extendsCount).toBe(1);
//         expect(metadata.totalInterfaces).toBe(2);
//         expect(metadata.hasValidSources).toBe(true);
//       });

//       it("When checking interface matching on complex service, Then should handle all patterns", () => {
//         // Given
//         const sourceFile = mockProject.createSourceFile(
//           "src/FullFeatured.ts",
//           DECORATOR_FIXTURES.IMPLEMENTS_AND_EXTENDS