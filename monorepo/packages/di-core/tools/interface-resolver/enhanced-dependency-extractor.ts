// tools/functional-di-enhanced-transformer/enhanced-dependency-extractor.ts - COMPLETE with nested support

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
  ArrayTypeNode
} from 'ts-morph';
import * as path from 'path';
import { FunctionalDependency, TransformationOptions, TypeResolutionContext } from './types';
import { KeySanitizer } from '../interface-resolver/key-sanitizer';
import type { DISourceConfiguration } from '../interface-resolver/enhanced-interface-extractor';

export class EnhancedDependencyExtractor {
  private keySanitizer: KeySanitizer;
  private sourceConfig: DISourceConfiguration;
  private validationCache = new Map<string, boolean>();

  constructor(
    private options: TransformationOptions,
    sourceConfig?: Partial<DISourceConfiguration>
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
  }

  /**
   * ENHANCED: Extract dependencies from function parameter with comprehensive nesting support
   */
  extractDependenciesFromParameter(param: ParameterDeclaration, sourceFile: SourceFile): FunctionalDependency[] {
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

    // ENHANCED: Use comprehensive extraction that handles all nesting levels
    return this.extractDependenciesFromTypeNode(typeNode, sourceFile, param.getName());
  }

  /**
   * NEW: Comprehensive type node analysis that handles all nesting scenarios
   */
  private extractDependenciesFromTypeNode(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string = ''
  ): FunctionalDependency[] {
    
    // Case 1: Direct marker injection - Inject<FooInterface>
    if (this.isDirectMarkerInjection(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found direct marker injection at ${basePath}`);
      }
      return this.extractFromDirectMarkerEnhanced(typeNode, sourceFile, basePath);
    }

    // Case 2: Type literal - { services: {...}, config: any }
    if (Node.isTypeLiteral(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found type literal at ${basePath}`);
      }
      return this.extractFromTypeLiteralEnhanced(typeNode, sourceFile, basePath);
    }

