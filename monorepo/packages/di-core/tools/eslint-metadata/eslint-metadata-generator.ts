/**
 * ESLint Metadata Generator
 * Generates rich metadata for ESLint rules to provide interface resolution context
 */

import * as path from 'path';
import * as fs from 'fs';
import type { SharedServiceRegistry, ServiceRegistration } from '../shared/SharedServiceRegistry';
import type { ConfigManager } from '../config-manager';
import type {
  ESLintMetadata,
  InterfaceMetadata,
  ImplementationMetadata,
  ImplementationInfo,
  InterfaceReference,
  ComponentMetadata,
  MetadataLookups,
  MetadataIssue,
  Location,
  DependencyInfo,
} from './metadata-types';
import { consoleFor } from '../logger';

const console = consoleFor('di-core:eslint-metadata-generator');

export class ESLintMetadataGenerator {
  private activeProfiles: string[] = [];

  constructor(
    private serviceRegistry: SharedServiceRegistry,
    private configManager: ConfigManager,
    private componentMetadataMap: Map<string, ComponentMetadata> = new Map()
  ) {}

  /**
   * Generate complete ESLint metadata
   */
  async generateMetadata(): Promise<ESLintMetadata> {
    console.log('📊 Generating ESLint metadata...');

    const metadata: ESLintMetadata = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      configHash: this.configManager.getConfigHash(),
      activeProfiles: this.activeProfiles,
      interfaces: this.extractInterfaceMetadata(),
      implementations: this.extractImplementationMetadata(),
      components: this.extractComponentMetadata(),
      lookups: this.generateLookups(),
      issues: this.detectIssues(),
    };

    console.log(`✅ Generated metadata for ${Object.keys(metadata.interfaces).length} interfaces, ${Object.keys(metadata.implementations).length} implementations`);

