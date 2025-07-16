// tools/test-utils/transformation-test-framework.ts
import { Project, SourceFile } from "ts-morph";
import { FunctionalDIEnhancedTransformer } from "../functional-di-enhanced-transformer";
import { IntegratedInterfaceResolver } from "../../interface-resolver/integrated-interface-resolver";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { diffLines, createTwoFilesPatch } from "diff";

export interface IgnorePattern {
  pattern: RegExp;
  replacement?: string;
  description?: string;
}

export interface TransformationTestOptions {
  fixtureDir: string;
  outputDir?: string;
  verbose?: boolean;
  updateSnapshots?: boolean;
  ignorePatterns?: IgnorePattern[];
  validateSyntax?: boolean; // Whether to validate TypeScript syntax
  failOnSyntaxErrors?: boolean; // Whether to fail tests if syntax validation fails
}
export interface TransformationTestResult {
  input: string;
  output: string;
  transformedFilePath: string;
  componentName: string;
  dependencies: any[];
  inputFilePath: string;
  validation: {
    isValid: boolean;
    diagnostics: Array<{
      message: string;
      line?: number;
      column?: number;
      category: "error" | "warning" | "suggestion" | "message";
    }>;
    hasErrors: boolean;
    hasWarnings: boolean;
  };
  inputValidation: {
    isValid: boolean;
    diagnostics: Array<{
      message: string;
      line?: number;
      column?: number;
      category: "error" | "warning" | "suggestion" | "message";
    }>;
    hasErrors: boolean;
    hasWarnings: boolean;
  };
}

export class TransformationTestFramework {
  private project: Project;
  private transformer: FunctionalDIEnhancedTransformer;
  private mockInterfaceResolver: IntegratedInterfaceResolver;
  private defaultIgnorePatterns: IgnorePattern[];

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

    // Setup default ignore patterns
    this.defaultIgnorePatterns = [
      {
        pattern: /\/\/ Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
        replacement: "// Generated: [TIMESTAMP]",
        description: "ISO timestamp in generated comments",
      },
      {
        pattern: /Generated at: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g,
        replacement: "Generated at: [TIMESTAMP]",
        description: "Human readable timestamp",
      },
      {
        pattern: /\btimestamp: "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/g,
        replacement: 'timestamp: "[TIMESTAMP]"',
        description: "JSON timestamp fields",
      },
    ];

    // Create mock interface resolver with common implementations
    this.setupMockInterfaceResolver();

    // Initialize transformer
    this.transformer = new FunctionalDIEnhancedTransformer({
      srcDir: "./src",
      outputDir: "./src/generated",
      verbose: this.options.verbose || false,
    });

