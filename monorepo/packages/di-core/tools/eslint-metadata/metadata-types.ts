/**
 * Type definitions for ESLint metadata generation
 * This metadata provides rich context information for ESLint rules to display
 * interface resolution details, multiple implementations, and navigation support.
 */

export interface Location {
  line: number;
  column: number;
}

export interface DependencyInfo {
  interfaceName: string;
  isOptional: boolean;
}

export interface ImplementationMetadata {
  implementationClass: string;
  implementationPath: string;
  implementationLocation: Location;
  token: string;
  scope: 'singleton' | 'transient' | 'scoped';
  registrationType: 'class' | 'inheritance' | 'interface';

  // Selection metadata
  isPrimary: boolean;
  profiles: string[];
  qualifier?: string;
  priority?: number;
  isSelected: boolean;
  selectionReason: string;

  // Dependencies
  dependencies: DependencyInfo[];

  // Additional context
  scanDirectory: string;
  isGeneric: boolean;
  typeParameters?: string[];
}

export interface InterfaceMetadata {
  implementations: ImplementationMetadata[];
  totalImplementations: number;
  hasAmbiguity: boolean;
  selectedImplementation?: string;
  disambiguationRequired: boolean;
}

export interface InterfaceReference {
  interfaceName: string;
  interfaceFilePath: string;
  interfaceLocation: Location;
  isExplicit: boolean;
}

export interface ImplementationInfo {
  filePath: string;
  location: Location;

  // All interfaces this class implements
  implementsInterfaces: InterfaceReference[];

  // Metadata
  isService: boolean;
  decorators: string[];
  scope: 'singleton' | 'transient' | 'scoped';
  isPrimary: boolean;
  profiles: string[];
  qualifier?: string;

  // Usage tracking
  usedByComponents: string[];
  dependsOn: string[];
}

export interface ComponentInjection {
  paramName: string;
  interfaceType: string;
  isOptional: boolean;

  // Enhanced resolution info
  resolvedClass: string;
  resolvedPath: string;
  token: string;
  allPossibleImplementations: string[];
  hasAmbiguity: boolean;
  qualifierUsed?: string;
}

export interface ComponentMetadata {
  componentName: string;
  injections: ComponentInjection[];
}

export interface MetadataLookups {
  interfaceToClass: Record<string, string>;
  classToInterfaces: Record<string, string[]>;
  componentToInterfaces: Record<string, string[]>;
  interfaceToComponents: Record<string, string[]>;
}

export interface MetadataIssue {
  type: 'unresolved' | 'ambiguous' | 'circular' | 'profile-mismatch';
  severity: 'error' | 'warning' | 'info';
  interfaceName?: string;
  implementationClass?: string;
  message: string;
  affectedComponents: string[];
  suggestedFix?: string;
}

export interface ESLintMetadata {
  version: string;
  generated: string;
  configHash: string;
  activeProfiles: string[];

  // Interface resolution with MULTIPLE implementations
  interfaces: Record<string, InterfaceMetadata>;

  // Reverse mapping - Implementation → Interfaces
  implementations: Record<string, ImplementationInfo>;

  // Component usage
  components: Record<string, ComponentMetadata>;

  // Quick lookups
  lookups: MetadataLookups;

  // Validation warnings
  issues: MetadataIssue[];
}
