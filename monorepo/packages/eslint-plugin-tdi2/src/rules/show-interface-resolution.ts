/**
 * ESLint Rule: show-interface-resolution
 * Shows how Inject<InterfaceType> resolves to concrete implementations
 * Displays multiple implementations, selection logic, and navigation context
 */

import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/utils';
import metadataLoader from '../utils/metadata-loader.js';
import type { InterfaceResolutionOptions, ImplementationMetadata } from '../types.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Show how Inject<> interfaces are resolved to implementations',
      category: 'TDI2 Context',
      recommended: true,
    },
    messages: {
      configNotFound: [
        '⚠️  TDI2 config not found',
        '',
        '💡 Run your app once to generate interface resolution data.',
        '   Example: npm run dev',
      ].join('\n'),

      interfaceResolved: [
        '✅ {{interfaceName}} → {{selectedClass}}',
        '📍 {{selectedPath}}:{{selectedLine}}',
        '⚙️  Scope: {{scope}}{{profileInfo}}',
        '{{dependencyInfo}}',
        '{{otherImplementationsInfo}}',
        '',
        '💡 Reason: {{selectionReason}}',
      ].join('\n'),

      interfaceResolvedMultiple: [
        '✅ {{interfaceName}} → {{selectedClass}} {{isPrimaryBadge}}',
        '📍 {{selectedPath}}:{{selectedLine}}',
        '⚙️  Scope: {{scope}}{{profileInfo}}',
        '{{dependencyInfo}}',
        '',
        '🔄 Other implementations ({{otherCount}}):',
        '{{otherList}}',
        '',
        '💡 Reason: {{selectionReason}}',
      ].join('\n'),

      interfaceAmbiguous: [
        '⚠️  {{interfaceName}} → AMBIGUOUS',
        '',
        '⚠️  Multiple implementations found ({{count}}):',
        '{{implementationList}}',
        '',
        '❌ Non-deterministic selection! Add one of:',
        '   • @Primary() on preferred implementation',
        '   • @Qualifier(...) at injection point',
        '   • @Profile(...) to filter by environment',
      ].join('\n'),

      interfaceUnresolved: [
        '❌ {{interfaceName}} → NOT RESOLVED',
        '',
        '💡 Ensure a @Service() class implements this interface',
      ].join('\n'),

      profileMismatch: [
        '⚠️  {{interfaceName}} → Profile Mismatch',
        '',
        '📍 {{implementationClass}} ({{implementationPath}}:{{line}})',
        '   └─ Requires: @Profile({{requiredProfiles}})',
        '   └─ Active: {{activeProfiles}}',
        '   └─ Status: Not loaded in current context',
        '',
        '💡 Available in profile: {{requiredProfiles}}',
      ].join('\n'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          showDependencies: {
            type: 'boolean',
            default: true,
          },
          showScope: {
            type: 'boolean',
            default: true,
          },
          showFilePath: {
            type: 'boolean',
            default: true,
          },
          showOtherImplementations: {
            type: 'boolean',
            default: true,
          },
          warnOnAmbiguous: {
            type: 'boolean',
            default: true,
          },
        },
      },
    ],
  },

  create(context: Rule.RuleContext) {
    const projectRoot = context.getCwd();
    const metadata = metadataLoader.loadMetadata(projectRoot);
    const options = (context.options[0] || {}) as InterfaceResolutionOptions;

    // Default options
    const showDependencies = options.showDependencies !== false;
    const showScope = options.showScope !== false;
    const showFilePath = options.showFilePath !== false;
    const showOtherImplementations = options.showOtherImplementations !== false;
    const warnOnAmbiguous = options.warnOnAmbiguous !== false;

    // If config not found, show warning once per file
    if ('error' in metadata && metadata.error === 'CONFIG_NOT_FOUND') {
      return {
        Program(node: Rule.Node) {
          context.report({
            node,
            messageId: 'configNotFound',
          });
        },
      };
    }

    if ('error' in metadata) {
      return {};
    }

    return {
      // Detect Inject<InterfaceName> patterns in TypeScript
      TSTypeReference(node: any) {
        // Check if this is an Inject or InjectOptional marker
        if (!isInjectMarker(node)) return;

        const interfaceName = extractInterfaceName(node);
        if (!interfaceName) return;

        const interfaceData = metadata.interfaces[interfaceName];

        // Handle unresolved interface
        if (!interfaceData) {
          context.report({
            node,
            messageId: 'interfaceUnresolved',
            data: {
              interfaceName,
            },
          });
          return;
        }

        // Handle ambiguous resolution
        if (interfaceData.hasAmbiguity && warnOnAmbiguous) {
          const implementations = interfaceData.implementations;

          context.report({
            node,
            messageId: 'interfaceAmbiguous',
            data: {
              interfaceName,
              count: implementations.length,
              implementationList: formatImplementationList(implementations),
            },
          });
          return;
        }

        // Handle profile mismatch
        const selected = interfaceData.implementations.find((impl) => impl.isSelected);
        if (selected && selected.profiles.length > 0) {
          const activeProfiles = metadata.activeProfiles || [];
          const hasProfileMatch = selected.profiles.some((p) => activeProfiles.includes(p));

          if (!hasProfileMatch && activeProfiles.length > 0) {
            context.report({
              node,
              messageId: 'profileMismatch',
              data: {
                interfaceName,
                implementationClass: selected.implementationClass,
                implementationPath: selected.implementationPath,
                line: selected.implementationLocation.line,
                requiredProfiles: selected.profiles.join(', '),
                activeProfiles: activeProfiles.join(', ') || 'none',
              },
            });
            return;
          }
        }

        // Show successful resolution
        if (selected) {
          const others = interfaceData.implementations.filter((impl) => !impl.isSelected);
          const hasOthers = others.length > 0;

          // Format dependency info
          let dependencyInfo = '';
          if (showDependencies && selected.dependencies.length > 0) {
            const depList = selected.dependencies
              .map((dep) => dep.interfaceName + (dep.isOptional ? '?' : ''))
              .join(', ');
            dependencyInfo = `🔗 Dependencies: ${depList}`;
          }

          // Format profile info
          let profileInfo = '';
          if (selected.profiles.length > 0) {
            profileInfo = ` | Profiles: ${selected.profiles.join(', ')}`;
          }

          // Format other implementations
          let otherImplementationsInfo = '';
          if (showOtherImplementations && hasOthers) {
            otherImplementationsInfo = [
              '',
              `🔄 Other implementations (${others.length}):`,
              ...others.map((impl) => formatOtherImplementation(impl)),
            ].join('\n');
          }

          // Choose message based on whether there are other implementations
          const messageId = hasOthers && showOtherImplementations
            ? 'interfaceResolvedMultiple'
            : 'interfaceResolved';

          const data = {
            interfaceName,
            selectedClass: selected.implementationClass,
            selectedPath: showFilePath ? selected.implementationPath : '(hidden)',
            selectedLine: selected.implementationLocation.line,
            scope: showScope ? selected.scope : '(hidden)',
            profileInfo,
            dependencyInfo,
            otherImplementationsInfo,
            selectionReason: selected.selectionReason,
            isPrimaryBadge: selected.isPrimary ? '⭐ PRIMARY' : '',
            otherCount: others.length,
            otherList: others.map((impl) => formatOtherImplementation(impl)).join('\n'),
          };

          context.report({
            node,
            messageId,
            data,
          });
        }
      },
    };
  },
};

