// tools/interface-resolver/state-type-extractor.ts - FIXED VERSION with enhanced array handling

import { InterfaceInfo, InheritanceInfo, StateBasedRegistration } from "./interface-resolver-types";
import { KeySanitizer } from "./key-sanitizer";

export class StateTypeExtractor {
  constructor(
    private keySanitizer: KeySanitizer,
    private verbose: boolean = false
  ) {}

  extractStateBasedRegistrations(
    implementedInterfaces: InterfaceInfo[],
    inheritanceInfo: InheritanceInfo
  ): StateBasedRegistration[] {
    const registrations: StateBasedRegistration[] = [];

    // ENHANCED: Check inheritance for AsyncState patterns FIRST
    if (inheritanceInfo.hasInheritance) {
      for (const inheritanceMapping of inheritanceInfo.inheritanceMappings) {
        if (inheritanceMapping.baseClass === 'AsyncState' && inheritanceMapping.isGeneric) {
          // Extract state type from AsyncState<StateType>
          for (const typeParam of inheritanceMapping.typeParameters) {
            const stateRegistration: StateBasedRegistration = {
              stateType: typeParam,
              serviceInterface: `AsyncState<${typeParam}>`
            };
            
            registrations.push(stateRegistration);

            if (this.verbose) {
              console.log(`🎯 Found state inheritance: AsyncState<${typeParam}> -> ${typeParam}`);
            }
          }
        }

        // Handle other state-based inheritance patterns
        if (this.isStateManagementPattern(inheritanceMapping)) {
          const stateRegistrations = this.extractStateFromInheritance(inheritanceMapping);
          registrations.push(...stateRegistrations);

          if (this.verbose && stateRegistrations.length > 0) {
            console.log(`🎯 Found state inheritance: ${inheritanceMapping.baseClassGeneric} -> ${stateRegistrations.map(r => r.stateType).join(', ')}`);
          }
        }
      }
    }

    // Check implemented interfaces for state patterns
    for (const interfaceInfo of implementedInterfaces) {
      if (interfaceInfo.isGeneric) {
        const stateType = this.extractGenericStateType(interfaceInfo.fullType);
        if (stateType) {
          registrations.push({
            stateType,
            serviceInterface: interfaceInfo.fullType
          });

          if (this.verbose) {
            console.log(`🎯 Found state interface: ${interfaceInfo.fullType} -> ${stateType}`);
          }
        }
      }
    }

    return registrations;
  }

  private extractGenericStateType(interfaceType: string): string | null {
    // Pattern 1: AsyncStateService<UserServiceState>
    const asyncStateServiceMatch = interfaceType.match(/^AsyncStateService<(.+)>$/);
    if (asyncStateServiceMatch) {
      return asyncStateServiceMatch[1]; // Returns "UserServiceState"
    }

    // Pattern 2: StateService<T>
    const stateServiceMatch = interfaceType.match(/^StateService<(.+)>$/);
    if (stateServiceMatch) {
      return stateServiceMatch[1];
    }

    // Pattern 3: Repository<EntityType>
    const repositoryMatch = interfaceType.match(/^Repository<(.+)>$/);
    if (repositoryMatch) {
      return repositoryMatch[1];
    }

    // Pattern 4: Manager<StateType>
    const managerMatch = interfaceType.match(/^(\w*Manager)<(.+)>$/);
    if (managerMatch) {
      return managerMatch[2];
    }

    // Pattern 5: Store<StateType>
    const storeMatch = interfaceType.match(/^(\w*Store)<(.+)>$/);
    if (storeMatch) {
      return storeMatch[2];
    }

    // Pattern 6: Generic service pattern *Service<StateType>
    const genericServiceMatch = interfaceType.match(/^(\w+Service)<(.+)>$/);
    if (genericServiceMatch) {
      return genericServiceMatch[2];
    }

    return null;
  }

