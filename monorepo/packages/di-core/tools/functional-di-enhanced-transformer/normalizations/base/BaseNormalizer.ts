import { 
  SourceFile, 
  FunctionDeclaration, 
  ArrowFunction, 
  Block,
  Node 
} from "ts-morph";

/**
 * Options for normalization operations
 */
export interface NormalizationOptions {
  verbose?: boolean;
  preserveComments?: boolean;
}

/**
 * Result of a normalization operation
 */
export interface NormalizationResult {
  success: boolean;
  transformationsCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Abstract base class for all normalizers
 * Provides common utilities and interface for AST transformations
 */
export abstract class BaseNormalizer {
  protected options: NormalizationOptions;

  constructor(options: NormalizationOptions = {}) {
    this.options = {
      verbose: false,
      preserveComments: true,
      ...options
    };
  }

  /**
   * Main normalization method - must be implemented by subclasses
   */
  abstract normalize(sourceFile: SourceFile): NormalizationResult;

  /**
   * Get the function body as a Block node
   */
  protected getFunctionBody(func: FunctionDeclaration | ArrowFunction): Block | undefined {
    const body = func.getBody();
    if (Node.isBlock(body)) {
      return body;
    }
    return undefined;
  }

  /**
   * Check if a function has destructuring in its parameters
   */
  protected hasDestructuringParameters(func: FunctionDeclaration | ArrowFunction): boolean {
    const parameters = func.getParameters();
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const nameNode = firstParam.getNameNode();
    return Node.isObjectBindingPattern(nameNode);
  }

  /**
   * Find all functions in the source file
   */
  protected getAllFunctions(sourceFile: SourceFile): (FunctionDeclaration | ArrowFunction)[] {
    const functions: (FunctionDeclaration | ArrowFunction)[] = [];
    
    // Find function declarations
    sourceFile.getFunctions().forEach(func => functions.push(func));
    
    // Find arrow functions (more complex traversal needed)
    sourceFile.forEachDescendant(node => {
      if (Node.isArrowFunction(node)) {
        functions.push(node);
      }
    });

    return functions;
  }

  /**
   * Log verbose messages if enabled
   */
  protected log(message: string): void {
    if (this.options.verbose) {
      console.log(`[${this.constructor.name}] ${message}`);
    }
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(transformationsCount: number): NormalizationResult {
    return {
      success: true,
      transformationsCount,
      errors: [],
      warnings: []
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(errors: string[], transformationsCount: number = 0): NormalizationResult {
    return {
      success: false,
      transformationsCount,
      errors,
      warnings: []
    };
  }

  /**
   * Add warning to result
   */
  protected addWarning(result: NormalizationResult, warning: string): void {
    result.warnings.push(warning);
  }
}