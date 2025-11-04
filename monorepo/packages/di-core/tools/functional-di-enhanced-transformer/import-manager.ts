// tools/functional-di-enhanced-transformer/import-manager.ts - Manages DI imports

import * as path from "path";
import { TransformationOptions } from "./types";

export class ImportManager {
  constructor(private options: TransformationOptions) {}

  getStaticContextPackageImportPath(): string {
    // Return the static import path for the DI context package
    return "@tdi2/di-core/context";
  }

  /**
   * Ensure DI imports are present in the source file
   */
  ensureDIImports(sourceFile: any): void {
    const existingImports = sourceFile.getImportDeclarations();
    const hasDIImport = existingImports.some((imp: any) =>
      imp
        .getModuleSpecifierValue()
        .includes(this.getStaticContextPackageImportPath())
    );

    if (!hasDIImport) {
      const relativePath = this.getStaticContextPackageImportPath();

      if (this.options.verbose) {
        console.log(
          `📦 Adding DI import to ${sourceFile.getBaseName()}: ${relativePath}`
        );
      }

      sourceFile.addImportDeclaration({
        moduleSpecifier: relativePath,
        namedImports: ["useService", "useOptionalService"],
      });
    }
  }

  /**
   * Add React import if needed
   */
  ensureReactImport(sourceFile: any): void {
    const existingImports = sourceFile.getImportDeclarations();
    const hasReactImport = existingImports.some(
      (imp: any) => imp.getModuleSpecifierValue() === "react"
    );

    if (!hasReactImport) {
      if (this.options.verbose) {
        console.log(`📦 Adding React import to ${sourceFile.getBaseName()}`);
      }

      sourceFile.addImportDeclaration({
        moduleSpecifier: "react",
        defaultImport: "React",
      });
    }
  }

  /**
   * Remove unnecessary imports
   */
  removeUnusedImports(sourceFile: any): void {
    const imports = sourceFile.getImportDeclarations();

    for (const importDecl of imports) {
      const namedImports = importDecl.getNamedImports();
      const usedImports: string[] = [];

      for (const namedImport of namedImports) {
        const importName = namedImport.getName();
        if (this.isImportUsed(sourceFile, importName)) {
          usedImports.push(importName);
        }
      }

      // Update import with only used imports
      if (usedImports.length === 0) {
        // Remove entire import if nothing is used
        importDecl.remove();

        if (this.options.verbose) {
          console.log(
            `🗑️  Removed unused import: ${importDecl.getModuleSpecifierValue()}`
          );
        }
      } else if (usedImports.length < namedImports.length) {
        // Update import with only used imports
        importDecl.removeNamedImports();
        importDecl.addNamedImports(usedImports);

        if (this.options.verbose) {
          console.log(
            `🔄 Updated import to include only: ${usedImports.join(", ")}`
          );
        }
      }
    }
  }

  /**
   * Check if an import is used in the file
   */
  private isImportUsed(sourceFile: any, importName: string): boolean {
    const sourceText = sourceFile.getFullText();

    // Simple usage check - look for the import name in the code
    // This is a basic implementation; a more sophisticated version would use AST analysis
    const regex = new RegExp(`\\b${importName}\\b`, "g");
    const matches = sourceText.match(regex);

    // Should appear at least twice - once in import, once in usage
    return matches && matches.length > 1;
  }

  /**
   * Organize imports (sort and group)
   */
  organizeImports(sourceFile: any): void {
    const imports = sourceFile.getImportDeclarations();
    if (imports.length === 0) return;

    // Group imports by type
    const reactImports: any[] = [];
    const diImports: any[] = [];
    const relativeImports: any[] = [];
    const nodeModuleImports: any[] = [];

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      if (moduleSpecifier === "react") {
        reactImports.push(importDecl);
      } else if (
        moduleSpecifier.includes("di/context") ||
        moduleSpecifier.includes("di/markers")
      ) {
        diImports.push(importDecl);
      } else if (moduleSpecifier.startsWith(".")) {
        relativeImports.push(importDecl);
      } else {
        nodeModuleImports.push(importDecl);
      }
    }

