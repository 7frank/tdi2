/**
 * Type definitions for the TDI2 Vite plugin
 */

import type { PluginConfig as BasePluginConfig } from '@tdi2/plugin-core';

export interface DIPluginOptions extends BasePluginConfig {
  /**
   * Enable file watching for hot reload during development
   * @default true
   */
  watch?: boolean;

  /**
   * Automatically clean old configuration files
   * @default true
   */
  cleanOldConfigs?: boolean;

  /**
   * Number of recent configurations to keep when cleaning
   * @default 3
   */
  keepConfigCount?: number;

  /**
   * Reuse existing valid configurations instead of regenerating
   * @default true
   */
  reuseExistingConfig?: boolean;
}

export interface TransformationSummary {
  count: number;
  functions: string[];
  transformedFiles: string[];
  resolvedDependencies: number;
  errors: Array<{
    file: string;
    error: string;
  }>;
}

export interface ConfigInfo {
  hash: string;
  configDir: string;
  bridgeDir: string;
  isValid: boolean;
  timestamp: string;
  metadata?: {
    enableFunctionalDI: boolean;
    enableInterfaceResolution: boolean;
    packageName: string;
    environment: string;
  };
}

export interface InterfaceImplementation {
  sanitizedKey: string;
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  registrationType: 'interface' | 'class' | 'inheritance' | 'state';
}

export interface ServiceDependency {
  serviceClass: string;
  filePath: string;
  constructorParams: Array<{
    paramName: string;
    interfaceType: string;
    isOptional: boolean;
    sanitizedKey: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  missingImplementations: string[];
  circularDependencies: string[];
  warnings: string[];
}

export interface InterfaceResolutionInfo {
  implementations: InterfaceImplementation[];
  dependencies: ServiceDependency[];
  validation: ValidationResult;
  stats: {
    totalInterfaces: number;
    totalImplementations: number;
    totalDependencies: number;
    registrationTypes: Record<string, number>;
  };
}

export interface DIDebugInfo {
  config: ConfigInfo;
  transformedFiles: string[];
  functionalSummary: TransformationSummary;
  interfaceResolution: InterfaceResolutionInfo | null;
  options: DIPluginOptions;
  timestamp: string;
  performance?: {
    transformationTime: number;
    scanTime: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

/**
 * Plugin preset configurations for common use cases
 */
export interface DIPluginPreset {
  name: string;
  description: string;
  options: DIPluginOptions;
}

/**
 * Hot module replacement context for DI files
 */
export interface DIHotUpdateContext {
  file: string;
  hasDIPatterns: boolean;
  affectedModules: string[];
  requiresFullReload: boolean;
}

/**
 * Build context information
 */
export interface DIBuildContext {
  mode: 'development' | 'production' | 'test';
  isWatch: boolean;
  transformedCount: number;
  errors: string[];
  warnings: string[];
}