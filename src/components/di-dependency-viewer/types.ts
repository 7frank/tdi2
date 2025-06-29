// src/components/di-dependency-viewer/types.ts

export interface ServiceDependency {
  serviceClass: string;
  interfaceDependencies: string[];
  filePath: string;
  constructorParams: Array<{
    paramName: string;
    interfaceType: string;
    isOptional: boolean;
    sanitizedKey: string;
  }>;
}

export interface InterfaceImplementation {
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  sanitizedKey: string;
  isClassBased?: boolean;
  isInheritanceBased?: boolean;
  isStateBased?: boolean;
  baseClass?: string;
  stateType?: string;
  serviceInterface?: string;
  inheritanceChain?: string[];
}

export interface DIDebugInfo {
  implementations: Array<[string, InterfaceImplementation]>;
  dependencies: Array<[string, ServiceDependency]>;
  validation: {
    isValid: boolean;
    missingImplementations: string[];
    circularDependencies: string[];
  };
  configHash: string;
}

export interface FilterState {
  types: {
    interface: boolean;
    class: boolean;
    inheritance: boolean;
    state: boolean;
  };
  showOptional: boolean;
  showRequired: boolean;
  search: string;
  layout: 'hierarchical' | 'tree' | 'circular' | 'grid';
}