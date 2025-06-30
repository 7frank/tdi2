// tools/functional-di-enhanced-transformer/dependency-extractor.ts - Extracts dependencies from parameters

import {
  ParameterDeclaration,
  Node,
  TypeNode,
  InterfaceDeclaration,
  TypeAliasDeclaration
} from 'ts-morph';
import * as path from 'path';
import { FunctionalDependency, TransformationOptions, TypeResolutionContext } from './types';
import { KeySanitizer } from '../interface-resolver/key-sanitizer';

export class DependencyExtractor {
  private keySanitizer: KeySanitizer;

  constructor(private options: TransformationOptions) {
    this.keySanitizer = new KeySanitizer();
  }

  /**
   * Extract dependencies from function parameter
   */
  extractDependenciesFromParameter(param: ParameterDeclaration, sourceFile: any): FunctionalDependency[] {
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
      return this.extractFromTypeLiteral(typeNode);
    }

    // Case 2: Type reference - props: TodoAppProps
    if (Node.isTypeReference(typeNode)) {
      if (this.options.verbose) {
        console.log('📝 Found type reference');
      }
      return this.extractFromTypeReference(typeNode, sourceFile);
    }

    return [];
  }

  /**
   * Extract dependencies from inline type literal
   */
  private extractFromTypeLiteral(typeNode: any): FunctionalDependency[] {
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

    // Find the services property
    const servicesProperty = members.find((member: any) => 
      Node.isPropertySignature(member) && member.getName() === 'services'
    );
    
    if (!servicesProperty || !Node.isPropertySignature(servicesProperty)) {
      if (this.options.verbose) {
        console.log('⚠️  No services property found and no direct Inject types in type literal');
      }
      return [];
    }

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

    return this.extractFromServicesTypeLiteral(serviceTypeNode);
  }

  /**
   * Extract dependencies from type reference (interface/type alias)
   */
  private extractFromTypeReference(typeNode: any, sourceFile: any): FunctionalDependency[] {
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
      return this.extractFromInterfaceDeclaration(typeDeclaration);
    }

    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      return this.extractFromTypeAliasDeclaration(typeDeclaration);
    }

    return [];
  }

  /**
   * Find interface or type alias declaration in the source file or imported files
   */
  private findTypeDeclaration(typeName: string, sourceFile: any): InterfaceDeclaration | TypeAliasDeclaration | undefined {
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
  private resolveImportedFile(moduleSpecifier: string, sourceFile: any): any | undefined {
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
   * Extract dependencies from interface declaration
   */
  private extractFromInterfaceDeclaration(interfaceDecl: InterfaceDeclaration): FunctionalDependency[] {
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

    const servicesProperty = properties.find(prop => {
      const propName = prop.getName();
      if (this.options.verbose) {
        console.log(`🔍 Checking property: ${propName}`);
      }
      return propName === 'services';
    });

    if (!servicesProperty) {
      if (this.options.verbose) {
        console.log(`⚠️  No services property found in interface ${interfaceDecl.getName()}`);
        console.log(`📋 Available properties: ${properties.map(p => p.getName()).join(', ')}`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Found services property in interface ${interfaceDecl.getName()}`);
    }

    const serviceTypeNode = servicesProperty.getTypeNode();
    if (!serviceTypeNode) {
      if (this.options.verbose) {
        console.log(`⚠️  Services property in interface ${interfaceDecl.getName()} has no type annotation`);
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
        console.log(`✅ Found type literal for services property in interface ${interfaceDecl.getName()}`);
      }
      return this.extractFromServicesTypeLiteral(serviceTypeNode);
    }

    if (Node.isTypeReference(serviceTypeNode)) {
      if (this.options.verbose) {
        console.log(`✅ Found type reference for services property in interface ${interfaceDecl.getName()}`);
      }
      // Get the source file containing this interface
      const sourceFile = interfaceDecl.getSourceFile();
      return this.extractFromTypeReference(serviceTypeNode, sourceFile);
    }

    if (this.options.verbose) {
      console.log(`⚠️  Services property in interface ${interfaceDecl.getName()} is not a supported type (${serviceTypeNode.getKindName()})`);
      console.log(`📝 Full property text: ${servicesProperty.getText()}`);
    }

    return [];
  }

  /**
   * Extract from services type literal specifically
   */
  private extractFromServicesTypeLiteral(typeNode: any): FunctionalDependency[] {
    const dependencies: FunctionalDependency[] = [];
    const members = typeNode.getMembers();

    for (const member of members) {
      if (Node.isPropertySignature(member)) {
        const propName = member.getName();
        const propTypeNode = member.getTypeNode();
        
        if (propTypeNode) {
          const dependency = this.parseDependencyType(propName, propTypeNode);
          if (dependency) {
            dependencies.push(dependency);
            if (this.options.verbose) {
              console.log(`✅ Added dependency: ${propName} -> ${dependency.interfaceType}`);
            }
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Extract dependencies from type alias declaration
   */
  private extractFromTypeAliasDeclaration(typeAlias: TypeAliasDeclaration): FunctionalDependency[] {
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

    return this.extractFromTypeLiteral(typeNode);
  }

  /**
   * Parse individual dependency types correctly
   */
  private parseDependencyType(propName: string, typeNode: TypeNode): FunctionalDependency | null {
    const typeText = typeNode.getText();
    
    const injectMatch = typeText.match(/Inject<([^>]+)>/);
    const optionalMatch = typeText.match(/InjectOptional<([^>]+)>/);
    
    let interfaceType: string;
    let isOptional: boolean;

    if (injectMatch) {
      interfaceType = injectMatch[1];
      isOptional = false;
    } else if (optionalMatch) {
      interfaceType = optionalMatch[1];
      isOptional = true;
    } else {
      // Not a DI marker type
      return null;
    }

    // Use the same key sanitization as the interface resolver
    const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceType);

    if (this.options.verbose) {
      console.log(`🔗 Found dependency: ${propName} -> ${interfaceType} (${isOptional ? 'optional' : 'required'})`);
    }

    return {
      serviceKey: propName,
      interfaceType,
      sanitizedKey,
      isOptional
    };
  }
}