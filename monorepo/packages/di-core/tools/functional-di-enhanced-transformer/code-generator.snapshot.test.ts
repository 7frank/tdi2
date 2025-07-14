// tools/functional-di-enhanced-transformer/code-generator.snapshot.test.ts

import { describe, it, expect, beforeEach } from "bun:test";
import { Project } from "ts-morph";
import { FunctionalDIEnhancedTransformer } from "./functional-di-enhanced-transformer";
import { expectToMatchCodeSnapshot } from "./test-utils/expectToMatchCodeSnapshot";

// Simple test fixtures following Animal/Dog pattern
const TEST_COMPONENTS = {
  SIMPLE_ANIMAL: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export function AnimalComponent(props: {
  name: string;
  services: {
    animal: Inject<AnimalInterface>;
  };
}) {
  const { name, services } = props;
  
  const handleClick = () => {
    console.log(services.animal.speak());
  };
  
  return (
    <div>
      <h1>{name}</h1>
      <p>Animal: {services.animal.getName()}</p>
      <button onClick={handleClick}>Make Sound</button>
    </div>
  );
}
`,

  MULTI_ANIMAL: `
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export function PetShopComponent(props: {
  shopName: string;
  services: {
    dog: Inject<AnimalInterface>;
    cat: Inject<AnimalInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { shopName, services } = props;
  
  const showPets = () => {
    services.logger?.log('Showing pets');
    console.log('Dog says:', services.dog.speak());
    console.log('Cat says:', services.cat.speak());
  };
  
  return (
    <div>
      <h1>{shopName}</h1>
      <button onClick={showPets}>Show All Pets</button>
    </div>
  );
}
`,

  ARROW_ANIMAL: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export const QuickAnimalComponent = (props: {
  title: string;
  services: {
    animal: Inject<AnimalInterface>;
  };
}) => {
  const { title, services } = props;
  return <div>{title}: {services.animal.getName()}</div>;
};
`,

  MIXED_SERVICES: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export function MixedPetComponent(props: {
  title: string;
  services: {
    animal: Inject<AnimalInterface>;  // DI service
    utils: UtilityService;            // Non-DI service
    config: ConfigService;            // Non-DI service
  };
}) {
  const { title, services } = props;
  return <div>{title}: {services.animal.getName()}</div>;
}
`,

  OPTIONAL_MISSING: `
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export function OptionalMissingComponent(props: {
  name: string;
  services: {
    animal: Inject<AnimalInterface>;
    logger?: InjectOptional<MissingLoggerInterface>;
    analytics?: InjectOptional<MissingAnalyticsInterface>;
  };
}) {
  const { name, services } = props;
  
  React.useEffect(() => {
    services.logger?.log('Component mounted');
    services.analytics?.track('page_view');
  }, []);
  
  return <div>Hello {name}: {services.animal.getName()}</div>;
}
`,

  DEEP_DESTRUCTURING: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export function DeepDestructuringComponent(props: {
  user: {
    profile: {
      settings: { theme: string; lang: string };
      preferences: { notifications: boolean };
    };
    metadata: { lastLogin: Date };
  };
  services: {
    animal: Inject<AnimalInterface>;
  };
}) {
  const { 
    user: { 
      profile: { 
        settings: { theme, lang },
        preferences: { notifications }
      },
      metadata: { lastLogin }
    }, 
    services 
  } = props;
  
  return (
    <div className={theme}>
      <p>Language: {lang}</p>
      <p>Notifications: {notifications ? 'On' : 'Off'}</p>
      <p>Last login: {lastLogin.toISOString()}</p>
      <p>Animal: {services.animal.getName()}</p>
    </div>
  );
}
`,

  NO_SERVICES: `
import React from 'react';

export function NoServicesComponent(props: {
  message: string;
  onClick?: () => void;
}) {
  return (
    <div onClick={props.onClick}>
      {props.message}
    </div>
  );
}
`,

  SEPARATE_INTERFACE_PROPS: `
import type { Inject } from "@tdi2/di-core/markers";

export interface PetComponentProps {
  petName: string;
  services: {
    animal: Inject<AnimalInterface>;
  };
}
`,

  SEPARATE_INTERFACE_COMPONENT: `
import React from 'react';
import type { PetComponentProps } from './PetComponentProps';

export function SeparateInterfaceComponent(props: PetComponentProps) {
  const { petName, services } = props;
  
  return (
    <div>
      <h2>{petName}</h2>
      <p>{services.animal.speak()}</p>
    </div>
  );
}
`
};

// Supporting interfaces
const SUPPORTING_FILES = {
  DI_MARKERS: `
export type Inject<T> = T & {
  readonly __inject__: unique symbol;
};

export type InjectOptional<T> = T & {
  readonly __injectOptional__: unique symbol;
};
`,

  ANIMAL_INTERFACE: `
export interface AnimalInterface {
  speak(): string;
  getName(): string;
}
`,

  LOGGER_INTERFACE: `
export interface LoggerInterface {
  log(message: string): void;
  error(message: string): void;
}
`,

  DOG_SERVICE: `
import { AnimalInterface } from './AnimalInterface';

export class DogService implements AnimalInterface {
  speak(): string {
    return "Woof!";
  }
  
  getName(): string {
    return "Dog";
  }
}
`,

  CONSOLE_LOGGER: `
import { LoggerInterface } from './LoggerInterface';

export class ConsoleLogger implements LoggerInterface {
  log(message: string): void {
    console.log(message);
  }
  
  error(message: string): void {
    console.error(message);
  }
}
`
};

describe("Code Generator Snapshot Tests", () => {
  let transformer: FunctionalDIEnhancedTransformer;
  let project: Project;

  beforeEach(() => {
    transformer = new FunctionalDIEnhancedTransformer({
      srcDir: "./src",
      outputDir: "./src/generated",
      verbose: false,
    });

    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        jsx: 1,
      },
    });

    // Add supporting files
    project.createSourceFile("src/di/markers.ts", SUPPORTING_FILES.DI_MARKERS);
    project.createSourceFile("src/AnimalInterface.ts", SUPPORTING_FILES.ANIMAL_INTERFACE);
    project.createSourceFile("src/LoggerInterface.ts", SUPPORTING_FILES.LOGGER_INTERFACE);
    project.createSourceFile("src/DogService.ts", SUPPORTING_FILES.DOG_SERVICE);
    project.createSourceFile("src/ConsoleLogger.ts", SUPPORTING_FILES.CONSOLE_LOGGER);

    // Mock the project and interface resolver
    (transformer as any).project = project;
    (transformer as any).interfaceResolver = {
      scanProject: () => Promise.resolve(),
      resolveImplementation: (interfaceType: string) => {
        const implementations: any = {
          'AnimalInterface': {
            interfaceName: 'AnimalInterface',
            implementationClass: 'DogService',
            sanitizedKey: 'AnimalInterface',
            isGeneric: false,
          },
          'LoggerInterface': {
            interfaceName: 'LoggerInterface',
            implementationClass: 'ConsoleLogger',
            sanitizedKey: 'LoggerInterface',
            isGeneric: false,
          },
        };
        return implementations[interfaceType];
      },
      validateDependencies: () => ({
        isValid: true,
        missingImplementations: ['MissingLoggerInterface', 'MissingAnalyticsInterface'],
        circularDependencies: [],
      }),
      getInterfaceImplementations: () => new Map([
        ['AnimalInterface', {
          interfaceName: 'AnimalInterface',
          implementationClass: 'DogService',
          sanitizedKey: 'AnimalInterface',
        }],
        ['LoggerInterface', {
          interfaceName: 'LoggerInterface',
          implementationClass: 'ConsoleLogger',
          sanitizedKey: 'LoggerInterface',
        }],
      ]),
      getServiceDependencies: () => new Map([
        ['DogService', {
          serviceClass: 'DogService',
          interfaceDependencies: [],
          filePath: '/src/DogService.ts',
          constructorParams: []
        }],
        ['ConsoleLogger', {
          serviceClass: 'ConsoleLogger',
          interfaceDependencies: [],
          filePath: '/src/ConsoleLogger.ts',
          constructorParams: []
        }],
      ]),
    };
  });

  describe("Simple Components", () => {
    it("should transform simple animal component", async () => {
      // Given
      project.createSourceFile("src/components/AnimalComponent.tsx", TEST_COMPONENTS.SIMPLE_ANIMAL);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,"simple-animal-component");
    });

    it("should transform component with multiple animals", async () => {
      // Given
      project.createSourceFile("src/components/PetShopComponent.tsx", TEST_COMPONENTS.MULTI_ANIMAL);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "multi-animal-component");
    });

    it("should transform arrow function component", async () => {
      // Given
      project.createSourceFile("src/components/QuickAnimalComponent.tsx", TEST_COMPONENTS.ARROW_ANIMAL);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "arrow-animal-component");
    });
  });

  describe("Edge Cases", () => {
    it("should handle mixed DI and non-DI services", async () => {
      // Given
      project.createSourceFile("src/components/MixedPetComponent.tsx", TEST_COMPONENTS.MIXED_SERVICES);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "mixed-services-component");
    });

    it("should handle optional missing services", async () => {
      // Given
      project.createSourceFile("src/components/OptionalMissingComponent.tsx", TEST_COMPONENTS.OPTIONAL_MISSING);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "optional-missing-component");
    });

    it("should handle deep destructuring patterns", async () => {
      // Given
      project.createSourceFile("src/components/DeepDestructuringComponent.tsx", TEST_COMPONENTS.DEEP_DESTRUCTURING);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "deep-destructuring-component");
    });

    it("should not transform components without DI services", async () => {
      // Given
      project.createSourceFile("src/components/NoServicesComponent.tsx", TEST_COMPONENTS.NO_SERVICES);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(0);
    });
  });

  describe("Separate Interfaces", () => {
    it("should handle components with separate interface definitions", async () => {
      // Given
      project.createSourceFile("src/components/PetComponentProps.ts", TEST_COMPONENTS.SEPARATE_INTERFACE_PROPS);
      project.createSourceFile("src/components/SeparateInterfaceComponent.tsx", TEST_COMPONENTS.SEPARATE_INTERFACE_COMPONENT);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "separate-interface-component");
    });
  });

  describe("Multiple Components", () => {
    it("should transform multiple components at once", async () => {
      // Given
      project.createSourceFile("src/components/AnimalComponent.tsx", TEST_COMPONENTS.SIMPLE_ANIMAL);
      project.createSourceFile("src/components/PetShopComponent.tsx", TEST_COMPONENTS.MULTI_ANIMAL);
      project.createSourceFile("src/components/QuickAnimalComponent.tsx", TEST_COMPONENTS.ARROW_ANIMAL);
      project.createSourceFile("src/components/NoServicesComponent.tsx", TEST_COMPONENTS.NO_SERVICES);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(3); // No services component should not be transformed

      // Sort by filename for consistent snapshots
      const sortedFiles = Array.from(transformedFiles.entries())
        .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
        .map(([path, content]) => ({ path, content }));

      expect(sortedFiles).toMatchSnapshot("multiple-components-transformation");
    });
  });

  describe("Error Scenarios", () => {
    it("should handle all missing implementations gracefully", async () => {
      // Given - mock resolver that returns no implementations
      (transformer as any).interfaceResolver.resolveImplementation = () => undefined;
      (transformer as any).interfaceResolver.getInterfaceImplementations = () => new Map();

      project.createSourceFile("src/components/AnimalComponent.tsx", TEST_COMPONENTS.SIMPLE_ANIMAL);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "all-missing-implementations");
    });

    it("should handle partial missing implementations", async () => {
      // Given - mock resolver that only has AnimalInterface
      (transformer as any).interfaceResolver.resolveImplementation = (interfaceType: string) => {
        if (interfaceType === 'AnimalInterface') {
          return {
            interfaceName: 'AnimalInterface',
            implementationClass: 'DogService',
            sanitizedKey: 'AnimalInterface',
            isGeneric: false,
          };
        }
        return undefined;
      };

      project.createSourceFile("src/components/PetShopComponent.tsx", TEST_COMPONENTS.MULTI_ANIMAL);

      // When
      const transformedFiles = await transformer.transformForBuild();

      // Then
      expect(transformedFiles.size).toBe(1);
      const transformedContent = Array.from(transformedFiles.values())[0];
      expectToMatchCodeSnapshot(transformedContent,  "partial-missing-implementations");
    });
  });

  describe("Transformation Summary", () => {
    it("should provide accurate transformation summary", async () => {
      // Given
      project.createSourceFile("src/components/AnimalComponent.tsx", TEST_COMPONENTS.SIMPLE_ANIMAL);
      project.createSourceFile("src/components/PetShopComponent.tsx", TEST_COMPONENTS.MULTI_ANIMAL);
      project.createSourceFile("src/components/NoServicesComponent.tsx", TEST_COMPONENTS.NO_SERVICES);

      // When
      await transformer.transformForBuild();
      const summary = transformer.getTransformationSummary();

      // Then
      expect(summary).toMatchSnapshot("transformation-summary");
    });
  });
});

// Helper function to create consistent snapshots
function normalizeSnapshot(content: string): string {
  return content
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove generated timestamps but keep the structure
    .replace(/Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, 'Generated: [TIMESTAMP]')
    // Normalize file paths
    .replace(/\/.*?\/src\//g, '/src/')
    // Remove any other timestamps
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '[TIMESTAMP]');
}

// Override expect.toMatchSnapshot to use normalized content
const originalToMatchSnapshot = expect.prototype.toMatchSnapshot;
expect.prototype.toMatchSnapshot = function(hint?: string) {
  if (typeof this.actual === 'string') {
    this.actual = normalizeSnapshot(this.actual);
  }
  return originalToMatchSnapshot.call(this, hint);
};