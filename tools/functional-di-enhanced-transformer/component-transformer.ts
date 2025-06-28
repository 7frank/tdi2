// tools/functional-di-enhanced-transformer/component-transformer.ts - Transforms React components

import {
  FunctionDeclaration,
  ArrowFunction,
  Node,
} from 'ts-morph';
import { FunctionalDependency, TransformationOptions, DICodeGenerationResult } from './types';
import { CodeGenerator } from './code-generator';
import { DestructuringProcessor } from './destructuring-processor';

export class ComponentTransformer {
  private codeGenerator: CodeGenerator;
  private destructuringProcessor: DestructuringProcessor;

  constructor(private options: TransformationOptions) {
    this.codeGenerator = new CodeGenerator(options);
    this.destructuringProcessor = new DestructuringProcessor(options);
  }

  /**
   * Transform a function declaration component
   */
  transformFunction(func: FunctionDeclaration, dependencies: FunctionalDependency[]): void {
    const body = func.getBody();
    if (!body || !Node.isBlock(body)) return;

    // Remove services from destructuring first
    this.destructuringProcessor.removeServicesFromDestructuring(body);

    // Generate DI code
    const diCode = this.codeGenerator.generateDICode(dependencies);

    // Insert at the beginning of the function body
    for (let i = diCode.statements.length - 1; i >= 0; i--) {
      body.insertStatements(0, diCode.statements[i]);
    }
  }

  /**
   * Transform an arrow function component
   */
  transformArrowFunction(arrowFunc: ArrowFunction, dependencies: FunctionalDependency[]): void {
    const body = arrowFunc.getBody();
    if (!Node.isBlock(body)) return;

    // Remove services from destructuring first
    this.destructuringProcessor.removeServicesFromDestructuring(body);

    // Generate DI code
    const diCode = this.codeGenerator.generateDICode(dependencies);

    // Insert at the beginning of the function body
    for (let i = diCode.statements.length - 1; i >= 0; i--) {
      body.insertStatements(0, diCode.statements[i]);
    }
  }

  /**
   * Check if a component needs transformation
   */
  needsTransformation(parameters: any[]): boolean {
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const typeNode = firstParam.getTypeNode();
    if (!typeNode) return false;

    // Check for DI markers in the type
    const typeText = typeNode.getText();
    return typeText.includes('Inject<') || typeText.includes('InjectOptional<');
  }

  /**
   * Validate component transformation
   */
  validateTransformation(component: FunctionDeclaration | ArrowFunction): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const parameters = component.getParameters();

    if (parameters.length === 0) {
      issues.push('Component has no parameters');
      return { isValid: false, issues };
    }

    if (parameters.length > 1) {
      issues.push('Component has multiple parameters - only first parameter will be processed');
    }

    const firstParam = parameters[0];
    const typeNode = firstParam.getTypeNode();
    
    if (!typeNode) {
      issues.push('First parameter has no type annotation');
      return { isValid: false, issues };
    }

    // Check for supported type patterns
    const typeText = typeNode.getText();
    const hasInlineType = Node.isTypeLiteral(typeNode);
    const hasTypeReference = Node.isTypeReference(typeNode);
    
    if (!hasInlineType && !hasTypeReference) {
      issues.push('Parameter type is not a supported pattern (should be inline type literal or type reference)');
      return { isValid: false, issues };
    }

    // Check for DI markers
    if (!typeText.includes('Inject<') && !typeText.includes('InjectOptional<')) {
      issues.push('Parameter type contains no DI markers (Inject<> or InjectOptional<>)');
      return { isValid: false, issues };
    }

    return { isValid: true, issues };
  }

  /**
   * Get transformation statistics
   */
  getTransformationStats(func: FunctionDeclaration | ArrowFunction): {
    parameterCount: number;
    hasTypeAnnotation: boolean;
    hasDIMarkers: boolean;
    typePattern: 'inline' | 'reference' | 'unknown';
  } {
    const parameters = func.getParameters();
    const parameterCount = parameters.length;
    
    if (parameterCount === 0) {
      return {
        parameterCount,
        hasTypeAnnotation: false,
        hasDIMarkers: false,
        typePattern: 'unknown'
      };
    }

    const firstParam = parameters[0];
    const typeNode = firstParam.getTypeNode();
    const hasTypeAnnotation = !!typeNode;
    
    if (!typeNode) {
      return {
        parameterCount,
        hasTypeAnnotation,
        hasDIMarkers: false,
        typePattern: 'unknown'
      };
    }

    const typeText = typeNode.getText();
    const hasDIMarkers = typeText.includes('Inject<') || typeText.includes('InjectOptional<');
    
    let typePattern: 'inline' | 'reference' | 'unknown';
    if (Node.isTypeLiteral(typeNode)) {
      typePattern = 'inline';
    } else if (Node.isTypeReference(typeNode)) {
      typePattern = 'reference';
    } else {
      typePattern = 'unknown';
    }

    return {
      parameterCount,
      hasTypeAnnotation,
      hasDIMarkers,
      typePattern
    };
  }
}