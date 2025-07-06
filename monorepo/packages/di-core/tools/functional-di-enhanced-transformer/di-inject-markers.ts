import { SourceFile, TypeNode, Node } from "ts-morph";

import * as path from "path";

export class DiInjectMarkers {
  constructor() {}
  /**
   * Recursively search for Inject markers in any type structure
   */
  hasInjectMarkersRecursive(
    typeNode: TypeNode,
    sourceFile: SourceFile
  ): boolean {
    // Direct text check first (fastest)
    const typeText = typeNode.getText();
    if (typeText.includes("Inject<") || typeText.includes("InjectOptional<")) {
      return true;
    }

    // Check inline type literal: { prop: Inject<Type>, nested: { deep: InjectOptional<Type> } }
    if (Node.isTypeLiteral(typeNode)) {
      return this.searchTypeLiteralForInjectMarkers(typeNode, sourceFile);
    }

    // Check type reference: ComponentProps (where ComponentProps might have Inject markers)
    if (Node.isTypeReference(typeNode)) {
      const typeName = typeNode.getTypeName().getText();
      const typeDeclaration = this.findTypeDeclaration(typeName, sourceFile);
      if (typeDeclaration) {
        return this.searchTypeDeclarationForInjectMarkers(
          typeDeclaration,
          sourceFile
        );
      }
    }

    // Check union types: Type1 | Type2
    if (Node.isUnionTypeNode && Node.isUnionTypeNode(typeNode)) {
      const unionTypes = typeNode.getTypeNodes();
      return unionTypes.some((unionType: any) =>
        this.hasInjectMarkersRecursive(unionType, sourceFile)
      );
    }

    // Check array types: Type[]
    if (Node.isArrayTypeNode && Node.isArrayTypeNode(typeNode)) {
      const elementType = typeNode.getElementTypeNode();
      return this.hasInjectMarkersRecursive(elementType, sourceFile);
    }

    return false;
  }

  /**
   * Search through all properties in a type literal for Inject markers
   */
  searchTypeLiteralForInjectMarkers(
    typeNode: TypeNode,
    sourceFile: SourceFile
  ): boolean {
    if (!Node.isTypeLiteral(typeNode)) {
      return false;
    }

    const members = typeNode.getMembers();

    for (const member of members) {
      if (Node.isPropertySignature(member)) {
        const memberTypeNode = member.getTypeNode();
        if (
          memberTypeNode &&
          this.hasInjectMarkersRecursive(memberTypeNode, sourceFile)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Search through interface/type alias declaration for Inject markers
   */
  searchTypeDeclarationForInjectMarkers(
    typeDeclaration: any,
    sourceFile: SourceFile
  ): boolean {
    // Handle interface declaration
    if (Node.isInterfaceDeclaration(typeDeclaration)) {
      const properties = typeDeclaration.getProperties();
      for (const property of properties) {
        const propertyTypeNode = property.getTypeNode();
        if (
          propertyTypeNode &&
          this.hasInjectMarkersRecursive(propertyTypeNode, sourceFile)
        ) {
          return true;
        }
      }
    }

    // Handle type alias declaration
    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      const aliasTypeNode = typeDeclaration.getTypeNode();
      if (
        aliasTypeNode &&
        this.hasInjectMarkersRecursive(aliasTypeNode, sourceFile)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find type declaration (interface or type alias) in current file or imports
   */
  findTypeDeclaration(typeName: string, sourceFile: SourceFile): any {
    // First check current file
    const localInterface = sourceFile.getInterface(typeName);
    if (localInterface) return localInterface;

    const localTypeAlias = sourceFile.getTypeAlias(typeName);
    if (localTypeAlias) return localTypeAlias;

    // Then check imported types
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const namedImports = importDecl.getNamedImports();
      const isTypeImported = namedImports.some(
        (namedImport: any) => namedImport.getName() === typeName
      );

      if (isTypeImported) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const importedFile = this.resolveImportedFile(
          moduleSpecifier,
          sourceFile
        );
        if (importedFile) {
          const importedInterface = importedFile.getInterface(typeName);
          if (importedInterface) return importedInterface;

          const importedTypeAlias = importedFile.getTypeAlias(typeName);
          if (importedTypeAlias) return importedTypeAlias;
        }
      }
    }

    return null;
  }

  /**
   * Resolve imported file path
   */
  resolveImportedFile(moduleSpecifier: string, sourceFile: SourceFile): any {
    try {
      const currentDir = path.dirname(sourceFile.getFilePath());

      let resolvedPath: string;
      if (moduleSpecifier.startsWith(".")) {
        resolvedPath = path.resolve(currentDir, moduleSpecifier);
      } else {
        resolvedPath = path.resolve(this.options.srcDir, moduleSpecifier);
      }

      const extensions = [".ts", ".tsx", "/index.ts", "/index.tsx"];
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        const project = sourceFile.getProject();
        const importedFile = project.getSourceFile(fullPath);
        if (importedFile) return importedFile;
      }
    } catch (error) {
      // Ignore resolution errors
    }

    return null;
  }
}
