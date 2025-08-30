// tools/interface-resolver/location-key-generator.ts - Centralized location-based key generation

import { SourceLocation } from "./interface-resolver-types";
import { KeySanitizer } from "./key-sanitizer";

export class LocationKeyGenerator {
  private keySanitizer = new KeySanitizer();

  /**
   * Generate a unique key from class name and location
   */
  generateKey(className: string, location?: SourceLocation): string {
    if (!location) {
      return this.keySanitizer.sanitizeKey(className);
    }

    return this.keySanitizer.createLocationBasedKey(
      className,
      location.filePath,
      location.lineNumber
    );
  }

  /**
   * Parse a key to extract class name and location info
   */
  parseKey(key: string): { className: string; location?: SourceLocation } {
    if (!this.isLocationBasedKey(key)) {
      return { className: key };
    }

    const interfaceName = this.keySanitizer.extractInterfaceNameFromLocationKey(key);
    const locationInfo = this.keySanitizer.extractLocationFromKey(key);

    return {
      className: interfaceName,
      location: locationInfo.filePath && locationInfo.lineNumber 
        ? { filePath: locationInfo.filePath, lineNumber: locationInfo.lineNumber }
        : undefined
    };
  }

  /**
   * Check if a key is location-based
   */
  isLocationBasedKey(key: string): boolean {
    return this.keySanitizer.isLocationBasedKey(key);
  }

  /**
   * Create a key for interface resolution with fallback behavior
   */
  createResolutionKey(interfaceName: string, implementationClass?: string, location?: SourceLocation): string {
    // If we have location info, use it for precise resolution
    if (location && implementationClass) {
      return this.generateKey(implementationClass, location);
    }

    // If we have implementation class but no location, use class name
    if (implementationClass) {
      return this.keySanitizer.sanitizeKey(implementationClass);
    }

    // Fallback to interface name
    return this.keySanitizer.sanitizeKey(interfaceName);
  }

  /**
   * Validate that a location is complete and valid
   */
  isValidLocation(location?: SourceLocation): boolean {
    return !!(location && location.filePath && location.lineNumber > 0);
  }

  /**
   * Extract the class name from any key type (location-based or standard)
   */
  extractClassName(key: string): string {
    if (this.isLocationBasedKey(key)) {
      return this.keySanitizer.extractInterfaceNameFromLocationKey(key);
    }
    return key;
  }

  /**
   * Compare two keys for equality, handling both types
   */
  keysEqual(key1: string, key2: string): boolean {
    // Exact match
    if (key1 === key2) {
      return true;
    }

    // Extract class names and compare
    const className1 = this.extractClassName(key1);
    const className2 = this.extractClassName(key2);
    
    return className1 === className2;
  }

  /**
   * Find matching key from a collection, handling both location-based and standard keys
   */
  findMatchingKey(searchKey: string, availableKeys: string[]): string | undefined {
    // Try exact match first
    if (availableKeys.includes(searchKey)) {
      return searchKey;
    }

    // Try class name matching for cross-compatibility
    const searchClassName = this.extractClassName(searchKey);
    
    for (const availableKey of availableKeys) {
      const availableClassName = this.extractClassName(availableKey);
      if (searchClassName === availableClassName) {
        return availableKey;
      }
    }

    return undefined;
  }
}