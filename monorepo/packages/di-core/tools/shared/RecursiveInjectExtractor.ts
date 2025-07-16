// tools/shared/RecursiveInjectExtractor.ts - FIXED V2: Extract ALL dependencies

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
  srcDir?: string;
}

export interface ExtractedInjectMarker {
  serviceKey: string;           // Property name where the marker was found
  interfaceType: string;        // The type inside Inject<T> or InjectOptional<T>
  isOptional: boolean;         // Whether it's InjectOptional
  propertyPath: string[];      // Path to the property (e.g., ['services', 'api'] for services.api)
  sourceLocation: string;      // For debugging
}

/**
 * FIXED V2: Recursively extracts ALL Inject<T> and InjectOptional<T> markers
 */
export class RecursiveInjectExtractor {
  constructor(private options: RecursiveExtractOptions = {}) {}

  /**
   * FIXED: Extract ALL inject markers from a type node recursively
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
   * FIXED: Extract ALL markers from type literal with complete property traversal
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
          if (this.options.verbose) {
            console.log(`  🔍 Checking property: ${propName} (${memberTypeNode.getKindName()})`);
          }

          // FIXED: Check if this property itself is an Inject marker
          const directMarker = this.extractDirectInjectMarker(member, currentPath, sourceFile);
          if (directMarker) {
            markers.push(directMarker);
            
            if (this.options.verbose) {
              console.log(`  ✅ Found direct inject marker: ${directMarker.propertyPath.join('.')} -> ${directMarker.interfaceType}`);
            }
          }
          
          // FIXED: ALWAYS recurse into nested structures to find ALL markers
          const nestedMarkers = this.extractInjectMarkersRecursive(memberTypeNode, sourceFile, currentPath);
          if (nestedMarkers.length > 0) {
            markers.push(...nestedMarkers);
            
            if (this.options.verbose) {
              console.log(`  ✅ Found ${nestedMarkers.length} nested markers in ${propName}`);
            }
          }
        }
      }
    }

    if (this.options.verbose) {
      console.log(`📊 Total markers found in type literal: ${markers.length}`);
    }

    return markers;
  }

  /**
   * FIXED: Extract direct Inject<T> or InjectOptional<T> marker AND handle non-Inject types
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
      
      // Extract service key correctly
      const serviceKey = propertyPath[propertyPath.length - 1];
      
      if (this.options.verbose) {
        console.log(`    🔗 Found ${isOptional ? 'optional' : 'required'} inject marker:`);
        console.log(`      propertyPath: [${propertyPath.join(', ')}]`);
        console.log(`      serviceKey: "${serviceKey}"`);
        console.log(`      interfaceType: "${interfaceType}"`);
      }

      return {
        serviceKey,
        interfaceType,
        isOptional,
        propertyPath,
        sourceLocation: `${sourceFile.getBaseName()}:${property.getStartLineNumber()}`
      };
    }

    // FIXED: Handle non-Inject types that might be interfaces (e.g., TestStateInterface)
    // Check if this is a direct interface type that should be treated as a service
    if (this.isServiceInterfaceType(typeText)) {
      const serviceKey = propertyPath[propertyPath.length - 1];
      
      if (this.options.verbose) {
        console.log(`    🔗 Found direct interface type:`);
        console.log(`      propertyPath: [${propertyPath.join(', ')}]`);
        console.log(`      serviceKey: "${serviceKey}"`);
        console.log(`      interfaceType: "${typeText}"`);
      }

      return {
        serviceKey,
        interfaceType: typeText,
        isOptional: property.hasQuestionToken(),
        propertyPath,
        sourceLocation: `${sourceFile.getBaseName()}:${property.getStartLineNumber()}`
      };
    }

    return null;
  }

  /**
   * FIXED: Check if a type is a service interface (not a primitive)
   */
  private isServiceInterfaceType(typeText: string): boolean {
    // Skip primitive types
    const primitiveTypes = ['string', 'number', 'boolean', 'any', 'unknown', 'void', 'null', 'undefined'];
    if (primitiveTypes.includes(typeText.toLowerCase())) {
      return false;
    }

    // Skip built-in object types
    const builtInTypes = ['Date', 'RegExp', 'Error', 'Array', 'Object', 'Function', 'Promise'];
    if (builtInTypes.includes(typeText)) {
      return false;
    }

    // Skip array types
    if (typeText.endsWith('[]') || typeText.includes('Array<')) {
      return false;
    }

    // Consider types ending with common service patterns as service interfaces
    const servicePatterns = ['Interface', 'Service', 'Repository', 'Manager', 'Controller', 'Handler'];
    if (servicePatterns.some(pattern => typeText.includes(pattern))) {
      return true;
    }

    // Consider generic types as potential service interfaces
    if (typeText.includes('<') && typeText.includes('>')) {
      return true;
    }

    // Consider capitalized types as potential interfaces
    if (/^[A-Z][a-zA-Z0-9]*$/.test(typeText)) {
      return true;
    }

    return false;
  }

