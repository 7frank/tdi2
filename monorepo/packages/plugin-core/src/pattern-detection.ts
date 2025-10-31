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
  const patterns = config.advanced.diPatterns;

  // Check for @Service decorator
  const hasService = patterns?.serviceDecorator?.test(content) ?? false;

  // Check for Inject<> type usage
  const hasInject = patterns?.interfaceMarker?.test(content) ?? false;

  // Check for @Inject decorator
  const hasInjectDecorator = patterns?.injectDecorator?.test(content) ?? false;

  // Check for interface implementations (likely services)
  const hasInterface = content.includes('implements') && content.includes('Interface');

  // Check for React components
  const hasComponent =
    (content.includes('function') || content.includes('=>')) &&
    (content.includes('React') || content.includes('FC') || content.includes('JSX') || content.includes('tsx'));

  // Determine if file has any DI patterns
  const hasDI = hasService || hasInject || hasInjectDecorator || (hasInterface && hasComponent);

  return {
    hasDI,
    hasService,
    hasInject: hasInject || hasInjectDecorator,
    hasInterface,
    hasComponent,
  };
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
