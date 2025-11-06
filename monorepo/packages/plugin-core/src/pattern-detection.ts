/**
 * DI pattern detection utilities
 */

import type { DIPatternDetection, PluginConfig } from './types';

/**
 * Detect if content contains TDI2 dependency injection patterns
 */
export function detectDIPatterns(
  content: string,
  config: Required<PluginConfig>
): DIPatternDetection {
  const patternsList: string[] = [];
  let hasDI = false;

  // Check for service decorators
  if (config.advanced.diPatterns?.serviceDecorator?.test(content)) {
    patternsList.push('@Service');
    hasDI = true;
  }

  // Check for inject decorators
  if (config.advanced.diPatterns?.injectDecorator?.test(content)) {
    patternsList.push('@Inject');
    hasDI = true;
  }

  // Check for interface markers (Inject<T>, InjectOptional<T>)
  if (config.advanced.diPatterns?.interfaceMarker?.test(content)) {
    patternsList.push('Inject<T>');
    hasDI = true;
  }

  // Check for @Autowired decorator
  if (content.includes('@Autowired') || content.includes('@AutoWire')) {
    patternsList.push('@Autowired');
    hasDI = true;
  }

  // Check for interface implementations
  if (content.includes('implements ') && content.includes('Interface')) {
    patternsList.push('Interface implementation');
    hasDI = true;
  }

  return { hasDI, patterns: patternsList };
}

/**
 * Quick check if content likely contains DI patterns (faster heuristic)
 */
export function quickDICheck(content: string): boolean {
  return (
    content.includes('@Service') ||
    content.includes('Inject<') ||
    content.includes('@Inject') ||
    (content.includes('implements') && content.includes('Interface'))
  );
}

/**
 * Check if a file path indicates it's a service file
 */
export function isServiceFile(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return (
    normalized.includes('.service.') ||
    normalized.includes('/services/') ||
    normalized.includes('\\services\\')
  );
}

/**
 * Check if a file path indicates it's a component file
 */
export function isComponentFile(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return (
    normalized.includes('.component.') ||
    normalized.includes('/components/') ||
    normalized.includes('\\components\\') ||
    normalized.endsWith('.tsx')
  );
}
