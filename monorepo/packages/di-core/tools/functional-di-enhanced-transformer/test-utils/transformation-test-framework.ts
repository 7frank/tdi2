// tools/test-utils/transformation-test-framework.ts
import { Project, SourceFile } from 'ts-morph';
import { FunctionalDIEnhancedTransformer } from '../functional-di-enhanced-transformer';
import { IntegratedInterfaceResolver } from '../../interface-resolver/integrated-interface-resolver';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface TransformationTestOptions {
  fixtureDir: string;
  outputDir?: string;
  verbose?: boolean;
  updateSnapshots?: boolean;
}

export interface TransformationTestResult {
  input: string;
  output: string;
  transformedFilePath: string;
  componentName: string;
  dependencies: any[];
}

export class TransformationTestFramework {
  private project: Project;
  private transformer: FunctionalDIEnhancedTransformer;
  private mockInterfaceResolver: IntegratedInterfaceResolver;

  constructor(private options: TransformationTestOptions) {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        jsx: 1, // React JSX
        target: 99, // Latest
        module: 99, // ESNext
      },
    });

    // Create mock interface resolver with common implementations
    this.setupMockInterfaceResolver();
    
    // Initialize transformer
    this.transformer = new FunctionalDIEnhancedTransformer({
      srcDir: './src',
      outputDir: './src/generated',
      verbose: this.options.verbose || false,
    });

    // Inject mocked dependencies
    (this.transformer as any).project = this.project;
    (this.transformer as any).interfaceResolver = this.mockInterfaceResolver;
  }

  private setupMockInterfaceResolver(): void {
    // Create common interface implementations for testing
    const commonImplementations = new Map([
      ['ApiInterface', {
        interfaceName: 'ApiInterface',
        implementationClass: 'ApiService',
        sanitizedKey: 'ApiInterface',
        filePath: '/src/services/ApiService.ts',
        isGeneric: false,
      }],
      ['LoggerInterface', {
        interfaceName: 'LoggerInterface',
        implementationClass: 'ConsoleLogger',
        sanitizedKey: 'LoggerInterface',
        filePath: '/src/services/ConsoleLogger.ts',
        isGeneric: false,
      }],
      ['CacheInterface_any', {
        interfaceName: 'CacheInterface',
        implementationClass: 'InMemoryCache',
        sanitizedKey: 'CacheInterface_any',
        filePath: '/src/services/InMemoryCache.ts',
        isGeneric: true,
      }],
      ['UserServiceInterface', {
        interfaceName: 'UserServiceInterface',
        implementationClass: 'UserService',
        sanitizedKey: 'UserServiceInterface',
        filePath: '/src/services/UserService.ts',
        isGeneric: false,
      }],
    ]);

    this.mockInterfaceResolver = {
      scanProject: jest.fn().mockResolvedValue(undefined),
      resolveImplementation: jest.fn((interfaceType: string) => {
        return commonImplementations.get(interfaceType);
      }),
      validateDependencies: jest.fn(() => ({
        isValid: true,
        missingImplementations: [],
        circularDependencies: []
      })),
      getInterfaceImplementations: jest.fn(() => commonImplementations),
      getServiceDependencies: jest.fn(() => new Map()),
    } as any;
  }

  /**
   * Run transformation tests for all fixtures in a directory
   */
  async runFixtureTests(testName: string): Promise<TransformationTestResult[]> {
    const fixturePattern = path.join(this.options.fixtureDir, `${testName}.*.input.tsx`);
    const inputFiles = glob.sync(fixturePattern);

    if (inputFiles.length === 0) {
      throw new Error(`No input fixtures found for pattern: ${fixturePattern}`);
    }

    const results: TransformationTestResult[] = [];

    for (const inputFile of inputFiles) {
      const result = await this.runSingleFixtureTest(inputFile);
      results.push(result);
    }

    return results;
  }

  /**
   * Run transformation test for a single fixture
   */
  async runSingleFixtureTest(inputFilePath: string): Promise<TransformationTestResult> {
    const inputContent = fs.readFileSync(inputFilePath, 'utf8');
    const fileName = path.basename(inputFilePath, '.input.tsx');
    const componentName = this.extractComponentName(inputContent);

    // Add input file to project
    const sourceFile = this.project.createSourceFile(`${fileName}.tsx`, inputContent);

    // Add any separate interface files if they exist
    await this.addSeparateInterfaceFiles(inputFilePath);

    // Run transformation
    const transformedFiles = await this.transformer.transformForBuild();
    
    // Get transformed content
    const transformedContent = transformedFiles.get(sourceFile.getFilePath()) || inputContent;

    // Extract dependencies for analysis
    const dependencies = this.extractDependenciesFromTransformed(transformedContent);

    const result: TransformationTestResult = {
      input: inputContent,
      output: transformedContent,
      transformedFilePath: sourceFile.getFilePath(),
      componentName,
      dependencies
    };

    // Generate or verify snapshot
    await this.handleSnapshot(fileName, result);

    return result;
  }

  private async addSeparateInterfaceFiles(inputFilePath: string): Promise<void> {
    const baseDir = path.dirname(inputFilePath);
    const baseName = path.basename(inputFilePath, '.input.tsx');
    
    // Look for corresponding interface files
    const interfaceFiles = [
      `${baseName}.interfaces.ts`,
      `${baseName}.types.ts`,
      'shared-interfaces.ts',
      'ComponentInterfaces.ts'
    ];

    for (const interfaceFile of interfaceFiles) {
      const interfacePath = path.join(baseDir, interfaceFile);
      if (fs.existsSync(interfacePath)) {
        const interfaceContent = fs.readFileSync(interfacePath, 'utf8');
        this.project.createSourceFile(interfaceFile, interfaceContent);
        
        if (this.options.verbose) {
          console.log(`📁 Added interface file: ${interfaceFile}`);
        }
      }
    }
  }

  private extractComponentName(content: string): string {
    // Extract component name from export function or export const
    const functionMatch = content.match(/export\s+function\s+(\w+)/);
    if (functionMatch) return functionMatch[1];

    const constMatch = content.match(/export\s+const\s+(\w+)\s*=/);
    if (constMatch) return constMatch[1];

    return 'UnknownComponent';
  }

  private extractDependenciesFromTransformed(content: string): any[] {
    const dependencies = [];
    
    // Extract useService calls
    const useServiceMatches = content.matchAll(/const\s+(\w+)\s+=\s+useService\('([^']+)'\)/g);
    for (const match of useServiceMatches) {
      dependencies.push({
        serviceKey: match[1],
        token: match[2],
        type: 'required'
      });
    }

    // Extract useOptionalService calls
    const useOptionalMatches = content.matchAll(/const\s+(\w+)\s+=\s+useOptionalService\('([^']+)'\)/g);
    for (const match of useOptionalMatches) {
      dependencies.push({
        serviceKey: match[1],
        token: match[2],
        type: 'optional'
      });
    }

    // Extract undefined assignments (missing optional dependencies)
    const undefinedMatches = content.matchAll(/const\s+(\w+)\s+=\s+undefined;\s*\/\/\s*Optional dependency not found/g);
    for (const match of undefinedMatches) {
      dependencies.push({
        serviceKey: match[1],
        token: null,
        type: 'missing-optional'
      });
    }

    return dependencies;
  }

  private async handleSnapshot(testName: string, result: TransformationTestResult): Promise<void> {
    const snapshotDir = this.options.outputDir || path.join(this.options.fixtureDir, '__snapshots__');
    const snapshotPath = path.join(snapshotDir, `${testName}.transformed.tsx`);

    // Ensure snapshot directory exists
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const snapshotContent = this.generateSnapshotContent(result);

    if (this.options.updateSnapshots || !fs.existsSync(snapshotPath)) {
      fs.writeFileSync(snapshotPath, snapshotContent, 'utf8');
      
      if (this.options.verbose) {
        console.log(`📸 Created/updated snapshot: ${snapshotPath}`);
      }
    } else {
      // Verify existing snapshot
      const existingSnapshot = fs.readFileSync(snapshotPath, 'utf8');
      if (existingSnapshot !== snapshotContent) {
        throw new Error(`Snapshot mismatch for ${testName}. Run with updateSnapshots: true to update.`);
      }
    }
  }

  private generateSnapshotContent(result: TransformationTestResult): string {
    return `// Auto-generated transformation snapshot for ${result.componentName}
// Generated: ${new Date().toISOString()}
${result.output}`;
  }

  /**
   * Create a Jest test that compares against snapshots
   */
  createJestTest(testName: string, description?: string): () => Promise<void> {
    return async () => {
      const results = await this.runFixtureTests(testName);
      
      for (const result of results) {
        // Load snapshot
        const snapshotPath = path.join(
          this.options.outputDir || path.join(this.options.fixtureDir, '__snapshots__'),
          `${testName}.transformed.snap.tsx`
        );
        
        if (fs.existsSync(snapshotPath)) {
          const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
          // Extract just the code part (remove comment headers)
          const expectedOutput = snapshotContent
            .split('\n')
            .filter(line => !line.startsWith('//'))
            .join('\n')
            .trim();
          
          // Compare transformation output
          expect(result.output.trim()).toBe(expectedOutput);
        } else {
          throw new Error(`Snapshot not found: ${snapshotPath}. Run the test with updateSnapshots: true first.`);
        }
      }
    };
  }
}

// Type definitions for snapshots
export interface TransformationSnapshot {
  componentName: string;
  input: string;
  output: string;
  dependencies: Array<{
    serviceKey: string;
    token: string | null;
    type: 'required' | 'optional' | 'missing-optional';
  }>;
  metadata: {
    transformedAt: string;
    hasDestructuring: boolean;
    hasSeparateInterface: boolean;
    dependencyCount: number;
    requiredDependencies: number;
    optionalDependencies: number;
    missingDependencies: number;
  };
}

// Utility function for creating tests
export function defineTransformationTest(
  testName: string,
  fixtureDir: string,
  options?: Partial<TransformationTestOptions>
): () => Promise<void> {
  const framework = new TransformationTestFramework({
    fixtureDir,
    verbose: false,
    updateSnapshots: false,
    ...options
  });
  
  return framework.createJestTest(testName);
}