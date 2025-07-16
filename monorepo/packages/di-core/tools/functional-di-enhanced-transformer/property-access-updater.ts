// tools/functional-di-enhanced-transformer/property-access-updater.ts
import {
  FunctionDeclaration,
  ArrowFunction,
  Node,
  PropertyAccessExpression,
  Identifier
} from 'ts-morph';
import { ExtractedDependency } from '../shared/SharedDependencyExtractor';

export interface PropertyAccessMapping {
  originalAccess: string;     // "services.api"
  newVariable: string;        // "api"
  propertyPath: string[];     // ["services", "api"]
}

export class PropertyAccessUpdater {
  private accessMappings: PropertyAccessMapping[] = [];

  constructor(private options: { verbose?: boolean } = {}) {}

  /**
   * Generate property access mappings from dependencies
   */
  generateMappings(dependencies: ExtractedDependency[]): PropertyAccessMapping[] {
    this.accessMappings = [];

    for (const dep of dependencies) {
      if (dep.propertyPath && dep.propertyPath.length > 0) {
        const mapping: PropertyAccessMapping = {
          originalAccess: dep.propertyPath.join('.'),
          newVariable: dep.serviceKey,
          propertyPath: dep.propertyPath
        };
        this.accessMappings.push(mapping);

        if (this.options.verbose) {
          console.log(`📝 Generated mapping: ${mapping.originalAccess} -> ${mapping.newVariable}`);
        }
      }
    }

    return this.accessMappings;
  }

  /**
   * Update all property access expressions in function body
   */
  updatePropertyAccessInFunction(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): void {
    // Generate mappings from dependencies
    const mappings = this.generateMappings(dependencies);
    
    if (mappings.length === 0) {
      return;
    }

    const body = this.getFunctionBody(func);
    if (!body) return;

    // Get all property access expressions
    const propertyAccesses = body.getDescendantsOfKind(Node.SyntaxKind.PropertyAccessExpression);
    
    // Sort by length (longest first) to handle nested properties correctly
    const sortedMappings = mappings.sort((a, b) => b.originalAccess.length - a.originalAccess.length);

    for (const propAccess of propertyAccesses) {
      this.updateSinglePropertyAccess(propAccess, sortedMappings);
    }
  }

  /**
   * Update a single property access expression
   */
  private updateSinglePropertyAccess(
    propAccess: PropertyAccessExpression,
    mappings: PropertyAccessMapping[]
  ): void {
    const fullExpression = this.getFullPropertyChain(propAccess);
    
    if (this.options.verbose) {
      console.log(`🔍 Analyzing property access: ${fullExpression}`);
    }

    for (const mapping of mappings) {
      if (this.matchesPropertyPattern(fullExpression, mapping)) {
        const replacement = this.generateReplacement(fullExpression, mapping);
        if (replacement !== fullExpression) {
          // Find the root of the property chain to replace
          const rootAccess = this.findRootPropertyAccess(propAccess, mapping.propertyPath);
          if (rootAccess) {
            rootAccess.replaceWithText(replacement);
            
            if (this.options.verbose) {
              console.log(`✅ Updated: ${fullExpression} -> ${replacement}`);
            }
            return;
          }
        }
      }
    }
  }

  /**
   * Get the full property chain as a string
   */
  private getFullPropertyChain(propAccess: PropertyAccessExpression): string {
    const parts: string[] = [];
    let current: any = propAccess;

    // Walk up the property chain
    while (current) {
      if (Node.isPropertyAccessExpression(current)) {
        parts.unshift(current.getName());
        current = current.getExpression();
      } else if (Node.isIdentifier(current)) {
        parts.unshift(current.getText());
        break;
      } else {
        break;
      }
    }

    return parts.join('.');
  }

  /**
   * Check if property expression matches a mapping pattern
   */
  private matchesPropertyPattern(
    expression: string,
    mapping: PropertyAccessMapping
  ): boolean {
    // Check if the expression starts with the mapping pattern
    return expression.startsWith(mapping.originalAccess);
  }

