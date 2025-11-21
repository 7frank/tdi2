/**
 * ESLint Rule: show-implementation-context
 * Shows context when hovering over @Service() class declarations
 * Displays interfaces implemented, usage stats, and links to other implementations
 */

import type { Rule } from 'eslint';
import metadataLoader from '../utils/metadata-loader.js';
import type { ImplementationContextOptions, ImplementationMetadata } from '../types.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Show context for @Service() implementation classes',
      category: 'TDI2 Context',
      recommended: true,
    },
    hasSuggestions: true,
    messages: {
      navigateToInterface: '🔗 Open interface {{interfaceName}} ({{path}}:{{line}})',
      implementationContext: [
        '📦 Service: {{className}}',
        '🔗 Implements: {{interfaces}}',
        '{{primaryBadge}}',
        '{{profileBadge}}',
        '',
        '📊 Usage:',
        '   • Used by: {{componentCount}} components',
        '   • Dependencies: {{dependencyCount}}',
        '{{dependencyList}}',
        '',
        '{{otherImplementationsSection}}',
      ].join('\n'),

      implementationNonPrimary: [
        '📦 Service: {{className}}',
        '🔗 Implements: {{interfaces}}',
        '⚙️  Scope: {{scope}}',
        '{{profileBadge}}',
        '',
        '⚠️  Not selected: {{primaryClass}} is @Primary',
        '💡 To use this: Add @Qualifier(\'{{qualifier}}\') at injection point',
        '',
        '🔄 Other implementations:',
        '{{otherImplementations}}',
      ].join('\n'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          showUsageStats: {
            type: 'boolean',
            default: true,
          },
          showDependencies: {
            type: 'boolean',
            default: true,
          },
          showOtherImplementations: {
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
    const options = (context.options[0] || {}) as ImplementationContextOptions;

    // Default options
    const showUsageStats = options.showUsageStats !== false;
    const showDependencies = options.showDependencies !== false;
    const showOtherImplementations = options.showOtherImplementations !== false;

    // Skip if metadata not available
    if (!metadata || 'error' in metadata) {
      return {};
    }

    return {
      // Match class declarations
      ClassDeclaration(node: any) {
        const className = node.id && node.id.name;
        if (!className) return;

        const implData = metadata.implementations[className];
        if (!implData || !implData.isService) return;

        // Get interface names
        const interfaces = implData.implementsInterfaces.map((ref) => ref.interfaceName);
        if (interfaces.length === 0) return;

        // Format primary badge
        let primaryBadge = '';
        if (implData.isPrimary) {
          primaryBadge = '⭐ Marked as: PRIMARY (default selection)';
        }

        // Format profile badge
        let profileBadge = '';
        if (implData.profiles.length > 0) {
          const activeProfiles = metadata.activeProfiles || [];
          const isActive = implData.profiles.some((p) => activeProfiles.includes(p));
          profileBadge = isActive
            ? `✅ Profiles: ${implData.profiles.join(', ')} (active)`
            : `⚙️  Profiles: ${implData.profiles.join(', ')} (not active)`;
        }

        // Format dependency list
        let dependencyList = '';
        if (showDependencies && implData.dependsOn.length > 0) {
          dependencyList = `   • List: ${implData.dependsOn.join(', ')}`;
        }

        // Format other implementations section
        let otherImplementationsSection = '';
        if (showOtherImplementations && interfaces.length > 0) {
          const firstInterface = interfaces[0];
          const interfaceData = metadata.interfaces[firstInterface];

          if (interfaceData && interfaceData.totalImplementations > 1) {
            const others = interfaceData.implementations
              .filter((impl) => impl.implementationClass !== className)
              .map((impl) => formatOtherImpl(impl))
              .join('\n');

            otherImplementationsSection = [
              `🔄 Other implementations of ${firstInterface}:`,
              others,
            ].join('\n');
          }
        }

        // Create navigation suggestions for interfaces
        const suggestions = implData.implementsInterfaces.map((ref) => ({
          messageId: 'navigateToInterface' as const,
          data: {
            interfaceName: ref.interfaceName,
            path: ref.interfaceFilePath,
            line: String(ref.interfaceLocation.line),
          },
          fix: () => null as any,
        }));

        // Check if this is the primary implementation
        if (implData.isPrimary || interfaces.length === 0) {
          // Show primary context
          context.report({
            node: node.id,
            messageId: 'implementationContext',
            data: {
              className,
              interfaces: interfaces.join(', '),
              primaryBadge,
              profileBadge,
              componentCount: showUsageStats ? implData.usedByComponents.length : 0,
              dependencyCount: implData.dependsOn.length,
              dependencyList,
              otherImplementationsSection,
            },
            suggest: suggestions,
          });
        } else {
          // Show non-primary context
          const firstInterface = interfaces[0];
          const interfaceData = metadata.interfaces[firstInterface];
          const primaryImpl = interfaceData?.implementations.find((impl) => impl.isPrimary);

          const otherImplementations = interfaceData?.implementations
            .filter((impl) => impl.implementationClass !== className)
            .map((impl) => formatOtherImpl(impl))
            .join('\n');

          context.report({
            node: node.id,
            messageId: 'implementationNonPrimary',
            data: {
              className,
              interfaces: interfaces.join(', '),
              scope: implData.scope,
              profileBadge,
              primaryClass: primaryImpl?.implementationClass || 'Unknown',
              qualifier: implData.qualifier || className.replace(/Service$/, '').toLowerCase(),
              otherImplementations: otherImplementations || '   (none)',
            },
            suggest: suggestions,
          });
        }
      },
    };
  },
};

// ==================== Helper Functions ====================

/**
 * Format other implementation for display
 */
function formatOtherImpl(impl: ImplementationMetadata): string {
  const badge = impl.isPrimary ? '⭐ PRIMARY' : '';
  const profiles = impl.profiles.length > 0 ? ` [${impl.profiles.join(', ')}]` : '';
  return `   • ${impl.implementationClass}${profiles} ${badge}`.trim();
}

export default rule;