    // Remove all imports and re-add in order
    for (const importDecl of imports) {
      importDecl.remove();
    }

    // Re-add imports in order: React, node_modules, DI, relative
    const orderedImports = [
      ...reactImports,
      ...nodeModuleImports,
      ...diImports,
      ...relativeImports,
    ];

    for (const importDecl of orderedImports) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: importDecl.getModuleSpecifierValue(),
        defaultImport: importDecl.getDefaultImport()?.getText(),
        namedImports: importDecl
          .getNamedImports()
          .map((ni: any) => ni.getName()),
        namespaceImport: importDecl.getNamespaceImport()?.getText(),
      });
    }

    if (this.options.verbose) {
      console.log(
        `📋 Organized ${orderedImports.length} imports in ${sourceFile.getBaseName()}`
      );
    }
  }

  /**
   * Add type imports for DI markers
   */
  ensureDITypeImports(sourceFile: any): void {
    const sourceText = sourceFile.getFullText();
    const needsInjectTypes =
      sourceText.includes("Inject<") || sourceText.includes("InjectOptional<");

    if (!needsInjectTypes) return;

    const existingImports = sourceFile.getImportDeclarations();
    const hasDITypeImport = existingImports.some((imp: any) =>
      imp.getModuleSpecifierValue().includes("di/markers")
    );

    if (!hasDITypeImport) {
      const relativePath = this.calculateDIMarkersImportPath(sourceFile);

      if (this.options.verbose) {
        console.log(
          `📦 Adding DI type import to ${sourceFile.getBaseName()}: ${relativePath}`
        );
      }

      sourceFile.addImportDeclaration({
        moduleSpecifier: relativePath,
        namedImports: ["Inject", "InjectOptional"],
        isTypeOnly: true,
      });
    }
  }

  /**
   * Calculate correct relative import path for DI markers
   */
  private calculateDIMarkersImportPath(sourceFile: any): string {
    const currentFilePath = sourceFile.getFilePath();

    // Find which scanDir this file belongs to for correct DI markers path
    const scanDirs = this.options.scanDirs || [this.options.srcDir!];
    const absolutePath = path.resolve(currentFilePath);
    const matchingScanDir = scanDirs.find((dir: string) => absolutePath.startsWith(path.resolve(dir)));
    const srcDir = matchingScanDir ? path.resolve(matchingScanDir) : path.resolve(scanDirs[0]);

    const diMarkersPath = path.join(srcDir, "di", "markers");

    // Calculate relative path
    const currentFileDir = path.dirname(currentFilePath);
    const relativePath = path
      .relative(currentFileDir, diMarkersPath)
      .replace(/\\/g, "/"); // Normalize to forward slashes

    // Ensure the path starts with ./ or ../
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  }

  /**
   * Update existing imports to include new dependencies
   */
  updateExistingImports(
    sourceFile: any,
    newImports: string[],
    moduleSpecifier: string
  ): void {
    const existingImports = sourceFile.getImportDeclarations();
    const targetImport = existingImports.find(
      (imp: any) => imp.getModuleSpecifierValue() === moduleSpecifier
    );

    if (targetImport) {
      const existingNamedImports = targetImport
        .getNamedImports()
        .map((ni: any) => ni.getName());
      const allImports = [...new Set([...existingNamedImports, ...newImports])];

      targetImport.removeNamedImports();
      targetImport.addNamedImports(allImports);

      if (this.options.verbose) {
        console.log(
          `🔄 Updated import ${moduleSpecifier} with: ${allImports.join(", ")}`
        );
      }
    } else {
      // Create new import
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: newImports,
      });

      if (this.options.verbose) {
        console.log(
          `📦 Added new import ${moduleSpecifier} with: ${newImports.join(", ")}`
        );
      }
    }
  }

  /**
   * Remove specific imports from a module
   */
  removeImportsFromModule(
    sourceFile: any,
    importsToRemove: string[],
    moduleSpecifier: string
  ): void {
    const existingImports = sourceFile.getImportDeclarations();
    const targetImport = existingImports.find(
      (imp: any) => imp.getModuleSpecifierValue() === moduleSpecifier
    );

    if (targetImport) {
      const existingNamedImports = targetImport
        .getNamedImports()
        .map((ni: any) => ni.getName());
      const filteredImports = existingNamedImports.filter(
        (imp) => !importsToRemove.includes(imp)
      );

      if (filteredImports.length === 0) {
        targetImport.remove();

        if (this.options.verbose) {
          console.log(`🗑️  Removed entire import: ${moduleSpecifier}`);
        }
      } else {
        targetImport.removeNamedImports();
        targetImport.addNamedImports(filteredImports);

        if (this.options.verbose) {
          console.log(
            `🔄 Removed ${importsToRemove.join(", ")} from import: ${moduleSpecifier}`
          );
        }
      }
    }
  }

  /**
   * Get import analysis for a source file
   */
  analyzeImports(sourceFile: any): {
    totalImports: number;
    reactImports: number;
    diImports: number;
    relativeImports: number;
    nodeModuleImports: number;
    unusedImports: string[];
    missingDIImports: boolean;
  } {
    const imports = sourceFile.getImportDeclarations();
    const sourceText = sourceFile.getFullText();

    let reactImports = 0;
    let diImports = 0;
    let relativeImports = 0;
    let nodeModuleImports = 0;
    const unusedImports: string[] = [];

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      if (moduleSpecifier === "react") {
        reactImports++;
      } else if (moduleSpecifier.includes("di/")) {
        diImports++;
      } else if (moduleSpecifier.startsWith(".")) {
        relativeImports++;
      } else {
        nodeModuleImports++;
      }

      // Check for unused imports
      const namedImports = importDecl.getNamedImports();
      for (const namedImport of namedImports) {
        const importName = namedImport.getName();
        if (!this.isImportUsed(sourceFile, importName)) {
          unusedImports.push(`${importName} from ${moduleSpecifier}`);
        }
      }
    }

    // Check if DI imports are missing but needed
    const needsDI =
      sourceText.includes("useService") ||
      sourceText.includes("useOptionalService");
    const hasDIContextImport = imports.some((imp: any) =>
      imp.getModuleSpecifierValue().includes("di/context")
    );
    const missingDIImports = needsDI && !hasDIContextImport;

    return {
      totalImports: imports.length,
      reactImports,
      diImports,
      relativeImports,
      nodeModuleImports,
      unusedImports,
      missingDIImports,
    };
  }

  /**
   * Generate import statement
   */
  generateImportStatement(
    moduleSpecifier: string,
    imports: {
      defaultImport?: string;
      namedImports?: string[];
      namespaceImport?: string;
      isTypeOnly?: boolean;
    }
  ): string {
    const parts: string[] = [];

    if (imports.isTypeOnly) {
      parts.push("import type");
    } else {
      parts.push("import");
    }

    const importParts: string[] = [];

    if (imports.defaultImport) {
      importParts.push(imports.defaultImport);
    }

    if (imports.namedImports && imports.namedImports.length > 0) {
      importParts.push(`{ ${imports.namedImports.join(", ")} }`);
    }

    if (imports.namespaceImport) {
      importParts.push(`* as ${imports.namespaceImport}`);
    }

    if (importParts.length > 0) {
      parts.push(importParts.join(", "));
      parts.push("from");
    }

    parts.push(`'${moduleSpecifier}';`);

    return parts.join(" ");
  }

  /**
   * Validate import statements
   */
  validateImports(sourceFile: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const imports = sourceFile.getImportDeclarations();

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // Check for common import issues
      if (
        moduleSpecifier.includes("..") &&
        moduleSpecifier.split("/").length > 3
      ) {
        warnings.push(`Deep relative import detected: ${moduleSpecifier}`);
      }

      if (moduleSpecifier.endsWith(".ts") || moduleSpecifier.endsWith(".tsx")) {
        errors.push(
          `Import should not include file extension: ${moduleSpecifier}`
        );
      }

      // Check for duplicate imports
      const duplicates = imports.filter(
        (imp: any) => imp.getModuleSpecifierValue() === moduleSpecifier
      );

      if (duplicates.length > 1) {
        errors.push(`Duplicate imports detected for: ${moduleSpecifier}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
