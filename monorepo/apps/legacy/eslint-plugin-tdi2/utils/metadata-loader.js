/**
 * ESLint Metadata Loader
 * Loads and caches TDI2 ESLint metadata for interface resolution context
 */

const fs = require('fs');
const path = require('path');

class MetadataLoader {
  constructor() {
    this.cache = null;
    this.cacheTime = 0;
    this.cacheTTL = 5000; // 5 second cache
    this.metadataPath = null;
  }

  /**
   * Load ESLint metadata from project
   * @param {string} projectRoot - Project root directory (usually from context.getCwd())
   * @returns {Object|{error: string, message: string}} - Metadata object or error
   */
  loadMetadata(projectRoot) {
    // Check cache
    if (this.cache && Date.now() - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }

    // Try to load metadata
    this.metadataPath = path.join(projectRoot, '.tdi2', 'eslint-metadata.json');

    if (!fs.existsSync(this.metadataPath)) {
      return {
        error: 'CONFIG_NOT_FOUND',
        message: 'TDI2 config not found. Run your app once to generate interface resolution data.',
      };
    }

    try {
      const content = fs.readFileSync(this.metadataPath, 'utf8');
      this.cache = JSON.parse(content);
      this.cacheTime = Date.now();
      return this.cache;
    } catch (err) {
      return {
        error: 'PARSE_ERROR',
        message: `Failed to parse ESLint metadata: ${err.message}`,
      };
    }
  }

  /**
   * Get interface resolution information
   * @param {string} interfaceName - Interface name (e.g., 'UserServiceInterface')
   * @returns {Object|null} - Interface metadata or null
   */
  getInterfaceResolution(interfaceName) {
    if (!this.cache || this.cache.error) return null;
    return this.cache.interfaces?.[interfaceName];
  }

  /**
   * Get implementation information
   * @param {string} className - Implementation class name (e.g., 'UserService')
   * @returns {Object|null} - Implementation metadata or null
   */
  getImplementationInfo(className) {
    if (!this.cache || this.cache.error) return null;
    return this.cache.implementations?.[className];
  }

  /**
   * Get component injection information
   * @param {string} filePath - Component file path
   * @returns {Object|null} - Component metadata or null
   */
  getComponentInjections(filePath) {
    if (!this.cache || this.cache.error) return null;
    return this.cache.components?.[filePath];
  }

  /**
   * Get all detected issues
   * @returns {Array} - Array of issues
   */
  getIssues() {
    if (!this.cache || this.cache.error) return [];
    return this.cache.issues || [];
  }

  /**
   * Check if interface has ambiguous resolution
   * @param {string} interfaceName - Interface name
   * @returns {boolean} - True if ambiguous
   */
  isAmbiguous(interfaceName) {
    const interfaceData = this.getInterfaceResolution(interfaceName);
    return interfaceData?.hasAmbiguity || false;
  }

  /**
   * Get all implementations for an interface
   * @param {string} interfaceName - Interface name
   * @returns {Array} - Array of implementation metadata
   */
  getAllImplementations(interfaceName) {
    const interfaceData = this.getInterfaceResolution(interfaceName);
    return interfaceData?.implementations || [];
  }

  /**
   * Get selected implementation for an interface
   * @param {string} interfaceName - Interface name
   * @returns {Object|null} - Selected implementation metadata or null
   */
  getSelectedImplementation(interfaceName) {
    const interfaceData = this.getInterfaceResolution(interfaceName);
    if (!interfaceData || !interfaceData.selectedImplementation) return null;

    return interfaceData.implementations.find(
      (impl) => impl.implementationClass === interfaceData.selectedImplementation
    );
  }

  /**
   * Get other (non-selected) implementations for an interface
   * @param {string} interfaceName - Interface name
   * @returns {Array} - Array of implementation metadata
   */
  getOtherImplementations(interfaceName) {
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
   * @param {string} className - Class name
   * @returns {Array} - Array of interface names
   */
  getImplementedInterfaces(className) {
    const implInfo = this.getImplementationInfo(className);
    return implInfo?.implementsInterfaces?.map((ref) => ref.interfaceName) || [];
  }

  /**
   * Check if metadata is available
   * @returns {boolean} - True if metadata loaded successfully
   */
  isAvailable() {
    return this.cache && !this.cache.error;
  }

  /**
   * Get metadata error if any
   * @returns {Object|null} - Error object or null
   */
  getError() {
    if (!this.cache || !this.cache.error) return null;
    return {
      type: this.cache.error,
      message: this.cache.message,
    };
  }

  /**
   * Invalidate cache (useful for tests or when metadata file changes)
   */
  invalidateCache() {
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * Get metadata file path (for debugging)
   * @returns {string|null} - Path to metadata file or null
   */
  getMetadataPath() {
    return this.metadataPath;
  }
}

// Export singleton instance
module.exports = new MetadataLoader();
module.exports.MetadataLoader = MetadataLoader;
