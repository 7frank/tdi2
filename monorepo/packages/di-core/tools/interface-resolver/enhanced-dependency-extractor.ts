// tools/interface-resolver/enhanced-dependency-extractor.ts - ENHANCED with robust circular protection

import {
  ParameterDeclaration,
  Node,
  TypeNode,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  SourceFile,
  ImportDeclaration,
  TypeReferenceNode,
  UnionTypeNode,
  IntersectionTypeNode,
  ArrayTypeNode,
  ConditionalTypeNode
} from 'ts-morph';
import * as path from 'path';
import { FunctionalDependency, TransformationOptions, TypeResolutionContext } from '../functional-di-enhanced-transformer/types';

import { KeySanitizer } from '../interface-resolver/key-sanitizer';
import type { DISourceConfiguration } from '../interface-resolver/enhanced-interface-extractor';
import { consoleFor } from '../logger';

const console = consoleFor('di-core:enhanced-dependency-extractor');

export interface CircularProtectionConfig {
  maxDepth: number;
  maxCircularReferences: number;
  enableCircularDetection: boolean;
}

export class EnhancedDependencyExtractor {
  private keySanitizer: KeySanitizer;
  private sourceConfig: DISourceConfiguration;
  private validationCache = new Map<string, boolean>();
  
  // ENHANCED: Robust circular protection
  private circularProtection = new Set<string>();
  private depthTracker = new Map<string, number>();
  private circularProtectionConfig: CircularProtectionConfig;
  private extractionStats = {
    totalExtractions: 0,
    circularDetections: 0,
    maxDepthReached: 0,
    avgDepth: 0
  };

  constructor(
    private options: TransformationOptions,
    sourceConfig?: Partial<DISourceConfiguration>,
    circularConfig?: Partial<CircularProtectionConfig>
  ) {
    this.keySanitizer = new KeySanitizer();
    this.sourceConfig = {
      decoratorSources: [
        "@tdi2/di-core/decorators",
        "@tdi2/di-core",
        "./decorators",
        "../decorators"
      ],
      markerSources: [
        "@tdi2/di-core/markers", 
        "@tdi2/di-core",
        "./markers",
        "../markers"
      ],
      validateSources: true,
      ...sourceConfig
    };

    // ENHANCED: Configurable circular protection
    this.circularProtectionConfig = {
      maxDepth: 10, // Default max depth
      maxCircularReferences: 50, // Max total circular refs before giving up
      enableCircularDetection: true,
      ...circularConfig
    };
  }

