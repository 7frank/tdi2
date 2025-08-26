// D3.js Interactive Dependency Graph Visualization for TDI2
// TypeScript implementation with comprehensive node/edge visualization and issue highlighting

import * as d3 from 'd3';

// Type definitions
interface GraphNode {
  id: string;
  label: string;
  type: 'interface' | 'class' | 'service' | 'component';
  color: string;
  size: number;
  metadata: {
    dependencies: string[];
    dependents: string[];
    issues: Array<{
      type: 'error' | 'warning';
      code: string;
      message: string;
      suggestion?: string;
    }>;
    scope: string;
    filePath?: string;
    lifecycle: string[];
  };
  // D3 simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'dependency' | 'implementation' | 'injection' | 'inheritance';
  optional: boolean;
  metadata: {
    strength: number;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layouts: {
    hierarchical: any;
    force: any;
    circular: any;
  };
  metadata: {
    totalNodes: number;
    totalEdges: number;
    analysisTimestamp: string;
    sourceInfo: {
      path: string;
      configFiles: string[];
    };
  };
}

type LayoutType = 'force' | 'hierarchical' | 'circular';

interface TooltipData {
  title: string;
  subtitle: string;
  details: Array<{
    label: string;
    value: string;
    type?: 'success' | 'warning' | 'error' | 'info';
  }>;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Main visualization class
export class GraphVisualization {
  private container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g: d3.Selection<SVGGElement, unknown, null, undefined>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  
  private width: number = 0;
  private height: number = 0;
  private data: GraphData | null = null;
  private currentLayout: LayoutType = 'force';
  
  // D3 simulation
  private simulation: d3.Simulation<GraphNode, undefined> | null = null;
  
  // Visual elements
  private nodeElements: d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown> | null = null;
  private linkElements: d3.Selection<SVGLineElement, GraphEdge, SVGGElement, unknown> | null = null;
  private labelElements: d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown> | null = null;
  
  // State
  private selectedNodes: Set<string> = new Set();
  private filteredNodeTypes: Set<string> = new Set(['interface', 'class', 'service', 'component']);
  private showIssuesOnly: boolean = false;

  constructor(containerId: string) {
    this.container = d3.select(`#${containerId}`);
    this.initialize();
  }

  private initialize(): void {
    // Clear container
    this.container.selectAll('*').remove();
    
    // Create SVG
    this.svg = this.container
      .append('svg')
      .attr('class', 'dependency-graph')
      .style('width', '100%')
      .style('height', '100%')
      .style('border', '1px solid #ddd')
      .style('border-radius', '8px');
    
    // Create main group for zoom/pan
    this.g = this.svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });
    
    this.svg.call(zoom);
    
    // Create tooltip
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('font-size', '12px')
      .style('max-width', '300px')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
      .style('z-index', '1000')
      .style('pointer-events', 'none');

    // Add definitions for markers
    this.svg.append('defs').selectAll('marker')
      .data(['dependency', 'implementation', 'injection', 'inheritance', 'error'])
      .join('marker')
      .attr('id', (d) => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d) => {
        switch (d) {
          case 'dependency': return '#666';
          case 'implementation': return '#4CAF50';
          case 'injection': return '#2196F3';
          case 'inheritance': return '#FF9800';
          case 'error': return '#F44336';
          default: return '#666';
        }
      });

