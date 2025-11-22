/**
 * TDI2 Metadata Types
 * Matches the structure of .tdi2/eslint-metadata.json
 */

export interface TDI2Metadata {
  version: string;
  generated: string;
  configHash: string;
  activeProfiles: string[];
  interfaces: Record<string, InterfaceData>;
  implementations: Record<string, ImplementationData>;
  components: Record<string, ComponentMetadata>;
  lookups: {
    interfaceToClass: Record<string, string>;
    classToInterfaces: Record<string, string[]>;
  };
}

export interface InterfaceData {
  implementations: ImplementationInfo[];
  totalImplementations: number;
  hasAmbiguity: boolean;
  selectedImplementation: string;
  disambiguationRequired: boolean;
}

export interface ImplementationInfo {
  implementationClass: string;
  implementationPath: string;
  implementationLocation: {
    line: number;
    column: number;
  };
  token: string;
  scope: 'singleton' | 'transient';
  registrationType: string;
  isPrimary: boolean;
  profiles: string[];
  isSelected: boolean;
  selectionReason: string;
  dependencies: DependencyInfo[];
  scanDirectory: string;
  isGeneric: boolean;
  typeParameters: string[];
}

export interface DependencyInfo {
  interfaceName: string;
  isOptional: boolean;
}

export interface ImplementationData {
  className: string;
  filePath: string;
  location: {
    line: number;
    column: number;
  };
  interfaces: string[];
  dependencies: DependencyInfo[];
  scope: 'singleton' | 'transient';
  isPrimary: boolean;
  profiles: string[];
}

export interface ComponentMetadata {
  componentName: string;
  injections: ComponentInjection[];
}

export interface ComponentInjection {
  paramName: string;
  interfaceType: string;
  isOptional: boolean;
  resolvedClass: string;
  resolvedPath: string;
  token: string;
  allPossibleImplementations: string[];
  hasAmbiguity: boolean;
}