    // Inject mocked dependencies
    (this.transformer as any).project = this.project;
    (this.transformer as any).interfaceResolver = this.mockInterfaceResolver;
  }

  private setupMockInterfaceResolver(): void {
    // Create common interface implementations for testing
    const commonImplementations = new Map([
      [
        "ApiInterface",
        {
          interfaceName: "ApiInterface",
          implementationClass: "ApiService",
          sanitizedKey: "ApiInterface",
          filePath: "/src/services/ApiService.ts",
          isGeneric: false,
        },
      ],
      [
        "LoggerInterface",
        {
          interfaceName: "LoggerInterface",
          implementationClass: "ConsoleLogger",
          sanitizedKey: "LoggerInterface",
          filePath: "/src/services/ConsoleLogger.ts",
          isGeneric: false,
        },
      ],
      [
        "CacheInterface_any",
        {
          interfaceName: "CacheInterface",
          implementationClass: "InMemoryCache",
          sanitizedKey: "CacheInterface_any",
          filePath: "/src/services/InMemoryCache.ts",
          isGeneric: true,
        },
      ],
      [
        "UserServiceInterface",
        {
          interfaceName: "UserServiceInterface",
          implementationClass: "UserService",
          sanitizedKey: "UserServiceInterface",
          filePath: "/src/services/UserService.ts",
          isGeneric: false,
        },
      ],
    ]);

    this.mockInterfaceResolver = {
      scanProject: jest.fn().mockResolvedValue(undefined),
      resolveImplementation: jest.fn((interfaceType: string) => {
        return commonImplementations.get(interfaceType);
      }),
      validateDependencies: jest.fn(() => ({
        isValid: true,
        missingImplementations: [],
        circularDependencies: [],
      })),
      getInterfaceImplementations: jest.fn(() => commonImplementations),
      getServiceDependencies: jest.fn(() => new Map()),
    } as any;
  }

  /**
   * Format TypeScript content using ts-morph
   */
  private formatTypeScriptContent(content: string): string {
    try {
      // Create a temporary file for formatting
      const tempFileName = `temp-format-${Date.now()}.tsx`;
      const tempFile = this.project.createSourceFile(tempFileName, content, {
        overwrite: true,
      });

      // Use ts-morph's built-in formatting
      tempFile.formatText();

      // Get the formatted content
      const formattedContent = tempFile.getFullText();

      // Clean up the temporary file
      tempFile.delete();

      return formattedContent.trim();
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️ TypeScript formatting failed:`, error);
      }
      return content.trim();
    }
  }

  /**
   * Apply ignore patterns to normalize content before comparison
   */
  private normalizeContentForComparison(content: string): string {
    const allPatterns = [
      ...this.defaultIgnorePatterns,
      ...(this.options.ignorePatterns || []),
    ];

    let normalizedContent = content;

    for (const pattern of allPatterns) {
      const replacement = pattern.replacement || "[IGNORED]";
      normalizedContent = normalizedContent.replace(
        pattern.pattern,
        replacement
      );

      if (this.options.verbose && pattern.pattern.test(content)) {
        console.log(
          `🔍 Applied ignore pattern: ${pattern.description || pattern.pattern.source}`
        );
      }
    }

    return normalizedContent;
  }

  /**
   * Normalize content for comparison: format TypeScript and apply ignore patterns
   */
  private normalizeAndFormatForComparison(content: string): string {
    // First format the TypeScript content
    const formattedContent = this.formatTypeScriptContent(content);

    // Then apply ignore patterns
    const normalizedContent =
      this.normalizeContentForComparison(formattedContent);

    if (this.options.verbose) {
      console.log(`📝 Formatted and normalized content for comparison`);
    }

    return normalizedContent;
  }

  /**
   * Validate that TypeScript content is syntactically valid and compiles
   */
  private validateTypeScriptSyntax(
    content: string,
    componentName: string
  ): {
    isValid: boolean;
    diagnostics: Array<{
      message: string;
      line?: number;
      column?: number;
      category: "error" | "warning" | "suggestion" | "message";
    }>;
    hasErrors: boolean;
    hasWarnings: boolean;
  } {
    try {
      // Create a temporary file for validation
      const tempFileName = `validation-${componentName}-${Date.now()}.tsx`;
      const tempFile = this.project.createSourceFile(tempFileName, content, {
        overwrite: true,
      });

      // Get diagnostics (syntax errors, type errors, etc.)
      const diagnostics = tempFile.getPreEmitDiagnostics();

      const processedDiagnostics = diagnostics.map((diagnostic) => {
        const start = diagnostic.getStart();
        const sourceFile = diagnostic.getSourceFile();
        let line: number | undefined;
        let column: number | undefined;

        if (start && sourceFile) {
          const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
          line = lineAndColumn.line;
          column = lineAndColumn.column;
        }

        return {
          message: diagnostic.getMessageText().toString(),
          line,
          column,
          category: this.mapDiagnosticCategory(diagnostic.getCategory()),
        };
      });

      const hasErrors = processedDiagnostics.some(
        (d) => d.category === "error"
      );
      const hasWarnings = processedDiagnostics.some(
        (d) => d.category === "warning"
      );

      // Clean up
      tempFile.delete();

      return {
        isValid: !hasErrors,
        diagnostics: processedDiagnostics,
        hasErrors,
        hasWarnings,
      };
    } catch (error) {
      return {
        isValid: false,
        diagnostics: [
          {
            message: `Validation failed: ${error}`,
            category: "error" as const,
          },
        ],
        hasErrors: true,
        hasWarnings: false,
      };
    }
  }

  /**
   * Map ts-morph diagnostic category to our string representation
   */
  private mapDiagnosticCategory(
    category: number
  ): "error" | "warning" | "suggestion" | "message" {
    switch (category) {
      case 1:
        return "error";
      case 2:
        return "warning";
      case 3:
        return "suggestion";
      case 4:
        return "message";
      default:
        return "error";
    }
  }

  /**
   * Get all effective ignore patterns (default + custom)
   */
  public getIgnorePatterns(): IgnorePattern[] {
    return [
      ...this.defaultIgnorePatterns,
      ...(this.options.ignorePatterns || []),
    ];
  }

  /**
   * Add a custom ignore pattern
   */
  public addIgnorePattern(pattern: IgnorePattern): void {
    if (!this.options.ignorePatterns) {
      this.options.ignorePatterns = [];
    }
    this.options.ignorePatterns.push(pattern);
  }

  /**
   * Run transformation tests for all fixtures in a directory
   */
  async runFixtureTests(testName: string): Promise<TransformationTestResult[]> {
    // Try exact match first
    const exactPattern = path.join(
      this.options.fixtureDir,
      `${testName}.input.tsx`
    );
    let inputFiles = glob.sync(exactPattern);

    // If no exact match, try wildcard pattern for variants
    if (inputFiles.length === 0) {
      const wildcardPattern = path.join(
        this.options.fixtureDir,
        `${testName}.*.input.tsx`
      );
      inputFiles = glob.sync(wildcardPattern);
    }

    if (inputFiles.length === 0) {
      throw new Error(`No input fixtures found for testName: ${testName}. Tried patterns:
        - ${exactPattern}
        - ${path.join(this.options.fixtureDir, `${testName}.*.input.tsx`)}`);
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
  async runSingleFixtureTest(
    inputFilePath: string
  ): Promise<TransformationTestResult> {
    const inputContent = fs.readFileSync(inputFilePath, "utf8");

    // Extract the full filename without extension for proper snapshot naming
    // e.g., "inline-with-destructuring.basic.input.tsx" -> "inline-with-destructuring.basic"
    const fullBaseName = path.basename(inputFilePath, ".input.tsx");
    const componentName = this.extractComponentName(inputContent);

    // Validate input file syntax if enabled
    const inputValidation =
      this.options.validateSyntax !== false
        ? this.validateTypeScriptSyntax(inputContent, `${componentName}-input`)
        : {
            isValid: true,
            diagnostics: [],
            hasErrors: false,
            hasWarnings: false,
          };

    if (!inputValidation.isValid) {
      if (this.options.verbose) {
        console.error(
          `❌ Input TypeScript validation failed for ${componentName}: ${inputFilePath}`
        );
        inputValidation.diagnostics.forEach((diag) => {
          const location = diag.line
            ? ` (line ${diag.line}, col ${diag.column})`
            : "";
          console.error(
            `  INPUT ${diag.category.toUpperCase()}: ${diag.message}${location}`
          );
        });
      }

      if (this.options.failOnSyntaxErrors) {
        throw new Error(
          `Input TypeScript validation failed for ${componentName}. Enable verbose mode to see details.`
        );
      }
    }

    // Add input file to project
    const sourceFile = this.project.createSourceFile(
      `${fullBaseName}.tsx`,
      inputContent
    );

    // Add any separate interface files if they exist
    await this.addSeparateInterfaceFiles(inputFilePath);

    // Run transformation
    const transformedFiles = await this.transformer.transformForBuild();

    // Get transformed content
    const transformedContent =
      transformedFiles.get(sourceFile.getFilePath()) || inputContent;

    // Extract dependencies for analysis
    const dependencies =
      this.extractDependenciesFromTransformed(transformedContent);

    // Validate output TypeScript syntax if enabled
    const outputValidation =
      this.options.validateSyntax !== false
        ? this.validateTypeScriptSyntax(
            transformedContent,
            `${componentName}-output`
          )
        : {
            isValid: true,
            diagnostics: [],
            hasErrors: false,
            hasWarnings: false,
          };

    if (!outputValidation.isValid) {
      if (this.options.verbose) {
        console.error(
          `❌ Output TypeScript validation failed for ${componentName}: ${inputFilePath}`
        );
        outputValidation.diagnostics.forEach((diag) => {
          const location = diag.line
            ? ` (line ${diag.line}, col ${diag.column})`
            : "";
          console.error(
            `  OUTPUT ${diag.category.toUpperCase()}: ${diag.message}${location}`
          );
        });
      }

      // Fail if configured to do so
      if (this.options.failOnSyntaxErrors) {
        throw new Error(
          `Output TypeScript validation failed for ${componentName}. Enable verbose mode to see details.`
        );
      }
    } else if (outputValidation.isValid && this.options.verbose) {
      console.log(`✅ TypeScript validation passed for ${componentName}`);
      if (outputValidation.hasWarnings) {
        console.warn(`⚠️ ${componentName} has warnings:`);
        outputValidation.diagnostics
          .filter((d) => d.category === "warning")
          .forEach((diag) => {
            const location = diag.line
              ? ` (line ${diag.line}, col ${diag.column})`
              : "";
            console.warn(`  WARNING: ${diag.message}${location}`);
          });
      }
    }

    const result: TransformationTestResult = {
      input: inputContent,
      output: transformedContent,
      transformedFilePath: sourceFile.getFilePath(),
      componentName,
      dependencies,
      inputFilePath, // Track the original input file path
      validation: outputValidation, // Keep output validation as the main validation
      inputValidation, // Add input validation separately
    };

    // Generate or verify snapshot using the full base name (including variant)
    await this.handleSnapshot(fullBaseName, result);

    return result;
  }

  private async addSeparateInterfaceFiles(
    inputFilePath: string
  ): Promise<void> {
    const baseDir = path.dirname(inputFilePath);
    const baseName = path.basename(inputFilePath, ".input.tsx");

    // Look for corresponding interface files
    const interfaceFiles = [
      `${baseName}.interfaces.ts`,
      `${baseName}.types.ts`,
      "shared-interfaces.ts",
      "ComponentInterfaces.ts",
    ];

    for (const interfaceFile of interfaceFiles) {
      const interfacePath = path.join(baseDir, interfaceFile);
      if (fs.existsSync(interfacePath)) {
        const interfaceContent = fs.readFileSync(interfacePath, "utf8");
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

    return "UnknownComponent";
  }

  private extractDependenciesFromTransformed(content: string): any[] {
    const dependencies = [];

    // Extract useService calls
    const useServiceMatches = content.matchAll(
      /const\s+(\w+)\s+=\s+useService\('([^']+)'\)/g
    );
    for (const match of useServiceMatches) {
      dependencies.push({
        serviceKey: match[1],
        token: match[2],
        type: "required",
      });
    }

    // Extract useOptionalService calls
    const useOptionalMatches = content.matchAll(
      /const\s+(\w+)\s+=\s+useOptionalService\('([^']+)'\)/g
    );
    for (const match of useOptionalMatches) {
      dependencies.push({
        serviceKey: match[1],
        token: match[2],
        type: "optional",
      });
    }

    // Extract undefined assignments (missing optional dependencies)
    const undefinedMatches = content.matchAll(
      /const\s+(\w+)\s+=\s+undefined;\s*\/\/\s*Optional dependency not found/g
    );
    for (const match of undefinedMatches) {
      dependencies.push({
        serviceKey: match[1],
        token: null,
        type: "missing-optional",
      });
    }

    return dependencies;
  }

  private async handleSnapshot(
    fullBaseName: string,
    result: TransformationTestResult
  ): Promise<void> {
    const snapshotDir =
      this.options.outputDir ||
      path.join(this.options.fixtureDir, "__snapshots__");

    // Use the full base name (including variant) for snapshot naming
    // e.g., "inline-with-destructuring.basic" -> "inline-with-destructuring.basic.transformed.snap.tsx"
    const snapshotPath = path.join(
      snapshotDir,
      `${fullBaseName}.transformed.snap.tsx`
    );

    // Ensure snapshot directory exists
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const snapshotContent = this.generateSnapshotContent(result);

    if (this.options.updateSnapshots || !fs.existsSync(snapshotPath)) {
      fs.writeFileSync(snapshotPath, snapshotContent, "utf8");

      if (this.options.verbose) {
        console.log(`📸 Created/updated snapshot: ${snapshotPath}`);
      }
    } else {
      // Verify existing snapshot
      const existingSnapshot = fs.readFileSync(snapshotPath, "utf8");

      // Format and normalize both contents before comparison
      const normalizedExisting =
        this.normalizeAndFormatForComparison(existingSnapshot);
      const normalizedNew =
        this.normalizeAndFormatForComparison(snapshotContent);

      if (normalizedExisting !== normalizedNew) {
        const diff = this.generateDiff(
          normalizedExisting,
          normalizedNew,
          snapshotPath
        );
        throw new Error(
          `Snapshot mismatch for ${fullBaseName}. Run with UPDATE_SNAPSHOTS=1 to update.\n\n${diff}`
        );
      }
    }
  }

  /**
   * Generate a unified diff using the 'diff' package
   */
  private generateDiff(
    expected: string,
    actual: string,
    filePath: string
  ): string {
    const fileName = path.basename(filePath);

    // Use createTwoFilesPatch for git-style diff output
    const patch = createTwoFilesPatch(
      `a/${fileName}`, // old file name
      `b/${fileName}`, // new file name
      expected, // old content
      actual, // new content
      "Expected", // old header
      "Actual", // new header
      {
        context: 3, // lines of context
      }
    );

    return patch;
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
        // Extract full base name from the input file path including variant
        // e.g., "/path/to/inline-with-destructuring.basic.input.tsx" -> "inline-with-destructuring.basic"
        const fullBaseName = path.basename(result.inputFilePath, ".input.tsx");

        // Load snapshot with the correct name
        const snapshotPath = path.join(
          this.options.outputDir ||
            path.join(this.options.fixtureDir, "__snapshots__"),
          `${fullBaseName}.transformed.snap.tsx`
        );

        if (fs.existsSync(snapshotPath)) {
          const snapshotContent = fs.readFileSync(snapshotPath, "utf8");
          // Extract just the code part (remove comment headers)
          const expectedOutput = snapshotContent
            .split("\n")
            .filter((line) => !line.startsWith("//"))
            .join("\n")
            .trim();

          // Normalize and format both contents before comparison
          const normalizedExpected =
            this.normalizeAndFormatForComparison(expectedOutput);
          const normalizedActual = this.normalizeAndFormatForComparison(
            result.output.trim()
          );

          // Compare transformation output
          expect(normalizedActual).toBe(normalizedExpected);
        } else {
          throw new Error(
            `Snapshot not found: ${snapshotPath}. Run the test with UPDATE_SNAPSHOTS=1 first.`
          );
        }
      }
    };
  }

  /**
   * Utility method to test ignore patterns without running full transformation
   */
  public testIgnorePattern(
    content: string,
    pattern: IgnorePattern
  ): {
    matches: boolean;
    result: string;
    matchCount: number;
    formattedResult?: string;
  } {
    const matches = pattern.pattern.test(content);
    const result = content.replace(
      pattern.pattern,
      pattern.replacement || "[IGNORED]"
    );
    const matchCount = (content.match(pattern.pattern) || []).length;

    // Also provide formatted result
    const formattedResult = this.formatTypeScriptContent(result);

    return { matches, result, matchCount, formattedResult };
  }

  /**
   * Utility method to preview the normalization and formatting process
   */
  public previewNormalization(content: string): {
    original: string;
    formatted: string;
    normalized: string;
    finalResult: string;
  } {
    const formatted = this.formatTypeScriptContent(content);
    const normalized = this.normalizeContentForComparison(content);
    const finalResult = this.normalizeAndFormatForComparison(content);

    return {
      original: content,
      formatted,
      normalized,
      finalResult,
    };
  }

  /**
   * Debug method to test formatting
   */
  public debugFormatting(content: string): {
    original: string;
    formatted: string;
    isFormatted: boolean;
  } {
    const formatted = this.formatTypeScriptContent(content);
    return {
      original: content,
      formatted,
      isFormatted: content !== formatted,
    };
  }

  /**
   * Public method to validate any TypeScript content
   */
  public validateContent(
    content: string,
    name: string = "content"
  ): {
    isValid: boolean;
    diagnostics: Array<{
      message: string;
      line?: number;
      column?: number;
      category: "error" | "warning" | "suggestion" | "message";
    }>;
    hasErrors: boolean;
    hasWarnings: boolean;
  } {
    return this.validateTypeScriptSyntax(content, name);
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
    type: "required" | "optional" | "missing-optional";
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

// Utility function for creating tests with ignore patterns and validation
export function defineTransformationTest(
  testName: string,
  fixtureDir: string,
  options?: Partial<TransformationTestOptions>
): () => Promise<void> {
  const framework = new TransformationTestFramework({
    fixtureDir,
    verbose: false,
    updateSnapshots: [
      "1",
      "true",
      "True",
      "TRUE",
      "yes",
      "Yes",
      "YES",
    ].includes(process.env.UPDATE_SNAPSHOTS || ""),
    validateSyntax: true, // Enable syntax validation by default
    failOnSyntaxErrors: false, // Don't fail tests by default, just log
    ...options,
  });

  return framework.createJestTest(testName);
}

// Predefined ignore pattern factories for common use cases
export const IgnorePatternFactories = {
  timestamp: (format?: "iso" | "human" | "unix"): IgnorePattern => {
    switch (format) {
      case "human":
        return {
          pattern: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g,
          replacement: "[TIMESTAMP]",
          description: "Human readable timestamp (YYYY-MM-DD HH:mm:ss)",
        };
      case "unix":
        return {
          pattern: /\b\d{10,13}\b/g,
          replacement: "[TIMESTAMP]",
          description: "Unix timestamp",
        };
      case "iso":
      default:
        return {
          pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
          replacement: "[TIMESTAMP]",
          description: "ISO 8601 timestamp",
        };
    }
  },

  uuid: (): IgnorePattern => ({
    pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    replacement: "[UUID]",
    description: "UUID v4",
  }),

  hash: (length?: number): IgnorePattern => ({
    pattern: new RegExp(`\\b[a-f0-9]{${(length || 32, 64)}}\\b`, "gi"),
    replacement: "[HASH]",
    description: `Hash (${length || "32-64"} chars)`,
  }),

  buildNumber: (): IgnorePattern => ({
    pattern: /build[:\s]+\d+/gi,
    replacement: "build: [NUMBER]",
    description: "Build number",
  }),

  version: (): IgnorePattern => ({
    pattern: /v?\d+\.\d+\.\d+(-[\w\.-]+)?/g,
    replacement: "[VERSION]",
    description: "Semantic version",
  }),

  custom: (
    pattern: RegExp,
    replacement: string,
    description?: string
  ): IgnorePattern => ({
    pattern,
    replacement,
    description: description || `Custom pattern: ${pattern.source}`,
  }),
};
