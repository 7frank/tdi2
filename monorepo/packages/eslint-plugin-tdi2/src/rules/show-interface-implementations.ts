/**
 * ESLint Rule: show-interface-implementations
 * Shows all implementations when hovering over interface declarations
 * Provides navigation to all implementing classes
 */

import type { Rule } from 'eslint';
import metadataLoader from '../utils/metadata-loader.js';
import type { InterfaceImplementationsOptions, ImplementationMetadata, ESLintMetadata } from '../types.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Show all implementations for interface declarations',
      category: 'TDI2 Context',
      recommended: true,
    },
    messages: {
      interfaceImplementations: [
        '📦 Interface: {{interfaceName}}',
        '🏭 Implementations: {{count}} found',
        '',
        '✅ Registered:',
        '{{implementations}}',
        '',
        '{{ambiguityWarning}}',
      ].join('\n'),

      interfaceNoImplementations: [
        '📦 Interface: {{interfaceName}}',
        '❌ No implementations found',
        '',
        '💡 Add a @Service() class that implements this interface',
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
          showProfiles: {
            type: 'boolean',
            default: true,
          },
          warnOnAmbiguity: {
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
    const options = (context.options[0] || {}) as InterfaceImplementationsOptions;

    // Default options
    const showUsageStats = options.showUsageStats !== false;
    const showProfiles = options.showProfiles !== false;
    const warnOnAmbiguity = options.warnOnAmbiguity !== false;

    // Skip if metadata not available
    if (!metadata || 'error' in metadata) {
      return {};
    }

    return {
      // Match interface declarations
      TSInterfaceDeclaration(node: any) {
        const interfaceName = node.id && node.id.name;
        if (!interfaceName) return;

        const interfaceData = metadata.interfaces[interfaceName];

        // Handle interface with no implementations
        if (!interfaceData) {
          context.report({
            node: node.id,
            messageId: 'interfaceNoImplementations',
            data: {
              interfaceName,
            },
          });
          return;
        }

        const implementations = interfaceData.implementations;

        // Format implementations list
        const implementationsList = implementations
          .map((impl, index) => formatImplementation(impl, index + 1, metadata, showUsageStats, showProfiles))
          .join('\n\n');

        // Format ambiguity warning
        let ambiguityWarning = '';
        if (warnOnAmbiguity && interfaceData.hasAmbiguity) {
          ambiguityWarning = [
            '⚠️  AMBIGUITY WARNING:',
            '   Multiple implementations with no @Primary',
            '   Add @Primary() to preferred implementation',
          ].join('\n');
        }

        context.report({
          node: node.id,
          messageId: 'interfaceImplementations',
          data: {
            interfaceName,
            count: implementations.length,
            implementations: implementationsList,
            ambiguityWarning,
          },
        });
      },
    };
  },
};

// ==================== Helper Functions ====================

/**
 * Format single implementation for display
 */
function formatImplementation(
  impl: ImplementationMetadata,
  number: number,
  metadata: ESLintMetadata,
  showUsageStats: boolean,
  showProfiles: boolean
): string {
  const parts: string[] = [];

  // Header with number and class name
  let header = `   ${number}. ${impl.implementationClass}`;

  // Add badges
  if (impl.isPrimary) {
    header += ' ⭐ PRIMARY';
  }

  if (impl.isSelected) {
    header += ' ✅ SELECTED';
  }

  parts.push(header);

  // Location
  parts.push(`      └─ 📍 ${impl.implementationPath}:${impl.implementationLocation.line}`);

  // Scope
  parts.push(`      └─ ⚙️  Scope: ${impl.scope}`);

  // Profiles
  if (showProfiles && impl.profiles.length > 0) {
    const activeProfiles = metadata.activeProfiles || [];
    const isActive = impl.profiles.some((p) => activeProfiles.includes(p));
    const statusBadge = isActive ? '✅' : '⏸️';
    parts.push(`      └─ ${statusBadge} Profiles: ${impl.profiles.join(', ')}`);
  }

  // Dependencies
  if (impl.dependencies.length > 0) {
    const depList = impl.dependencies
      .map((dep) => dep.interfaceName + (dep.isOptional ? '?' : ''))
      .join(', ');
    parts.push(`      └─ 🔗 Dependencies: ${depList}`);
  }

  // Usage stats
  if (showUsageStats) {
    const usedByCount = metadata.lookups?.interfaceToComponents?.[impl.implementationClass]?.length || 0;
    if (usedByCount > 0) {
      parts.push(`      └─ 📊 Used by: ${usedByCount} components`);
    }
  }

  // Selection reason (if not selected, explain why)
  if (!impl.isSelected) {
    parts.push(`      └─ 💡 ${impl.selectionReason}`);
  }

  return parts.join('\n');
}

export default rule;