// ==================== Helper Functions ====================

/**
 * Check if node is an Inject<> or InjectOptional<> marker
 */
function isInjectMarker(node: any): boolean {
  if (!node.typeName) return false;

  const typeName = node.typeName.name || node.typeName.escapedText;
  return typeName === 'Inject' || typeName === 'InjectOptional';
}

/**
 * Extract interface name from Inject<InterfaceName>
 */
function extractInterfaceName(node: any): string | null {
  try {
    if (!node.typeParameters || !node.typeParameters.params || node.typeParameters.params.length === 0) {
      return null;
    }

    const typeParam = node.typeParameters.params[0];

    // Handle TSTypeReference
    if (typeParam.typeName) {
      return typeParam.typeName.name || typeParam.typeName.escapedText;
    }

    // Handle TSTypeLiteral or other types
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Format list of implementations for ambiguous warning
 */
function formatImplementationList(implementations: ImplementationMetadata[]): string {
  return implementations
    .map((impl, i) => {
      const parts = [
        `   ${i + 1}. ${impl.implementationClass} (${impl.implementationPath}:${impl.implementationLocation.line})`,
      ];

      if (impl.profiles.length > 0) {
        parts.push(`      └─ Profiles: ${impl.profiles.join(', ')}`);
      }

      if (impl.isPrimary) {
        parts.push('      └─ ⭐ PRIMARY');
      }

      return parts.join('\n');
    })
    .join('\n');
}

/**
 * Format single other implementation for display
 */
function formatOtherImplementation(impl: ImplementationMetadata): string {
  const parts = [`   • ${impl.implementationClass} (${impl.implementationPath}:${impl.implementationLocation.line})`];

  if (impl.profiles.length > 0) {
    parts.push(`     └─ Profiles: ${impl.profiles.join(', ')}`);
  }

  if (impl.isPrimary) {
    parts.push('     └─ ⭐ PRIMARY (but not selected in current context)');
  }

  return parts.join('\n');
}

export default rule;
