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
  outputDir: './src/.tdi2',
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  generateDebugFiles: false,
  customSuffix: '',
  enableParameterNormalization: true,
  generateFallbacks: false,
  excludePatterns: ['node_modules', '.d.ts', '.test.', '.spec.'],
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
 * Check if a file should be skipped based on configuration
 */
export function shouldSkipFile(
  filePath: string,
  config: { excludePatterns?: string[]; outputDir?: string }
): boolean {
  const normalized = normalizePath(filePath);

  // Skip outputDir (generated files)
  if (config.outputDir) {
    const normalizedOutputDir = normalizePath(config.outputDir);
    // Extract just the directory name (e.g., '.tdi2' from './src/.tdi2')
    const outputDirName = normalizedOutputDir.split('/').pop() || '';
    if (outputDirName && normalized.includes(outputDirName)) {
      return true;
    }
  }

  // Skip by exclude patterns (works for both files and directories)
  if (config.excludePatterns) {
    for (const pattern of config.excludePatterns) {
      if (normalized.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a file should be processed based on extension
 */
export function shouldProcessFile(
  filePath: string,
  extensions: string[],
  config?: { excludePatterns?: string[]; outputDir?: string }
): boolean {
  const normalized = normalizePath(filePath);

  // Use the centralized skip function if config is provided
  if (config && shouldSkipFile(filePath, config)) {
    return false;
  }

  // Legacy behavior if no config provided
  if (!config) {
    // Skip node_modules
    if (normalized.includes('node_modules')) {
      return false;
    }

    // Skip generated files
    if (normalized.includes('.tdi2') || normalized.includes('/generated/')) {
      return false;
    }
  }

  // Check extension
  return extensions.some(ext => normalized.endsWith(ext));
}
