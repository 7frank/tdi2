// tools/interface-resolver/enhanced-interface-extractor.ts - Complete AST-driven implementation

import {
  ClassDeclaration,
  Node,
  SyntaxKind,
  ImportDeclaration,
  SourceFile
} from "ts-morph";
import { InterfaceInfo } from "./interface-resolver-types";
import { KeySanitizer } from "./key-sanitizer";

export interface DISourceConfiguration {
  decoratorSources: string[];      // ["@tdi2/di-core/decorators", "@custom/di/decorators"]
  markerSources: string[];         // ["@tdi2/di-core/markers", "@custom/di/markers"]
  validateSources: boolean;        // Whether to validate import sources
}

export class EnhancedInterfaceExtractor {
  private sourceConfig: DISourceConfiguration;
  private sourceValidationCache = new Map<string, boolean>();

  constructor(
    private keySanitizer: KeySanitizer,
    private verbose: boolean = false,
    sourceConfig?: Partial<DISourceConfiguration>
  ) {
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
   * Extract all implemented interfaces using AST methods
   */
  getImplementedInterfaces(classDecl: ClassDeclaration): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = [];

    try {
      // Use AST method to get heritage clauses instead of manual parsing
      const heritageClauses = classDecl.getHeritageClauses();

      for (const heritage of heritageClauses) {
        // Check if this is an implements clause using AST token
        if (heritage.getToken() === SyntaxKind.ImplementsKeyword) {
          // Use AST method to get type nodes
          const typeNodes = heritage.getTypeNodes();
          
          for (const typeNode of typeNodes) {
            const interfaceInfo = this.extractInterfaceFromTypeNode(typeNode);
            if (interfaceInfo) {
              interfaces.push(interfaceInfo);
              
              if (this.verbose) {
                console.log(`🔌 Found interface: ${interfaceInfo.fullType} (generic: ${interfaceInfo.isGeneric})`);
              }
            }
          }
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.warn(
          `⚠️  Failed to parse interfaces for ${classDecl.getName()}:`,
          error
        );
      }
    }

    return interfaces;
  }

  /**
   * Extract all extended classes using AST methods
   */
  getExtendedClasses(classDecl: ClassDeclaration): InterfaceInfo[] {
    const extendedClasses: InterfaceInfo[] = [];

    try {
      const heritageClauses = classDecl.getHeritageClauses();

      for (const heritage of heritageClauses) {
        // Check if this is an extends clause using AST token
        if (heritage.getToken() === SyntaxKind.ExtendsKeyword) {
          const typeNodes = heritage.getTypeNodes();
          
          for (const typeNode of typeNodes) {
            const classInfo = this.extractInterfaceFromTypeNode(typeNode);
            if (classInfo) {
              extendedClasses.push(classInfo);
              
              if (this.verbose) {
                console.log(`🧬 Found extends: ${classInfo.fullType} (generic: ${classInfo.isGeneric})`);
              }
            }
          }
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.warn(
          `⚠️  Failed to parse extended classes for ${classDecl.getName()}:`,
          error
        );
      }
    }

    return extendedClasses;
  }

  /**
   * Extract interface information from a type node using AST
   */
  private extractInterfaceFromTypeNode(typeNode: any): InterfaceInfo | null {
    try {
      // Get the full text representation
      const fullType = typeNode.getText();
      
      // Determine if it's generic by checking for type arguments
      const typeArgs = typeNode.getTypeArguments?.() || [];
      const isGeneric = typeArgs.length > 0;
      
      let name: string;
      let typeParameters: string[] = [];

      if (isGeneric) {
        // For generic types, extract the identifier and type arguments using AST
        if (Node.isTypeReference(typeNode)) {
          const typeName = typeNode.getTypeName();
          name = typeName.getText();
          
          // Extract type parameters using AST
          typeParameters = typeArgs.map((arg: any) => arg.getText());
        } else {
          // Fallback to text parsing for complex cases
          const match = fullType.match(/^([^<]+)<(.+)>$/);
          if (match) {
            name = match[1];
            typeParameters = this.parseTypeParameters(match[2]);
          } else {
            name = fullType;
          }
        }
      } else {
        // Simple type - just get the identifier
        if (Node.isIdentifier(typeNode)) {
          name = typeNode.getText();
        } else if (Node.isTypeReference(typeNode)) {
          const typeName = typeNode.getTypeName();
          name = typeName.getText();
        } else {
          name = fullType;
        }
      }

      return {
        name,
        fullType,
        isGeneric,
        typeParameters
      };
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Failed to extract interface from type node:`, error);
      }
      return null;
    }
  }

  /**
   * Parse type parameters from a string (fallback for complex cases)
   */
  private parseTypeParameters(typeParamsString: string): string[] {
    const params: string[] = [];
    let current = '';
    let depth = 0;
    
    for (const char of typeParamsString) {
      if (char === '<') {
        depth++;
      } else if (char === '>') {
        depth--;
      } else if (char === ',' && depth === 0) {
        params.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    
    if (current.trim()) {
      params.push(current.trim());
    }
    
    return params;
  }

  /**
   * Validate that a decorator comes from a valid DI source
   */
  validateDecoratorSource(decorator: any, sourceFile: SourceFile): boolean {
    if (!this.sourceConfig.validateSources) {
      return true; // Skip validation if disabled
    }

    try {
      const decoratorName = this.getDecoratorName(decorator);
      if (!decoratorName) return false;

      // Check cache first
      const cacheKey = `${sourceFile.getFilePath()}:${decoratorName}`;
      if (this.sourceValidationCache.has(cacheKey)) {
        return this.sourceValidationCache.get(cacheKey)!;
      }

      // Find import declaration for this decorator
      const imports = sourceFile.getImportDeclarations();
      const isValid = this.isDecoratorFromValidSource(decoratorName, imports);
      
      // Cache result
      this.sourceValidationCache.set(cacheKey, isValid);
      
      if (this.verbose && !isValid) {
        console.warn(`⚠️  Decorator ${decoratorName} not from valid source`);
      }
      
      return isValid;
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Failed to validate decorator source:`, error);
      }
      return false;
    }
  }