  /**
   * Generate replacement text for property access
   */
  private generateReplacement(
    originalExpression: string,
    mapping: PropertyAccessMapping
  ): string {
    if (originalExpression === mapping.originalAccess) {
      // Exact match: "services.api" -> "api"
      return mapping.newVariable;
    } else if (originalExpression.startsWith(mapping.originalAccess + '.')) {
      // Nested access: "services.api.getData()" -> "api.getData()"
      const remainingPath = originalExpression.substring(mapping.originalAccess.length + 1);
      return `${mapping.newVariable}.${remainingPath}`;
    }

    return originalExpression;
  }

  /**
   * Find the root property access node that needs to be replaced
   */
  private findRootPropertyAccess(
    propAccess: PropertyAccessExpression,
    targetPath: string[]
  ): PropertyAccessExpression | Identifier | null {
    // We need to find the node that represents the start of our target path
    let current: any = propAccess;
    
    // First, walk up to find the complete property chain
    while (current.getParent() && Node.isPropertyAccessExpression(current.getParent())) {
      current = current.getParent();
    }
    
    // Now we have the root of the property chain
    // Check if this matches our target path
    const fullChain = this.getFullPropertyChain(current);
    
    // Find the longest matching path
    for (let i = targetPath.length; i > 0; i--) {
      const partialPath = targetPath.slice(0, i).join('.');
      if (fullChain.startsWith(partialPath)) {
        // Found a match, now find the corresponding node
        return this.findNodeForPath(current, i);
      }
    }
    
    return current;
  }

  /**
   * Find the node that represents a specific depth in the property chain
   */
  private findNodeForPath(rootNode: any, depth: number): any {
    let current = rootNode;
    let currentDepth = this.getPropertyDepth(rootNode);
    
    // Navigate to the correct depth
    while (currentDepth > depth && Node.isPropertyAccessExpression(current)) {
      current = current.getExpression();
      currentDepth--;
    }
    
    return current;
  }

  /**
   * Get the depth of a property access chain
   */
  private getPropertyDepth(node: any): number {
    let depth = 0;
    let current = node;
    
    while (current) {
      if (Node.isPropertyAccessExpression(current)) {
        depth++;
        current = current.getExpression();
      } else if (Node.isIdentifier(current)) {
        depth++;
        break;
      } else {
        break;
      }
    }
    
    return depth;
  }

  /**
   * Get function body regardless of function type
   */
  private getFunctionBody(func: FunctionDeclaration | ArrowFunction): any {
    if (Node.isFunctionDeclaration(func)) {
      return func.getBody();
    } else if (Node.isArrowFunction(func)) {
      return func.getBody();
    }
    return null;
  }

  /**
   * Advanced property access replacement using AST traversal
   */
  updatePropertyAccessAdvanced(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): void {
    const mappings = this.generateMappings(dependencies);
    if (mappings.length === 0) return;

    const body = this.getFunctionBody(func);
    if (!body) return;

    // Use a more sophisticated approach with AST traversal
    body.forEachDescendant((node, traversal) => {
      if (Node.isPropertyAccessExpression(node)) {
        const fullChain = this.getFullPropertyChain(node);
        
        for (const mapping of mappings) {
          if (this.shouldReplacePropertyAccess(node, mapping, fullChain)) {
            const replacement = this.generateReplacement(fullChain, mapping);
            
            // Find the correct node to replace
            const nodeToReplace = this.findExactNodeToReplace(node, mapping);
            if (nodeToReplace && replacement !== fullChain) {
              nodeToReplace.replaceWithText(replacement);
              
              if (this.options.verbose) {
                console.log(`🔄 Advanced update: ${fullChain} -> ${replacement}`);
              }
              
              // Skip traversing children since we replaced the node
              traversal.skip();
              return;
            }
          }
        }
      }
    });
  }

  /**
   * Check if a property access should be replaced
   */
  private shouldReplacePropertyAccess(
    node: PropertyAccessExpression,
    mapping: PropertyAccessMapping,
    fullChain: string
  ): boolean {
    // Don't replace if this is part of a larger property chain that we haven't processed yet
    const parent = node.getParent();
    if (Node.isPropertyAccessExpression(parent)) {
      return false;
    }
    
    return fullChain.startsWith(mapping.originalAccess);
  }

