// tools/key-sanitizer.ts - Handles sanitization of keys for DI registration

export class KeySanitizer {
  
  /**
   * Standard sanitization for interface and class names
   */
  sanitizeKey(type: string): string {
    try {
      // Step 1: Normalize generic types to use 'any'
      const normalized = this.normalizeGenericType(type.trim());

      // Step 2: Convert to safe identifier
      const sanitized = normalized
        .replace(/<any>/g, "_any") // CacheInterface<any> -> CacheInterface_any
        .replace(/[^\w]/g, "_") // Replace remaining special chars
        .replace(/_+/g, "_") // Remove multiple underscores
        .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

      return sanitized || type.replace(/[^\w]/g, "_");
    } catch (error) {
      return type.replace(/[^\w]/g, "_");
    }
  }

  /**
   * Special sanitization for inheritance keys (more descriptive)
   */
  sanitizeInheritanceKey(inheritanceType: string): string {
    try {
      // Handle complex generic inheritance like AsyncState<{name: string, email: string}>
      let sanitized = inheritanceType
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[{}\[\]]/g, '_') // Replace object/array brackets
        .replace(/[<>]/g, '_') // Replace generic brackets
        .replace(/[,;:]/g, '_') // Replace punctuation
        .replace(/[^\w_]/g, '_') // Replace any remaining special chars
        .replace(/_+/g, '_') // Remove multiple underscores
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

      // Special handling for common patterns
      sanitized = sanitized
        .replace(/string/g, 'str')
        .replace(/number/g, 'num')
        .replace(/boolean/g, 'bool')
        .replace(/Array/g, 'Arr');

      return sanitized || 'UnknownInheritance';
    } catch (error) {
      return inheritanceType.replace(/[^\w]/g, '_');
    }
  }

  /**
   * Sanitization for state type keys (semantic naming)
   */
  sanitizeStateKey(stateType: string): string {
    try {
      // For state types, we want to preserve semantic meaning
      let sanitized = stateType
        .replace(/State$/, '') // Remove trailing 'State'
        .replace(/Interface$/, '') // Remove trailing 'Interface'
        .replace(/Type$/, '') // Remove trailing 'Type'
        .replace(/[^\w]/g, '_') // Replace special chars
        .replace(/_+/g, '_') // Remove multiple underscores
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

      // Add 'State' suffix back if it doesn't end with a meaningful suffix
      if (!sanitized.endsWith('State') && 
          !sanitized.endsWith('Data') && 
          !sanitized.endsWith('Model') &&
          !sanitized.endsWith('Entity')) {
        sanitized += 'State';
      }

      return sanitized || 'UnknownState';
    } catch (error) {
      return stateType.replace(/[^\w]/g, '_') + 'State';
    }
  }

  /**
   * Normalize generic types consistently
   */
  private normalizeGenericType(type: string): string {
    // Strategy: All generic type parameters become 'any' for matching purposes
    // CacheInterface<T> -> CacheInterface<any>
    // CacheInterface<string> -> CacheInterface<any>  
    // CacheInterface<User> -> CacheInterface<any>
    // This allows any implementation to match any usage
    return type.replace(/<[^>]*>/g, "<any>");
  }

  /**
   * Extract the base type name from a generic type
   */
  extractBaseTypeName(type: string): string {
    const match = type.match(/^([^<]+)(?:<.*>)?$/);
    return match ? match[1] : type;
  }

  /**
   * Extract generic type parameters
   */
  extractGenericParameters(type: string): string[] {
    const match = type.match(/^[^<]+<(.+)>$/);
    if (!match) return [];
    
    // Split by commas, but handle nested generics
    const params: string[] = [];
    let current = '';
    let depth = 0;
    
    for (const char of match[1]) {
      if (char === '<') depth++;
      else if (char === '>') depth--;
      else if (char === ',' && depth === 0) {
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
   * Check if a type is generic
   */
  isGenericType(type: string): boolean {
    return type.includes('<') && type.includes('>');
  }

  /**
   * Sanitize a qualified name (package.ClassName)
   */
  sanitizeQualifiedName(qualifiedName: string): string {
    return qualifiedName
      .replace(/\./g, '_') // Replace dots with underscores
      .replace(/[^\w]/g, '_') // Replace special chars
      .replace(/_+/g, '_') // Remove multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }

  /**
   * Create a unique key from multiple components
   */
  createCompositeKey(...components: string[]): string {
    return components
      .filter(c => c && c.trim()) // Remove empty components
      .map(c => this.sanitizeKey(c)) // Sanitize each component
      .join('_');
  }

  /**
   * Sanitize array type notation
   */
  sanitizeArrayType(type: string): string {
    if (type.endsWith('[]')) {
      const baseType = type.replace('[]', '');
      return `${this.sanitizeKey(baseType)}_Array`;
    }
    
    const arrayMatch = type.match(/^Array<(.+)>$/);
    if (arrayMatch) {
      const elementType = arrayMatch[1];
      return `Array_${this.sanitizeKey(elementType)}`;
    }
    
    return this.sanitizeKey(type);
  }

  /**
   * Sanitize union type notation
   */
  sanitizeUnionType(type: string): string {
    if (type.includes('|')) {
      const unionTypes = type.split('|').map(t => t.trim());
      const sanitizedTypes = unionTypes.map(t => this.sanitizeKey(t));
      return sanitizedTypes.join('_or_');
    }
    
    return this.sanitizeKey(type);
  }

  /**
   * Handle object literal types {name: string, age: number}
   */
  sanitizeObjectLiteralType(type: string): string {
    if (type.includes('{') && type.includes('}')) {
      // Create a hash-based name for object literals
      const hash = this.createSimpleHash(type);
      return `ObjectType_${hash}`;
    }
    
    return this.sanitizeKey(type);
  }

  /**
   * Create a simple hash for complex types
   */
  private createSimpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 8);
  }

  /**
   * Validate that a sanitized key is a valid identifier
   */
  isValidIdentifier(key: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
  }

  /**
   * Ensure a key is a valid identifier, fix if necessary
   */
  ensureValidIdentifier(key: string): string {
    let sanitized = this.sanitizeKey(key);
    
    // Ensure it starts with a letter or underscore
    if (!/^[a-zA-Z_]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    
    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'Unknown';
    }
    
    return sanitized;
  }
}