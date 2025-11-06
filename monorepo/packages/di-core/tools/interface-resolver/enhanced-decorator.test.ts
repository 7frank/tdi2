// tools/interface-resolver/enhanced-decorator.test.ts - COMPLETE with comprehensive coverage

import { describe, it, expect, beforeEach } from "vitest";
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
  // Given - Create a class programmatically with ACTUAL multiple constructors
  const sourceFile = mockProject.createSourceFile(
    "src/MultipleConstructors.ts",
    `
import { Service, Inject } from "@tdi2/di-core/decorators";

export interface LoggerInterface {
  log(message: string): void;
}

@Service()
export class MultipleConstructorsService {
  private logger: LoggerInterface;
}
    `
  );
  
  const classDecl = sourceFile.getClasses()[0];
  
  // Force-add multiple constructor implementations using ts-morph API
  // This creates an invalid TypeScript class with actual multiple constructors
  classDecl.addConstructor({
    parameters: [{ 
      name: "logger", 
      type: "LoggerInterface",
      decorators: [{ name: "Inject" }]
    }],
    statements: ["this.logger = logger;"]
  });
  
  classDecl.addConstructor({
    parameters: [
      { 
        name: "logger", 
        type: "LoggerInterface",
        decorators: [{ name: "Inject" }]
      },
      {
        name: "config",
        type: "any"
      }
    ],
    statements: ["this.logger = logger;"]
  });

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
          { input: "BaseService<UserServiceState>", expected: "BaseService_UserServiceState" },
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
          "BaseService<UserServiceState>",
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
          DECORATOR_FIXTURES.BASE_SERVICE_INHERITANCE
        );
        const classDecl = sourceFile.getClasses()[1]; // UserService
        const extendedClasses = interfaceExtractor.getExtendedClasses(classDecl);

        // When & Then
        expect(interfaceExtractor.matchesInterfacePattern(extendedClasses[0], ["^Base.*Service.*$"])).toBe(true);
        expect(interfaceExtractor.matchesInterfacePattern(extendedClasses[0], ["^Async.*$"])).toBe(false);
      });
    });
  });

  describe("Feature: Comprehensive Service Analysis", () => {
    describe("Given full-featured services", () => {
      it("When analyzing service with all features, Then should provide complete information", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/FullFeatured.ts",
          DECORATOR_FIXTURES.IMPLEMENTS_AND_EXTENDS
        );
        const classDecl = sourceFile.getClasses()[1]; // ImplementsAndExtendsService

        // When
        const serviceValidation = serviceValidator.validateServiceWithSources(classDecl);
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);
        const metadata = interfaceExtractor.getExtractionMetadata(classDecl);

        // Then
        expect(serviceValidation.isValid).toBe(true);
        expect(serviceValidation.hasServiceDecorator).toBe(true);
        
        expect(heritage.implements).toHaveLength(1);
        expect(heritage.extends).toHaveLength(1);
        expect(heritage.all).toHaveLength(2);
        
        expect(metadata.className).toBe("ImplementsAndExtendsService");
        expect(metadata.implementsCount).toBe(1);
        expect(metadata.extendsCount).toBe(1);
        expect(metadata.totalInterfaces).toBe(2);
        expect(metadata.hasValidSources).toBe(true);
      });

      it("When checking interface matching on complex service, Then should handle all patterns", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/FullFeatured.ts",
          DECORATOR_FIXTURES.IMPLEMENTS_AND_EXTENDS
        );
        const classDecl = sourceFile.getClasses()[1]; // ImplementsAndExtendsService

        // When
        const hasInterfacePattern = interfaceExtractor.hasInterfaceMatching(classDecl, /Foo.*Interface/);
        const hasBasePattern = interfaceExtractor.hasInterfaceMatching(classDecl, "BaseClass");
        const hasGenericPattern = interfaceExtractor.hasInterfaceMatching(classDecl, /.*<.*>/);

        // Then
        expect(hasInterfacePattern).toBe(true);
        expect(hasBasePattern).toBe(true);
        expect(hasGenericPattern).toBe(true);
      });
    });
  });

  describe("Feature: Advanced AST Analysis", () => {
    describe("Given complex inheritance hierarchies", () => {
      it("When analyzing deep inheritance chain, Then should extract all levels", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/DeepInheritance.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export class GrandParent<T> {
  grandMethod(item: T): T { return item; }
}

export class Parent<T, U> extends GrandParent<T> {
  parentMethod(item: U): U { return item; }
}

export interface DeepInterface<V> {
  deepMethod(item: V): V;
}

@Service()
export class DeepService extends Parent<string, number> implements DeepInterface<boolean> {
  deepMethod(item: boolean): boolean { return item; }
}
          `
        );
        const classDecl = sourceFile.getClasses()[2]; // DeepService

        // When
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);

        // Then
        expect(heritage.implements).toHaveLength(1);
        expect(heritage.extends).toHaveLength(1);
        expect(heritage.all).toHaveLength(2);
        
        expect(heritage.implements[0].name).toBe("DeepInterface");
        expect(heritage.implements[0].typeParameters).toEqual(["boolean"]);
        
        expect(heritage.extends[0].name).toBe("Parent");
        expect(heritage.extends[0].typeParameters).toEqual(["string", "number"]);
      });

      it("When class has multiple generic constraints, Then should handle complex type parameters", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/GenericConstraints.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export interface Serializable {
  serialize(): string;
}

export interface Identifiable {
  id: string;
}

export interface Repository<T extends Serializable & Identifiable> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
}

export interface UserEntity extends Serializable, Identifiable {
  name: string;
  email: string;
}

@Service()
export class UserRepository implements Repository<UserEntity> {
  async save(entity: UserEntity): Promise<UserEntity> {
    return entity;
  }
  
  async findById(id: string): Promise<UserEntity | null> {
    return null;
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0]; // UserRepository

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("Repository");
        expect(interfaces[0].fullType).toBe("Repository<UserEntity>");
        expect(interfaces[0].isGeneric).toBe(true);
        expect(interfaces[0].typeParameters).toEqual(["UserEntity"]);
      });
    });

    describe("Given conditional and union types", () => {
      it("When interface uses conditional types, Then should extract base interface", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/ConditionalTypes.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export type ApiResponse<T> = T extends string ? { message: T } : { data: T };

export interface ConditionalInterface<T> {
  process(input: T): ApiResponse<T>;
}

@Service()
export class ConditionalService implements ConditionalInterface<string> {
  process(input: string): { message: string } {
    return { message: input };
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("ConditionalInterface");
        expect(interfaces[0].typeParameters).toEqual(["string"]);
      });

      it("When interface uses union types, Then should handle complex type expressions", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/UnionTypes.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export interface UnionInterface<T extends string | number | boolean> {
  handle(value: T): T;
}

@Service()
export class UnionService implements UnionInterface<string | number> {
  handle(value: string | number): string | number {
    return value;
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("UnionInterface");
        expect(interfaces[0].typeParameters).toEqual(["string | number"]);
      });
    });
  });

  describe("Feature: Decorator Composition and Metadata", () => {
    describe("Given services with multiple decorators", () => {
      it("When service has multiple valid decorators, Then should recognize primary service decorator", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/MultipleDecorators.ts",
          `
import { Service, Singleton, Primary } from "@tdi2/di-core/decorators";

export interface LoggerInterface {
  log(message: string): void;
}

@Service()
@Singleton()
@Primary()
export class MultiDecoratorLogger implements LoggerInterface {
  log(message: string): void {
    console.log(message);
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasServiceDecorator = serviceValidator.hasServiceDecorator(classDecl);
        const validation = serviceValidator.validateServiceWithSources(classDecl);

        // Then
        expect(hasServiceDecorator).toBe(true);
        expect(validation.isValid).toBe(true);
      });

      it("When decorators have parameters, Then should parse decorator arguments", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/DecoratorWithParams.ts",
          `
import { Service, Inject, Qualifier } from "@tdi2/di-core/decorators";

export interface DatabaseInterface {
  query(sql: string): Promise<any[]>;
}

export interface LoggerInterface {
  log(message: string): void;
}

@Service("UserService")
export class ParameterizedService {
  constructor(
    @Inject("primaryDatabase") 
    @Qualifier("mysql") 
    private database: DatabaseInterface,
    
    @Inject() 
    private logger: LoggerInterface
  ) {}
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];
        const constructor = classDecl.getConstructors()[0];
        const params = constructor.getParameters();

        // When
        const hasServiceDecorator = serviceValidator.hasServiceDecorator(classDecl);
        const firstParamHasInject = serviceValidator.hasInjectDecorator(params[0]);
        const secondParamHasInject = serviceValidator.hasInjectDecorator(params[1]);

        // Then
        expect(hasServiceDecorator).toBe(true);
        expect(firstParamHasInject).toBe(true);
        expect(secondParamHasInject).toBe(true);
      });
    });

    describe("Given complex decorator scenarios", () => {
      it("When decorator is imported with alias, Then should still recognize it", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/AliasedDecorator.ts",
          `
import { Service as DIService } from "@tdi2/di-core/decorators";

@DIService()
export class AliasedDecoratorService {
  doSomething(): void {}
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const hasServiceDecorator = serviceValidator.hasServiceDecorator(classDecl);

        // Then
        expect(hasServiceDecorator).toBe(true);
      });

      it("When using namespace imports, Then should recognize decorators", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/NamespaceImport.ts",
          `
import * as DI from "@tdi2/di-core/decorators";

@DI.Service()
export class NamespaceDecoratorService {
  constructor(@DI.Inject() private dependency: any) {}
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];
        const constructor = classDecl.getConstructors()[0];
        const param = constructor.getParameters()[0];

        // When
        const hasServiceDecorator = serviceValidator.hasServiceDecorator(classDecl);
        const hasInjectDecorator = serviceValidator.hasInjectDecorator(param);

        // Then
        expect(hasServiceDecorator).toBe(true);
        expect(hasInjectDecorator).toBe(true);
      });
    });
  });

  describe("Feature: Advanced Validation Scenarios", () => {
    describe("Given edge cases in service definitions", () => {
      it("When service extends class and implements interface with same name, Then should handle gracefully", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/SameNamePattern.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export class Logger {
  baseLog(message: string): void {
    console.log(message);
  }
}

export interface Logger {
  log(message: string): void;
}

@Service()
export class LoggerService extends Logger implements Logger {
  log(message: string): void {
    this.baseLog(message);
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[1]; // LoggerService

        // When
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);

        // Then
        expect(heritage.implements).toHaveLength(1);
        expect(heritage.extends).toHaveLength(1);
        expect(heritage.implements[0].name).toBe("Logger");
        expect(heritage.extends[0].name).toBe("Logger");
      });

      it("When service has generic class with interface constraints, Then should extract type information", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/GenericConstraints.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export interface Validatable {
  validate(): boolean;
}

export interface Processable<T> {
  process(item: T): T;
}

@Service()
export class GenericProcessor<T extends Validatable> implements Processable<T> {
  process(item: T): T {
    if (item.validate()) {
      return item;
    }
    throw new Error("Invalid item");
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("Processable");
        expect(interfaces[0].typeParameters).toEqual(["T"]);
      });
    });

    describe("Given circular reference scenarios", () => {
      it("When interfaces reference each other, Then should handle without infinite loops", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/CircularInterfaces.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export interface NodeInterface<T> {
  value: T;
  parent?: NodeInterface<T>;
  children: NodeInterface<T>[];
}

export interface TreeInterface<T> {
  root: NodeInterface<T>;
  find(value: T): NodeInterface<T> | null;
}

@Service()
export class TreeService<T> implements TreeInterface<T> {
  root!: NodeInterface<T>;
  
  find(value: T): NodeInterface<T> | null {
    return null;
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When & Then - Should not hang or throw
        expect(() => {
          const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);
          const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);
          const metadata = interfaceExtractor.getExtractionMetadata(classDecl);
        }).not.toThrow();
      });
    });
  });

  describe("Feature: Real-World Patterns Integration", () => {
    describe("Given common enterprise patterns", () => {
      it("When using Repository pattern with UnitOfWork, Then should extract all interfaces", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/EnterprisePattern.ts",
          `
import { Service, Inject } from "@tdi2/di-core/decorators";

export interface Entity {
  id: string;
}

export interface Repository<T extends Entity> {
  add(entity: T): void;
  remove(entity: T): void;
  findById(id: string): Promise<T | null>;
}

export interface UnitOfWork {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface UserEntity extends Entity {
  name: string;
  email: string;
}

@Service()
export class UserRepository implements Repository<UserEntity> {
  constructor(@Inject() private unitOfWork: UnitOfWork) {}
  
  add(entity: UserEntity): void {}
  remove(entity: UserEntity): void {}
  async findById(id: string): Promise<UserEntity | null> { return null; }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0]; // UserRepository

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);
        const constructor = classDecl.getConstructors()[0];
        const params = constructor.getParameters();

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("Repository");
        expect(interfaces[0].typeParameters).toEqual(["UserEntity"]);
        expect(serviceValidator.hasInjectDecorator(params[0])).toBe(true);
      });

      it("When using Factory pattern with BaseService, Then should handle complex service inheritance", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/FactoryWithService.ts",
          `
import { Service, Inject } from "@tdi2/di-core/decorators";

export class BaseService<T> {
  protected data: T | null = null;
  getData(): T | null { return this.data; }
  setData(newData: T): void { this.data = newData; }
}

export interface Factory<T> {
  create(...args: any[]): T;
}

export interface ProductData {
  products: any[];
  loading: boolean;
  error?: string;
}

export interface ProductFactory extends Factory<any> {
  createProduct(name: string): any;
}

@Service()
export class ProductService extends BaseService<ProductData> implements ProductFactory {
  constructor(@Inject() private logger: any) {
    super();
  }
  
  create(...args: any[]): any { return {}; }
  createProduct(name: string): any { return { name }; }
}
          `
        );
        const classDecl = sourceFile.getClasses()[1]; // ProductService

        // When
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);
        const extendedClasses = interfaceExtractor.getExtendedClasses(classDecl);
        const implementedInterfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(extendedClasses).toHaveLength(1);
        expect(extendedClasses[0].name).toBe("BaseService");
        expect(extendedClasses[0].typeParameters).toEqual(["ProductData"]);
        
        expect(implementedInterfaces).toHaveLength(1);
        expect(implementedInterfaces[0].name).toBe("ProductFactory");
        
        expect(heritage.all).toHaveLength(2);
      });
    });

    describe("Given microservice communication patterns", () => {
      it("When using Command/Query pattern with DI, Then should validate complex dependencies", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/CQRSPattern.ts",
          `
import { Service, Inject } from "@tdi2/di-core/decorators";

export interface Command<T> {
  execute(): Promise<T>;
}

export interface Query<T> {
  query(): Promise<T>;
}

export interface CommandBus {
  send<T>(command: Command<T>): Promise<T>;
}

export interface QueryBus {
  ask<T>(query: Query<T>): Promise<T>;
}

export interface CreateUserCommand extends Command<string> {
  userData: any;
}

export interface GetUserQuery extends Query<any> {
  userId: string;
}

@Service()
export class UserCommandHandler implements Command<string> {
  constructor(
    @Inject() private commandBus: CommandBus,
    @Inject() private queryBus: QueryBus
  ) {}
  
  async execute(): Promise<string> {
    return "user-id";
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0]; // UserCommandHandler

        // When
        const validation = serviceValidator.validateServiceWithSources(classDecl);
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);
        const constructor = classDecl.getConstructors()[0];
        const params = constructor.getParameters();

        // Then
        expect(validation.isValid).toBe(true);
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("Command");
        expect(interfaces[0].typeParameters).toEqual(["string"]);
        
        expect(params).toHaveLength(2);
        expect(serviceValidator.hasInjectDecorator(params[0])).toBe(true);
        expect(serviceValidator.hasInjectDecorator(params[1])).toBe(true);
      });
    });
  });

  describe("Feature: Cross-Feature Integration Tests", () => {
    describe("Given services using all DI features together", () => {
      it("When service combines interfaces, inheritance, and dependencies, Then should handle complete integration", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/FullIntegration.ts",
          `
import { Service, Inject } from "@tdi2/di-core/decorators";

export class BaseService<T> {
  protected data: T | null = null;
  getData(): T | null { return this.data; }
  setData(newData: T): void { this.data = newData; }
}

export interface Repository<T> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
}

export interface CacheInterface<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
}

export interface NotificationInterface {
  notify(message: string): void;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
}

export interface UserServiceData {
  currentUser?: UserData;
  users: UserData[];
  loading: boolean;
}

@Service()
export class UserService 
  extends BaseService<UserServiceData> 
  implements Repository<UserData> {
  
  constructor(
    @Inject() private cache: CacheInterface<UserData>,
    @Inject() private notifications: NotificationInterface
  ) {
    super();
    this.setData({
      users: [],
      loading: false
    });
  }
  
  async save(entity: UserData): Promise<UserData> {
    this.cache.set(entity.id, entity);
    this.notifications.notify(\`User \${entity.name} saved\`);
    return entity;
  }
  
  async findById(id: string): Promise<UserData | null> {
    return this.cache.get(id);
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[1]; // UserService

        // When
        const validation = serviceValidator.validateServiceWithSources(classDecl);
        const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);
        const metadata = interfaceExtractor.getExtractionMetadata(classDecl);

        // Then
        expect(validation.isValid).toBe(true);
        expect(validation.hasServiceDecorator).toBe(true);
        
        expect(heritage.extends).toHaveLength(1);
        expect(heritage.extends[0].name).toBe("BaseService");
        expect(heritage.extends[0].typeParameters).toEqual(["UserServiceData"]);
        
        expect(heritage.implements).toHaveLength(1);
        expect(heritage.implements[0].name).toBe("Repository");
        expect(heritage.implements[0].typeParameters).toEqual(["UserData"]);
        
        expect(metadata.totalInterfaces).toBe(2);
        expect(metadata.hasValidSources).toBe(true);
        
        const constructor = classDecl.getConstructors()[0];
        const params = constructor.getParameters();
        expect(params).toHaveLength(2);
        expect(params.every(p => serviceValidator.hasInjectDecorator(p))).toBe(true);
      });
    });
  });

  describe("Feature: Regression Prevention", () => {
    describe("Given previously problematic scenarios", () => {
      it("When AST parsing encounters unexpected node types, Then should handle gracefully", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/UnexpectedNodes.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

// Edge case: computed property names, decorators on getters, etc.
@Service()
export class EdgeCaseService {
  private static instance: EdgeCaseService;
  
  static getInstance(): EdgeCaseService {
    return EdgeCaseService.instance ||= new EdgeCaseService();
  }
  
  @deprecated
  get computedProp() {
    return "computed";
  }
  
  ["dynamicMethod"]() {
    return "dynamic";
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When & Then - Should not throw despite unusual patterns
        expect(() => {
          const hasServiceDecorator = serviceValidator.hasServiceDecorator(classDecl);
          const heritage = interfaceExtractor.getAllHeritageInfo(classDecl);
          const validation = serviceValidator.validateServiceWithSources(classDecl);
        }).not.toThrow();
      });

      it("When generic types have very deep nesting, Then should handle without stack overflow", () => {
        // Given
        const sourceFile = mockProject.createSourceFile(
          "src/DeepNesting.ts",
          `
import { Service } from "@tdi2/di-core/decorators";

export interface Wrapper<T> {
  value: T;
}

export interface DeepGeneric<T> {
  process(item: Wrapper<Wrapper<Wrapper<Wrapper<T>>>>): T;
}

@Service()
export class DeepNestingService implements DeepGeneric<string> {
  process(item: Wrapper<Wrapper<Wrapper<Wrapper<string>>>>): string {
    return item.value.value.value.value;
  }
}
          `
        );
        const classDecl = sourceFile.getClasses()[0];

        // When
        const interfaces = interfaceExtractor.getImplementedInterfaces(classDecl);

        // Then
        expect(interfaces).toHaveLength(1);
        expect(interfaces[0].name).toBe("DeepGeneric");
        expect(interfaces[0].typeParameters).toEqual(["string"]);
      });
    });
  });
});