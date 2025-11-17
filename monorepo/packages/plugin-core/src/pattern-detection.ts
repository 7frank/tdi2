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

  return { hasDI, patterns: patternsList };
}
