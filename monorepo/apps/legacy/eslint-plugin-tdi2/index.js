/**
 * TDI2 ESLint Plugin
 * Provides rich context information for interface resolution and DI usage
 */

const showInterfaceResolution = require('./rules/show-interface-resolution');
const showImplementationContext = require('./rules/show-implementation-context');
const showInterfaceImplementations = require('./rules/show-interface-implementations');

module.exports = {
  rules: {
    // Interface resolution context at Inject<> usage points
    'show-interface-resolution': showInterfaceResolution,

    // Implementation context at @Service() class declarations
    'show-implementation-context': showImplementationContext,

    // All implementations when hovering over interface declarations
    'show-interface-implementations': showInterfaceImplementations,
  },

  configs: {
    recommended: {
      plugins: ['tdi2'],
      rules: {
        'tdi2/show-interface-resolution': 'warn',
        'tdi2/show-implementation-context': 'warn',
        'tdi2/show-interface-implementations': 'warn',
      },
    },
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
      },
    },
  },
};
