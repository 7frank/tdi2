// Graph visualization supporting ASCII, JSON, DOT, and Mermaid formats

import type { 
  DependencyGraph, 
  DependencyNode, 
  GraphVisualizationOptions 
} from './types';

export class GraphVisualizer {
  
  /**
   * Generate visualization in the specified format
   */
  visualize(graph: DependencyGraph, options: GraphVisualizationOptions): string {
    switch (options.format) {
      case 'ascii':
        return this.generateAsciiTree(graph, options);
      case 'json':
        return this.generateJson(graph, options);
      case 'dot':
        return this.generateDotFormat(graph, options);
      case 'mermaid':
        return this.generateMermaidDiagram(graph, options);
      default:
        throw new Error(`Unsupported visualization format: ${options.format}`);
    }
  }
  
  /**
   * Generate ASCII tree representation
   */
  private generateAsciiTree(graph: DependencyGraph, options: GraphVisualizationOptions): string {
    const lines: string[] = [];
    const visited = new Set<string>();
    const { maxDepth = 10, highlight = [], nodeTypes, showProfiles = false } = options;
    
    // Start with root nodes
    for (const root of graph.roots) {
      if (this.shouldIncludeNode(graph.nodes.get(root), nodeTypes)) {
        this.renderNodeAscii(graph, root, '', visited, lines, 0, maxDepth, highlight, showProfiles);
      }
    }
    
    // Include any unvisited nodes (islands)
    for (const [token] of graph.nodes.entries()) {
      if (!visited.has(token) && this.shouldIncludeNode(graph.nodes.get(token), nodeTypes)) {
        lines.push('\n🏝️  Isolated services:');
        this.renderNodeAscii(graph, token, '', new Set(), lines, 0, maxDepth, highlight, showProfiles);
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * Recursively render ASCII tree nodes
   */
  private renderNodeAscii(
    graph: DependencyGraph, 
    token: string, 
    prefix: string, 
    visited: Set<string>, 
    lines: string[], 
    depth: number, 
    maxDepth: number,
    highlight: string[],
    showProfiles: boolean
  ): void {
    if (visited.has(token) || depth > maxDepth) return;
    
    visited.add(token);
    const node = graph.nodes.get(token);
    if (!node) return;
    
    // Format node representation
    const isHighlighted = highlight.includes(token);
    const nodeIcon = this.getNodeIcon(node);
    const nodeColor = isHighlighted ? '🎯' : '';
    const profileInfo = showProfiles && node.metadata.profiles ? ` [${node.metadata.profiles.join(',')}]` : '';
    
    let nodeText = `${nodeColor}${nodeIcon} ${token}`;
    if (node.implementationClass !== token) {
      nodeText += ` → ${node.implementationClass}`;
    }
    nodeText += ` (${node.scope})${profileInfo}`;
    
    lines.push(prefix + nodeText);
    
    // Render dependencies
    const deps = graph.dependencies.get(token) || [];
    for (let i = 0; i < deps.length; i++) {
      const isLast = i === deps.length - 1;
      const childPrefix = prefix + (isLast ? '└── ' : '├── ');
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      
      const dep = deps[i];
      const depNode = graph.nodes.get(dep);
      
      if (visited.has(dep)) {
        // Show circular reference
        lines.push(childPrefix + `🔄 ${dep} (circular reference)`);
      } else if (depNode) {
        this.renderNodeAscii(graph, dep, nextPrefix, visited, lines, depth + 1, maxDepth, highlight, showProfiles);
      } else {
        // Missing dependency
        lines.push(childPrefix + `❌ ${dep} (missing)`);
      }
    }
  }
  
  /**
   * Generate JSON representation
   */
  private generateJson(graph: DependencyGraph, options: GraphVisualizationOptions): string {
    const { includeDetails = true, nodeTypes, showProfiles = false } = options;
    
    const jsonGraph: any = {
      meta: {
        totalNodes: graph.nodes.size,
        rootNodes: graph.roots.length,
        leafNodes: graph.leaves.length,
        generatedAt: new Date().toISOString(),
        options
      },
      nodes: [],
      edges: [],
      statistics: this.generateGraphStatistics(graph)
    };
    
    // Add nodes
    for (const [token, node] of graph.nodes.entries()) {
      if (!this.shouldIncludeNode(node, nodeTypes)) continue;
      
      const jsonNode: any = {
        id: token,
        implementationClass: node.implementationClass,
        scope: node.scope,
        type: this.getNodeType(node),
        isOptional: node.isOptional
      };
      
      if (includeDetails) {
        jsonNode.filePath = node.filePath;
        jsonNode.metadata = node.metadata;
        jsonNode.dependencyCount = node.dependencies.length;
        jsonNode.dependentCount = node.dependents.length;
      }
      
      if (showProfiles && node.metadata.profiles) {
        jsonNode.profiles = node.metadata.profiles;
      }
      
      jsonGraph.nodes.push(jsonNode);
    }
    
    // Add edges
    for (const [from, dependencies] of graph.dependencies.entries()) {
      if (!this.shouldIncludeNode(graph.nodes.get(from), nodeTypes)) continue;
      
      for (const to of dependencies) {
        if (!this.shouldIncludeNode(graph.nodes.get(to), nodeTypes)) continue;
        
        jsonGraph.edges.push({
          from,
          to,
          type: 'dependency'
        });
      }
    }
    
    return JSON.stringify(jsonGraph, null, 2);
  }
  
  /**
   * Generate Graphviz DOT format
   */
  private generateDotFormat(graph: DependencyGraph, options: GraphVisualizationOptions): string {
    const { highlight = [], nodeTypes, showProfiles = false } = options;
    const lines: string[] = [];
    
    lines.push('digraph DependencyGraph {');
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box, style=rounded];');
    lines.push('');
    
    // Add node definitions
    for (const [token, node] of graph.nodes.entries()) {
      if (!this.shouldIncludeNode(node, nodeTypes)) continue;
      
      const isHighlighted = highlight.includes(token);
      const color = isHighlighted ? 'red' : this.getNodeColor(node);
      const shape = this.getNodeShape(node);
      const profileInfo = showProfiles && node.metadata.profiles ? `\\n[${node.metadata.profiles.join(',')}]` : '';
      
      const label = `${token}\\n${node.implementationClass}\\n(${node.scope})${profileInfo}`;
      lines.push(`  "${token}" [label="${label}", color="${color}", shape="${shape}"];`);
    }
    
    lines.push('');
    
    // Add edges
    for (const [from, dependencies] of graph.dependencies.entries()) {
      if (!this.shouldIncludeNode(graph.nodes.get(from), nodeTypes)) continue;
      
      for (const to of dependencies) {
        if (!this.shouldIncludeNode(graph.nodes.get(to), nodeTypes)) continue;
        
        const toNode = graph.nodes.get(to);
        const style = toNode ? 'solid' : 'dashed';
        const color = toNode ? 'black' : 'red';
        
        lines.push(`  "${from}" -> "${to}" [style="${style}", color="${color}"];`);
      }
    }
    
    lines.push('}');
    return lines.join('\n');
  }
  
  /**
   * Generate Mermaid diagram
   */
  private generateMermaidDiagram(graph: DependencyGraph, options: GraphVisualizationOptions): string {
    const { highlight = [], nodeTypes } = options;
    const lines: string[] = [];
    
    lines.push('graph TD');
    lines.push('');
    
    // Add nodes with definitions
    for (const [token, node] of graph.nodes.entries()) {
      if (!this.shouldIncludeNode(node, nodeTypes)) continue;
      
      const isHighlighted = highlight.includes(token);
      const nodeId = this.sanitizeMermaidId(token);
      const nodeClass = this.getMermaidNodeClass(node, isHighlighted);
      const label = `${token}\\n${node.implementationClass}`;
      
      lines.push(`  ${nodeId}["${label}"]:::${nodeClass}`);
    }
    
    lines.push('');
    
    // Add dependencies
    for (const [from, dependencies] of graph.dependencies.entries()) {
      if (!this.shouldIncludeNode(graph.nodes.get(from), nodeTypes)) continue;
      
      const fromId = this.sanitizeMermaidId(from);
      for (const to of dependencies) {
        if (!this.shouldIncludeNode(graph.nodes.get(to), nodeTypes)) continue;
        
        const toId = this.sanitizeMermaidId(to);
        const toNode = graph.nodes.get(to);
        const arrow = toNode ? '-->' : '-.->'; // Dashed arrow for missing dependencies
        
        lines.push(`  ${fromId} ${arrow} ${toId}`);
      }
    }
    
    // Add class definitions
    lines.push('');
    lines.push('  classDef interface fill:#e1f5fe;');
    lines.push('  classDef class fill:#f3e5f5;');
    lines.push('  classDef inheritance fill:#e8f5e8;');
    lines.push('  classDef state fill:#fff3e0;');
    lines.push('  classDef highlighted fill:#ffebee,stroke:#d32f2f,stroke-width:2px;');
    lines.push('  classDef missing fill:#ffebee,stroke:#d32f2f,stroke-dasharray: 5 5;');
    
    return lines.join('\n');
  }
  
  /**
   * Generate graph statistics
   */
  private generateGraphStatistics(graph: DependencyGraph): any {
    const nodesByType = {
      interface: 0,
      class: 0,
      inheritance: 0,
      state: 0
    };
    
    const nodesByScope = {
      singleton: 0,
      transient: 0,
      scoped: 0
    };
    
    for (const [, node] of graph.nodes.entries()) {
      // Count by type
      if (node.metadata.isInterface) nodesByType.interface++;
      else if (node.metadata.isInheritanceBased) nodesByType.inheritance++;
      else if (node.metadata.isStateBased) nodesByType.state++;
      else nodesByType.class++;
      
      // Count by scope
      nodesByScope[node.scope]++;
    }
    
    const totalDependencies = Array.from(graph.dependencies.values()).flat().length;
    const avgDependenciesPerNode = totalDependencies / graph.nodes.size;
    
    return {
      nodesByType,
      nodesByScope,
      totalDependencies,
      avgDependenciesPerNode: Math.round(avgDependenciesPerNode * 100) / 100,
      maxDepth: Math.max(...Array.from(graph.nodes.keys()).map(token => this.calculateDepth(graph, token))),
      isolatedNodes: this.findIsolatedNodes(graph).length
    };
  }
  
  // Helper methods
  
  private shouldIncludeNode(node: DependencyNode | undefined, nodeTypes?: string[]): boolean {
    if (!node) return false;
    if (!nodeTypes || nodeTypes.length === 0) return true;
    
    return nodeTypes.some(type => {
      switch (type) {
        case 'interface': return node.metadata.isInterface;
        case 'class': return node.metadata.isClass;
        case 'inheritance': return node.metadata.isInheritanceBased;
        case 'state': return node.metadata.isStateBased;
        default: return false;
      }
    });
  }
  
  private getNodeIcon(node: DependencyNode): string {
    if (node.metadata.isInterface) return '🔌';
    if (node.metadata.isInheritanceBased) return '🧬';
    if (node.metadata.isStateBased) return '📊';
    if (node.metadata.isClass) return '📦';
    return '⚙️';
  }
  
  private getNodeType(node: DependencyNode): string {
    if (node.metadata.isInterface) return 'interface';
    if (node.metadata.isInheritanceBased) return 'inheritance';
    if (node.metadata.isStateBased) return 'state';
    if (node.metadata.isClass) return 'class';
    return 'unknown';
  }
  
  private getNodeColor(node: DependencyNode): string {
    if (node.metadata.isInterface) return 'blue';
    if (node.metadata.isInheritanceBased) return 'green';
    if (node.metadata.isStateBased) return 'orange';
    if (node.metadata.isClass) return 'purple';
    return 'black';
  }
  
  private getNodeShape(node: DependencyNode): string {
    if (node.metadata.isInterface) return 'ellipse';
    if (node.metadata.isInheritanceBased) return 'diamond';
    if (node.metadata.isStateBased) return 'hexagon';
    return 'box';
  }
  
  private getMermaidNodeClass(node: DependencyNode, isHighlighted: boolean): string {
    if (isHighlighted) return 'highlighted';
    if (node.metadata.isInterface) return 'interface';
    if (node.metadata.isInheritanceBased) return 'inheritance';
    if (node.metadata.isStateBased) return 'state';
    return 'class';
  }
  
  private sanitizeMermaidId(token: string): string {
    return token.replace(/[^a-zA-Z0-9_]/g, '_');
  }
  
  private calculateDepth(graph: DependencyGraph, token: string): number {
    const visited = new Set<string>();
    
    const dfs = (current: string): number => {
      if (visited.has(current)) return 0;
      visited.add(current);
      
      const deps = graph.dependencies.get(current) || [];
      if (deps.length === 0) return 0;
      
      let maxDepth = 0;
      for (const dep of deps) {
        maxDepth = Math.max(maxDepth, dfs(dep) + 1);
      }
      
      return maxDepth;
    };
    
    return dfs(token);
  }
  
  private findIsolatedNodes(graph: DependencyGraph): string[] {
    const isolated: string[] = [];
    
    for (const [token, node] of graph.nodes.entries()) {
      if (node.dependencies.length === 0 && node.dependents.length === 0) {
        isolated.push(token);
      }
    }
    
    return isolated;
  }
}