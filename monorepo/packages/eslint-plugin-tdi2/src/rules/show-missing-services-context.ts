/**
 * ESLint Rule: show-missing-services-context
 * Shows DI context when a component is missing the 'services' prop
 * Provides information about what services would be injected
 */

import type { Rule } from 'eslint';
import metadataLoader from '../utils/metadata-loader.js';
import type { ComponentMetadata } from '../types.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Show DI context when components are missing services prop',
      category: 'TDI2 Context',
      recommended: true,
    },
    messages: {
      missingServicesWithContext: [
        '💡 DI Context: This component expects services',
        '',
        '🔧 Auto-injected by TDI2:',
        '{{injectionList}}',
        '',
        '✅ The services prop is handled by the DI transformer',
        '   You can safely ignore the TypeScript error above.',
      ].join('\n'),
    },
    schema: [],
  },

  create(context: Rule.RuleContext) {
    const projectRoot = context.getCwd();
    const metadata = metadataLoader.loadMetadata(projectRoot);

    // Skip if metadata not available
    if (!metadata || 'error' in metadata) {
      return {};
    }

    return {
      // Match JSX elements
      JSXOpeningElement(node: any) {
        const elementName = node.name?.name;
        if (!elementName) return;

        // Check if element has services prop
        const hasServicesProp = node.attributes?.some(
          (attr: any) => attr.type === 'JSXAttribute' && attr.name?.name === 'services'
        );

        // If services prop is present, no need to show context
        if (hasServicesProp) return;

        // Look for component metadata
        let componentData: ComponentMetadata | null = null;

        // Try to find component in metadata by checking all component entries
        for (const [filePath, comp] of Object.entries(metadata.components)) {
          if (comp.componentName === elementName) {
            componentData = comp;
            break;
          }
        }

        // If no component metadata or no injections, skip
        if (!componentData || componentData.injections.length === 0) {
          return;
        }

        // Format injection list with resolution info
        const injectionList = componentData.injections
          .map((injection) => {
            const parts = [
              `   • ${injection.paramName}: ${injection.interfaceType}`,
            ];

            if (injection.resolvedClass) {
              parts.push(`     └─ Resolves to: ${injection.resolvedClass}`);
              if (injection.resolvedPath) {
                parts.push(`     └─ 📍 ${injection.resolvedPath}`);
              }
            }

            if (injection.hasAmbiguity) {
              parts.push(`     └─ ⚠️  Ambiguous: ${injection.allPossibleImplementations.join(', ')}`);
            }

            return parts.join('\n');
          })
          .join('\n\n');

        // Report info message
        context.report({
          node,
          messageId: 'missingServicesWithContext',
          data: {
            injectionList,
          },
        });
      },
    };
  },
};

export default rule;