    // Case 3: Type reference - ComponentProps, ServiceConfig, etc.
    if (Node.isTypeReference(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found type reference at ${basePath}`);
      }
      return this.extractFromTypeReferenceEnhanced(typeNode, sourceFile, basePath);
    }

    // Case 4: Union type - { services: {...} } | { fallback: true }
    if (Node.isUnionTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found union type at ${basePath}`);
      }
      return this.extractFromUnionType(typeNode, sourceFile, basePath);
    }

    // Case 5: Intersection type - ServiceProps & ConfigProps
    if (Node.isIntersectionTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found intersection type at ${basePath}`);
      }
      return this.extractFromIntersectionType(typeNode, sourceFile, basePath);
    }

    // Case 6: Array type - Array<{ service: Inject<T> }>
    if (Node.isArrayTypeNode(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Found array type at ${basePath}`);
      }
      return this.extractFromArrayType(typeNode, sourceFile, basePath);
    }

    if (this.options.verbose) {
      console.log(`⚠️  Type node ${typeNode.getKindName()} at ${basePath} not supported for dependency extraction`);
    }

    return [];
  }

  /**
   * ENHANCED: Extract from type literal with deep nesting support
   */
  private extractFromTypeLiteralEnhanced(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string
  ): FunctionalDependency[] {
    if (!Node.isTypeLiteral(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const members = typeNode.getMembers();

    if (this.options.verbose) {
      console.log(`🔍 Processing type literal with ${members.length} members at ${basePath}`);
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
          console.log(`🔍 Processing property: ${memberPath} (${memberTypeNode.getKindName()})`);
        }

        // Special handling for 'services' property
        if (memberName === 'services') {
          const serviceDeps = this.extractDependenciesFromTypeNode(memberTypeNode, sourceFile, memberPath);
          dependencies.push(...serviceDeps);
        } else {
          // Check if this property itself is a marker injection or contains nested markers
          const memberDeps = this.extractDependenciesFromTypeNode(memberTypeNode, sourceFile, memberPath);
          
          // If this is a direct marker injection, use the property name as the service key
          if (memberDeps.length > 0 && this.isDirectMarkerInjection(memberTypeNode)) {
            memberDeps.forEach(dep => {
              dep.serviceKey = memberName; // Use property name as service key
            });
          }
          
          dependencies.push(...memberDeps);
        }
      } else {
        if (this.options.verbose) {
          console.log(`⚠️  Skipping non-property member: ${member.getKindName()} at ${basePath}`);
        }
      }
    }

    return dependencies;
  }

  /**
   * NEW: Extract from union types (A | B)
   */
  private extractFromUnionType(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string
  ): FunctionalDependency[] {
    if (!Node.isUnionTypeNode(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const unionTypes = (typeNode as UnionTypeNode).getTypeNodes();

    if (this.options.verbose) {
      console.log(`🔍 Processing union type with ${unionTypes.length} variants at ${basePath}`);
    }

    // Extract dependencies from each variant of the union
    // This handles cases like: { services: {...} } | { fallbackMode: true }
    for (const unionVariant of unionTypes) {
      const variantDeps = this.extractDependenciesFromTypeNode(unionVariant, sourceFile, basePath);
      dependencies.push(...variantDeps);
    }

    return dependencies;
  }

  /**
   * NEW: Extract from intersection types (A & B)
   */
  private extractFromIntersectionType(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string
  ): FunctionalDependency[] {
    if (!Node.isIntersectionTypeNode(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const intersectionTypes = (typeNode as IntersectionTypeNode).getTypeNodes();

    if (this.options.verbose) {
      console.log(`🔍 Processing intersection type with ${intersectionTypes.length} types at ${basePath}`);
    }

    // Extract dependencies from each part of the intersection
    // This handles cases like: ServiceProps & ConfigProps
    for (const intersectionPart of intersectionTypes) {
      const partDeps = this.extractDependenciesFromTypeNode(intersectionPart, sourceFile, basePath);
      dependencies.push(...partDeps);
    }

    return dependencies;
  }

  /**
   * NEW: Extract from array types
   */
  private extractFromArrayType(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string
  ): FunctionalDependency[] {
    if (!Node.isArrayTypeNode(typeNode)) return [];

    const elementTypeNode = (typeNode as ArrayTypeNode).getElementTypeNode();
    
    if (this.options.verbose) {
      console.log(`🔍 Processing array type at ${basePath}, element type: ${elementTypeNode.getKindName()}`);
    }

    // Extract dependencies from the array element type
    // This handles cases like: Array<{ service: Inject<T> }>
    return this.extractDependenciesFromTypeNode(elementTypeNode, sourceFile, `${basePath}[]`);
  }

  /**
   * ENHANCED: Extract from type reference with resolution
   */
  private extractFromTypeReferenceEnhanced(
    typeNode: TypeNode, 
    sourceFile: SourceFile, 
    basePath: string
  ): FunctionalDependency[] {
    if (!Node.isTypeReference(typeNode)) return [];

    // First check if this type reference itself is a marker injection
    if (this.isDirectMarkerInjection(typeNode)) {
      if (this.options.verbose) {
        console.log(`📝 Type reference is direct marker injection at ${basePath}`);
      }
      return this.extractFromDirectMarkerEnhanced(typeNode, sourceFile, basePath);
    }

    // Otherwise, resolve the type reference and analyze its definition
    const typeName = (typeNode as TypeReferenceNode).getTypeName().getText();
    
    if (this.options.verbose) {
      console.log(`🔍 Resolving type reference: ${typeName} at ${basePath}`);
    }

    // Find the type declaration
    const typeDeclaration = this.findTypeDeclaration(typeName, sourceFile);
    if (!typeDeclaration) {
      if (this.options.verbose) {
        console.log(`❌ Could not resolve type declaration for: ${typeName}`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Found type declaration: ${typeDeclaration.getKindName()}`);
    }

    // Extract dependencies from the resolved type
    if (Node.isInterfaceDeclaration(typeDeclaration)) {
      return this.extractFromInterfaceDeclarationEnhanced(typeDeclaration, sourceFile, basePath);
    }

    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      return this.extractFromTypeAliasDeclarationEnhanced(typeDeclaration, sourceFile, basePath);
    }

    return [];
  }

  /**
   * ENHANCED: Extract from interface declaration with nesting support
   */
  private extractFromInterfaceDeclarationEnhanced(
    interfaceDecl: InterfaceDeclaration, 
    sourceFile: SourceFile, 
    basePath: string
  ): FunctionalDependency[] {
    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from interface ${interfaceDecl.getName()} at ${basePath}`);
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

      // Recursively extract from property type
      const propDeps = this.extractDependenciesFromTypeNode(propTypeNode, sourceFile, propPath);
      
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
   * ENHANCED: Extract from type alias with nesting support
   */
  private extractFromTypeAliasDeclarationEnhanced(
    typeAlias: TypeAliasDeclaration, 
    sourceFile: SourceFile, 
    basePath: string
  ): FunctionalDependency[] {
    const typeNode = typeAlias.getTypeNode();
    if (!typeNode) {
      if (this.options.verbose) {
        console.log(`⚠️  Type alias ${typeAlias.getName()} has no type node`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from type alias ${typeAlias.getName()} at ${basePath}`);
    }

    // Recursively extract from the aliased type
    return this.extractDependenciesFromTypeNode(typeNode, sourceFile, basePath);
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
    
    // Validate marker source if enabled
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
        // Absolute import (from src root)
        resolvedPath = path.resolve(this.options.srcDir!, moduleSpecifier);
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
   * Validate that a marker comes from a valid source
   */
  private validateMarkerSource(markerName: string, sourceFile: SourceFile): boolean {
    const cacheKey = `${sourceFile.getFilePath()}:${markerName}`;
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    const imports = sourceFile.getImportDeclarations();
    const isValid = this.isMarkerFromValidSource(markerName, imports);
    
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
   * Get enhanced extraction statistics
   */
  getExtractionStats(): {
    cacheSize: number;
    supportedTypeNodes: string[];
    sourceValidationEnabled: boolean;
  } {
    return {
      cacheSize: this.validationCache.size,
      supportedTypeNodes: [
        'TypeReference (Inject<T>)',
        'TypeLiteral ({ services: {...} })',
        'UnionType (A | B)',
        'IntersectionType (A & B)',
        'ArrayType (Array<T>)',
        'InterfaceDeclaration',
        'TypeAliasDeclaration'
      ],
      sourceValidationEnabled: this.sourceConfig.validateSources
    };
  }
}