    return metadata;
  }

  /**
   * Set active profiles for selection logic
   */
  setActiveProfiles(profiles: string[]): void {
    this.activeProfiles = profiles;
  }

  /**
   * Extract interface resolution metadata with multiple implementations
   */
  private extractInterfaceMetadata(): Record<string, InterfaceMetadata> {
    const result: Record<string, InterfaceMetadata> = {};
    const config = this.serviceRegistry.getConfiguration();

    // Group by interface name
    for (const [interfaceName, implementationClasses] of config.interfaceMapping) {
      const implementations: ImplementationMetadata[] = [];

      for (const className of implementationClasses) {
        const registration = this.serviceRegistry.getServiceByClass(className);
        if (registration) {
          implementations.push(this.buildImplementationMetadata(registration));
        }
      }

      // Determine which is selected
      const selected = this.determineSelectedImplementation(implementations);

      result[interfaceName] = {
        implementations,
        totalImplementations: implementations.length,
        hasAmbiguity: this.checkAmbiguity(implementations),
        selectedImplementation: selected?.implementationClass,
        disambiguationRequired: this.needsDisambiguation(implementations),
      };
    }

    console.debug(`📋 Extracted ${Object.keys(result).length} interface mappings`);
    return result;
  }

  /**
   * Build metadata for a single implementation
   */
  private buildImplementationMetadata(registration: ServiceRegistration): ImplementationMetadata {
    const location = this.extractLocation(registration.filePath);

    // For now, we'll use heuristics for decorator detection
    // In the future, this can be enhanced to read actual decorators from source
    const isPrimary = this.detectPrimaryStatus(registration);
    const profiles = this.extractProfilesFromRegistration(registration);

    return {
      implementationClass: registration.implementationClass,
      implementationPath: this.normalizeFilePath(registration.filePath),
      implementationLocation: location,
      token: registration.token,
      scope: registration.scope,
      registrationType: registration.registrationType,

      // Selection metadata
      isPrimary,
      profiles,
      qualifier: undefined, // TODO: Extract from decorators
      priority: undefined, // TODO: Extract from configuration
      isSelected: this.isCurrentlySelected(registration, isPrimary, profiles),
      selectionReason: this.explainSelection(registration, isPrimary, profiles),

      // Dependencies
      dependencies: this.extractDependencies(registration),

      // Additional context
      scanDirectory: this.getScanDirectory(registration.filePath),
      isGeneric: registration.metadata.isGeneric,
      typeParameters: registration.metadata.typeParameters,
    };
  }

  /**
   * Extract reverse mapping - Implementation → Interfaces
   */
  private extractImplementationMetadata(): Record<string, ImplementationInfo> {
    const result: Record<string, ImplementationInfo> = {};
    const config = this.serviceRegistry.getConfiguration();

    for (const [className, token] of config.classMapping) {
      const registration = this.serviceRegistry.getService(token);
      if (!registration) continue;

      const location = this.extractLocation(registration.filePath);
      const implementsInterfaces = this.findImplementedInterfaces(className);
      const isPrimary = this.detectPrimaryStatus(registration);
      const profiles = this.extractProfilesFromRegistration(registration);

      result[className] = {
        filePath: this.normalizeFilePath(registration.filePath),
        location,
        implementsInterfaces,
        isService: true,
        decorators: this.extractDecoratorNames(registration, isPrimary, profiles),
        scope: registration.scope,
        isPrimary,
        profiles,
        qualifier: undefined, // TODO: Extract from decorators
        usedByComponents: this.findComponentsUsing(className),
        dependsOn: registration.dependencies.map(d => d.interfaceType),
      };
    }

    console.debug(`🔄 Extracted ${Object.keys(result).length} implementation mappings`);
    return result;
  }

  /**
   * Extract component usage metadata
   */
  private extractComponentMetadata(): Record<string, ComponentMetadata> {
    const result: Record<string, ComponentMetadata> = {};

    for (const [filePath, componentData] of this.componentMetadataMap) {
      result[this.normalizeFilePath(filePath)] = componentData;
    }

    console.debug(`📦 Extracted ${Object.keys(result).length} component metadata entries`);
    return result;
  }

  /**
   * Generate quick lookup maps
   */
  private generateLookups(): MetadataLookups {
    const config = this.serviceRegistry.getConfiguration();

    const interfaceToClass: Record<string, string> = {};
    const classToInterfaces: Record<string, string[]> = {};
    const componentToInterfaces: Record<string, string[]> = {};
    const interfaceToComponents: Record<string, string[]> = {};

    // Interface to default class
    for (const [interfaceName, classes] of config.interfaceMapping) {
      // Pick first or primary
      const registrations = classes
        .map(c => this.serviceRegistry.getServiceByClass(c))
        .filter((r): r is ServiceRegistration => !!r);

      const primary = registrations.find(r => this.detectPrimaryStatus(r));
      const selected = primary || registrations[0];

      if (selected) {
        interfaceToClass[interfaceName] = selected.implementationClass;
      }
    }

    // Class to interfaces
    for (const [interfaceName, classes] of config.interfaceMapping) {
      for (const className of classes) {
        if (!classToInterfaces[className]) {
          classToInterfaces[className] = [];
        }
        classToInterfaces[className].push(interfaceName);
      }
    }

    // Component to interfaces & interface to components
    for (const [componentPath, componentData] of this.componentMetadataMap) {
      const normalizedPath = this.normalizeFilePath(componentPath);
      const interfaces = componentData.injections.map(inj => inj.interfaceType);

      componentToInterfaces[normalizedPath] = interfaces;

      for (const interfaceName of interfaces) {
        if (!interfaceToComponents[interfaceName]) {
          interfaceToComponents[interfaceName] = [];
        }
        interfaceToComponents[interfaceName].push(normalizedPath);
      }
    }

    return {
      interfaceToClass,
      classToInterfaces,
      componentToInterfaces,
      interfaceToComponents,
    };
  }

  /**
   * Detect issues in the DI configuration
   */
  private detectIssues(): MetadataIssue[] {
    const issues: MetadataIssue[] = [];
    const config = this.serviceRegistry.getConfiguration();

    // Check for ambiguous registrations (multiple implementations, no primary)
    for (const [interfaceName, classes] of config.interfaceMapping) {
      if (classes.length > 1) {
        const registrations = classes
          .map(c => this.serviceRegistry.getServiceByClass(c))
          .filter((r): r is ServiceRegistration => !!r);

        const hasPrimary = registrations.some(r => this.detectPrimaryStatus(r));

        if (!hasPrimary) {
          issues.push({
            type: 'ambiguous',
            severity: 'warning',
            interfaceName,
            message: `Multiple implementations found (${classes.join(', ')}). Consider adding @Primary decorator.`,
            affectedComponents: this.findComponentsUsingInterface(interfaceName),
            suggestedFix: `Add @Primary() decorator to preferred implementation or use @Qualifier at injection point`,
          });
        }
      }
    }

    // Check for circular dependencies
    // TODO: Implement circular dependency detection

    console.debug(`⚠️  Detected ${issues.length} issues`);
    return issues;
  }

  // ==================== Helper Methods ====================

  private extractLocation(filePath: string): Location {
    // TODO: Extract actual line/column from source file
    // For now, return default location
    return { line: 1, column: 0 };
  }

  private normalizeFilePath(filePath: string): string {
    // Make path relative to project root
    const projectRoot = this.configManager.getProjectRoot();
    return path.relative(projectRoot, filePath);
  }

  private extractDependencies(registration: ServiceRegistration): DependencyInfo[] {
    return registration.dependencies.map(dep => ({
      interfaceName: dep.interfaceType,
      isOptional: dep.isOptional,
    }));
  }

  private findImplementedInterfaces(className: string): InterfaceReference[] {
    const config = this.serviceRegistry.getConfiguration();
    const references: InterfaceReference[] = [];

    for (const [interfaceName, classes] of config.interfaceMapping) {
      if (classes.includes(className)) {
        references.push({
          interfaceName,
          interfaceFilePath: '', // TODO: Find interface file path
          interfaceLocation: { line: 0, column: 0 }, // TODO: Extract location
          isExplicit: true, // Assume explicit for now
        });
      }
    }

    return references;
  }

  private detectPrimaryStatus(registration: ServiceRegistration): boolean {
    // TODO: Read from actual decorators
    // For now, use heuristic: first registration or single implementation
    const config = this.serviceRegistry.getConfiguration();
    const implementations = config.interfaceMapping.get(registration.interfaceName) || [];
    return implementations.length === 1 || implementations[0] === registration.implementationClass;
  }

  private extractProfilesFromRegistration(registration: ServiceRegistration): string[] {
    // TODO: Extract from actual @Profile decorators
    // For now, return empty array (all profiles)
    return [];
  }

  private extractDecoratorNames(registration: ServiceRegistration, isPrimary: boolean, profiles: string[]): string[] {
    const decorators = ['@Service()'];
    if (isPrimary) decorators.push('@Primary()');
    if (profiles.length > 0) decorators.push(`@Profile(${profiles.map(p => `'${p}'`).join(', ')})`);
    return decorators;
  }

  private getScanDirectory(filePath: string): string {
    const scanDirs = this.configManager.getScanDirs();
    const projectRoot = this.configManager.getProjectRoot();

    for (const scanDir of scanDirs) {
      const fullScanPath = path.resolve(projectRoot, scanDir);
      if (filePath.startsWith(fullScanPath)) {
        return scanDir;
      }
    }

    return 'unknown';
  }

  private isCurrentlySelected(registration: ServiceRegistration, isPrimary: boolean, profiles: string[]): boolean {
    // Selection logic:
    // 1. If @Primary, selected
    if (isPrimary) return true;

    // 2. If profiles match active profiles
    if (profiles.length > 0 && this.activeProfiles.length > 0) {
      return profiles.some(p => this.activeProfiles.includes(p));
    }

    // 3. Default to first implementation
    const config = this.serviceRegistry.getConfiguration();
    const implementations = config.interfaceMapping.get(registration.interfaceName) || [];
    return implementations[0] === registration.implementationClass;
  }

  private explainSelection(registration: ServiceRegistration, isPrimary: boolean, profiles: string[]): string {
    if (isPrimary) {
      return 'Marked with @Primary decorator';
    }

    if (profiles.length > 0 && this.activeProfiles.length > 0) {
      const matching = profiles.filter(p => this.activeProfiles.includes(p));
      if (matching.length > 0) {
        return `Profile match: ${matching.join(', ')}`;
      }
      return `Profile mismatch (requires: ${profiles.join(', ')})`;
    }

    const config = this.serviceRegistry.getConfiguration();
    const implementations = config.interfaceMapping.get(registration.interfaceName) || [];

    if (implementations.length === 1) {
      return 'Only implementation';
    }

    return 'Default selection (consider adding @Primary)';
  }

  private determineSelectedImplementation(implementations: ImplementationMetadata[]): ImplementationMetadata | undefined {
    if (implementations.length === 0) return undefined;

    // 1. @Primary decorator
    const primary = implementations.find(impl => impl.isPrimary);
    if (primary) return primary;

    // 2. Profile match
    if (this.activeProfiles.length > 0) {
      const profileMatches = implementations.filter(impl =>
        impl.profiles.some(p => this.activeProfiles.includes(p))
      );
      if (profileMatches.length > 0) return profileMatches[0];
    }

    // 3. First registered
    return implementations[0];
  }

  private checkAmbiguity(implementations: ImplementationMetadata[]): boolean {
    if (implementations.length <= 1) return false;

    // Ambiguous if multiple implementations and no primary
    const hasPrimary = implementations.some(impl => impl.isPrimary);
    return !hasPrimary;
  }

  private needsDisambiguation(implementations: ImplementationMetadata[]): boolean {
    return this.checkAmbiguity(implementations);
  }

  private findComponentsUsing(className: string): string[] {
    const components: string[] = [];

    for (const [componentPath, componentData] of this.componentMetadataMap) {
      const usesClass = componentData.injections.some(inj => inj.resolvedClass === className);
      if (usesClass) {
        components.push(this.normalizeFilePath(componentPath));
      }
    }

    return components;
  }

  private findComponentsUsingInterface(interfaceName: string): string[] {
    const components: string[] = [];

    for (const [componentPath, componentData] of this.componentMetadataMap) {
      const usesInterface = componentData.injections.some(inj => inj.interfaceType === interfaceName);
      if (usesInterface) {
        components.push(this.normalizeFilePath(componentPath));
      }
    }

    return components;
  }

  /**
   * Write metadata to file
   */
  async writeMetadataFile(metadata: ESLintMetadata): Promise<void> {
    const configDir = this.configManager.getConfigDir();
    const metadataPath = path.join(configDir, 'eslint-metadata.json');

    await fs.promises.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    console.info(`📝 Generated ESLint metadata: ${metadataPath}`);

    // Also create bridge file in project root .tdi2/
    const bridgePath = path.join(
      this.configManager.getProjectRoot(),
      '.tdi2',
      'eslint-metadata.json'
    );

    await fs.promises.mkdir(path.dirname(bridgePath), { recursive: true });
    await fs.promises.writeFile(
      bridgePath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    console.info(`🔗 Created bridge file: ${bridgePath}`);
  }
}