  /**
   * Find the exact node that should be replaced for a mapping
   */
  private findExactNodeToReplace(
    node: PropertyAccessExpression,
    mapping: PropertyAccessMapping
  ): any {
    // Walk up the tree to find the root of the property chain that matches our mapping
    let current: any = node;
    
    // Go to the root of the property access chain
    while (current.getParent() && Node.isPropertyAccessExpression(current.getParent())) {
      current = current.getParent();
    }
    
    return current;
  }

  /**
   * Validate that property access updates are correct
   */
  validateUpdates(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const body = this.getFunctionBody(func);
    if (!body) return { isValid: true, issues: [] };

    const mappings = this.generateMappings(dependencies);
    const bodyText = body.getText();

    // Check that old property access patterns are removed
    for (const mapping of mappings) {
      if (bodyText.includes(mapping.originalAccess + '.')) {
        issues.push(`Old property access pattern still present: ${mapping.originalAccess}`);
      }
    }

    // Check that new variables are used
    for (const mapping of mappings) {
      if (!bodyText.includes(mapping.newVariable)) {
        issues.push(`New variable not found in function body: ${mapping.newVariable}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Preview what property access updates would be made
   */
  previewUpdates(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): Array<{ from: string; to: string; location: string }> {
    const updates: Array<{ from: string; to: string; location: string }> = [];
    const mappings = this.generateMappings(dependencies);
    
    if (mappings.length === 0) return updates;

    const body = this.getFunctionBody(func);
    if (!body) return updates;

    const propertyAccesses = body.getDescendantsOfKind(Node.SyntaxKind.PropertyAccessExpression);
    
    for (const propAccess of propertyAccesses) {
      const fullChain = this.getFullPropertyChain(propAccess);
      
      for (const mapping of mappings) {
        if (this.matchesPropertyPattern(fullChain, mapping)) {
          const replacement = this.generateReplacement(fullChain, mapping);
          if (replacement !== fullChain) {
            updates.push({
              from: fullChain,
              to: replacement,
              location: `Line ${propAccess.getStartLineNumber()}`
            });
          }
        }
      }
    }

    return updates;
  }

  /**
   * Get statistics about property access patterns in function
   */
  getPropertyAccessStats(func: FunctionDeclaration | ArrowFunction): {
    totalPropertyAccesses: number;
    uniquePatterns: string[];
    maxDepth: number;
  } {
    const body = this.getFunctionBody(func);
    if (!body) return { totalPropertyAccesses: 0, uniquePatterns: [], maxDepth: 0 };

    const propertyAccesses = body.getDescendantsOfKind(Node.SyntaxKind.PropertyAccessExpression);
    const patterns = new Set<string>();
    let maxDepth = 0;

    for (const propAccess of propertyAccesses) {
      const chain = this.getFullPropertyChain(propAccess);
      patterns.add(chain);
      
      const depth = chain.split('.').length;
      maxDepth = Math.max(maxDepth, depth);
    }

    return {
      totalPropertyAccesses: propertyAccesses.length,
      uniquePatterns: Array.from(patterns),
      maxDepth
    };
  }
}

// Usage example
export function demonstratePropertyAccessUpdater() {
  console.log(`
=== PROPERTY ACCESS UPDATER EXAMPLE ===

BEFORE:
function MyComponent(props: { services: { api: Inject<ApiInterface> } }) {
  const api = props.services.api ?? useService('ApiInterface');
  return <div>{services.api.getData()}</div>;  // ❌ Still using old access
}

AFTER:
function MyComponent(props: { services: { api: Inject<ApiInterface> } }) {
  const api = props.services.api ?? useService('ApiInterface');
  return <div>{api.getData()}</div>;  // ✅ Using new variable
}

The PropertyAccessUpdater:
1. Generates mappings: services.api -> api
2. Finds all property access expressions
3. Replaces services.api.* with api.*
4. Validates the updates are correct
  `);
}