// tools/shared/RecursiveInjectExtractor.ts - FIXED property path handling

import {
  SourceFile,
  TypeNode,
  Node,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  PropertySignature
} from "ts-morph";
import * as path from "path";

export interface RecursiveExtractOptions {
  verbose?: boolean;
  scanDirs?: string[]; // Preferred: array of directories to scan
}

export interface ExtractedInjectMarker {
  serviceKey: string;           // Property name where the marker was found
  interfaceType: string;        // The type inside Inject<T> or InjectOptional<T>
  isOptional: boolean;         // Whether it's InjectOptional
  propertyPath: string[];      // FIXED: Path to the property (e.g., ['services', 'api'] for services.api)
  sourceLocation: string;      // For debugging
}

/**
 * FIXED: Recursively extracts Inject<T> and InjectOptional<T> markers from type structures
 */
export class RecursiveInjectExtractor {
  constructor(private options: RecursiveExtractOptions = {}) {}

  /**
   * Extract all Inject markers from a type node recursively
   */
  extractInjectMarkersRecursive(
    typeNode: TypeNode,
    sourceFile: SourceFile,
    propertyPath: string[] = []
  ): ExtractedInjectMarker[] {
    const markers: ExtractedInjectMarker[] = [];

    if (this.options.verbose) {
      console.log(`🔍 Extracting from ${typeNode.getKindName()} at path: [${propertyPath.join(', ')}]`);
    }

    // Check inline type literal: { prop: Inject<Type>, nested: { deep: InjectOptional<Type> } }
    if (Node.isTypeLiteral(typeNode)) {
      const literalMarkers = this.extractFromTypeLiteral(typeNode, sourceFile, propertyPath);
      markers.push(...literalMarkers);
    }

    // Check type reference: ComponentProps (where ComponentProps might have Inject markers)
    if (Node.isTypeReference(typeNode)) {
      const typeName = typeNode.getTypeName().getText();
      const typeDeclaration = this.findTypeDeclaration(typeName, sourceFile);
      if (typeDeclaration) {
        const refMarkers = this.extractFromTypeDeclaration(typeDeclaration, sourceFile, propertyPath);
        markers.push(...refMarkers);
      }
    }

    // Check union types: Type1 | Type2
    if (Node.isUnionTypeNode && Node.isUnionTypeNode(typeNode)) {
      const unionTypes = typeNode.getTypeNodes();
      for (const unionType of unionTypes) {
        const unionMarkers = this.extractInjectMarkersRecursive(unionType, sourceFile, propertyPath);
        markers.push(...unionMarkers);
      }
    }

    // Check array types: Type[]
    if (Node.isArrayTypeNode && Node.isArrayTypeNode(typeNode)) {
      const elementType = (typeNode as any).getElementTypeNode();
      const arrayMarkers = this.extractInjectMarkersRecursive(elementType, sourceFile, propertyPath);
      markers.push(...arrayMarkers);
    }

    // Check intersection types: Type1 & Type2
    if (Node.isIntersectionTypeNode && Node.isIntersectionTypeNode(typeNode)) {
      const intersectionTypes = (typeNode as any).getTypeNodes();
      for (const intersectionType of intersectionTypes) {
        const intersectionMarkers = this.extractInjectMarkersRecursive(intersectionType, sourceFile, propertyPath);
        markers.push(...intersectionMarkers);
      }
    }

    return markers;
  }

  /**
   * Extract markers from type literal
   */
  private extractFromTypeLiteral(
    typeNode: TypeNode,
    sourceFile: SourceFile,
    propertyPath: string[]
  ): ExtractedInjectMarker[] {
    if (!Node.isTypeLiteral(typeNode)) {
      return [];
    }

    const markers: ExtractedInjectMarker[] = [];
    const members = typeNode.getMembers();

    if (this.options.verbose) {
      console.log(`📝 Processing type literal with ${members.length} members at path: [${propertyPath.join(', ')}]`);
    }

    for (const member of members) {
      if (Node.isPropertySignature(member)) {
        const propName = member.getName();
        const currentPath = [...propertyPath, propName];
        
        const memberTypeNode = member.getTypeNode();
        if (memberTypeNode) {
          // Check if this property itself is an Inject marker
          const directMarker = this.extractDirectInjectMarker(member, currentPath, sourceFile);
          if (directMarker) {
            markers.push(directMarker);
            
            if (this.options.verbose) {
              console.log(`✅ Found direct inject marker: ${directMarker.propertyPath.join('.')} -> ${directMarker.interfaceType}`);
            }
          } else {
            // Recursively check nested structures
            const nestedMarkers = this.extractInjectMarkersRecursive(memberTypeNode, sourceFile, currentPath);
            markers.push(...nestedMarkers);
          }
        }
      }
    }

    return markers;
  }

