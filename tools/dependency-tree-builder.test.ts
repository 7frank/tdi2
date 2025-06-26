// tests/unit/tools/dependency-tree-builder.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { DependencyTreeBuilder } from './dependency-tree-builder';
import { ConfigManager } from './config-manager';
import { InterfaceResolver } from './interface-resolver';
import type { 
  InterfaceImplementation, 
  ServiceDependency 
} from './interface-resolver';
import * as fs from 'fs';
import * as path from 'path';

// Mock file system operations
const mockFs = {
  writeFile: mock(),
  mkdir: mock(),
  exists: mock(() => true)
};

// Mock ConfigManager
const createMockConfigManager = () => ({
  getConfigDir: mock(() => '/mock/config'),
  getBridgeDir: mock(() => '/mock/bridge'), 
  getConfigHash: mock(() => 'mock-hash-123'),
  generateBridgeFiles: mock()
});

// Mock InterfaceResolver with test data
const createMockInterfaceResolver = () => {
  const mockImplementations = new Map<string, InterfaceImplementation>([
    ['LoggerInterface', {
      interfaceName: 'LoggerInterface',
      implementationClass: 'ConsoleLogger',
      filePath: '/src/services/ConsoleLogger.ts',
      isGeneric: false,
      typeParameters: [],
      sanitizedKey: 'LoggerInterface'
    }],
    ['CacheInterface_any_', {
      interfaceName: 'CacheInterface',
      implementationClass: 'MemoryCache',
      filePath: '/src/services/MemoryCache.ts',
      isGeneric: true,
      typeParameters: ['T'],
      sanitizedKey: 'CacheInterface_any_'
    }],
    ['ApiInterface', {
      interfaceName: 'ApiInterface',
      implementationClass: 'RestApiService',
      filePath: '/src/services/RestApiService.ts',
      isGeneric: false,
      typeParameters: [],
      sanitizedKey: 'ApiInterface'
    }],
    ['EmailInterface', {
      interfaceName: 'EmailInterface',
      implementationClass: 'SMTPEmailService',
      filePath: '/src/services/SMTPEmailService.ts',
      isGeneric: false,
      typeParameters: [],
      sanitizedKey: 'EmailInterface'
    }]
  ]);

  const mockDependencies = new Map<string, ServiceDependency>([
    ['RestApiService', {
      serviceClass: 'RestApiService',
      interfaceDependencies: ['LoggerInterface'],
      filePath: '/src/services/RestApiService.ts',
      constructorParams: [{
        paramName: 'logger',
        interfaceType: 'LoggerInterface',
        isOptional: false,
        sanitizedKey: 'LoggerInterface'
      }]
    }],
    ['SMTPEmailService', {
      serviceClass: 'SMTPEmailService',
      interfaceDependencies: ['LoggerInterface', 'ApiInterface', 'CacheInterface_any_'],
      filePath: '/src/services/SMTPEmailService.ts',
      constructorParams: [
        {
          paramName: 'logger',
          interfaceType: 'LoggerInterface',
          isOptional: false,
          sanitizedKey: 'LoggerInterface'
        },
        {
          paramName: 'api',
          interfaceType: 'ApiInterface',
          isOptional: false,
          sanitizedKey: 'ApiInterface'
        },
        {
          paramName: 'cache',
          interfaceType: 'CacheInterface<any>',
          isOptional: true,
          sanitizedKey: 'CacheInterface_any_'
        }
      ]
    }]
  ]);

  return {
    scanProject: mock(),
    getInterfaceImplementations: mock(() => mockImplementations),
    getServiceDependencies: mock(() => mockDependencies),
    validateDependencies: mock(() => ({
      isValid: true,
      missingImplementations: [],
      circularDependencies: []
    })),
    getDependencyTree: mock(() => [
      {
        id: 'ConsoleLogger',
        dependencies: [],
        resolved: []
      },
      {
        id: 'MemoryCache',
        dependencies: [],
        resolved: []
      },
      {
        id: 'RestApiService',
        dependencies: ['LoggerInterface'],
        resolved: ['ConsoleLogger']
      },
      {
        id: 'SMTPEmailService',
        dependencies: ['LoggerInterface', 'ApiInterface', 'CacheInterface_any_'],
        resolved: ['ConsoleLogger', 'RestApiService', 'MemoryCache']
      }
    ])
  };
};

