// tools/interface-resolver/key-sanitizer.ts - FIXED VERSION with enhanced type parameter handling

export class KeySanitizer {
  
  /**
   * Standard sanitization for interface and class names - FIXED FOR COMPLEX GENERICS
   */
  sanitizeKey(type: string): string {
    try {
      // Step 1: Handle AsyncState pattern specifically
      const asyncStateMatch = type.match(/^AsyncState<(.+)>$/);
      if (asyncStateMatch) {
        const stateType = asyncStateMatch[1];
        return `AsyncState_${this.sanitizeKey(stateType)}`;
      }

      // Step 2: Handle array types specifically
      if (type.endsWith('[]')) {
        const baseType = type.replace('[]', '');
        return `${this.sanitizeKey(baseType)}_Array`;
      }

      const arrayMatch = type.match(/^Array<(.+)>$/);
      if (arrayMatch) {
        const elementType = arrayMatch[1];
        return `Array_${this.sanitizeKey(elementType)}`;
      }

      // Step 3: Handle complex generics with multiple parameters
      if (this.isGenericType(type)) {
        const baseName = this.extractBaseTypeName(type);
        const params = this.extractGenericParameters(type);
        
        if (params.length > 0) {
          const sanitizedParams = params.map(param => this.sanitizeKey(param.trim()));
          return `${baseName}_${sanitizedParams.join('_')}`;
        }
      }

      // Step 4: Handle simple types
      const sanitized = type
        .replace(/[^\w]/g, "_") // Replace special chars
        .replace(/_+/g, "_") // Remove multiple underscores
        .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

      return sanitized || type.replace(/[^\w]/g, "_");
    } catch (error) {
      return type.replace(/[^\w]/g, "_");
    }
  }

  /**
   * Enhanced generic parameter extraction with proper nesting support
   */
  extractGenericParameters(type: string): string[] {
    const match = type.match(/^[^<]+<(.+)>$/);
    if (!match) return [];
    
    const params: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < match[1].length; i++) {
      const char = match[1][i];
      const prevChar = i > 0 ? match[1][i - 1] : '';
      
      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
      
      if (!inString) {
        if (char === '<') {
          depth++;
        } else if (char === '>') {
          depth--;
        } else if (char === ',' && depth === 0) {
          if (current.trim()) {
            params.push(current.trim());
          }
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      params.push(current.trim());
    }
    
    return params;
  }

  /**
   * Enhanced inheritance key sanitization
   */
  sanitizeInheritanceKey(inheritanceType: string): string {
    try {
      // Handle AsyncState<StateType> inheritance specifically
      const asyncStateMatch = inheritanceType.match(/^AsyncState<(.+)>$/);
      if (asyncStateMatch) {
        const stateType = asyncStateMatch[1];
        return `AsyncState_${this.sanitizeKey(stateType)}`;
      }

      // Handle generics normally
      if (this.isGenericType(inheritanceType)) {
        return this.sanitizeKey(inheritanceType);
      }

      // Continue with existing logic for other patterns
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
        .replace(/\bstring\b/g, 'str')
        .replace(/\bnumber\b/g, 'num')
        .replace(/\bboolean\b/g, 'bool')
        .replace(/\bArray\b/g, 'Arr');

      return sanitized || 'UnknownInheritance';
    } catch (error) {
      return inheritanceType.replace(/[^\w]/g, '_');
    }
  }

  /**
   * Enhanced state key sanitization
   */
  sanitizeStateKey(stateType: string): string {
    try {
      // Handle complex generics first
      if (this.isGenericType(stateType)) {
        return this.sanitizeKey(stateType);
      }

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
   * Extract the base type name from a generic type
   */
  extractBaseTypeName(type: string): string {
    const match = type.match(/^([^<]+)(?:<.*>)?$/);
    return match ? match[1].trim() : type;
  }

  /**
   * Check if a type is generic
   */
  isGenericType(type: string): boolean {
    return type.includes('<') && type.includes('>');
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
    if (!key || key.trim() === '') {
      return '_';
    }
    
    let sanitized = this.sanitizeKey(key);
    
    // Ensure it starts with a letter or underscore
    if (!/^[a-zA-Z_]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    
    return sanitized;
  }

  /**
   * Sanitize array type notation with proper array suffix
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
   * Create a composite key from multiple components
   */
  createCompositeKey(...components: string[]): string {
    return components
      .filter(c => c && c.trim()) // Remove empty components
      .map(c => this.sanitizeKey(c)) // Sanitize each component
      .join('_');
  }

  /**
   * Handle special patterns that need specific sanitization
   */
  private handleSpecialPatterns(type: string): string | null {
    // Handle Map<K, V> pattern
    const mapMatch = type.match(/^Map<(.+),\s*(.+)>$/);
    if (mapMatch) {
      const keyType = mapMatch[1].trim();
      const valueType = mapMatch[2].trim();
      return `Map_${this.sanitizeKey(keyType)}_${this.sanitizeKey(valueType)}`;
    }

    // Handle Promise<T> pattern
    const promiseMatch = type.match(/^Promise<(.+)>$/);
    if (promiseMatch) {
      const valueType = promiseMatch[1].trim();
      return `Promise_${this.sanitizeKey(valueType)}`;
    }

    // Handle function types
    if (type.includes('=>') || type.includes('function')) {
      return 'Function';
    }

    // Handle object literals
    if (type.includes('{') && type.includes('}')) {
      return `ObjectType_${this.createSimpleHash(type)}`;
    }

    return null;
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
}