  /**
   * FIXED: Extract ALL markers from interface or type alias declaration
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
      
      if (this.options.verbose) {
        console.log(`  📝 Interface has ${properties.length} properties`);
      }
      
      for (const property of properties) {
        const propName = property.getName();
        const currentPath = [...propertyPath, propName];
        
        const propertyTypeNode = property.getTypeNode();
        if (propertyTypeNode) {
          if (this.options.verbose) {
            console.log(`    🔍 Processing property: ${propName}`);
          }

          // Check for direct inject marker
          const directMarker = this.extractDirectInjectMarker(property, currentPath, sourceFile);
          if (directMarker) {
            markers.push(directMarker);
          }

          // Always recurse to find nested markers
          const nestedMarkers = this.extractInjectMarkersRecursive(propertyTypeNode, sourceFile, currentPath);
          markers.push(...nestedMarkers);
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

    if (this.options.verbose) {
      console.log(`📊 Total markers found in declaration: ${markers.length}`);
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

      let resolvedPath: string;
      if (moduleSpecifier.startsWith(".")) {
        resolvedPath = path.resolve(currentDir, moduleSpecifier);
      } else {
        const srcDir = this.options.srcDir || './src';
        resolvedPath = path.resolve(srcDir, moduleSpecifier);
      }

      const extensions = [".ts", ".tsx", "/index.ts", "/index.tsx"];
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        const project = sourceFile.getProject();
        const importedFile = project.getSourceFile(fullPath);
        if (importedFile) {
          if (this.options.verbose) {
            console.log(`✅ Resolved import: ${moduleSpecifier} -> ${fullPath}`);
          }
          return importedFile;
        }
      }

      if (this.options.verbose) {
        console.log(`❌ Could not resolve import: ${moduleSpecifier}`);
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to resolve import: ${moduleSpecifier}`, error);
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

    // Check for direct service interface types
    if (Node.isTypeLiteral(typeNode)) {
      const members = typeNode.getMembers();
      for (const member of members) {
        if (Node.isPropertySignature(member)) {
          const memberTypeNode = member.getTypeNode();
          if (memberTypeNode) {
            const memberTypeText = memberTypeNode.getText();
            // Check for both inject markers and direct service interfaces
            if (memberTypeText.includes("Inject<") || 
                memberTypeText.includes("InjectOptional<") ||
                this.isServiceInterfaceType(memberTypeText)) {
              return true;
            }
            // Recurse into nested structures
            if (this.hasInjectMarkersRecursive(memberTypeNode, sourceFile)) {
              return true;
            }
          }
        }
      }
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

  /**
   * FIXED: Debug method to analyze property path extraction with ALL dependencies
   */
  debugPropertyPathExtraction(typeNode: TypeNode, sourceFile: SourceFile): void {
    if (!this.options.verbose) return;

    console.log('\n🐛 DEBUG: Complete Property Path Extraction Analysis');
    console.log('====================================================');
    console.log(`Type: ${typeNode.getKindName()}`);
    console.log(`Text: ${typeNode.getText()}`);
    
    const markers = this.extractFromTypeNode(typeNode, sourceFile);
    
    console.log(`\nFound ${markers.length} markers:`);
    markers.forEach((marker, index) => {
      console.log(`\n[${index + 1}] Marker:`);
      console.log(`  serviceKey: "${marker.serviceKey}"`);
      console.log(`  interfaceType: "${marker.interfaceType}"`);
      console.log(`  propertyPath: [${marker.propertyPath.map(p => `"${p}"`).join(', ')}]`);
      console.log(`  isOptional: ${marker.isOptional}`);
      console.log(`  sourceLocation: "${marker.sourceLocation}"`);
    });
    
    console.log('\n====================================================\n');
  }

  /**
   * ADDED: Method to extract dependencies from complex nested structures
   */
  extractAllDependenciesFromComplexType(
    typeNode: TypeNode,
    sourceFile: SourceFile
  ): ExtractedInjectMarker[] {
    const allMarkers: ExtractedInjectMarker[] = [];
    
    if (this.options.verbose) {
      console.log('\n🔍 EXTRACTING ALL DEPENDENCIES FROM COMPLEX TYPE');
      console.log('================================================');
    }

    // Extract with comprehensive traversal
    const markers = this.extractInjectMarkersRecursive(typeNode, sourceFile, []);
    allMarkers.push(...markers);

    // Double-check by traversing the AST differently for edge cases
    if (Node.isTypeLiteral(typeNode)) {
      const members = typeNode.getMembers();
      for (const member of members) {
        if (Node.isPropertySignature(member)) {
          const memberTypeNode = member.getTypeNode();
          if (memberTypeNode) {
            const memberTypeText = memberTypeNode.getText();
            
            // Check for missed service interface types
            if (this.isServiceInterfaceType(memberTypeText) && 
                !allMarkers.some(m => m.serviceKey === member.getName())) {
              
              const additionalMarker: ExtractedInjectMarker = {
                serviceKey: member.getName(),
                interfaceType: memberTypeText,
                isOptional: member.hasQuestionToken(),
                propertyPath: [member.getName()],
                sourceLocation: `${sourceFile.getBaseName()}:${member.getStartLineNumber()}`
              };
              
              allMarkers.push(additionalMarker);
              
              if (this.options.verbose) {
                console.log(`🔍 Found additional service interface: ${member.getName()} -> ${memberTypeText}`);
              }
            }
          }
        }
      }
    }

    if (this.options.verbose) {
      console.log(`\n📊 TOTAL DEPENDENCIES EXTRACTED: ${allMarkers.length}`);
      allMarkers.forEach((marker, index) => {
        console.log(`  [${index + 1}] ${marker.propertyPath.join('.')} -> ${marker.interfaceType}`);
      });
      console.log('================================================\n');
    }

    return allMarkers;
  }
}