  /**
   * FIXED: Extract direct Inject<T> or InjectOptional<T> marker from a property with correct service key extraction
   */
  private extractDirectInjectMarker(
    property: PropertySignature,
    propertyPath: string[],
    sourceFile: SourceFile
  ): ExtractedInjectMarker | null {
    const propertyTypeNode = property.getTypeNode();
    if (!propertyTypeNode) return null;

    const typeText = propertyTypeNode.getText();
    
    // Check for Inject<T> or InjectOptional<T> markers
    const injectMatch = typeText.match(/^Inject<(.+)>$/);
    const optionalMatch = typeText.match(/^InjectOptional<(.+)>$/);
    
    if (injectMatch || optionalMatch) {
      const interfaceType = injectMatch ? injectMatch[1] : optionalMatch![1];
      const isOptional = !!optionalMatch;
      
      // FIXED: Extract service key correctly based on property path
      let serviceKey: string;
      
      if (propertyPath.length === 1) {
        // Direct property: api: Inject<ApiInterface> -> serviceKey = 'api'
        serviceKey = propertyPath[0];
      } else if (propertyPath.length > 1) {
        // Nested property: services.api: Inject<ApiInterface> -> serviceKey = 'api'
        serviceKey = propertyPath[propertyPath.length - 1];
      } else {
        // Fallback
        serviceKey = property.getName();
      }
      
      if (this.options.verbose) {
        console.log(`🔗 Found ${isOptional ? 'optional' : 'required'} inject marker:`);
        console.log(`  propertyPath: [${propertyPath.join(', ')}]`);
        console.log(`  serviceKey: "${serviceKey}"`);
        console.log(`  interfaceType: "${interfaceType}"`);
      }

      return {
        serviceKey,
        interfaceType,
        isOptional,
        propertyPath,
        sourceLocation: `${sourceFile.getBaseName()}:${property.getStartLineNumber()}`
      };
    }

    return null;
  }

  /**
   * Extract markers from interface or type alias declaration
   */
  private extractFromTypeDeclaration(
    typeDeclaration: InterfaceDeclaration | TypeAliasDeclaration,
    sourceFile: SourceFile,
    propertyPath: string[]
  ): ExtractedInjectMarker[] {
    const markers: ExtractedInjectMarker[] = [];

    if (this.options.verbose) {
      const declName = Node.isInterfaceDeclaration(typeDeclaration) 
        ? typeDeclaration.getName() 
        : typeDeclaration.getName();
      console.log(`📋 Processing ${typeDeclaration.getKindName()}: ${declName} at path: [${propertyPath.join(', ')}]`);
    }

    // Handle interface declaration
    if (Node.isInterfaceDeclaration(typeDeclaration)) {
      const properties = typeDeclaration.getProperties();
      for (const property of properties) {
        const propName = property.getName();
        const currentPath = [...propertyPath, propName];
        
        const propertyTypeNode = property.getTypeNode();
        if (propertyTypeNode) {
          // Check if this property itself is an Inject marker
          const directMarker = this.extractDirectInjectMarker(property, currentPath, sourceFile);
          if (directMarker) {
            markers.push(directMarker);
          } else {
            // Recursively check nested structures
            const nestedMarkers = this.extractInjectMarkersRecursive(propertyTypeNode, sourceFile, currentPath);
            markers.push(...nestedMarkers);
          }
        }
      }
    }

    // Handle type alias declaration
    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      const aliasTypeNode = typeDeclaration.getTypeNode();
      if (aliasTypeNode) {
        const aliasMarkers = this.extractInjectMarkersRecursive(aliasTypeNode, sourceFile, propertyPath);
        markers.push(...aliasMarkers);
      }
    }