  private extractStateFromInheritance(inheritanceMapping: any): StateBasedRegistration[] {
    const registrations: StateBasedRegistration[] = [];

    // Pattern 1: extends AsyncState<StateType> - ENHANCED
    if (inheritanceMapping.baseClass === 'AsyncState') {
      for (const typeParam of inheritanceMapping.typeParameters) {
        registrations.push({
          stateType: typeParam,
          serviceInterface: `AsyncState<${typeParam}>`
        });
      }
    }

    // Pattern 2: extends BaseRepository<EntityType>
    if (inheritanceMapping.baseClass === 'BaseRepository' || inheritanceMapping.baseClass === 'Repository') {
      for (const typeParam of inheritanceMapping.typeParameters) {
        registrations.push({
          stateType: typeParam,
          serviceInterface: `Repository<${typeParam}>`
        });
      }
    }

    // Pattern 3: extends BaseService<StateType>
    if (inheritanceMapping.baseClass === 'BaseService') {
      for (const typeParam of inheritanceMapping.typeParameters) {
        registrations.push({
          stateType: typeParam,
          serviceInterface: `BaseService<${typeParam}>`
        });
      }
    }

    // Pattern 4: extends Store<StateType>
    if (inheritanceMapping.baseClass.endsWith('Store')) {
      for (const typeParam of inheritanceMapping.typeParameters) {
        registrations.push({
          stateType: typeParam,
          serviceInterface: `${inheritanceMapping.baseClass}<${typeParam}>`
        });
      }
    }

    // Pattern 5: extends Manager<StateType>
    if (inheritanceMapping.baseClass.endsWith('Manager')) {
      for (const typeParam of inheritanceMapping.typeParameters) {
        registrations.push({
          stateType: typeParam,
          serviceInterface: `${inheritanceMapping.baseClass}<${typeParam}>`
        });
      }
    }

    return registrations;
  }

  /**
   * Check if a type is a valid state type (not a primitive)
   */
  isValidStateType(stateType: string): boolean {
    const primitiveTypes = ['string', 'number', 'boolean', 'any', 'unknown', 'void', 'null', 'undefined'];
    const trimmedType = stateType.trim();
    
    // Not a primitive type
    if (primitiveTypes.includes(trimmedType.toLowerCase())) {
      return false;
    }

    // Not an array of primitives (like string[])
    if (primitiveTypes.some(primitive => trimmedType.toLowerCase() === `${primitive}[]`)) {
      return false;
    }

    // Should be a custom type, interface, or complex object
    return true;
  }

  /**
   * Extract state type from complex generic expressions
   */
  extractStateFromComplexGeneric(genericType: string): string[] {
    const stateTypes: string[] = [];

    // Handle union types: AsyncState<UserState | AdminState>
    if (genericType.includes('|')) {
      const unionTypes = genericType.split('|').map(t => t.trim());
      for (const unionType of unionTypes) {
        if (this.isValidStateType(unionType)) {
          stateTypes.push(unionType);
        }
      }
      return stateTypes;
    }

    // Handle object types: AsyncState<{name: string, email: string}>
    if (genericType.includes('{') && genericType.includes('}')) {
      // For object types, create a synthetic state type name
      const objectTypeKey = this.keySanitizer.sanitizeKey(genericType);
      stateTypes.push(objectTypeKey);
      return stateTypes;
    }

    // Handle array types: AsyncState<User[]>
    if (genericType.endsWith('[]')) {
      const arrayElementType = genericType.replace('[]', '');
      if (this.isValidStateType(arrayElementType)) {
        stateTypes.push(genericType); // Keep the full array type
      }
      return stateTypes;
    }

    // Handle nested generics: AsyncState<Promise<User>>
    const nestedGenericMatch = genericType.match(/^(\w+)<(.+)>$/);
    if (nestedGenericMatch) {
      const innerType = nestedGenericMatch[2];
      return this.extractStateFromComplexGeneric(innerType);
    }

    // Simple type
    if (this.isValidStateType(genericType)) {
      stateTypes.push(genericType);
    }

    return stateTypes;
  }

  /**
   * Check if inheritance pattern indicates state management
   */
  isStateManagementPattern(inheritanceMapping: any): boolean {
    const statePatterns = [
      'AsyncState',
      'BaseState', 
      'StateManager',
      'Store',
      'Repository',
      'Service'
    ];

    return statePatterns.some(pattern => 
      inheritanceMapping.baseClass === pattern || 
      inheritanceMapping.baseClass.includes(pattern)
    );
  }

  /**
   * Get recommended service interface for a state type
   */
  getRecommendedServiceInterface(stateType: string, baseClass?: string): string {
    if (baseClass === 'AsyncState') {
      return `AsyncState<${stateType}>`;
    }
    
    if (baseClass === 'Repository' || baseClass === 'BaseRepository') {
      return `Repository<${stateType}>`;
    }
    
    if (baseClass?.endsWith('Store')) {
      return `${baseClass}<${stateType}>`;
    }
    
    if (baseClass?.endsWith('Manager')) {
      return `${baseClass}<${stateType}>`;
    }
    
    // Default generic service interface
    return `StateService<${stateType}>`;
  }

  /**
   * Extract multiple state types from comma-separated generics
   */
  extractMultipleStateTypes(genericExpression: string): string[] {
    // Handle simple comma separation: Service<User, Product>
    if (genericExpression.includes(',') && !genericExpression.includes('{')) {
      return genericExpression.split(',').map(t => t.trim()).filter(t => this.isValidStateType(t));
    }

    // Handle complex object with commas: Service<{name: string, age: number}>
    return this.extractStateFromComplexGeneric(genericExpression);
  }
}