    this.updateDimensions();
    window.addEventListener('resize', () => this.updateDimensions());
  }

  private updateDimensions(): void {
    const rect = this.container.node()!.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.svg.attr('width', this.width).attr('height', this.height);
  }

  public setData(data: GraphData): void {
    this.data = data;
    this.render();
  }

  public setLayout(layout: LayoutType): void {
    this.currentLayout = layout;
    this.render();
  }

  public setFilters(nodeTypes: Set<string>, showIssuesOnly: boolean): void {
    this.filteredNodeTypes = nodeTypes;
    this.showIssuesOnly = showIssuesOnly;
    this.render();
  }

  private getFilteredData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    if (!this.data) return { nodes: [], edges: [] };

    let nodes = this.data.nodes.filter(node => 
      this.filteredNodeTypes.has(node.type) &&
      (!this.showIssuesOnly || node.metadata.issues.length > 0)
    );

    const nodeIds = new Set(nodes.map(n => n.id));
    let edges = this.data.edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes, edges };
  }

  private render(): void {
    if (!this.data) return;

    const { nodes, edges } = this.getFilteredData();

    // Stop existing simulation
    if (this.simulation) {
      this.simulation.stop();
    }

    // Clear existing elements
    this.g.selectAll('*').remove();

    // Create groups for different element types
    const linkGroup = this.g.append('g').attr('class', 'links');
    const nodeGroup = this.g.append('g').attr('class', 'nodes');
    const labelGroup = this.g.append('g').attr('class', 'labels');

    // Create links
    this.linkElements = linkGroup
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', (d) => this.getEdgeColor(d))
      .attr('stroke-width', (d) => this.getEdgeWidth(d))
      .attr('stroke-dasharray', (d) => d.optional ? '5,5' : null)
      .attr('marker-end', (d) => `url(#arrow-${this.getEdgeMarkerType(d)})`)
      .style('opacity', 0.7)
      .on('mouseover', (event, d) => this.showEdgeTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    // Create nodes
    this.nodeElements = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', (d) => this.getNodeRadius(d))
      .attr('fill', (d) => this.getNodeColor(d))
      .attr('stroke', (d) => this.getNodeStroke(d))
      .attr('stroke-width', (d) => this.getNodeStrokeWidth(d))
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showNodeTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (event, d) => this.handleNodeClick(event, d))
      .call(this.createDragBehavior());

    // Create labels
    this.labelElements = labelGroup
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('class', 'label')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Apply layout
    this.applyLayout(nodes, edges);
  }

  private applyLayout(nodes: GraphNode[], edges: GraphEdge[]): void {
    switch (this.currentLayout) {
      case 'force':
        this.applyForceLayout(nodes, edges);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(nodes, edges);
        break;
      case 'circular':
        this.applyCircularLayout(nodes);
        break;
    }
  }

  private applyForceLayout(nodes: GraphNode[], edges: GraphEdge[]): void {
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(edges)
        .id(d => d.id)
        .distance((d) => this.getLinkDistance(d))
        .strength(0.5))
      .force('charge', d3.forceManyBody<GraphNode>()
        .strength((d) => this.getChargeStrength(d)))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius((d) => this.getNodeRadius(d) + 5))
      .force('x', d3.forceX(this.width / 2).strength(0.1))
      .force('y', d3.forceY(this.height / 2).strength(0.1));

    this.simulation.on('tick', () => this.updatePositions());
  }

  private applyHierarchicalLayout(nodes: GraphNode[], edges: GraphEdge[]): void {
    // Create hierarchy based on dependencies
    const levels: { [level: number]: GraphNode[] } = {};
    const visited = new Set<string>();
    
    const assignLevel = (node: GraphNode, level: number): void => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      
      // Assign higher levels to dependencies
      const deps = edges.filter(e => 
        (typeof e.source === 'string' ? e.source : e.source.id) === node.id
      );
      deps.forEach(edge => {
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) assignLevel(targetNode, level + 1);
      });
    };

    // Start with interfaces at level 0
    nodes.filter(n => n.type === 'interface').forEach(node => assignLevel(node, 0));
    nodes.filter(n => n.type !== 'interface' && !visited.has(n.id))
      .forEach(node => assignLevel(node, 1));

    // Position nodes
    Object.entries(levels).forEach(([level, levelNodes]) => {
      const levelHeight = parseInt(level) * 120 + 100;
      const nodeWidth = this.width / (levelNodes.length + 1);
      
      levelNodes.forEach((node, index) => {
        node.fx = (index + 1) * nodeWidth;
        node.fy = levelHeight;
      });
    });

    this.updatePositions();
  }

  private applyCircularLayout(nodes: GraphNode[]): void {
    const radius = Math.min(this.width, this.height) / 3;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      node.fx = centerX + radius * Math.cos(angle);
      node.fy = centerY + radius * Math.sin(angle);
    });

    this.updatePositions();
  }

  private updatePositions(): void {
    if (!this.linkElements || !this.nodeElements || !this.labelElements) return;

    this.linkElements
      .attr('x1', (d) => {
        const source = typeof d.source === 'string' ? 
          this.data!.nodes.find(n => n.id === d.source) : d.source;
        return source?.x || 0;
      })
      .attr('y1', (d) => {
        const source = typeof d.source === 'string' ? 
          this.data!.nodes.find(n => n.id === d.source) : d.source;
        return source?.y || 0;
      })
      .attr('x2', (d) => {
        const target = typeof d.target === 'string' ? 
          this.data!.nodes.find(n => n.id === d.target) : d.target;
        return target?.x || 0;
      })
      .attr('y2', (d) => {
        const target = typeof d.target === 'string' ? 
          this.data!.nodes.find(n => n.id === d.target) : d.target;
        return target?.y || 0;
      });

    this.nodeElements
      .attr('cx', (d) => d.x || 0)
      .attr('cy', (d) => d.y || 0);

    this.labelElements
      .attr('x', (d) => d.x || 0)
      .attr('y', (d) => (d.y || 0) + this.getNodeRadius(d) + 15);
  }

  // Visual property methods
  private getNodeRadius(node: GraphNode): number {
    const baseSize = node.size || 20;
    const issueMultiplier = node.metadata.issues.length > 0 ? 1.2 : 1;
    return Math.max(8, Math.min(30, baseSize * issueMultiplier));
  }

  private getNodeColor(node: GraphNode): string {
    // Use the color from the backend if available (which includes issue-based coloring)
    if (node.color) {
      return node.color;
    }
    
    // Fallback: Check issues directly
    if (node.metadata.issues.some(issue => issue.type === 'error')) {
      return '#F44336'; // Red for errors
    }
    if (node.metadata.issues.some(issue => issue.type === 'warning')) {
      return '#FF9800'; // Orange for warnings
    }
    
    // Default colors by type
    switch (node.type) {
      case 'interface': return '#2196F3'; // Blue
      case 'class': return '#9C27B0'; // Purple
      case 'service': return '#4CAF50'; // Green
      case 'component': return '#FF5722'; // Deep Orange
      default: return '#607D8B'; // Blue Grey
    }
  }

  private getNodeStroke(node: GraphNode): string {
    if (this.selectedNodes.has(node.id)) return '#FFD700'; // Gold for selected
    if (node.metadata.issues.length > 0) return '#333';
    return '#fff';
  }

  private getNodeStrokeWidth(node: GraphNode): number {
    if (this.selectedNodes.has(node.id)) return 3;
    if (node.metadata.issues.length > 0) return 2;
    return 1;
  }

  private getEdgeColor(edge: GraphEdge): string {
    switch (edge.type) {
      case 'implementation': return '#4CAF50';
      case 'injection': return '#2196F3';
      case 'inheritance': return '#FF9800';
      case 'dependency': return '#666';
      default: return '#999';
    }
  }

  private getEdgeWidth(edge: GraphEdge): number {
    const baseWidth = edge.metadata.strength || 1;
    return Math.max(1, Math.min(4, baseWidth * 2));
  }

  private getEdgeMarkerType(edge: GraphEdge): string {
    return edge.type;
  }

  private getLinkDistance(edge: GraphEdge): number {
    switch (edge.type) {
      case 'implementation': return 60;
      case 'injection': return 80;
      case 'inheritance': return 100;
      default: return 80;
    }
  }

  private getChargeStrength(node: GraphNode): number {
    const baseStrength = -300;
    const typeMultiplier = node.type === 'interface' ? 1.5 : 1;
    const issueMultiplier = node.metadata.issues.length > 0 ? 1.2 : 1;
    return baseStrength * typeMultiplier * issueMultiplier;
  }

  // Event handlers
  private handleNodeClick(event: MouseEvent, node: GraphNode): void {
    event.stopPropagation();
    
    if (this.selectedNodes.has(node.id)) {
      this.selectedNodes.delete(node.id);
    } else {
      this.selectedNodes.add(node.id);
    }
    
    this.highlightConnected(node.id);
    this.render();
  }

  private highlightConnected(nodeId: string): void {
    if (!this.data) return;
    
    const connected = new Set([nodeId]);
    
    // Add direct dependencies and dependents
    this.data.edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      if (sourceId === nodeId) connected.add(targetId);
      if (targetId === nodeId) connected.add(sourceId);
    });
    
    // Update visual highlighting
    this.nodeElements?.style('opacity', (d) => 
      connected.has(d.id) ? 1.0 : 0.3
    );
    this.linkElements?.style('opacity', (d) => {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
      const targetId = typeof d.target === 'string' ? d.target : d.target.id;
      return (sourceId === nodeId || targetId === nodeId) ? 1.0 : 0.1;
    });
  }

  private showNodeTooltip(event: MouseEvent, node: GraphNode): void {
    const details: Array<{label: string, value: string, type?: 'error' | 'warning'}> = [
      { label: 'Dependencies', value: node.metadata.dependencies.length.toString() },
      { label: 'Dependents', value: node.metadata.dependents.length.toString() }
    ];

    // Add interface name if available
    if (node.metadata.interfaceName) {
      details.push({ label: 'Interface', value: node.metadata.interfaceName });
    }

    // Add implementation class if different from label
    if (node.metadata.implementationClass && node.metadata.implementationClass !== node.label) {
      details.push({ label: 'Implementation', value: node.metadata.implementationClass });
    }

    // Add file path
    if (node.metadata.filePath) {
      details.push({ label: 'File', value: node.metadata.filePath });
    }

    // Add full token for detailed info
    if (node.metadata.fullToken) {
      details.push({ label: 'Full Token', value: node.metadata.fullToken });
    }

    // Add issues
    if (node.metadata.issues && node.metadata.issues.length > 0) {
      details.push(...node.metadata.issues.map(issue => ({
        label: issue.type.toUpperCase(),
        value: issue.message,
        type: issue.type as 'error' | 'warning'
      })));
    }

    const tooltipData: TooltipData = {
      title: node.label,
      subtitle: `${node.type} • ${node.metadata.scope}${node.metadata.registrationType ? ` • ${node.metadata.registrationType}` : ''}`,
      details
    };

    this.showTooltip(event, tooltipData);
  }

  private showEdgeTooltip(event: MouseEvent, edge: GraphEdge): void {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    
    const tooltipData: TooltipData = {
      title: `${sourceId} → ${targetId}`,
      subtitle: `${edge.type} relationship`,
      details: [
        { label: 'Type', value: edge.type },
        { label: 'Optional', value: edge.optional ? 'Yes' : 'No' },
        { label: 'Strength', value: edge.metadata.strength.toString() }
      ]
    };

    this.showTooltip(event, tooltipData);
  }

  private showTooltip(event: MouseEvent, data: TooltipData): void {
    const html = `
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">
        ${data.title}
      </div>
      <div style="font-size: 11px; color: #ccc; margin-bottom: 8px;">
        ${data.subtitle}
      </div>
      ${data.details.map(detail => `
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span style="color: ${this.getDetailColor(detail.type)}">${detail.label}:</span>
          <span style="margin-left: 8px; font-weight: bold;">${detail.value}</span>
        </div>
      `).join('')}
    `;

    this.tooltip
      .html(html)
      .style('visibility', 'visible')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  private getDetailColor(type?: string): string {
    switch (type) {
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'success': return '#4CAF50';
      case 'info': return '#2196F3';
      default: return '#ccc';
    }
  }

  private hideTooltip(): void {
    this.tooltip.style('visibility', 'hidden');
  }

  private createDragBehavior(): d3.DragBehavior<Element, GraphNode, GraphNode> {
    return d3.drag<Element, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
      });
  }

  // Public API methods
  public exportSVG(): string {
    const svgNode = this.svg.node();
    if (!svgNode) return '';
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgNode);
  }

  public resetView(): void {
    this.selectedNodes.clear();
    this.nodeElements?.style('opacity', 1.0);
    this.linkElements?.style('opacity', 0.7);
    
    // Reset zoom
    this.svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
  }

  public focusOnNode(nodeId: string): void {
    const node = this.data?.nodes.find(n => n.id === nodeId);
    if (!node || !node.x || !node.y) return;

    const scale = 2;
    const translate = [
      this.width / 2 - scale * node.x,
      this.height / 2 - scale * node.y
    ];

    this.svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  }

  public destroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
    this.tooltip.remove();
    window.removeEventListener('resize', () => this.updateDimensions());
  }
}