describe('DependencyTreeBuilder', () => {
  let builder: DependencyTreeBuilder;
  let mockConfigManager: any;
  let mockInterfaceResolver: any;

  beforeEach(() => {
    mockConfigManager = createMockConfigManager();
    mockInterfaceResolver = createMockInterfaceResolver();
    
    builder = new DependencyTreeBuilder(mockConfigManager, {
      verbose: false,
      srcDir: './src'
    });

    // Mock the internal interface resolver
    (builder as any).interfaceResolver = mockInterfaceResolver;
    
    // Mock fs operations
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
  });

  describe('Feature: Dependency Tree Construction', () => {
    describe('Given a project with service implementations', () => {
      it('When building dependency tree, Then should scan project and validate dependencies', async () => {
        // Given - Mock resolver is set up with test data
        
        // When
        await builder.buildDependencyTree();
        
        // Then
        expect(mockInterfaceResolver.scanProject).toHaveBeenCalled();
        expect(mockInterfaceResolver.validateDependencies).toHaveBeenCalled();
      });

      it('When validation fails, Then should throw descriptive error', async () => {
        // Given
        mockInterfaceResolver.validateDependencies.mockReturnValue({
          isValid: false,
          missingImplementations: ['MissingInterface -> NonExistentService'],
          circularDependencies: ['ServiceA -> ServiceB -> ServiceA']
        });
        
        // When & Then
        await expect(builder.buildDependencyTree()).rejects.toThrow(
          'Invalid dependency configuration. Fix the issues above before proceeding.'
        );
      });

      it('When validation succeeds, Then should build configurations for all services', async () => {
        // Given - Valid dependency setup
        
        // When
        await builder.buildDependencyTree();
        const configurations = builder.getConfigurations();
        
        // Then
        expect(configurations.size).toBe(4); // 4 services in mock data
        expect(configurations.has('LoggerInterface')).toBe(true);
        expect(configurations.has('CacheInterface_any_')).toBe(true);
        expect(configurations.has('ApiInterface')).toBe(true);
        expect(configurations.has('EmailInterface')).toBe(true);
      });
    });

    describe('Given services with different dependency patterns', () => {
      it('When service has no dependencies, Then should create simple factory', async () => {
        // Given
        await builder.buildDependencyTree();
        const configurations = builder.getConfigurations();
        
        // When
        const loggerConfig = configurations.get('LoggerInterface');
        
        // Then
        expect(loggerConfig).toBeDefined();
        expect(loggerConfig?.dependencies).toHaveLength(0);
        expect(loggerConfig?.token).toBe('LoggerInterface');
        expect(loggerConfig?.implementation.implementationClass).toBe('ConsoleLogger');
        expect(loggerConfig?.scope).toBe('singleton');
      });

      it('When service has single dependency, Then should include dependency in configuration', async () => {
        // Given
        await builder.buildDependencyTree();
        const configurations = builder.getConfigurations();
        
        // When
        const apiConfig = configurations.get('ApiInterface');
        
        // Then
        expect(apiConfig).toBeDefined();
        expect(apiConfig?.dependencies).toContain('LoggerInterface');
        expect(apiConfig?.implementation.implementationClass).toBe('RestApiService');
      });

      it('When service has multiple dependencies, Then should include all dependencies', async () => {
        // Given
        await builder.buildDependencyTree();
        const configurations = builder.getConfigurations();
        
        // When
        const emailConfig = configurations.get('EmailInterface');
        
        // Then
        expect(emailConfig).toBeDefined();
        expect(emailConfig?.dependencies).toContain('LoggerInterface');
        expect(emailConfig?.dependencies).toContain('ApiInterface');
        expect(emailConfig?.dependencies).toContain('CacheInterface_any_');
        expect(emailConfig?.dependencies).toHaveLength(3);
      });
    });
  });

  describe('Feature: Factory Function Generation', () => {
    describe('Given different service dependency scenarios', () => {
      it('When service has no dependencies, Then should generate simple factory', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        const factoryCode = (builder as any).generateFactoryFunction({
          implementation: { implementationClass: 'ConsoleLogger' },
          dependencies: []
        });
        
        // Then
        expect(factoryCode).toContain('function createConsoleLogger(container: any)');
        expect(factoryCode).toContain('return new ConsoleLogger();');
        expect(factoryCode).not.toContain('container.resolve');
      });

      it('When service has required dependencies, Then should generate dependency resolution', async () => {
        // Given
        const mockConfig = {
          implementation: { implementationClass: 'RestApiService' },
          dependencies: ['LoggerInterface']
        };
        
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(new Map([
          ['ServiceA', {
            serviceClass: 'ServiceA',
            interfaceDependencies: ['ServiceB'],
            filePath: '/src/ServiceA.ts',
            constructorParams: [{
              paramName: 'serviceB',
              interfaceType: 'ServiceBInterface',
              isOptional: false,
              sanitizedKey: 'ServiceB'
            }]
          }],
          ['ServiceB', {
            serviceClass: 'ServiceB',
            interfaceDependencies: ['ServiceA'],
            filePath: '/src/ServiceB.ts',
            constructorParams: [{
              paramName: 'serviceA',
              interfaceType: 'ServiceAInterface',
              isOptional: false,
              sanitizedKey: 'ServiceA'
            }]
          }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When & Then
        expect(() => (builder as any).topologicalSort()).toThrow('Circular dependency detected involving: ServiceA');
      });

      it('When dependency chain is complex but valid, Then should sort correctly', async () => {
        // Given - More complex dependency chain
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(new Map([
          ['A', { interfaceName: 'A', implementationClass: 'A', filePath: '/A.ts', isGeneric: false, typeParameters: [], sanitizedKey: 'A' }],
          ['B', { interfaceName: 'B', implementationClass: 'B', filePath: '/B.ts', isGeneric: false, typeParameters: [], sanitizedKey: 'B' }],
          ['C', { interfaceName: 'C', implementationClass: 'C', filePath: '/C.ts', isGeneric: false, typeParameters: [], sanitizedKey: 'C' }],
          ['D', { interfaceName: 'D', implementationClass: 'D', filePath: '/D.ts', isGeneric: false, typeParameters: [], sanitizedKey: 'D' }]
        ]));
        
        // A -> B, C -> A, D -> B, C
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(new Map([
          ['A', { serviceClass: 'A', interfaceDependencies: ['B'], filePath: '/A.ts', constructorParams: [] }],
          ['C', { serviceClass: 'C', interfaceDependencies: ['A'], filePath: '/C.ts', constructorParams: [] }],
          ['D', { serviceClass: 'D', interfaceDependencies: ['B', 'C'], filePath: '/D.ts', constructorParams: [] }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When
        const sortedConfigs = (builder as any).topologicalSort();
        const tokens = sortedConfigs.map((config: any) => config.token);
        
        // Then
        expect(tokens.indexOf('B')).toBeLessThan(tokens.indexOf('A')); // B before A
        expect(tokens.indexOf('A')).toBeLessThan(tokens.indexOf('C')); // A before C
        expect(tokens.indexOf('B')).toBeLessThan(tokens.indexOf('D')); // B before D
        expect(tokens.indexOf('C')).toBeLessThan(tokens.indexOf('D')); // C before D
      });
    });
  });

  describe('Feature: DI Configuration File Generation', () => {
    describe('Given a complete dependency tree', () => {
      it('When generating DI configuration, Then should create valid TypeScript file', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateDIConfiguration();
        
        // Then
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
          '/mock/config/di-config.ts',
          expect.stringContaining('// Auto-generated DI configuration - Interface-based resolution'),
          'utf8'
        );
        
        // Check that the generated content includes imports
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di-config.ts')
        );
        const generatedContent = writeCall[1];
        
        expect(generatedContent).toContain('import { ConsoleLogger }');
        expect(generatedContent).toContain('import { MemoryCache }');
        expect(generatedContent).toContain('import { RestApiService }');
        expect(generatedContent).toContain('import { SMTPEmailService }');
      });

      it('When generating configuration, Then should include factory functions', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateDIConfiguration();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di-config.ts')
        );
        const generatedContent = writeCall[1];
        
        expect(generatedContent).toContain('function createConsoleLogger(container: any)');
        expect(generatedContent).toContain('function createMemoryCache(container: any)');
        expect(generatedContent).toContain('function createRestApiService(container: any)');
        expect(generatedContent).toContain('function createSMTPEmailService(container: any)');
      });

      it('When generating configuration, Then should include DI map with correct structure', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateDIConfiguration();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di-config.ts')
        );
        const generatedContent = writeCall[1];
        
        expect(generatedContent).toContain('export const DI_CONFIG = {');
        expect(generatedContent).toContain("'LoggerInterface': {");
        expect(generatedContent).toContain('factory: createConsoleLogger');
        expect(generatedContent).toContain("scope: 'singleton'");
        expect(generatedContent).toContain('dependencies: []');
      });

      it('When generating configuration, Then should include interface mapping for debugging', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateDIConfiguration();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di-config.ts')
        );
        const generatedContent = writeCall[1];
        
        expect(generatedContent).toContain('export const INTERFACE_MAPPING = {');
        expect(generatedContent).toContain("'LoggerInterface': 'ConsoleLogger'");
        expect(generatedContent).toContain("'CacheInterface': 'MemoryCache'");
        expect(generatedContent).toContain("'ApiInterface': 'RestApiService'");
        expect(generatedContent).toContain("'EmailInterface': 'SMTPEmailService'");
      });

      it('When generating configuration, Then should include metadata comments', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateDIConfiguration();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di-config.ts')
        );
        const generatedContent = writeCall[1];
        
        expect(generatedContent).toContain('// Do not edit this file manually');
        expect(generatedContent).toContain('// Config: mock-hash-123');
        expect(generatedContent).toContain('// Generated:');
      });
    });

    describe('Given different import path scenarios', () => {
      it('When service files are in subdirectories, Then should generate correct relative imports', async () => {
        // Given
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(new Map([
          ['NestedService', {
            interfaceName: 'NestedInterface',
            implementationClass: 'NestedService',
            filePath: '/src/modules/auth/services/NestedService.ts',
            isGeneric: false,
            typeParameters: [],
            sanitizedKey: 'NestedService'
          }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateDIConfiguration();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di-config.ts')
        );
        const generatedContent = writeCall[1];
        
        // Should generate relative import path
        expect(generatedContent).toContain('import { NestedService } from');
      });

      it('When service files have different extensions, Then should handle correctly', async () => {
        // Given
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(new Map([
          ['ReactService', {
            interfaceName: 'ReactInterface',
            implementationClass: 'ReactService',
            filePath: '/src/services/ReactService.tsx',
            isGeneric: false,
            typeParameters: [],
            sanitizedKey: 'ReactService'
          }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateDIConfiguration();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di-config.ts')
        );
        const generatedContent = writeCall[1];
        
        // Should strip .tsx extension in import
        expect(generatedContent).toContain('import { ReactService }');
        expect(generatedContent).not.toContain('.tsx');
      });
    });
  });

  describe('Feature: Import File Generation', () => {
    describe('Given services across multiple files', () => {
      it('When generating import file, Then should include all unique imports', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateImportFile();
        
        // Then
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
          '/mock/config/di.generated.ts',
          expect.stringContaining('import "./services/ConsoleLogger"'),
          'utf8'
        );
        
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di.generated.ts')
        );
        const generatedContent = writeCall[1];
        
        expect(generatedContent).toContain('import "./services/MemoryCache"');
        expect(generatedContent).toContain('import "./services/RestApiService"');
        expect(generatedContent).toContain('import "./services/SMTPEmailService"');
      });

      it('When generating import file, Then should create bridge file', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateImportFile();
        
        // Then
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
          '/mock/bridge/di-imports.ts',
          expect.stringContaining('// Auto-generated bridge file for imports'),
          'utf8'
        );
      });

      it('When generating import file, Then should include metadata', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateImportFile();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di.generated.ts')
        );
        const generatedContent = writeCall[1];
        
        expect(generatedContent).toContain('/**');
        expect(generatedContent).toContain('* Generated file - do not edit');
        expect(generatedContent).toContain('* Config: mock-hash-123');
        expect(generatedContent).toContain('* Generated:');
      });

      it('When services share same directory, Then should avoid duplicate imports', async () => {
        // Given - Multiple services in same directory
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(new Map([
          ['ServiceA', {
            interfaceName: 'InterfaceA',
            implementationClass: 'ServiceA',
            filePath: '/src/services/SharedService.ts',
            isGeneric: false,
            typeParameters: [],
            sanitizedKey: 'ServiceA'
          }],
          ['ServiceB', {
            interfaceName: 'InterfaceB',
            implementationClass: 'ServiceB',
            filePath: '/src/services/SharedService.ts', // Same file
            isGeneric: false,
            typeParameters: [],
            sanitizedKey: 'ServiceB'
          }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When
        await (builder as any).generateImportFile();
        
        // Then
        const writeCall = (fs.promises.writeFile as any).mock.calls.find(
          (call: any) => call[0].endsWith('di.generated.ts')
        );
        const generatedContent = writeCall[1];
        
        // Should only import the file once
        const importCount = (generatedContent.match(/import.*SharedService/g) || []).length;
        expect(importCount).toBe(1);
      });
    });
  });

  describe('Feature: Error Handling and Edge Cases', () => {
    describe('Given file system errors', () => {
      it('When file write fails, Then should propagate error', async () => {
        // Given
        (fs.promises.writeFile as any).mockRejectedValue(new Error('Permission denied'));
        await builder.buildDependencyTree();
        
        // When & Then
        await expect((builder as any).generateDIConfiguration()).rejects.toThrow('Permission denied');
      });

      it('When directory creation fails, Then should handle gracefully', async () => {
        // Given
        (fs.promises.mkdir as any).mockRejectedValue(new Error('Cannot create directory'));
        
        // When & Then
        // Should not throw during tree building, only during file generation
        await expect(builder.buildDependencyTree()).resolves.not.toThrow();
      });
    });

    describe('Given empty or malformed data', () => {
      it('When no services are found, Then should generate empty configuration', async () => {
        // Given
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(new Map());
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(new Map());
        
        // When
        await builder.buildDependencyTree();
        const configurations = builder.getConfigurations();
        
        // Then
        expect(configurations.size).toBe(0);
      });

      it('When service has malformed dependency data, Then should handle gracefully', async () => {
        // Given
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(new Map([
          ['BrokenService', {
            serviceClass: 'BrokenService',
            interfaceDependencies: undefined as any, // Malformed data
            filePath: '/src/BrokenService.ts',
            constructorParams: null as any // Malformed data
          }]
        ]));
        
        // When & Then
        await expect(builder.buildDependencyTree()).resolves.not.toThrow();
      });
    });

    describe('Given configuration conflicts', () => {
      it('When service implementation is missing, Then should still generate configuration', async () => {
        // Given
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(new Map([
          ['OrphanInterface', {
            interfaceName: 'OrphanInterface',
            implementationClass: 'OrphanService',
            filePath: '/src/services/OrphanService.ts',
            isGeneric: false,
            typeParameters: [],
            sanitizedKey: 'OrphanInterface'
          }]
        ]));
        
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(new Map([
          ['DependentService', {
            serviceClass: 'DependentService',
            interfaceDependencies: ['NonExistentInterface'],
            filePath: '/src/DependentService.ts',
            constructorParams: []
          }]
        ]));
        
        // When
        await builder.buildDependencyTree();
        const configurations = builder.getConfigurations();
        
        // Then
        expect(configurations.size).toBe(1); // Only OrphanInterface should be configured
        expect(configurations.has('OrphanInterface')).toBe(true);
      });
    });
  });

  describe('Feature: Debug and Introspection', () => {
    describe('Given development debugging needs', () => {
      it('When accessing debug methods, Then should provide useful information', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        const dependencyTree = builder.getDependencyTree();
        const configurations = builder.getConfigurations();
        const interfaceResolver = builder.getInterfaceResolver();
        
        // Then
        expect(dependencyTree).toBeDefined();
        expect(dependencyTree.length).toBeGreaterThan(0);
        expect(configurations).toBeInstanceOf(Map);
        expect(interfaceResolver).toBeDefined();
      });

      it('When verbose mode is enabled, Then should provide detailed logging', async () => {
        // Given
        const verboseBuilder = new DependencyTreeBuilder(mockConfigManager, {
          verbose: true,
          srcDir: './src'
        });
        (verboseBuilder as any).interfaceResolver = mockInterfaceResolver;
        
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        // When
        await verboseBuilder.buildDependencyTree();
        
        // Then
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🌳 Building dependency tree'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Built dependency tree'));
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Feature: Performance and Memory Management', () => {
    describe('Given large codebases', () => {
      it('When processing many services, Then should complete in reasonable time', async () => {
        // Given - Simulate large number of services
        const largeImplementations = new Map();
        const largeDependencies = new Map();
        
        for (let i = 0; i < 100; i++) {
          largeImplementations.set(`Service${i}`, {
            interfaceName: `Interface${i}`,
            implementationClass: `Service${i}`,
            filePath: `/src/Service${i}.ts`,
            isGeneric: false,
            typeParameters: [],
            sanitizedKey: `Service${i}`
          });
          
          if (i > 0) {
            largeDependencies.set(`Service${i}`, {
              serviceClass: `Service${i}`,
              interfaceDependencies: [`Service${i-1}`],
              filePath: `/src/Service${i}.ts`,
              constructorParams: []
            });
          }
        }
        
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(largeImplementations);
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(largeDependencies);
        
        // When
        const startTime = Date.now();
        await builder.buildDependencyTree();
        const endTime = Date.now();
        
        // Then
        expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
        expect(builder.getConfigurations().size).toBe(100);
      });

      it('When handling deep dependency chains, Then should not cause stack overflow', async () => {
        // Given - Deep dependency chain
        const deepImplementations = new Map();
        const deepDependencies = new Map();
        
        for (let i = 0; i < 50; i++) {
          deepImplementations.set(`Deep${i}`, {
            interfaceName: `DeepInterface${i}`,
            implementationClass: `Deep${i}`,
            filePath: `/src/Deep${i}.ts`,
            isGeneric: false,
            typeParameters: [],
            sanitizedKey: `Deep${i}`
          });
          
          if (i > 0) {
            deepDependencies.set(`Deep${i}`, {
              serviceClass: `Deep${i}`,
              interfaceDependencies: [`Deep${i-1}`],
              filePath: `/src/Deep${i}.ts`,
              constructorParams: []
            });
          }
        }
        
        mockInterfaceResolver.getInterfaceImplementations.mockReturnValue(deepImplementations);
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(deepDependencies);
        
        // When & Then
        await expect(builder.buildDependencyTree()).resolves.not.toThrow();
        
        const sortedConfigs = (builder as any).topologicalSort();
        expect(sortedConfigs.length).toBe(50);
      });
    });
  });
});
Value(new Map([
          ['RestApiService', {
            serviceClass: 'RestApiService',
            constructorParams: [{
              paramName: 'logger',
              interfaceType: 'LoggerInterface',
              isOptional: false,
              sanitizedKey: 'LoggerInterface'
            }]
          }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When
        const factoryCode = (builder as any).generateFactoryFunction(mockConfig);
        
        // Then
        expect(factoryCode).toContain('function createRestApiService(container: any)');
        expect(factoryCode).toContain('const dep0 = container.resolve(\'LoggerInterface\');');
        expect(factoryCode).toContain('return new RestApiService(dep0);');
      });

      it('When service has optional dependencies, Then should handle optional resolution', async () => {
        // Given
        const mockConfig = {
          implementation: { implementationClass: 'EmailService' },
          dependencies: ['LoggerInterface', 'CacheInterface_any_']
        };
        
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(new Map([
          ['EmailService', {
            serviceClass: 'EmailService',
            constructorParams: [
              {
                paramName: 'logger',
                interfaceType: 'LoggerInterface',
                isOptional: false,
                sanitizedKey: 'LoggerInterface'
              },
              {
                paramName: 'cache',
                interfaceType: 'CacheInterface<any>',
                isOptional: true,
                sanitizedKey: 'CacheInterface_any_'
              }
            ]
          }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When
        const factoryCode = (builder as any).generateFactoryFunction(mockConfig);
        
        // Then
        expect(factoryCode).toContain('const dep0 = container.resolve(\'LoggerInterface\');');
        expect(factoryCode).toContain('const dep1 = container.has(\'CacheInterface_any_\') ? container.resolve(\'CacheInterface_any_\') : undefined;');
        expect(factoryCode).toContain('return new EmailService(dep0, dep1);');
      });

      it('When service has mix of required and optional dependencies, Then should handle both correctly', async () => {
        // Given
        const mockConfig = {
          implementation: { implementationClass: 'ComplexService' },
          dependencies: ['RequiredInterface', 'OptionalInterface1', 'OptionalInterface2']
        };
        
        mockInterfaceResolver.getServiceDependencies.mockReturnValue(new Map([
          ['ComplexService', {
            serviceClass: 'ComplexService',
            constructorParams: [
              {
                paramName: 'required',
                interfaceType: 'RequiredInterface',
                isOptional: false,
                sanitizedKey: 'RequiredInterface'
              },
              {
                paramName: 'optional1',
                interfaceType: 'OptionalInterface1',
                isOptional: true,
                sanitizedKey: 'OptionalInterface1'
              },
              {
                paramName: 'optional2',
                interfaceType: 'OptionalInterface2',
                isOptional: true,
                sanitizedKey: 'OptionalInterface2'
              }
            ]
          }]
        ]));
        
        await builder.buildDependencyTree();
        
        // When
        const factoryCode = (builder as any).generateFactoryFunction(mockConfig);
        
        // Then
        expect(factoryCode).toContain('const dep0 = container.resolve(\'RequiredInterface\');');
        expect(factoryCode).toContain('const dep1 = container.has(\'OptionalInterface1\') ? container.resolve(\'OptionalInterface1\') : undefined;');
        expect(factoryCode).toContain('const dep2 = container.has(\'OptionalInterface2\') ? container.resolve(\'OptionalInterface2\') : undefined;');
        expect(factoryCode).toContain('return new ComplexService(dep0, dep1, dep2);');
      });
    });

    describe('Given factory naming conventions', () => {
      it('When generating factory names, Then should follow consistent naming pattern', () => {
        // Given & When
        const factoryName1 = (builder as any).generateFactoryName('ConsoleLogger');
        const factoryName2 = (builder as any).generateFactoryName('RestApiService');
        const factoryName3 = (builder as any).generateFactoryName('SMTPEmailService');
        
        // Then
        expect(factoryName1).toBe('createConsoleLogger');
        expect(factoryName2).toBe('createRestApiService');
        expect(factoryName3).toBe('createSMTPEmailService');
      });
    });
  });

  describe('Feature: Topological Sorting', () => {
    describe('Given services with dependency relationships', () => {
      it('When sorting dependencies, Then should resolve dependencies before dependents', async () => {
        // Given
        await builder.buildDependencyTree();
        
        // When
        const sortedConfigs = (builder as any).topologicalSort();
        
        // Then
        const configNames = sortedConfigs.map((config: any) => config.token);
        
        // LoggerInterface and CacheInterface should come before services that depend on them
        const loggerIndex = configNames.indexOf('LoggerInterface');
        const cacheIndex = configNames.indexOf('CacheInterface_any_');
        const apiIndex = configNames.indexOf('ApiInterface');
        const emailIndex = configNames.indexOf('EmailInterface');
        
        expect(loggerIndex).toBeGreaterThan(-1);
        expect(apiIndex).toBeGreaterThan(loggerIndex); // ApiInterface depends on LoggerInterface
        expect(emailIndex).toBeGreaterThan(loggerIndex); // EmailInterface depends on LoggerInterface
        expect(emailIndex).toBeGreaterThan(apiIndex); // EmailInterface depends on ApiInterface
      });

    })
})