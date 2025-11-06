/**
 * Shared configuration utilities for TDI2 plugins
 */

import type { PluginConfig, BasePluginConfig, AdvancedPluginConfig } from './types';

/**
 * Default advanced configuration
 */
const DEFAULT_ADVANCED_CONFIG: Required<AdvancedPluginConfig> = {
  fileExtensions: ['.ts', '.tsx'],
  diPatterns: {
    serviceDecorator: /@Service\s*\(/,
    injectDecorator: /@Inject\s*\(/,
    interfaceMarker: /Inject<|InjectOptional</,
  },
  performance: {
    parallel: true,
    maxConcurrency: 10,
    enableCache: true,
  },
};

/**
 * Default base configuration
 */
const DEFAULT_BASE_CONFIG: Required<BasePluginConfig> = {
  scanDirs: ['./src'],
  outputDir: './src/generated',
  verbose: false,
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  generateDebugFiles: false,
  customSuffix: '',
  enableParameterNormalization: true,
  generateFallbacks: false,
};

/**
 * Get default plugin configuration with all fields populated
 */
export function getDefaultConfig(userConfig: PluginConfig = {}): Required<PluginConfig> {
  return {
    ...DEFAULT_BASE_CONFIG,
    ...userConfig,
    advanced: {
      ...DEFAULT_ADVANCED_CONFIG,
      ...userConfig.advanced,
      diPatterns: {
        ...DEFAULT_ADVANCED_CONFIG.diPatterns,
        ...userConfig.advanced?.diPatterns,
      },
      performance: {
        ...DEFAULT_ADVANCED_CONFIG.performance,
        ...userConfig.advanced?.performance,
      },
    },
  };
}

/**
 * Validate plugin configuration and throw errors for invalid settings
 */
export function validateConfig(config: Required<PluginConfig>): void {
  // Validate scanDirs
  if (!Array.isArray(config.scanDirs)) {
    throw new Error('TDI2 Plugin: scanDirs must be an array');
  }

  if (config.scanDirs.length === 0) {
    throw new Error('TDI2 Plugin: scanDirs cannot be empty');
  }

  for (const dir of config.scanDirs) {
    if (typeof dir !== 'string' || dir.trim() === '') {
      throw new Error('TDI2 Plugin: Each scanDir must be a non-empty string');
    }
  }

  // Validate outputDir
  if (!config.outputDir || typeof config.outputDir !== 'string') {
    throw new Error('TDI2 Plugin: outputDir must be a non-empty string');
  }

  // Validate boolean flags
  const booleanFields: Array<keyof BasePluginConfig> = [
    'verbose',
    'enableFunctionalDI',
    'enableInterfaceResolution',
    'generateDebugFiles',
    'enableParameterNormalization',
    'generateFallbacks',
  ];

  for (const field of booleanFields) {
    if (typeof config[field] !== 'boolean') {
      throw new Error(`TDI2 Plugin: ${field} must be a boolean`);
    }
  }

  // Validate advanced config
  if (!Array.isArray(config.advanced.fileExtensions)) {
    throw new Error('TDI2 Plugin: advanced.fileExtensions must be an array');
  }

  if (config.advanced.fileExtensions.length === 0) {
    throw new Error('TDI2 Plugin: advanced.fileExtensions cannot be empty');
  }

  if ((config.advanced.performance?.maxConcurrency ?? 10) < 1) {
    throw new Error('TDI2 Plugin: advanced.performance.maxConcurrency must be at least 1');
  }
}

/**
 * Normalize file path for consistent comparison
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if a file should be processed based on extension
 */
export function shouldProcessFile(filePath: string, extensions: string[]): boolean {
  const normalized = normalizePath(filePath);

  // Skip node_modules
  if (normalized.includes('node_modules')) {
    return false;
  }

  // Skip generated files
  if (normalized.includes('.tdi2') || normalized.includes('/generated/')) {
    return false;
  }

  // Check extension
  return extensions.some(ext => normalized.endsWith(ext));
}
