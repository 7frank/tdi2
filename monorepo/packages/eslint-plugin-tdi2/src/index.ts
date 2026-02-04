/**
 * TDI2 ESLint Plugin
 * Provides rich context information for interface resolution and DI usage
 */

import type { ESLint, Linter } from 'eslint';
import showInterfaceResolution from './rules/show-interface-resolution.js';
import showImplementationContext from './rules/show-implementation-context.js';
import showInterfaceImplementations from './rules/show-interface-implementations.js';
import showMissingServicesContext from './rules/show-missing-services-context.js';

const plugin: ESLint.Plugin = {
  rules: {
    // Interface resolution context at Inject<> usage points
    'show-interface-resolution': showInterfaceResolution,

    // Implementation context at @Service() class declarations
    'show-implementation-context': showImplementationContext,

    // All implementations when hovering over interface declarations
    'show-interface-implementations': showInterfaceImplementations,

    // DI context when services prop is missing
    'show-missing-services-context': showMissingServicesContext,
  },

  configs: {
    recommended: {
      plugins: ['tdi2'],
      rules: {
        'tdi2/show-interface-resolution': 'warn',
        'tdi2/show-implementation-context': 'warn',
        'tdi2/show-interface-implementations': 'warn',
        'tdi2/show-missing-services-context': 'warn',
      },
    } as any,
    strict: {
      plugins: ['tdi2'],
      rules: {
        'tdi2/show-interface-resolution': [
          'warn',
          {
            showDependencies: true,
            showScope: true,
            showFilePath: true,
            showOtherImplementations: true,
            warnOnAmbiguous: true,
          },
        ],
        'tdi2/show-implementation-context': [
          'warn',
          {
            showUsageStats: true,
            showDependencies: true,
            showOtherImplementations: true,
          },
        ],
        'tdi2/show-interface-implementations': [
          'warn',
          {
            showUsageStats: true,
            showProfiles: true,
            warnOnAmbiguity: true,
          },
        ],
        'tdi2/show-missing-services-context': 'warn',
      },
    } as any,
  },
};

export default plugin;