  /**
   * Validate that a marker type comes from a valid DI source
   */
  validateMarkerSource(markerType: string, sourceFile: SourceFile): boolean {
    if (!this.sourceConfig.validateSources) {
      return true;
    }

    try {
      // Extract marker name (Inject, InjectOptional)
      const markerMatch = markerType.match(/^(InjectOptional?)<.+>$/);
      if (!markerMatch) return false;
      
      const markerName = markerMatch[1];
      
      // Check cache
      const cacheKey = `${sourceFile.getFilePath()}:${markerName}`;
      if (this.sourceValidationCache.has(cacheKey)) {
        return this.sourceValidationCache.get(cacheKey)!;
      }

      // Find import declaration
      const imports = sourceFile.getImportDeclarations();
      const isValid = this.isMarkerFromValidSource(markerName, imports);
      
      this.sourceValidationCache.set(cacheKey, isValid);
      
      if (this.verbose && !isValid) {
        console.warn(`⚠️  Marker ${markerName} not from valid source`);
      }
      
      return isValid;
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Failed to validate marker source:`, error);
      }
      return false;
    }
  }

  /**
   * Get decorator name from decorator node
   */
  private getDecoratorName(decorator: any): string | null {
    try {
      const expression = decorator.getExpression();
      
      if (Node.isCallExpression(expression)) {
        const expr = expression.getExpression();
        return Node.isIdentifier(expr) ? expr.getText() : null;
      } else if (Node.isIdentifier(expression)) {
        return expression.getText();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if decorator is imported from valid source
   */
  private isDecoratorFromValidSource(
    decoratorName: string, 
    imports: ImportDeclaration[]
  ): boolean {
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if import is from valid decorator source
      if (!this.sourceConfig.decoratorSources.some(source => 
        moduleSpecifier === source || moduleSpecifier.includes(source)
      )) {
        continue;
      }

      // Check if decorator is in named imports
      const namedImports = importDecl.getNamedImports();
      if (namedImports.some(ni => ni.getName() === decoratorName)) {
        return true;
      }

      // Check default import
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport && defaultImport.getText() === decoratorName) {
        return true;
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
   * Check if marker is imported from valid source
   */
  private isMarkerFromValidSource(
    markerName: string, 
    imports: ImportDeclaration[]
  ): boolean {
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if import is from valid marker source
      if (!this.sourceConfig.markerSources.some(source => 
        moduleSpecifier === source || moduleSpecifier.includes(source)
      )) {
        continue;
      }

      // Check if marker is in named imports (usually type-only)
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
    }

    return false;
  }

  /**
   * Update source configuration
   */
  updateSourceConfiguration(config: Partial<DISourceConfiguration>): void {
    this.sourceConfig = { ...this.sourceConfig, ...config };
    this.sourceValidationCache.clear(); // Clear cache when config changes
  }

  /**
   * Get current source configuration
   */
  getSourceConfiguration(): DISourceConfiguration {
    return { ...this.sourceConfig };
  }

  /**
   * Clear source validation cache
   */
  clearSourceCache(): void {
    this.sourceValidationCache.clear();
  }

  /**
   * Generate comprehensive interface pattern matching
   */
  matchesInterfacePattern(interfaceInfo: InterfaceInfo, patterns: string[]): boolean {
    for (const pattern of patterns) {
      // Exact match
      if (interfaceInfo.name === pattern || interfaceInfo.fullType === pattern) {
        return true;
      }

      // Regex pattern match
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(interfaceInfo.name) || regex.test(interfaceInfo.fullType)) {
          return true;
        }
      } catch (error) {
        // Invalid regex, skip
      }

      // Wildcard pattern match
      if (pattern.includes('*')) {
        const regexPattern = pattern.replace(/\*/g, '.*');
        try {
          const regex = new RegExp(`^${regexPattern}$`, 'i');
          if (regex.test(interfaceInfo.name) || regex.test(interfaceInfo.fullType)) {
            return true;
          }
        } catch (error) {
          // Invalid regex, skip
        }
      }
    }

    return false;
  }

  /**
   * Extract all heritage information (implements + extends) 
   */
  getAllHeritageInfo(classDecl: ClassDeclaration): {
    implements: InterfaceInfo[];
    extends: InterfaceInfo[];
    all: InterfaceInfo[];
  } {
    const implements = this.getImplementedInterfaces(classDecl);
    const _extends = this.getExtendedClasses(classDecl);
    const all = [...implements, ..._extends];

    return { implements, extends, all };
  }

  /**
   * Check if class has specific interface pattern
   */
  hasInterfaceMatching(classDecl: ClassDeclaration, pattern: string | RegExp): boolean {
    const heritage = this.getAllHeritageInfo(classDecl);
    
    for (const info of heritage.all) {
      if (typeof pattern === 'string') {
        if (info.name === pattern || info.fullType.includes(pattern)) {
          return true;
        }
      } else {
        if (pattern.test(info.name) || pattern.test(info.fullType)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extract metadata for debugging
   */
  getExtractionMetadata(classDecl: ClassDeclaration): {
    className: string;
    heritageClauseCount: number;
    implementsCount: number;
    extendsCount: number;
    totalInterfaces: number;
    hasValidSources: boolean;
  } {
    const className = classDecl.getName() || 'Unknown';
    const heritageClauses = classDecl.getHeritageClauses();
    const heritage = this.getAllHeritageInfo(classDecl);
    
    return {
      className,
      heritageClauseCount: heritageClauses.length,
      implementsCount: heritage.implements.length,
      extendsCount: heritage.extends.length,
      totalInterfaces: heritage.all.length,
      hasValidSources: true // Would need to validate each interface
    };
  }
}