  /**
   * ENHANCED: Extract dependencies with robust circular protection
   */
  extractDependenciesFromParameter(param: ParameterDeclaration, sourceFile: SourceFile): FunctionalDependency[] {
    // Reset protection for each parameter
    this.resetCircularProtection();
    this.extractionStats.totalExtractions++;

    const typeNode = param.getTypeNode();
    if (!typeNode) {
      if (this.options.verbose) {
        console.log('⚠️  Parameter has no type node');
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`🔍 Analyzing parameter: ${param.getName()}`);
      console.log(`🔍 Parameter type: ${typeNode.getKindName()}`);
      console.log(`📝 Parameter type text: ${typeNode.getText()}`);
    }

    try {
      // ENHANCED: Use comprehensive extraction with depth tracking
      return this.extractDependenciesFromTypeNodeWithProtection(
        typeNode, 
        sourceFile, 
        param.getName(),
        0 // Starting depth
      );
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to extract dependencies from parameter ${param.getName()}:`, error);
      }
      return [];
    } finally {
      // Always clean up
      this.resetCircularProtection();
      
      if (this.options.verbose) {
        console.log(`📊 Extraction stats: ${JSON.stringify(this.extractionStats, null, 2)}`);
      }
    }
  }

  /**
   * ENHANCED: Type node analysis with robust depth and circular protection
   */
  private extractDependenciesFromTypeNodeWithProtection(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    
    // DEPTH PROTECTION: Check max depth
    if (currentDepth >= this.circularProtectionConfig.maxDepth) {
      if (this.options.verbose) {
        console.log(`🛑 Max depth ${this.circularProtectionConfig.maxDepth} reached at ${basePath}, stopping`);
      }
      this.extractionStats.maxDepthReached++;
      return [];
    }

    // CIRCULAR PROTECTION: Enhanced circular detection
    if (this.circularProtectionConfig.enableCircularDetection) {
      const pathKey = this.createPathKey(sourceFile, basePath, typeNode, currentDepth);
      
      if (this.circularProtection.has(pathKey)) {
        if (this.options.verbose) {
          console.log(`🔄 Circular reference detected at ${basePath} (depth: ${currentDepth}), skipping`);
        }
        this.extractionStats.circularDetections++;
        return [];
      }

      // Check if we've exceeded max circular references
      if (this.circularProtection.size >= this.circularProtectionConfig.maxCircularReferences) {
        if (this.options.verbose) {
          console.log(`🛑 Max circular references ${this.circularProtectionConfig.maxCircularReferences} exceeded, stopping`);
        }
        return [];
      }

      // Add to protection
      this.circularProtection.add(pathKey);
      this.depthTracker.set(pathKey, currentDepth);
    }

    // Update stats
    this.extractionStats.avgDepth = (this.extractionStats.avgDepth + currentDepth) / 2;

    try {
      // Call the original extraction logic with depth parameter
      return this.extractDependenciesFromTypeNode(typeNode, sourceFile, basePath, currentDepth);
    } finally {
      // IMPORTANT: Remove from protection when done (backtracking)
      if (this.circularProtectionConfig.enableCircularDetection) {
        const pathKey = this.createPathKey(sourceFile, basePath, typeNode, currentDepth);
        this.circularProtection.delete(pathKey);
        this.depthTracker.delete(pathKey);
      }
    }
  }

  /**
   * ENHANCED: Comprehensive type node analysis with depth parameter
   */
  private extractDependenciesFromTypeNode(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    
    // Case 1: Direct marker injection - Inject<FooInterface>
    if (this.isDirectMarkerInjection(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found direct marker injection at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromDirectMarkerEnhanced(typeNode, sourceFile, basePath);
    }

    // Case 2: Type literal - { services: {...}, config: any }
    if (Node.isTypeLiteral(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found type literal at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromTypeLiteralEnhanced(typeNode, sourceFile, basePath, currentDepth);
    }

    // Case 3: Type reference - ComponentProps, ServiceConfig, etc.
    if (Node.isTypeReference(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found type reference at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromTypeReferenceEnhanced(typeNode, sourceFile, basePath, currentDepth);
    }

    // Case 4: Union type - { services: {...} } | { fallback: true }
    if (Node.isUnionTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found union type at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromUnionType(typeNode, sourceFile, basePath, currentDepth);
    }

    // Case 5: Intersection type - ServiceProps & ConfigProps
    if (Node.isIntersectionTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found intersection type at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromIntersectionType(typeNode, sourceFile, basePath, currentDepth);
    }

    // Case 6: Array type - Array<{ service: Inject<T> }> or T[]
    if (Node.isArrayTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found array type at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromArrayType(typeNode, sourceFile, basePath, currentDepth);
    }

    // Case 7: Tuple type - [Type1, Type2, ...]
    if (Node.isTupleTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found tuple type at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromTupleType(typeNode, sourceFile, basePath, currentDepth);
    }

    // Case 8: Mapped type - { [K in keyof T]: ... }
    if (Node.isMappedTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found mapped type at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromMappedType(typeNode, sourceFile, basePath, currentDepth);
    }

    // Case 9: Conditional type - T extends U ? X : Y
    if (Node.isConditionalTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found conditional type at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromConditionalType(typeNode, sourceFile, basePath, currentDepth);
    }

    if (this.options.verbose) {
      console.log(`⚠️  Type node ${typeNode.getKindName()} at ${basePath} (depth: ${currentDepth}) not supported for dependency extraction`);
    }

    return [];
  }

  /**
   * ENHANCED: Create a comprehensive path key for circular detection
   */
  private createPathKey(sourceFile: SourceFile, basePath: string, typeNode: TypeNode, depth: number): string {
    const filePath = sourceFile.getFilePath();
    const typeText = typeNode.getText();
    const typeKind = typeNode.getKindName();
    
    // Create a more robust key that includes:
    // 1. File path (to handle cross-file references)
    // 2. Base path (to track nested property access)
    // 3. Type text (to differentiate between different types)
    // 4. Type kind (to differentiate between different node types)
    // 5. Depth (to track how deep we are)
    return `${filePath}:${basePath}:${typeKind}:${typeText}:${depth}`;
  }

  /**
   * ENHANCED: Reset circular protection between extractions
   */
  private resetCircularProtection(): void {
    this.circularProtection.clear();
    this.depthTracker.clear();
  }

  /**
   * ENHANCED: Type literal extraction with depth tracking
   */
  private extractFromTypeLiteralEnhanced(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (!Node.isTypeLiteral(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const members = typeNode.getMembers();

    if (this.options.verbose) {
      console.log(`🔍 Processing type literal with ${members.length} members at ${basePath} (depth: ${currentDepth})`);
    }

    for (const member of members) {
      if (Node.isPropertySignature(member)) {
        const memberName = member.getName();
        const memberPath = basePath ? `${basePath}.${memberName}` : memberName;
        const memberTypeNode = member.getTypeNode();

        if (!memberTypeNode) {
          if (this.options.verbose) {
            console.log(`⚠️  Property ${memberPath} has no type node`);
          }
          continue;
        }

        if (this.options.verbose) {
          console.log(`🔍 Processing property: ${memberPath} (${memberTypeNode.getKindName()}) at depth ${currentDepth}`);
        }

        // Recursive call with incremented depth
        const memberDeps = this.extractDependenciesFromTypeNodeWithProtection(
          memberTypeNode, 
          sourceFile, 
          memberPath,
          currentDepth + 1
        );
        
        // Special handling for 'services' property
        if (memberName === 'services') {
          dependencies.push(...memberDeps);
        } else {
          // If this is a direct marker injection, use the property name as the service key
          if (memberDeps.length > 0 && this.isDirectMarkerInjection(memberTypeNode)) {
            memberDeps.forEach(dep => {
              dep.serviceKey = memberName;
            });
          }
          dependencies.push(...memberDeps);
        }
      } else {
        if (this.options.verbose) {
          console.log(`⚠️  Skipping non-property member: ${member.getKindName()} at ${basePath} (depth: ${currentDepth})`);
        }
      }
    }

    return dependencies;
  }

  /**
   * ENHANCED: Extract from conditional types (T extends U ? X : Y) with depth tracking and type parameter resolution
   */
  private extractFromConditionalType(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (!Node.isConditionalTypeNode(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const conditionalType = typeNode as ConditionalTypeNode;

    if (this.options.verbose) {
      console.log(`🔍 Processing conditional type at ${basePath} (depth: ${currentDepth})`);
    }

    try {
      // ENHANCED: Try to resolve the conditional type based on context
      const resolvedTypeParameters = this.extractTypeParametersFromContext(basePath, sourceFile);
      
      // Extract dependencies from both branches of the conditional type
      const trueType = conditionalType.getTrueType();
      if (trueType) {
        if (this.options.verbose) {
          console.log(`🔍 Processing conditional true branch: ${trueType.getKindName()} at depth ${currentDepth}`);
        }
        const trueDeps = this.extractDependenciesFromTypeNodeWithTypeParams(
          trueType, 
          sourceFile, 
          `${basePath}<true>`,
          resolvedTypeParameters,
          currentDepth + 1
        );
        dependencies.push(...trueDeps);
      }

      const falseType = conditionalType.getFalseType();
      if (falseType) {
        if (this.options.verbose) {
          console.log(`🔍 Processing conditional false branch: ${falseType.getKindName()} at depth ${currentDepth}`);
        }
        const falseDeps = this.extractDependenciesFromTypeNodeWithTypeParams(
          falseType, 
          sourceFile, 
          `${basePath}<false>`,
          resolvedTypeParameters,
          currentDepth + 1
        );
        dependencies.push(...falseDeps);
      }

    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to process conditional type at ${basePath} (depth: ${currentDepth}):`, error);
      }
    }

    return dependencies;
  }

  /**
   * ENHANCED: Union type extraction with depth tracking
   */
  private extractFromUnionType(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (!Node.isUnionTypeNode(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const unionTypes = (typeNode as UnionTypeNode).getTypeNodes();

    if (this.options.verbose) {
      console.log(`🔍 Processing union type with ${unionTypes.length} variants at ${basePath} (depth: ${currentDepth})`);
    }

    // Extract dependencies from each variant of the union
    for (let i = 0; i < unionTypes.length; i++) {
      const unionVariant = unionTypes[i];
      const variantPath = `${basePath}[union:${i}]`;
      
      const variantDeps = this.extractDependenciesFromTypeNodeWithProtection(
        unionVariant, 
        sourceFile, 
        variantPath,
        currentDepth + 1
      );
      dependencies.push(...variantDeps);
    }

    return dependencies;
  }

  /**
   * ENHANCED: Intersection type extraction with depth tracking
   */
  private extractFromIntersectionType(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (!Node.isIntersectionTypeNode(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const intersectionTypes = (typeNode as IntersectionTypeNode).getTypeNodes();

    if (this.options.verbose) {
      console.log(`🔍 Processing intersection type with ${intersectionTypes.length} types at ${basePath} (depth: ${currentDepth})`);
    }

    // Extract dependencies from each part of the intersection
    for (let i = 0; i < intersectionTypes.length; i++) {
      const intersectionPart = intersectionTypes[i];
      const partPath = `${basePath}[intersection:${i}]`;
      
      const partDeps = this.extractDependenciesFromTypeNodeWithProtection(
        intersectionPart, 
        sourceFile, 
        partPath,
        currentDepth + 1
      );
      dependencies.push(...partDeps);
    }

    return dependencies;
  }

  /**
   * ENHANCED: Array type extraction with depth tracking
   */
  private extractFromArrayType(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (!Node.isArrayTypeNode(typeNode)) return [];

    const elementTypeNode = (typeNode as ArrayTypeNode).getElementTypeNode();
    
    if (this.options.verbose) {
      console.log(`🔍 Processing array type at ${basePath} (depth: ${currentDepth}), element type: ${elementTypeNode.getKindName()}`);
    }

    // Extract dependencies from the array element type
    return this.extractDependenciesFromTypeNodeWithProtection(
      elementTypeNode, 
      sourceFile, 
      `${basePath}[]`,
      currentDepth + 1
    );
  }

  /**
   * ENHANCED: Tuple type extraction with depth tracking
   */
  private extractFromTupleType(
    typeNode: any, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    const dependencies: FunctionalDependency[] = [];
    
    try {
      const elementTypes = typeNode.getElementTypeNodes();
      
      if (this.options.verbose) {
        console.log(`🔍 Processing tuple type with ${elementTypes.length} elements at ${basePath} (depth: ${currentDepth})`);
      }

      // Extract dependencies from each tuple element
      elementTypes.forEach((elementType: TypeNode, index: number) => {
        const elementDeps = this.extractDependenciesFromTypeNodeWithProtection(
          elementType, 
          sourceFile, 
          `${basePath}[${index}]`,
          currentDepth + 1
        );
        dependencies.push(...elementDeps);
      });
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to process tuple type at ${basePath} (depth: ${currentDepth}):`, error);
      }
    }

    return dependencies;
  }

  /**
   * ENHANCED: Mapped type extraction with depth tracking
   */
  private extractFromMappedType(
    typeNode: any, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (this.options.verbose) {
      console.log(`🔍 Processing mapped type at ${basePath} (depth: ${currentDepth}) (simplified extraction)`);
    }

    try {
      // For mapped types, try to get the template type
      const templateType = typeNode.getTemplateTypeNode?.();
      if (templateType) {
        return this.extractDependenciesFromTypeNodeWithProtection(
          templateType, 
          sourceFile, 
          `${basePath}<mapped>`,
          currentDepth + 1
        );
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to process mapped type at ${basePath} (depth: ${currentDepth}):`, error);
      }
    }

    return [];
  }

  /**
   * ENHANCED: Type reference extraction with depth tracking
   */
  private extractFromTypeReferenceEnhanced(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (!Node.isTypeReference(typeNode)) return [];

    // First check if this type reference itself is a marker injection
    if (this.isDirectMarkerInjection(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Type reference is direct marker injection at ${basePath} (depth: ${currentDepth})`);
      }
      return this.extractFromDirectMarkerEnhanced(typeNode, sourceFile, basePath);
    }

    // Handle built-in Array type specifically
    const typeReference = typeNode as TypeReferenceNode;
    const typeName = typeReference.getTypeName().getText();
    
    if (typeName === 'Array') {
      if (this.options.verbose) {
        console.log(`🔍 Handling built-in Array type at ${basePath} (depth: ${currentDepth})`);
      }
      return this.handleBuiltInArrayType(typeReference, sourceFile, basePath, currentDepth);
    }

    if (this.options.verbose) {
      console.log(`🔍 Resolving type reference: ${typeName} at ${basePath} (depth: ${currentDepth})`);
    }

    // Check if this is a built-in type that we should handle specially
    if (this.isBuiltInType(typeName)) {
      if (this.options.verbose) {
        console.log(`📝 Handling built-in type: ${typeName} at ${basePath} (depth: ${currentDepth})`);
      }
      return this.handleBuiltInType(typeReference, sourceFile, basePath, currentDepth);
    }

    // Find the type declaration
    const typeDeclaration = this.findTypeDeclaration(typeName, sourceFile);
    if (!typeDeclaration) {
      if (this.options.verbose) {
        console.log(`❌ Could not resolve type declaration for: ${typeName} at depth ${currentDepth}`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Found type declaration: ${typeDeclaration.getKindName()} at depth ${currentDepth}`);
    }

    // Extract dependencies from the resolved type
    if (Node.isInterfaceDeclaration(typeDeclaration)) {
      return this.extractFromInterfaceDeclarationEnhanced(typeDeclaration, sourceFile, basePath, currentDepth);
    }

    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      return this.extractFromTypeAliasDeclarationEnhanced(typeDeclaration, sourceFile, basePath, currentDepth);
    }

    return [];
  }

  /**
   * ENHANCED: Interface declaration extraction with depth tracking
   */
  private extractFromInterfaceDeclarationEnhanced(
    interfaceDecl: InterfaceDeclaration, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from interface ${interfaceDecl.getName()} at ${basePath} (depth: ${currentDepth})`);
    }

    const dependencies: FunctionalDependency[] = [];
    const properties = interfaceDecl.getProperties();

    for (const property of properties) {
      const propName = property.getName();
      const propPath = basePath ? `${basePath}.${propName}` : propName;
      const propTypeNode = property.getTypeNode();

      if (!propTypeNode) {
        if (this.options.verbose) {
          console.log(`⚠️  Property ${propPath} has no type annotation`);
        }
        continue;
      }

      // Recursive call with incremented depth
      const propDeps = this.extractDependenciesFromTypeNodeWithProtection(
        propTypeNode, 
        sourceFile, 
        propPath,
        currentDepth + 1
      );
      
      // If this is a direct marker injection, use the property name as the service key
      if (propDeps.length > 0 && this.isDirectMarkerInjection(propTypeNode)) {
        propDeps.forEach(dep => {
          dep.serviceKey = propName;
        });
      }
      
      dependencies.push(...propDeps);
    }

    return dependencies;
  }

  /**
   * ENHANCED: Type alias extraction with depth tracking
   */
  private extractFromTypeAliasDeclarationEnhanced(
    typeAlias: TypeAliasDeclaration, 
    sourceFile: SourceFile, 
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    const typeNode = typeAlias.getTypeNode();
    if (!typeNode) {
      if (this.options.verbose) {
        console.log(`⚠️  Type alias ${typeAlias.getName()} has no type node`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from type alias ${typeAlias.getName()} at ${basePath} (depth: ${currentDepth})`);
    }

    // Recursive call with incremented depth
    return this.extractDependenciesFromTypeNodeWithProtection(
      typeNode, 
      sourceFile, 
      basePath,
      currentDepth + 1
    );
  }

  /**
   * ENHANCED: Built-in array type handling with depth tracking
   */
  private handleBuiltInArrayType(
    typeReference: TypeReferenceNode,
    sourceFile: SourceFile,
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    const typeArgs = typeReference.getTypeArguments();
    if (typeArgs.length !== 1) {
      if (this.options.verbose) {
        console.log(`⚠️  Array type has ${typeArgs.length} type arguments, expected 1`);
      }
      return [];
    }

    const elementType = typeArgs[0];
    if (this.options.verbose) {
      console.log(`🔍 Processing Array element type: ${elementType.getKindName()} at depth ${currentDepth}`);
    }

    // Extract dependencies from the array element type
    return this.extractDependenciesFromTypeNodeWithProtection(
      elementType, 
      sourceFile, 
      `${basePath}[]`,
      currentDepth + 1
    );
  }

  /**
   * ENHANCED: Built-in type handling with depth tracking
   */
  private handleBuiltInType(
    typeReference: TypeReferenceNode,
    sourceFile: SourceFile,
    basePath: string,
    currentDepth: number
  ): FunctionalDependency[] {
    const typeName = typeReference.getTypeName().getText();
    const typeArgs = typeReference.getTypeArguments();

    if (this.options.verbose) {
      console.log(`🔍 Handling built-in type: ${typeName} with ${typeArgs.length} type arguments at depth ${currentDepth}`);
    }

    // For most built-in types, extract from their type arguments
    const dependencies: FunctionalDependency[] = [];
    
    for (let i = 0; i < typeArgs.length; i++) {
      const typeArg = typeArgs[i];
      const argDeps = this.extractDependenciesFromTypeNodeWithProtection(
        typeArg, 
        sourceFile, 
        `${basePath}<${typeName}:${i}>`,
        currentDepth + 1
      );
      dependencies.push(...argDeps);
    }

    return dependencies;
  }

  /**
   * Enhanced marker type checking
   */
  private isMarkerType(typeName: string): boolean {
    return typeName === 'Inject' || typeName === 'InjectOptional';
  }

  /**
   * Enhanced direct marker injection detection using ts-morph AST
   */
  private isDirectMarkerInjection(typeNode: TypeNode): boolean {
    if (!Node.isTypeReference(typeNode)) {
      return false;
    }

    const typeReference = typeNode as TypeReferenceNode;
    const typeName = typeReference.getTypeName();
    const markerName = Node.isIdentifier(typeName) ? typeName.getText() : null;
    
    return markerName !== null && this.isMarkerType(markerName);
  }

  /**
   * ENHANCED: Extract from direct marker with path support using ts-morph AST
 */
  private extractFromDirectMarkerEnhanced(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    servicePath: string
  ): FunctionalDependency[] {
    if (!Node.isTypeReference(typeNode)) return [];

    const typeReference = typeNode as TypeReferenceNode;
    const typeName = typeReference.getTypeName();
    const markerName = Node.isIdentifier(typeName) ? typeName.getText() : null;
    
    if (!markerName || !this.isMarkerType(markerName)) {
      return [];
    }

    // Get type arguments using AST - much cleaner than manual parsing!
    const typeArgs = typeReference.getTypeArguments();
    if (typeArgs.length !== 1) {
      if (this.options.verbose) {
        console.warn(`⚠️  Expected exactly 1 type argument for ${markerName}, got ${typeArgs.length}`);
      }
      return [];
    }

    const interfaceTypeNode = typeArgs[0];
    const interfaceType = interfaceTypeNode.getText();
    
    // FIXED: Validate marker source if enabled - use the actual source file where the marker is imported
    if (this.sourceConfig.validateSources && !this.validateMarkerSource(markerName, sourceFile)) {
      if (this.options.verbose) {
        console.warn(`⚠️  Marker source not validated for ${servicePath}, skipping`);
      }
      return [];
    }

    const isOptional = markerName === 'InjectOptional';
    const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceType);

    // Extract service key from path (e.g., "services.api" -> "api")
    const serviceKey = this.extractServiceKeyFromPath(servicePath);

    if (this.options.verbose) {
      console.log(`✅ Direct marker injection: ${servicePath} -> ${serviceKey} : ${interfaceType} (${isOptional ? 'optional' : 'required'})`);
    }

    return [{
      serviceKey,
      interfaceType,
      sanitizedKey,
      isOptional
    }];
  }

  /**
   * NEW: Extract service key from nested path
   */
  private extractServiceKeyFromPath(path: string): string {
    // Handle nested paths like "services.api" -> "api"
    // or "props.services.cache" -> "cache"
    const parts = path.split('.');
    
    // If path contains 'services', take the part after it
    const servicesIndex = parts.indexOf('services');
    if (servicesIndex !== -1 && servicesIndex < parts.length - 1) {
      return parts[servicesIndex + 1];
    }
    
    // Otherwise, take the last part
    return parts[parts.length - 1];
  }

  /**
   * ENHANCED: Extract type parameters from the usage context
   */
  private extractTypeParametersFromContext(basePath: string, sourceFile: SourceFile): Map<string, string> {
    const typeParams = new Map<string, string>();
    
    // Look for type parameter usage in the original parameter
    // For example: ConditionalServiceProps<string> -> T = string
    try {
      // Find the function/component that contains this parameter
      const functions = sourceFile.getFunctions();
      for (const func of functions) {
        const params = func.getParameters();
        for (const param of params) {
          const paramName = param.getName();
          // Check if this parameter matches the base path
          if (paramName === basePath.split('.')[0] || basePath.startsWith(paramName)) {
            const typeNode = param.getTypeNode();
            if (typeNode && Node.isTypeReference(typeNode)) {
              const typeArgs = typeNode.getTypeArguments();
              if (typeArgs.length > 0) {
                // For ConditionalServiceProps<string>, map T -> string
                typeParams.set('T', typeArgs[0].getText());
                
                if (this.options.verbose) {
                  console.log(`🔍 Resolved type parameter from function: T -> ${typeArgs[0].getText()}`);
                }
              }
            }
          }
        }
      }

      // Also check variable statements for arrow functions
      const variableStatements = sourceFile.getVariableStatements();
      for (const varStmt of variableStatements) {
        const declarations = varStmt.getDeclarations();
        for (const decl of declarations) {
          const initializer = decl.getInitializer();
          if (initializer && initializer.getKind() === 218) { // ArrowFunction
            const params = initializer.getParameters();
            for (const param of params) {
              const paramName = param.getName();
              // Check if this parameter matches the base path
              if (paramName === basePath.split('.')[0] || basePath.startsWith(paramName)) {
                const typeNode = param.getTypeNode();
                if (typeNode && Node.isTypeReference(typeNode)) {
                  const typeArgs = typeNode.getTypeArguments();
                  if (typeArgs.length > 0) {
                    typeParams.set('T', typeArgs[0].getText());
                    
                    if (this.options.verbose) {
                      console.log(`🔍 Resolved type parameter from arrow function: T -> ${typeArgs[0].getText()}`);
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to extract type parameters from context:`, error);
      }
    }
    
    return typeParams;
  }

  /**
   * ENHANCED: Extract dependencies with type parameter resolution and depth tracking
   */
  private extractDependenciesFromTypeNodeWithTypeParams(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string,
    typeParams: Map<string, string>,
    currentDepth: number
  ): FunctionalDependency[] {
    // Use the protected extraction method with depth tracking
    const dependencies = this.extractDependenciesFromTypeNodeWithProtection(
      typeNode, 
      sourceFile, 
      basePath, 
      currentDepth
    );
    
    // Post-process to resolve type parameters
    return dependencies.map(dep => ({
      ...dep,
      interfaceType: this.resolveTypeParameters(dep.interfaceType, typeParams),
      sanitizedKey: this.keySanitizer.sanitizeKey(this.resolveTypeParameters(dep.interfaceType, typeParams))
    }));
  }

  /**
   * NEW: Resolve type parameters in interface types
   */
  private resolveTypeParameters(interfaceType: string, typeParams: Map<string, string>): string {
    let resolved = interfaceType;
    
    for (const [param, value] of typeParams) {
      // Replace type parameter with concrete type
      // Handle both simple cases (T) and generic cases (ProcessorInterface<T>)
      const paramRegex = new RegExp(`\\b${param}\\b`, 'g');
      resolved = resolved.replace(paramRegex, value);
    }
    
    if (this.options.verbose && resolved !== interfaceType) {
      console.log(`🔧 Resolved type parameters: ${interfaceType} -> ${resolved}`);
    }
    
    return resolved;
  }

  /**
   * Find interface or type alias declaration in the source file or imported files
   */
  private findTypeDeclaration(typeName: string, sourceFile: SourceFile): InterfaceDeclaration | TypeAliasDeclaration | undefined {
    if (this.options.verbose) {
      console.log(`🔍 Searching for type declaration: ${typeName}`);
    }

    // First, look in the current source file
    const localInterface = sourceFile.getInterface(typeName);
    if (localInterface) {
      if (this.options.verbose) {
        console.log(`✅ Found interface ${typeName} in current file`);
      }
      return localInterface;
    }

    const localTypeAlias = sourceFile.getTypeAlias(typeName);
    if (localTypeAlias) {
      if (this.options.verbose) {
        console.log(`✅ Found type alias ${typeName} in current file`);
      }
      return localTypeAlias;
    }

    // Then, look in imported files
    const imports = sourceFile.getImportDeclarations();
    if (this.options.verbose) {
      console.log(`🔍 Checking ${imports.length} import declarations`);
    }

    for (const importDeclaration of imports) {
      const namedImports = importDeclaration.getNamedImports();
      const isTypeImported = namedImports.some((namedImport) => 
        namedImport.getName() === typeName
      );

      if (isTypeImported) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
        if (this.options.verbose) {
          console.log(`🔍 Looking for ${typeName} in imported module: ${moduleSpecifier}`);
        }
        
        const importedFile = this.resolveImportedFile(moduleSpecifier, sourceFile);
        
        if (importedFile) {
          if (this.options.verbose) {
            console.log(`✅ Resolved import file: ${importedFile.getFilePath()}`);
          }

          const importedInterface = importedFile.getInterface(typeName);
          if (importedInterface) {
            if (this.options.verbose) {
              console.log(`✅ Found interface ${typeName} in imported file`);
            }
            return importedInterface;
          }

          const importedTypeAlias = importedFile.getTypeAlias(typeName);
          if (importedTypeAlias) {
            if (this.options.verbose) {
              console.log(`✅ Found type alias ${typeName} in imported file`);
            }
            return importedTypeAlias;
          }

          if (this.options.verbose) {
            console.log(`❌ Type ${typeName} not found in imported file ${importedFile.getFilePath()}`);
          }
        } else {
          if (this.options.verbose) {
            console.log(`❌ Could not resolve import file for module: ${moduleSpecifier}`);
          }
        }
      }
    }

    if (this.options.verbose) {
      console.log(`❌ Type declaration ${typeName} not found anywhere`);
    }

    return undefined;
  }

  /**
   * Resolve imported file path
   */
  private resolveImportedFile(moduleSpecifier: string, sourceFile: SourceFile): SourceFile | undefined {
    try {
      const currentDir = path.dirname(sourceFile.getFilePath());
      const project = sourceFile.getProject();

      let resolvedPath: string;
      if (moduleSpecifier.startsWith('.')) {
        // Relative import
        resolvedPath = path.resolve(currentDir, moduleSpecifier);
      } else {
        // Absolute import - try each scanDir to find the file
        const scanDirs = this.options.scanDirs || ["./src"];
        const currentFilePath = path.resolve(sourceFile.getFilePath());
        const matchingScanDir = scanDirs.find((dir: string) =>
          currentFilePath.startsWith(path.resolve(dir))
        );
        const baseDir = matchingScanDir ? path.resolve(matchingScanDir) : path.resolve(scanDirs[0]);
        resolvedPath = path.resolve(baseDir, moduleSpecifier);
      }

      // Try different extensions
      const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        const importedFile = project.getSourceFile(fullPath);
        if (importedFile) {
          if (this.options.verbose) {
            console.log(`✅ Resolved import: ${moduleSpecifier} -> ${fullPath}`);
          }
          return importedFile;
        }
      }

      // ENHANCED: Try to find by filename matching (for test scenarios)
      const baseName = path.basename(moduleSpecifier);
      for (const sourceFile of project.getSourceFiles()) {
        const fileName = path.basename(sourceFile.getFilePath(), path.extname(sourceFile.getFilePath()));
        if (fileName === baseName) {
          if (this.options.verbose) {
            console.log(`✅ Found import by filename match: ${moduleSpecifier} -> ${sourceFile.getFilePath()}`);
          }
          return sourceFile;
        }
      }

      if (this.options.verbose) {
        console.log(`❌ Could not resolve import: ${moduleSpecifier}`);
        console.log(`🔍 Tried paths: ${extensions.map(ext => resolvedPath + ext).join(', ')}`);
        console.log(`🔍 Available files: ${project.getSourceFiles().map(f => f.getFilePath()).join(', ')}`);
      }
      return undefined;
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to resolve import: ${moduleSpecifier}`, error);
      }
      return undefined;
    }
  }

  /**
   * NEW: Check if a type name is a built-in TypeScript type
   */
  private isBuiltInType(typeName: string): boolean {
    const builtInTypes = [
      'Array', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
      'Date', 'RegExp', 'Error', 'Function', 'Object',
      'Partial', 'Required', 'Readonly', 'Record', 'Pick', 'Omit'
    ];
    return builtInTypes.includes(typeName);
  }

  /**
   * FIXED: Validate that a marker comes from a valid source - now checks the target file where it's used
   */
  private validateMarkerSource(markerName: string, sourceFile: SourceFile): boolean {
    const cacheKey = `${sourceFile.getFilePath()}:${markerName}`;
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    // Check imports in the source file to see if the marker is imported from a valid source
    const imports = sourceFile.getImportDeclarations();
    const isValid = this.isMarkerFromValidSource(markerName, imports);
    
    // FIXED: If not found in current file, also check imported files for type imports
    if (!isValid) {
      // Sometimes markers are imported in interface files, not component files
      // So we need to check imported type definition files too
      for (const importDecl of imports) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const importedFile = this.resolveImportedFile(moduleSpecifier, sourceFile);
        
        if (importedFile) {
          const importedFileImports = importedFile.getImportDeclarations();
          if (this.isMarkerFromValidSource(markerName, importedFileImports)) {
            this.validationCache.set(cacheKey, true);
            return true;
          }
        }
      }
    }
    
    this.validationCache.set(cacheKey, isValid);
    return isValid;
  }

  /**
   * Check if marker is imported from valid source
   */
  private isMarkerFromValidSource(markerName: string, imports: ImportDeclaration[]): boolean {
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if import is from valid marker source
      if (!this.sourceConfig.markerSources.some(source => 
        this.moduleMatchesSource(moduleSpecifier, source)
      )) {
        continue;
      }

      // Check if marker is in named imports
      const namedImports = importDecl.getNamedImports();
      if (namedImports.some(ni => ni.getName() === markerName)) {
        return true;
      }

      // Check if it's a type-only import
      if (importDecl.isTypeOnly()) {
        const typeImports = importDecl.getNamedImports();
        if (typeImports.some(ni => ni.getName() === markerName)) {
          return true;
        }
      }

      // Check namespace import
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        return true; // Assume valid if imported via namespace
      }
    }

    return false;
  }

  /**
   * Check if module specifier matches a source pattern
   */
  private moduleMatchesSource(moduleSpecifier: string, source: string): boolean {
    // Exact match
    if (moduleSpecifier === source) {
      return true;
    }

    // Starts with source (for sub-paths)
    if (moduleSpecifier.startsWith(source + '/')) {
      return true;
    }

    // Relative path matches
    if (source.startsWith('./') || source.startsWith('../')) {
      return moduleSpecifier === source;
    }

    return false;
  }

  /**
   * Update source configuration
   */
  updateSourceConfiguration(config: Partial<DISourceConfiguration>): void {
    this.sourceConfig = { ...this.sourceConfig, ...config };
    this.validationCache.clear();
  }

  /**
   * Get current source configuration
   */
  getSourceConfiguration(): DISourceConfiguration {
    return { ...this.sourceConfig };
  }

  /**
   * Clear validation cache
   */
  clearValidationCache(): void {
    this.validationCache.clear();
  }

  /**
   * ENHANCED: Update circular protection configuration
   */
  updateCircularProtectionConfig(config: Partial<CircularProtectionConfig>): void {
    this.circularProtectionConfig = { ...this.circularProtectionConfig, ...config };
  }

  /**
   * ENHANCED: Get current circular protection configuration
   */
  getCircularProtectionConfig(): CircularProtectionConfig {
    return { ...this.circularProtectionConfig };
  }

  /**
   * ENHANCED: Get extraction statistics including circular protection stats
   */
  getExtractionStats(): {
    cacheSize: number;
    circularProtectionSize: number;
    supportedTypeNodes: string[];
    sourceValidationEnabled: boolean;
    circularProtectionConfig: CircularProtectionConfig;
    extractionStats: typeof this.extractionStats;
  } {
    return {
      cacheSize: this.validationCache.size,
      circularProtectionSize: this.circularProtection.size,
      supportedTypeNodes: [
        'TypeReference (Inject<T>)',
        'TypeLiteral ({ services: {...} })',
        'UnionType (A | B)',
        'IntersectionType (A & B)',
        'ArrayType (Array<T>, T[])',
        'TupleType ([T1, T2, ...])',
        'MappedType ({ [K in keyof T]: ... })',
        'ConditionalType (T extends U ? X : Y)',
        'InterfaceDeclaration',
        'TypeAliasDeclaration',
        'Built-in types (Array, Promise, etc.)'
      ],
      sourceValidationEnabled: this.sourceConfig.validateSources,
      circularProtectionConfig: this.circularProtectionConfig,
      extractionStats: { ...this.extractionStats }
    };
  }

  /**
   * ENHANCED: Reset extraction statistics
   */
  resetExtractionStats(): void {
    this.extractionStats = {
      totalExtractions: 0,
      circularDetections: 0,
      maxDepthReached: 0,
      avgDepth: 0
    };
  }
}