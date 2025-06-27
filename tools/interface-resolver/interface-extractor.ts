// tools/interface-extractor.ts - Handles extraction of implemented interfaces

import {
  ClassDeclaration,
  Node,
  SyntaxKind,
} from "ts-morph";
import { InterfaceInfo } from "./interface-resolver-types";
import { KeySanitizer } from "./key-sanitizer";

export class InterfaceExtractor {
  constructor(
    private keySanitizer: KeySanitizer,
    private verbose: boolean = false
  ) {}

  getImplementedInterfaces(classDecl: ClassDeclaration): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = [];

    try {
      const heritageClauses = classDecl.getHeritageClauses();

      for (const heritage of heritageClauses) {
        // Check if this is an implements clause
        const token = heritage.getToken();
        if (token === SyntaxKind.ImplementsKeyword) {
          for (const type of heritage.getTypeNodes()) {
            const fullType = type.getText();
            const isGeneric = fullType.includes("<");

            let name = fullType;
            let typeParameters: string[] = [];

            if (isGeneric) {
              const match = fullType.match(/^([^<]+)<(.+)>$/);
              if (match) {
                name = match[1];
                typeParameters = match[2].split(",").map((p) => p.trim());
              }
            }

            interfaces.push({
              name,
              fullType,
              isGeneric,
              typeParameters,
            });
          }
        }
      }
    } catch (error) {
      // Handle malformed heritage clauses gracefully
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
   * Check if an interface follows a specific pattern
   */
  isInterfacePattern(interfaceInfo: InterfaceInfo, pattern: string): boolean {
    return interfaceInfo.name === pattern || interfaceInfo.fullType.includes(pattern);
  }

  /**
   * Extract type parameters from a generic interface
   */
  extractTypeParameters(interfaceInfo: InterfaceInfo): string[] {
    if (!interfaceInfo.isGeneric) {
      return [];
    }

    return interfaceInfo.typeParameters;
  }

  /**
   * Check if interface is a service-related interface
   */
  isServiceInterface(interfaceInfo: InterfaceInfo): boolean {
    const servicePatterns = [
      'Service',
      'Repository', 
      'Provider',
      'Handler',
      'Manager',
      'Controller'
    ];

    return servicePatterns.some(pattern => 
      interfaceInfo.name.includes(pattern) || 
      interfaceInfo.fullType.includes(pattern)
    );
  }

  /**
   * Check if interface is a state-management interface
   */
  isStateInterface(interfaceInfo: InterfaceInfo): boolean {
    const statePatterns = [
      'StateService',
      'AsyncState',
      'StateManager',
      'Store'
    ];

    return statePatterns.some(pattern => 
      interfaceInfo.name.includes(pattern) || 
      interfaceInfo.fullType.includes(pattern)
    );
  }

  /**
   * Get the base interface name without generics
   */
  getBaseInterfaceName(interfaceInfo: InterfaceInfo): string {
    return interfaceInfo.name;
  }

  /**
   * Get the full generic interface signature
   */
  getFullInterfaceSignature(interfaceInfo: InterfaceInfo): string {
    return interfaceInfo.fullType;
  }
}