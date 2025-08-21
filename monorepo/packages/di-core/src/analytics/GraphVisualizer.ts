// Graph visualization supporting ASCII, JSON, DOT, and Mermaid formats

import type { 
  DependencyGraph, 
  DependencyNode, 
  GraphVisualizationOptions 
} from './types';

export class GraphVisualizer {
   private static _class="klass"
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
 * Mermaid diagram grouped by interface with its implementing classes.
 * - One subgraph per interface: implementations stacked above the interface (direction BT).
 * - Classes without an interface go to an “Ungrouped Classes” column.
 * - Grouping uses explicit metadata first, then interface.implementationClass, then name heuristics.
 * - Left→Right columns to avoid horizontal sprawl.
 */
private generateMermaidDiagram(graph: DependencyGraph, options: GraphVisualizationOptions): string {
  const { highlight = [], nodeTypes } = options;

  type Key = string; // interface token

  // Collect interfaces and classes (based on metadata)
  const interfaces = new Set<Key>();
  const classes = new Set<string>();

  for (const [token, node] of graph.nodes.entries()) {
    if (!this.shouldIncludeNode(node, nodeTypes)) continue;
    if (node.metadata?.isInterface) interfaces.add(token);
    else if (node.metadata?.isClass || (!node.metadata?.isInheritanceBased && !node.metadata?.isStateBased && !node.metadata?.isInterface)) {
      classes.add(token);
    }
  }

  // Build mapping: interface -> implementations
  const implsByInterface = new Map<Key, Set<string>>();
  for (const intf of interfaces) implsByInterface.set(intf, new Set<string>());

  // 1) Explicit: class node lists interfaces it implements
  for (const [token, node] of graph.nodes.entries()) {
    if (!this.shouldIncludeNode(node, nodeTypes)) continue;
    if (!(node.metadata?.isClass)) continue;
    const list: string[] = Array.isArray(node.metadata?.interfaces) ? node.metadata.interfaces : [];
    for (const i of list) {
      if (interfaces.has(i)) implsByInterface.get(i)!.add(token);
    }
  }

  // 2) Explicit: interface node lists implementations
  for (const [token, node] of graph.nodes.entries()) {
    if (!this.shouldIncludeNode(node, nodeTypes)) continue;
    if (!(node.metadata?.isInterface)) continue;
    const list: string[] = Array.isArray(node.metadata?.implementations) ? node.metadata.implementations : [];
    for (const impl of list) {
      if (graph.nodes.has(impl) && (graph.nodes.get(impl)!.metadata?.isClass)) {
        implsByInterface.get(token)!.add(impl);
      }
    }
  }

  // 3) Conventional: interface.implementationClass points to a class token
  for (const intf of interfaces) {
    const iNode = graph.nodes.get(intf)!;
    const impl = iNode.implementationClass;
    if (impl && impl !== intf && graph.nodes.get(impl)?.metadata?.isClass) {
      implsByInterface.get(intf)!.add(impl);
    }
  }

  // 4) Heuristic fallback by name (only supplements if nothing explicit for that interface)
  for (const intf of interfaces) {
    if (implsByInterface.get(intf)!.size) continue;
    const base = intf.replace(/Interface$/,'');
    for (const c of classes) {
      if (c === base || c === `${base}Impl` || c === `${base}Service`) {
        implsByInterface.get(intf)!.add(c);
      }
    }
  }

  // Assign each class to a single interface group (tie-breaker: alphabetical interface name)
  const assignedClassToInterface = new Map<string, string>();
  for (const [intf, impls] of implsByInterface.entries()) {
    for (const c of impls) {
      if (!assignedClassToInterface.has(c)) {
        assignedClassToInterface.set(c, intf);
      } else {
        const current = assignedClassToInterface.get(c)!;
        const chosen = [current, intf].sort((a, b) => a.localeCompare(b))[0];
        assignedClassToInterface.set(c, chosen);
      }
    }
  }

  // Ungrouped classes = those not assigned to any interface
  const ungrouped: string[] = [];
  for (const c of classes) if (!assignedClassToInterface.has(c)) ungrouped.push(c);

  // Helpers
  const mkLabel = (token: string, impl: string) =>
    `${token.replace(/"/g, '&quot;')}<br/>${impl.replace(/"/g, '&quot;')}`;

  const lines: string[] = [];
  let linkIndex = 0; // global link index for linkStyle

  // Init + direction
  lines.push('%%{init: { "flowchart": { "ranker": "tight-tree", "nodeSpacing": 22, "rankSpacing": 70 } }}%%');
  lines.push('flowchart LR');
  lines.push('');

  // Styles
  lines.push('  classDef interface fill:#e1f5fe;');
  lines.push(`  classDef ${GraphVisualizer._class} fill:#f3e5f5;`);
  lines.push('  classDef inheritance fill:#e8f5e8;');
  lines.push('  classDef state fill:#fff3e0;');
  lines.push('  classDef highlighted fill:#ffebee,stroke:#d32f2f,stroke-width:2px;');
  lines.push('  classDef missing fill:#ffebee,stroke:#d32f2f,stroke-dasharray: 5 5;');
  lines.push('  classDef invisible stroke-width:0px,fill-opacity:0,stroke-opacity:0;');
  lines.push('');

  // Emit all nodes once with labels and classes
  for (const [token, node] of graph.nodes.entries()) {
    if (!this.shouldIncludeNode(node, nodeTypes)) continue;
    const nodeId = this.sanitizeMermaidId(token);
    const isHighlighted = highlight.includes(token);
    const nodeClass = this.getMermaidNodeClass(node, isHighlighted);
    const label = mkLabel(token, node.implementationClass);
    lines.push(`  ${nodeId}["${label}"]:::${nodeClass}`);
  }
  lines.push('');

  // Build columns: one per interface group (implementations stacked above interface with BT)
  const anchorIds: string[] = [];
  const sortedInterfaces = Array.from(interfaces).sort((a, b) => a.localeCompare(b));

  for (const intf of sortedInterfaces) {
    if (!this.shouldIncludeNode(graph.nodes.get(intf), nodeTypes)) continue;

    const colId = `col_${this.sanitizeMermaidId(intf)}`;
    const anchorId = `${colId}_anchor`;
    anchorIds.push(anchorId);

    lines.push(`  subgraph ${colId}["${intf} · group"]`);
    lines.push('    direction BT');
    lines.push(`    ${anchorId}[" "]:::invisible`);

    // Place interface first so with BT it ends up at the bottom
    const intfId = this.sanitizeMermaidId(intf);
    lines.push(`    ${intfId}`);

    const impls = Array.from(implsByInterface.get(intf) ?? [])
      .filter(c => assignedClassToInterface.get(c) === intf)
      .sort((a, b) => a.localeCompare(b));

    for (const c of impls) lines.push(`    ${this.sanitizeMermaidId(c)}`);

    lines.push('  end');
    lines.push('');
  }

  // Ungrouped column (if any)
  if (ungrouped.length > 0) {
    const colId = 'col_ungrouped';
    const anchorId = `${colId}_anchor`;
    anchorIds.push(anchorId);

    lines.push(`  subgraph ${colId}["Ungrouped Classes"]`);
    lines.push('    direction BT');
    lines.push(`    ${anchorId}[" "]:::invisible`);
    ungrouped.sort((a, b) => a.localeCompare(b));
    for (const c of ungrouped) lines.push(`    ${this.sanitizeMermaidId(c)}`);
    lines.push('  end');
    lines.push('');
  }

  // Anchor chain to enforce left→right ordering; then hide the anchor links
  for (let i = 0; i < anchorIds.length - 1; i++) {
    lines.push(`  ${anchorIds[i]} --- ${anchorIds[i + 1]}`);
    lines.push(`  linkStyle ${linkIndex} stroke-width:0px,opacity:0`);
    linkIndex++;
  }
  lines.push('');

  // Real dependency edges
  for (const [from, deps] of graph.dependencies.entries()) {
    if (!this.shouldIncludeNode(graph.nodes.get(from), nodeTypes)) continue;
    const fromId = this.sanitizeMermaidId(from);
    for (const to of deps) {
      if (!this.shouldIncludeNode(graph.nodes.get(to), nodeTypes)) continue;
      const toId = this.sanitizeMermaidId(to);
      const toNode = graph.nodes.get(to);
      const arrow = toNode ? '-->' : '-.->'; // dashed for missing
      lines.push(`  ${fromId} ${arrow} ${toId}`);
      linkIndex++; // track global index even if we don’t style these
    }
  }

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
    return GraphVisualizer._class;
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