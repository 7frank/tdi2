/**
 * ESLint Metadata Loader
 * Loads and caches TDI2 ESLint metadata for interface resolution context
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ESLintMetadata,
  MetadataResult,
  InterfaceMetadata,
  ImplementationInfo,
  ComponentMetadata,
  MetadataIssue,
  ImplementationMetadata,
} from '../types.js';

export class MetadataLoader {
  private cache: MetadataResult | null = null;
  private cacheTime: number = 0;
  public cacheTTL: number = 5000; // 5 second cache (public for testing)
  private metadataPath: string | null = null;

  /**
   * Load ESLint metadata from project
   */
  loadMetadata(projectRoot: string): MetadataResult {
    // Check cache
    if (this.cache && Date.now() - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }

    // Try to load metadata
    this.metadataPath = path.join(projectRoot, '.tdi2', 'eslint-metadata.json');

    if (!fs.existsSync(this.metadataPath)) {
      const error = {
        error: 'CONFIG_NOT_FOUND' as const,
        message: 'TDI2 config not found. Run your app once to generate interface resolution data.',
      };
      this.cache = error;
      return error;
    }

    try {
      const content = fs.readFileSync(this.metadataPath, 'utf8');
      const metadata = JSON.parse(content) as ESLintMetadata;
      this.cache = metadata;
      this.cacheTime = Date.now();
      return metadata;
    } catch (err) {
      const error = {
        error: 'PARSE_ERROR' as const,
        message: `Failed to parse ESLint metadata: ${(err as Error).message}`,
      };
      this.cache = error;
      return error;
    }
  }

  /**
   * Get interface resolution information
   */
  getInterfaceResolution(interfaceName: string): InterfaceMetadata | null {
    if (!this.cache || 'error' in this.cache) return null;
    return this.cache.interfaces?.[interfaceName] || null;
  }

  /**
   * Get implementation information
   */
  getImplementationInfo(className: string): ImplementationInfo | null {
    if (!this.cache || 'error' in this.cache) return null;
    return this.cache.implementations?.[className] || null;
  }

  /**
   * Get component injection information
   */
  getComponentInjections(filePath: string): ComponentMetadata | null {
    if (!this.cache || 'error' in this.cache) return null;
    return this.cache.components?.[filePath] || null;
  }

  /**
   * Get all detected issues
   */
  getIssues(): MetadataIssue[] {
    if (!this.cache || 'error' in this.cache) return [];
    return this.cache.issues || [];
  }

  /**
   * Check if interface has ambiguous resolution
   */
  isAmbiguous(interfaceName: string): boolean {
    const interfaceData = this.getInterfaceResolution(interfaceName);
    return interfaceData?.hasAmbiguity || false;
  }

  /**
   * Get all implementations for an interface
   */
  getAllImplementations(interfaceName: string): ImplementationMetadata[] {
    const interfaceData = this.getInterfaceResolution(interfaceName);
    return interfaceData?.implementations || [];
  }

  /**
   * Get selected implementation for an interface
   */
  getSelectedImplementation(interfaceName: string): ImplementationMetadata | null {
    const interfaceData = this.getInterfaceResolution(interfaceName);
    if (!interfaceData || !interfaceData.selectedImplementation) return null;

    return (
      interfaceData.implementations.find(
        (impl) => impl.implementationClass === interfaceData.selectedImplementation
      ) || null
    );
  }

  /**
   * Get other (non-selected) implementations for an interface
   */
  getOtherImplementations(interfaceName: string): ImplementationMetadata[] {
    const interfaceData = this.getInterfaceResolution(interfaceName);
    if (!interfaceData || !interfaceData.selectedImplementation) {
      return interfaceData?.implementations || [];
    }

    return interfaceData.implementations.filter(
      (impl) => impl.implementationClass !== interfaceData.selectedImplementation
    );
  }

  /**
   * Get interfaces implemented by a class
   */
  getImplementedInterfaces(className: string): string[] {
    const implInfo = this.getImplementationInfo(className);
    return implInfo?.implementsInterfaces?.map((ref) => ref.interfaceName) || [];
  }

  /**
   * Check if metadata is available
   */
  isAvailable(): boolean {
    return this.cache !== null && !('error' in this.cache);
  }

  /**
   * Get metadata error if any
   */
  getError(): { type: string; message: string } | null {
    if (!this.cache || !('error' in this.cache)) return null;
    return {
      type: this.cache.error,
      message: this.cache.message,
    };
  }

  /**
   * Invalidate cache (useful for tests or when metadata file changes)
   */
  invalidateCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * Get metadata file path (for debugging)
   */
  getMetadataPath(): string | null {
    return this.metadataPath;
  }
}

// Export singleton instance
const metadataLoader = new MetadataLoader();
export default metadataLoader;
export { metadataLoader };
