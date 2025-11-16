// tools/shared/SharedTypeResolver.ts

import type { InterfaceImplementation,InterfaceResolverInterface, RegistrationType } from "../interface-resolver/interface-resolver-types";
import { KeySanitizer } from "../interface-resolver/key-sanitizer";

import { consoleFor } from '../logger';

const console = consoleFor('di-core:shared-type-resolver');

export interface TypeResolutionRequest {
  interfaceType: string;        // "Bar<Baz>" or "FooInterface"
  context: 'class-constructor' | 'function-parameter';
  isOptional: boolean;
  sourceLocation: string;       // For debugging
  sourceFile?: string;
}

export interface TypeResolutionResult {
  interfaceType: string;        // Original type
  implementation?: InterfaceImplementation;
  sanitizedKey: string;         // "Bar_Baz" 
  resolutionStrategy: RegistrationType | 'not-found';
  error?: string;
}

export class SharedTypeResolver {
  private keySanitizer: KeySanitizer;
  private resolutionCache = new Map<string, TypeResolutionResult>();

  constructor(
    private interfaceResolver: InterfaceResolverInterface,
    private options: { verbose?: boolean } = {}
  ) {
    this.keySanitizer = new KeySanitizer();
  }

  /**
   * Resolve a single interface type to its implementation
   */
  resolveType(request: TypeResolutionRequest): TypeResolutionResult {
    const cacheKey = `${request.interfaceType}:${request.context}`;
    
    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey)!;
    }

    const result = this.performResolution(request);
    this.resolutionCache.set(cacheKey, result);
    
    this.logResolution(request, result);

    return result;
  }

  /**
   * Resolve multiple types efficiently (batch operation)
   */
  resolveMultipleTypes(requests: TypeResolutionRequest[]): Map<string, TypeResolutionResult> {
    const results = new Map<string, TypeResolutionResult>();
    
    for (const request of requests) {
      const result = this.resolveType(request);
      results.set(request.interfaceType, result);
    }
    
    return results;
  }

  /**
   * Core resolution logic - tries multiple strategies
   */
  private performResolution(request: TypeResolutionRequest): TypeResolutionResult {
    const { interfaceType } = request;
    
    try {
      // Generate sanitized key first (always needed)
      const sanitizedKey = this.keySanitizer.sanitizeKey(interfaceType);

      // Try to resolve implementation
      const implementation = this.interfaceResolver.resolveImplementation(interfaceType);

      if (implementation) {
        return {
          interfaceType,
          implementation,
          sanitizedKey,
          resolutionStrategy: implementation.registrationType
        };
      }

      // No implementation found
      return {
        interfaceType,
        sanitizedKey,
        resolutionStrategy: 'not-found',
        error: `No implementation found for ${interfaceType}`
      };

    } catch (error) {
      return {
        interfaceType,
        sanitizedKey: this.keySanitizer.sanitizeKey(interfaceType),
        resolutionStrategy: 'not-found',
        error: error instanceof Error ? error.message : 'Unknown resolution error'
      };
    }
  }


  /**
   * Check if a type is resolvable without actually resolving it
   */
  canResolve(interfaceType: string): boolean {
    try {
      const implementation = this.interfaceResolver.resolveImplementation(interfaceType);
      return !!implementation;
    } catch {
      return false;
    }
  }

  /**
   * Get all available interface types that can be resolved
   */
  getAvailableTypes(): string[] {
    const implementations = this.interfaceResolver.getInterfaceImplementations();
    const types = new Set<string>();
    
    for (const [, impl] of implementations) {
      types.add(impl.interfaceName);
      if (impl.baseClassGeneric) {
        types.add(impl.baseClassGeneric);
      }
    }
    
    return Array.from(types);
  }

  /**
   * Normalize type strings for consistent comparison
   */
  normalizeType(interfaceType: string): string {
    return interfaceType
      .replace(/\s+/g, '') // Remove whitespace
      .replace(/,\s*/g, ','); // Normalize comma spacing
  }

  /**
   * Extract generic type parameters from interface type
   */
  extractGenericParameters(interfaceType: string): string[] {
    return this.keySanitizer.extractGenericParameters(interfaceType);
  }

  /**
   * Check if interface type is generic
   */
  isGenericType(interfaceType: string): boolean {
    return this.keySanitizer.isGenericType(interfaceType);
  }

  /**
   * Get base interface name without generics
   */
  getBaseInterfaceName(interfaceType: string): string {
    return this.keySanitizer.extractBaseTypeName(interfaceType);
  }

  /**
   * Clear resolution cache (useful for testing or dynamic updates)
   */
  clearCache(): void {
    this.resolutionCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.resolutionCache.size,
      hitRate: 0 // TODO: Implement hit rate tracking if needed
    };
  }

  /**
   * Validate that a resolution result is usable
   */
  validateResolution(result: TypeResolutionResult): boolean {
    return result.resolutionStrategy !== 'not-found' && 
           !!result.implementation && 
           !!result.sanitizedKey;
  }

  /**
   * Log resolution for debugging
   */
  private logResolution(request: TypeResolutionRequest, result: TypeResolutionResult): void {
    if (result.implementation) {
      console.log(
        `🔍 [${request.context}] ${request.interfaceType} -> ${result.implementation.implementationClass} (${result.resolutionStrategy})`
      );
    } else {
      console.warn(
        `❌ [${request.context}] ${request.interfaceType} -> NOT FOUND${result.error ? `: ${result.error}` : ''}`
      );
    }
  }

  /**
   * Create resolution suggestions for failed resolutions
   */
  createResolutionSuggestions(failedType: string): string[] {
    const suggestions: string[] = [];
    const available = this.getAvailableTypes();
    
    // Find similar interface names
    const similarTypes = available.filter(type => 
      type.toLowerCase().includes(failedType.toLowerCase()) ||
      failedType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (similarTypes.length > 0) {
      suggestions.push(`Did you mean one of: ${similarTypes.join(', ')}?`);
    }
    
    // Check if it's a generic type issue
    if (this.isGenericType(failedType)) {
      const baseType = this.getBaseInterfaceName(failedType);
      const hasBaseType = available.some(type => type === baseType);
      if (hasBaseType) {
        suggestions.push(`Found base interface '${baseType}' but not the generic variant. Check type parameters.`);
      }
    }
    
    // Check for common typos
    const commonPatterns = ['Interface', 'Service', 'Repository', 'Manager'];
    for (const pattern of commonPatterns) {
      if (!failedType.includes(pattern)) {
        const withPattern = `${failedType}${pattern}`;
        if (available.some(type => type === withPattern)) {
          suggestions.push(`Try '${withPattern}' instead of '${failedType}'`);
        }
      }
    }
    
    return suggestions;
  }
}