    return markers;
  }

  /**
   * Find type declaration (interface or type alias) in current file or imports
   */
  private findTypeDeclaration(typeName: string, sourceFile: SourceFile): InterfaceDeclaration | TypeAliasDeclaration | null {
    // First check current file
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

    // Then check imported types
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const namedImports = importDecl.getNamedImports();
      const isTypeImported = namedImports.some(
        (namedImport: any) => namedImport.getName() === typeName
      );

      if (isTypeImported) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        if (this.options.verbose) {
          console.log(`🔍 Looking for ${typeName} in imported module: ${moduleSpecifier}`);
        }
        
        const importedFile = this.resolveImportedFile(moduleSpecifier, sourceFile);
        if (importedFile) {
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
        }
      }
    }

    if (this.options.verbose) {
      console.log(`❌ Could not find declaration for type: ${typeName}`);
    }

    return null;
  }

  /**
   * Resolve imported file path
   */
  private resolveImportedFile(moduleSpecifier: string, sourceFile: SourceFile): SourceFile | null {
    try {
      const currentDir = path.dirname(sourceFile.getFilePath());

      // Handle relative imports (./foo, ../bar)
      if (moduleSpecifier.startsWith(".")) {
        const resolvedPath = path.resolve(currentDir, moduleSpecifier);
        return this.tryResolveWithExtensions(resolvedPath, moduleSpecifier, sourceFile);
      }

      // Handle non-relative imports - try all scanDirs
      const scanDirs = this.options.scanDirs || ['./src'];

      for (const scanDir of scanDirs) {
        const resolvedPath = path.resolve(scanDir, moduleSpecifier);
        const result = this.tryResolveWithExtensions(resolvedPath, moduleSpecifier, sourceFile);
        if (result) {
          return result;
        }
      }

      if (this.options.verbose) {
        console.log(`❌ Could not resolve import: ${moduleSpecifier} (tried ${scanDirs.length} directories)`);
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to resolve import: ${moduleSpecifier}`, error);
      }
    }

    return null;
  }

  /**
   * Try to resolve a path with common TypeScript extensions
   */
  private tryResolveWithExtensions(
    resolvedPath: string,
    moduleSpecifier: string,
    sourceFile: SourceFile
  ): SourceFile | null {
    const extensions = [".ts", ".tsx", "/index.ts", "/index.tsx"];
    const project = sourceFile.getProject();

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

    return null;
  }

  /**
   * Check if a type node has inject markers (detection only, no extraction)
   */
  hasInjectMarkersRecursive(typeNode: TypeNode, sourceFile: SourceFile): boolean {
    // Direct text check first (fastest)
    const typeText = typeNode.getText();
    if (typeText.includes("Inject<") || typeText.includes("InjectOptional<")) {
      return true;
    }

    // Check inline type literal
    if (Node.isTypeLiteral(typeNode)) {
      return this.hasInjectMarkersInTypeLiteral(typeNode, sourceFile);
    }

    // Check type reference
    if (Node.isTypeReference(typeNode)) {
      const typeName = typeNode.getTypeName().getText();
      const typeDeclaration = this.findTypeDeclaration(typeName, sourceFile);
      if (typeDeclaration) {
        return this.hasInjectMarkersInTypeDeclaration(typeDeclaration, sourceFile);
      }
    }

    // Check union types
    if (Node.isUnionTypeNode && Node.isUnionTypeNode(typeNode)) {
      const unionTypes = (typeNode as any).getTypeNodes();
      return unionTypes.some((unionType: any) =>
        this.hasInjectMarkersRecursive(unionType, sourceFile)
      );
    }

    // Check array types
    if (Node.isArrayTypeNode && Node.isArrayTypeNode(typeNode)) {
      const elementType = (typeNode as any).getElementTypeNode();
      return this.hasInjectMarkersRecursive(elementType, sourceFile);
    }

    return false;
  }

  /**
   * Check if type literal has inject markers (detection only)
   */
  private hasInjectMarkersInTypeLiteral(typeNode: TypeNode, sourceFile: SourceFile): boolean {
    if (!Node.isTypeLiteral(typeNode)) {
      return false;
    }

    const members = typeNode.getMembers();
    for (const member of members) {
      if (Node.isPropertySignature(member)) {
        const memberTypeNode = member.getTypeNode();
        if (memberTypeNode && this.hasInjectMarkersRecursive(memberTypeNode, sourceFile)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if type declaration has inject markers (detection only)
   */
  private hasInjectMarkersInTypeDeclaration(
    typeDeclaration: InterfaceDeclaration | TypeAliasDeclaration,
    sourceFile: SourceFile
  ): boolean {
    // Handle interface declaration
    if (Node.isInterfaceDeclaration(typeDeclaration)) {
      const properties = typeDeclaration.getProperties();
      for (const property of properties) {
        const propertyTypeNode = property.getTypeNode();
        if (propertyTypeNode && this.hasInjectMarkersRecursive(propertyTypeNode, sourceFile)) {
          return true;
        }
      }
    }

    // Handle type alias declaration
    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      const aliasTypeNode = typeDeclaration.getTypeNode();
      if (aliasTypeNode && this.hasInjectMarkersRecursive(aliasTypeNode, sourceFile)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract all inject markers from interface declaration (public method)
   */
  extractFromInterfaceDeclaration(
    interfaceDecl: InterfaceDeclaration,
    sourceFile: SourceFile,
    initialPath: string[] = []
  ): ExtractedInjectMarker[] {
    if (this.options.verbose) {
      console.log(`🔍 Recursively extracting inject markers from interface ${interfaceDecl.getName()}`);
    }

    return this.extractFromTypeDeclaration(interfaceDecl, sourceFile, initialPath);
  }

  /**
   * Extract all inject markers from type alias declaration (public method)
   */
  extractFromTypeAliasDeclaration(
    typeAlias: TypeAliasDeclaration,
    sourceFile: SourceFile,
    initialPath: string[] = []
  ): ExtractedInjectMarker[] {
    if (this.options.verbose) {
      console.log(`🔍 Recursively extracting inject markers from type alias ${typeAlias.getName()}`);
    }

    return this.extractFromTypeDeclaration(typeAlias, sourceFile, initialPath);
  }

  /**
   * Extract all inject markers from type node (public method)
   */
  extractFromTypeNode(
    typeNode: TypeNode,
    sourceFile: SourceFile,
    initialPath: string[] = []
  ): ExtractedInjectMarker[] {
    if (this.options.verbose) {
      console.log(`🔍 Recursively extracting inject markers from type node: ${typeNode.getKindName()}`);
    }

    return this.extractInjectMarkersRecursive(typeNode, sourceFile, initialPath);
  }
}