// tools/inheritance-analyzer.ts - Handles analysis of class inheritance

import {
  ClassDeclaration,
  Node,
  SyntaxKind,
} from "ts-morph";
import { InheritanceInfo, InheritanceMapping } from "./interface-resolver-types";
import { KeySanitizer } from "./key-sanitizer";

export class InheritanceAnalyzer {
  constructor(
    private keySanitizer: KeySanitizer,
    private verbose: boolean = false
  ) {}

  getInheritanceInfo(classDecl: ClassDeclaration): InheritanceInfo {
    const inheritanceChain: string[] = [];
    const inheritanceMappings: InheritanceMapping[] = [];

    try {
      const heritageClauses = classDecl.getHeritageClauses();

      for (const heritage of heritageClauses) {
        // Check if this is an extends clause
        const token = heritage.getToken();
        if (token === SyntaxKind.ExtendsKeyword) {
          for (const type of heritage.getTypeNodes()) {
            const fullType = type.getText();
            const isGeneric = fullType.includes("<");

            let baseClass = fullType;
            let baseTypeName = fullType;
            let typeParameters: string[] = [];

            if (isGeneric) {
              const match = fullType.match(/^([^<]+)<(.+)>$/);
              if (match) {
                baseClass = match[1];
                baseTypeName = match[1];
                typeParameters = match[2].split(",").map((p) => p.trim());
              }
            }

            inheritanceChain.push(fullType);

            // Create sanitized key for the inheritance mapping
            const sanitizedKey = this.keySanitizer.sanitizeInheritanceKey(fullType);

            inheritanceMappings.push({
              baseClass,
              baseClassGeneric: fullType,
              baseTypeName,
              sanitizedKey,
              isGeneric,
              typeParameters,
            });
          }
        }
      }
    } catch (error) {
      // Handle malformed heritage clauses gracefully
      console.warn(
        `⚠️  Failed to parse inheritance for ${classDecl.getName()}:`,
        error
      );
    }

    return {
      hasInheritance: inheritanceChain.length > 0,
      inheritanceChain,
      inheritanceMappings,
    };
  }

  /**
   * Check if class extends a specific base class
   */
  extendsBaseClass(inheritanceInfo: InheritanceInfo, baseClassName: string): boolean {
    return inheritanceInfo.inheritanceMappings.some(
      mapping => mapping.baseClass === baseClassName
    );
  }

  /**
   * Check if class extends a generic base class
   */
  extendsGenericBaseClass(inheritanceInfo: InheritanceInfo, baseClassName: string): boolean {
    return inheritanceInfo.inheritanceMappings.some(
      mapping => mapping.baseClass === baseClassName && mapping.isGeneric
    );
  }

  /**
   * Get type parameters for a specific base class
   */
  getTypeParametersForBaseClass(inheritanceInfo: InheritanceInfo, baseClassName: string): string[] {
    const mapping = inheritanceInfo.inheritanceMappings.find(
      mapping => mapping.baseClass === baseClassName
    );
    return mapping?.typeParameters || [];
  }

  /**
   * Get the full inheritance chain as a string array
   */
  getInheritanceChain(inheritanceInfo: InheritanceInfo): string[] {
    return inheritanceInfo.inheritanceChain;
  }

  /**
   * Check if inheritance chain contains a specific class
   */
  inheritanceChainContains(inheritanceInfo: InheritanceInfo, className: string): boolean {
    return inheritanceInfo.inheritanceChain.some(
      chainItem => chainItem.includes(className)
    );
  }

  /**
   * Get the immediate base class (first in inheritance chain)
   */
  getImmediateBaseClass(inheritanceInfo: InheritanceInfo): InheritanceMapping | null {
    return inheritanceInfo.inheritanceMappings.length > 0 
      ? inheritanceInfo.inheritanceMappings[0] 
      : null;
  }

  /**
   * Check if class is part of a specific inheritance pattern
   */
  matchesInheritancePattern(inheritanceInfo: InheritanceInfo, pattern: RegExp): boolean {
    return inheritanceInfo.inheritanceChain.some(
      chainItem => pattern.test(chainItem)
    );
  }

  /**
   * Get all base classes (without generics)
   */
  getAllBaseClasses(inheritanceInfo: InheritanceInfo): string[] {
    return inheritanceInfo.inheritanceMappings.map(mapping => mapping.baseClass);
  }

  /**
   * Get all generic base classes (with their type parameters)
   */
  getAllGenericBaseClasses(inheritanceInfo: InheritanceInfo): InheritanceMapping[] {
    return inheritanceInfo.inheritanceMappings.filter(mapping => mapping.isGeneric);
  }
}