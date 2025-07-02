// tools/functional-di-enhanced-transformer/enhanced-dependency-extractor.ts - AST-driven marker validation

import {
  ParameterDeclaration,
  Node,
  TypeNode,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  SourceFile,
  ImportDeclaration
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
   * Extract dependencies from function parameter with comprehensive AST analysis
   */
  extractDependenciesFromParameter(param: ParameterDeclaration, sourceFile: SourceFile): FunctionalDependency[] {
    const typeNode = param.getTypeNode();
    if (!typeNode) return [];

    if (this.options.verbose) {
      console.log(`🔍 Analyzing parameter type: ${typeNode.getKindName()}`);
    }

    // Case 1: Inline type literal - props: { services: {...} }
    if (Node.isTypeLiteral(typeNode)) {
      if (this.options.verbose) {
        console.log('📝 Found inline type literal');
      }
      return this.extractFromTypeLiteral(typeNode, sourceFile);
    }

    // Case 2: Type reference - props: ComponentProps
    if (Node.isTypeReference(typeNode)) {
      if (this.options.verbose) {
        console.log('📝 Found type reference');
      }
      return this.extractFromTypeReference(typeNode, sourceFile);
    }

    // Case 3: Direct marker injection - service: Inject<FooInterface>
    if (this.isDirectMarkerInjection(typeNode)) {
      if (this.options.verbose) {
        console.log('📝 Found direct marker injection');
      }
      return this.extractFromDirectMarker(param, typeNode, sourceFile);
    }

    return [];
  }

  /**
   * Extract dependencies from inline type literal with enhanced validation
   */
  private extractFromTypeLiteral(typeNode: TypeNode, sourceFile: SourceFile): FunctionalDependency[] {
    if (!Node.isTypeLiteral(typeNode)) return [];

    if (this.options.verbose) {
      console.log('📝 Extracting from type literal');
      console.log(`📝 Type literal text: ${typeNode.getText()}`);
    }

    const members = typeNode.getMembers();
    
    if (this.options.verbose) {
      console.log(`🔍 Type literal has ${members.length} members:`);
      members.forEach((member: any, index: number) => {
        if (Node.isPropertySignature(member)) {
          console.log(`  ${index}: ${member.getName()} (${member.getKindName()})`);
        } else {
          console.log(`  ${index}: ${member.getKindName()}`);
        }
      });
    }

    // Look for services property or direct marker properties
    const dependencies: FunctionalDependency[] = [];

    for (const member of members) {
      if (Node.isPropertySignature(member)) {
        const memberName = member.getName();
        
        if (memberName === 'services') {
          // Found services property - extract nested dependencies
          const serviceDeps = this.extractFromServicesProperty(member, sourceFile);
          dependencies.push(...serviceDeps);
        } else {
          // Check if this is a direct marker injection
          const directDep = this.extractFromPropertySignature(member, sourceFile);
          if (directDep) {
            dependencies.push(directDep);
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Extract from services property in type literal
   */
  private extractFromServicesProperty(servicesProperty: any, sourceFile: SourceFile): FunctionalDependency[] {
    const serviceTypeNode = servicesProperty.getTypeNode();
    if (!serviceTypeNode || !Node.isTypeLiteral(serviceTypeNode)) {
      if (this.options.verbose) {
        console.log('⚠️  Services property is not a type literal');
      }
      return [];
    }

    if (this.options.verbose) {
      console.log('✅ Found services property in type literal, extracting nested dependencies');
    }

    return this.extractFromServicesTypeLiteral(serviceTypeNode, sourceFile);
  }

  /**
   * Extract from services type literal specifically
   */
  private extractFromServicesTypeLiteral(typeNode: TypeNode, sourceFile: SourceFile): FunctionalDependency[] {
    if (!Node.isTypeLiteral(typeNode)) return [];

    const dependencies: FunctionalDependency[] = [];
    const members = typeNode.getMembers();

    for (const member of members) {
      if (Node.isPropertySignature(member)) {
        const dependency = this.extractFromPropertySignature(member, sourceFile);
        if (dependency) {
          dependencies.push(dependency);
          if (this.options.verbose) {
            console.log(`✅ Added dependency: ${dependency.serviceKey} -> ${dependency.interfaceType}`);
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Extract dependency from property signature with source validation
   */
  private extractFromPropertySignature(propertySignature: any, sourceFile: SourceFile): FunctionalDependency | null {
    const propName = propertySignature.getName();
    const propTypeNode = propertySignature.getTypeNode();
    if (!propTypeNode) return null;

    const typeText = propTypeNode.getText();
    
    // Parse DI marker types with source validation
    const markerInfo = this.parseMarkerType(typeText, sourceFile);
    if (!markerInfo) return null;

    // Use the same key sanitization as the interface resolver
    const sanitizedKey = this.keySanitizer.sanitizeKey(markerInfo.interfaceType);

    if (this.options.verbose) {
      console.log(`🔗 Found dependency: ${propName} -> ${markerInfo.interfaceType} (${markerInfo.isOptional ? 'optional' : 'required'})`);
      if (markerInfo.validSource) {
        console.log(`✅ Marker source validated`);
      } else {
        console.warn(`⚠️  Marker source not validated`);
      }
    }

    return {
      serviceKey: propName,
      interfaceType: markerInfo.interfaceType,
      sanitizedKey,
      isOptional: markerInfo.isOptional
    };
  }

  /**
   * Parse marker type with source validation
   */
  private parseMarkerType(typeText: string, sourceFile: SourceFile): {
    interfaceType: string;
    isOptional: boolean;
    validSource: boolean;
  } | null {
    // Match Inject<T> patterns
    const injectMatch = typeText.match(/^Inject<(.+)>$/);
    const optionalMatch = typeText.match(/^InjectOptional<(.+)>$/);
    
    let interfaceType: string;
    let isOptional: boolean;
    let markerName: string;

    if (injectMatch) {
      interfaceType = injectMatch[1];
      isOptional = false;
      markerName = 'Inject';
    } else if (optionalMatch) {
      interfaceType = optionalMatch[1];
      isOptional = true;
      markerName = 'InjectOptional';
    } else {
      // Not a DI marker type
      return null;
    }

    // Validate marker source if enabled
    const validSource = this.sourceConfig.validateSources 
      ? this.validateMarkerSource(markerName, sourceFile)
      : true;

    return {
      interfaceType,
      isOptional,
      validSource
    };
  }

  /**
   * Extract dependencies from type reference (external interface)
   */
  private extractFromTypeReference(typeNode: TypeNode, sourceFile: SourceFile): FunctionalDependency[] {
    if (!Node.isTypeReference(typeNode)) return [];

    const typeName = typeNode.getTypeName().getText();
    
    if (this.options.verbose) {
      console.log(`🔍 Resolving type reference: ${typeName}`);
    }

    // Find the interface or type alias declaration
    const typeDeclaration = this.findTypeDeclaration(typeName, sourceFile);
    if (!typeDeclaration) {
      if (this.options.verbose) {
        console.log(`❌ Could not find declaration for type: ${typeName}`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Found type declaration: ${typeDeclaration.getKindName()}`);
    }

    // Extract services property from the type declaration
    if (Node.isInterfaceDeclaration(typeDeclaration)) {
      return this.extractFromInterfaceDeclaration(typeDeclaration, sourceFile);
    }

    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      return this.extractFromTypeAliasDeclaration(typeDeclaration, sourceFile);
    }

    return [];
  }

  /**
   * Extract from interface declaration
   */
  private extractFromInterfaceDeclaration(interfaceDecl: InterfaceDeclaration, sourceFile: SourceFile): FunctionalDependency[] {
    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from interface ${interfaceDecl.getName()}`);
    }

    const properties = interfaceDecl.getProperties();
    
    if (this.options.verbose) {
      console.log(`🔍 Interface ${interfaceDecl.getName()} has ${properties.length} properties:`);
      properties.forEach(prop => {
        console.log(`  - ${prop.getName()}: ${prop.getTypeNode()?.getKindName() || 'unknown'}`);
      });
    }

    // Look for services property or direct marker properties
    const dependencies: FunctionalDependency[] = [];

    for (const property of properties) {
      const propName = property.getName();
      
      if (propName === 'services') {
        // Extract from services property
        const serviceDeps = this.extractFromServicesPropertyDeclaration(property, sourceFile);
        dependencies.push(...serviceDeps);
      } else {
        // Check for direct marker injection
        const directDep = this.extractFromPropertySignature(property, sourceFile);
        if (directDep) {
          dependencies.push(directDep);
        }
      }
    }

    return dependencies;
  }

  /**
   * Extract from services property declaration
   */
  private extractFromServicesPropertyDeclaration(property: any, sourceFile: SourceFile): FunctionalDependency[] {
    const serviceTypeNode = property.getTypeNode();
    if (!serviceTypeNode) {
      if (this.options.verbose) {
        console.log(`⚠️  Services property has no type annotation`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`🔍 Services property type: ${serviceTypeNode.getKindName()}`);
      console.log(`📝 Services property type text: ${serviceTypeNode.getText()}`);
    }

    // Handle type literal for services property
    if (Node.isTypeLiteral(serviceTypeNode)) {
      if (this.options.verbose) {
        console.log(`✅ Found type literal for services property`);
      }
      return this.extractFromServicesTypeLiteral(serviceTypeNode, sourceFile);
    }

    if (Node.isTypeReference(serviceTypeNode)) {
      if (this.options.verbose) {
        console.log(`✅ Found type reference for services property`);
      }
      return this.extractFromTypeReference(serviceTypeNode, sourceFile);
    }

    if (this.options.verbose) {
      console.log(`⚠️  Services property is not a supported type (${serviceTypeNode.getKindName()})`);
    }

    return [];
  }

  /**
   * Extract from type alias declaration
   */
  private extractFromTypeAliasDeclaration(typeAlias: TypeAliasDeclaration, sourceFile: SourceFile): FunctionalDependency[] {
    const typeNode = typeAlias.getTypeNode();
    if (!typeNode || !Node.isTypeLiteral(typeNode)) {
      if (this.options.verbose) {
        console.log(`⚠️  Type alias ${typeAlias.getName()} is not a type literal`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from type alias ${typeAlias.getName()}`);
    }

    return this.extractFromTypeLiteral(typeNode, sourceFile);
  }

  /**
   * Extract from direct marker injection (e.g., service: Inject<FooInterface>)
   */
  private extractFromDirectMarker(param: ParameterDeclaration, typeNode: TypeNode, sourceFile: SourceFile): FunctionalDependency[] {
    const paramName = param.getName();
    const typeText = typeNode.getText();
    
    const markerInfo = this.parseMarkerType(typeText, sourceFile);
    if (!markerInfo) return [];

    const sanitizedKey = this.keySanitizer.sanitizeKey(markerInfo.interfaceType);

    return [{
      serviceKey: paramName,
      interfaceType: markerInfo.interfaceType,
      sanitizedKey,
      isOptional: markerInfo.isOptional
    }];
  }

  /**
   * Check if type node represents direct marker injection
   */
  private isDirectMarkerInjection(typeNode: TypeNode): boolean {
    const typeText = typeNode.getText();
    return /^(InjectOptional?)<.+>$/.test(typeText);
  }

  /**
   * Find interface or type alias declaration in the source file or imported files
   */
  private findTypeDeclaration(typeName: string, sourceFile: SourceFile): InterfaceDeclaration | TypeAliasDeclaration | undefined {
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
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const namedImports = importDeclaration.getNamedImports();
      const isTypeImported = namedImports.some((namedImport: any) => 
        namedImport.getName() === typeName
      );

      if (isTypeImported) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
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

    return undefined;
  }

  /**
   * Resolve imported file path
   */
  private resolveImportedFile(moduleSpecifier: string, sourceFile: SourceFile): SourceFile | undefined {
    try {
      const currentDir = path.dirname(sourceFile.getFilePath());
      
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
}