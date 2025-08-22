import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphEdge } from '../services/interfaces/GraphServiceInterface';

export class GraphVisualizationEngine {
  private containerId: string;
  private container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g: d3.Selection<SVGGElement, unknown, null, undefined>;
  private simulation: d3.Simulation<GraphNode, GraphEdge> | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private width: number = 0;
  private height: number = 600;
  private data: GraphData | null = null;
  private currentLayout: 'force' | 'hierarchical' | 'circular' = 'force';
  private selectedNodes: Set<string> = new Set();
  private onNodeClick?: (nodeId: string) => void;

  // Visual elements
  private linkElements: d3.Selection<SVGLineElement, GraphEdge, SVGGElement, unknown> | null = null;
  private nodeElements: d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown> | null = null;
  private labelElements: d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown> | null = null;

  constructor(containerId: string) {
    this.containerId = containerId;
    console.log('[GraphViz] Initializing with container:', containerId);
    this.container = d3.select(`#${containerId}`);
    console.log('[GraphViz] Container selected:', this.container.size());
    this.initialize();
  }

  private initialize() {
    // Clear container
    this.container.selectAll('*').remove();
    
    // Create SVG
    this.svg = this.container
      .append('svg')
      .attr('class', 'dependency-graph')
      .style('width', '100%')
      .style('height', '600px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '8px')
      .style('background', 'white');
    
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

    // Add arrow markers
    this.svg.append('defs').selectAll('marker')
      .data(['dependency', 'implementation', 'injection', 'inheritance', 'potential', 'error'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', d => {
        switch (d) {
          case 'implementation': return 'M0,-5L10,0L0,5L3,0Z';
          case 'injection': return 'M0,-5L10,0L0,5';
          case 'inheritance': return 'M0,-5L10,0L0,5L2,0Z';
          case 'potential': return 'M0,-3L7,0L0,3';
          default: return 'M0,-5L10,0L0,5';
        }
      })
      .attr('fill', d => this.getMarkerColor(d));

    this.updateDimensions();
    window.addEventListener('resize', () => this.updateDimensions());
  }

  private updateDimensions() {
    const rect = this.container.node()?.getBoundingClientRect();
    if (rect) {
      this.width = rect.width;
      this.height = Math.max(600, rect.height);
      this.svg.attr('width', this.width).attr('height', this.height);
    }
  }

  setData(data: GraphData) {
    console.log('[GraphViz] Setting data:', data);
    console.log('[GraphViz] Nodes count:', data?.nodes?.length);
    console.log('[GraphViz] Edges count:', data?.edges?.length);
    this.data = data;
    this.render();
  }

  setLayout(layout: 'force' | 'hierarchical' | 'circular') {
    this.currentLayout = layout;
    this.render();
  }

  setSelectedNodes(selectedNodes: Set<string>) {
    this.selectedNodes = selectedNodes;
    this.updateNodeSelection();
  }

  setNodeClickHandler(handler: (nodeId: string) => void) {
    this.onNodeClick = handler;
  }

  private render() {
    console.log('[GraphViz] Render called, data:', this.data);
    if (!this.data) {
      console.log('[GraphViz] No data, skipping render');
      return;
    }

    const { nodes, edges } = this.data;
    console.log('[GraphViz] Rendering with nodes:', nodes.length, 'edges:', edges.length);

    // Stop existing simulation
    if (this.simulation) {
      this.simulation.stop();
    }

    // Clear existing elements
    this.g.selectAll('*').remove();

    // Create groups
    const linkGroup = this.g.append('g').attr('class', 'links');
    const nodeGroup = this.g.append('g').attr('class', 'nodes');
    const labelGroup = this.g.append('g').attr('class', 'labels');

    // Create links
    this.linkElements = linkGroup
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', d => this.getEdgeColor(d))
      .attr('stroke-width', d => this.getEdgeWidth(d))
      .attr('stroke-dasharray', d => this.getEdgeDashArray(d))
      .attr('marker-end', d => `url(#arrow-${this.getEdgeMarkerType(d)})`)
      .style('opacity', d => d.type === 'potential' ? 0.5 : 0.7)
      .on('mouseover', (event, d) => this.showEdgeTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    // Create nodes
    this.nodeElements = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', d => this.getNodeRadius(d))
      .attr('fill', d => this.getNodeColor(d))
      .attr('stroke', d => this.getNodeStroke(d))
      .attr('stroke-width', d => this.getNodeStrokeWidth(d))
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
      .text(d => d.label)
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

  private applyLayout(nodes: GraphNode[], edges: GraphEdge[]) {
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

  private applyForceLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => (d as GraphNode).id)
        .distance(80)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(d => this.getNodeRadius(d as GraphNode) + 5));

    this.simulation.on('tick', () => this.updatePositions());
  }

  private applyHierarchicalLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const levels: { [key: number]: GraphNode[] } = {};
    const visited = new Set<string>();
    
    const assignLevel = (node: GraphNode, level: number) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      
      edges.filter(e => {
        const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
        return sourceId === node.id;
      }).forEach(edge => {
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) assignLevel(targetNode, level + 1);
      });
    };

    // Start with interfaces
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

  private applyCircularLayout(nodes: GraphNode[]) {
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

  private updatePositions() {
    if (!this.linkElements || !this.nodeElements || !this.labelElements) return;

    this.linkElements
      .attr('x1', d => {
        const source = typeof d.source === 'object' ? d.source : null;
        return source?.x || 0;
      })
      .attr('y1', d => {
        const source = typeof d.source === 'object' ? d.source : null;
        return source?.y || 0;
      })
      .attr('x2', d => {
        const target = typeof d.target === 'object' ? d.target : null;
        return target?.x || 0;
      })
      .attr('y2', d => {
        const target = typeof d.target === 'object' ? d.target : null;
        return target?.y || 0;
      });

    this.nodeElements
      .attr('cx', d => d.x || 0)
      .attr('cy', d => d.y || 0);

    this.labelElements
      .attr('x', d => d.x || 0)
      .attr('y', d => (d.y || 0) + this.getNodeRadius(d) + 15);
  }

  private updateNodeSelection() {
    if (!this.nodeElements) return;
    
    this.nodeElements
      .attr('stroke', d => this.getNodeStroke(d))
      .attr('stroke-width', d => this.getNodeStrokeWidth(d));
  }

  // Visual property methods
  private getNodeRadius(node: GraphNode): number {
    const baseSize = node.size || 20;
    const issueMultiplier = node.metadata.issues.length > 0 ? 1.2 : 1;
    return Math.max(8, Math.min(30, baseSize * issueMultiplier));
  }

  private getNodeColor(node: GraphNode): string {
    if (node.metadata.issues.some(issue => issue.type === 'error')) {
      return '#F44336';
    }
    if (node.metadata.issues.some(issue => issue.type === 'warning')) {
      return '#FF9800';
    }
    
    switch (node.type) {
      case 'interface': return '#2196F3';
      case 'class': return '#9C27B0';
      case 'service': return '#4CAF50';
      case 'component': return '#FF5722';
      default: return '#607D8B';
    }
  }

  private getNodeStroke(node: GraphNode): string {
    if (this.selectedNodes.has(node.id)) return '#FFD700';
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
      case 'potential': return '#FFC107';
      case 'dependency': return '#666';
      default: return '#999';
    }
  }

  private getEdgeWidth(edge: GraphEdge): number {
    return Math.max(1, Math.min(4, (edge.metadata?.strength || 1) * 2));
  }

  private getEdgeMarkerType(edge: GraphEdge): string {
    return edge.type || 'dependency';
  }

  private getEdgeDashArray(edge: GraphEdge): string | null {
    if (edge.type === 'potential') return '3,3';
    if (edge.optional) return '5,5';
    return null;
  }

  private getMarkerColor(type: string): string {
    switch (type) {
      case 'implementation': return '#4CAF50';
      case 'injection': return '#2196F3';
      case 'inheritance': return '#FF9800';
      case 'potential': return '#FFC107';
      case 'error': return '#F44336';
      default: return '#666';
    }
  }

  // Event handlers
  private handleNodeClick(event: MouseEvent, node: GraphNode) {
    event.stopPropagation();
    if (this.onNodeClick) {
      this.onNodeClick(node.id);
    }
  }

  private showNodeTooltip(event: MouseEvent, node: GraphNode) {
    const html = `
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">
        ${node.label}
      </div>
      <div style="font-size: 11px; color: #ccc; margin-bottom: 8px;">
        ${node.type} • ${node.metadata.scope}
      </div>
      <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>Dependencies:</span>
        <span style="margin-left: 8px; font-weight: bold;">${node.metadata.dependencies.length}</span>
      </div>
      <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>Dependents:</span>
        <span style="margin-left: 8px; font-weight: bold;">${node.metadata.dependents.length}</span>
      </div>
      ${node.metadata.filePath ? `
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">File:</span>
          <div style="margin-top: 2px; font-size: 10px; color: #fff; word-break: break-all;">${node.metadata.filePath}</div>
        </div>
      ` : ''}
      ${node.metadata.issues.map(issue => `
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span style="color: ${issue.type === 'error' ? '#F44336' : '#FF9800'}">${issue.type.toUpperCase()}:</span>
          <span style="margin-left: 8px; font-weight: bold; font-size: 10px;">${issue.message}</span>
        </div>
      `).join('')}
    `;

    this.tooltip
      .html(html)
      .style('visibility', 'visible')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  private showEdgeTooltip(event: MouseEvent, edge: GraphEdge) {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    
    const html = `
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">
        ${sourceId} → ${targetId}
      </div>
      <div style="font-size: 11px; color: #ccc; margin-bottom: 8px;">
        ${edge.type} relationship
      </div>
      <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>Type:</span>
        <span style="margin-left: 8px; font-weight: bold;">${edge.type}</span>
      </div>
      <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>Optional:</span>
        <span style="margin-left: 8px; font-weight: bold;">${edge.optional ? 'Yes' : 'No'}</span>
      </div>
      ${edge.metadata?.reason ? `
        <div style="margin-bottom: 4px;">
          <span style="color: #FFC107;">Reason:</span>
          <div style="margin-top: 2px; font-size: 10px; color: #fff;">${edge.metadata.reason}</div>
        </div>
      ` : ''}
      ${edge.metadata?.suggestion ? `
        <div style="margin-bottom: 4px;">
          <span style="color: #4CAF50;">💡 Suggestion:</span>
          <div style="margin-top: 2px; font-size: 10px; color: #fff;">${edge.metadata.suggestion}</div>
        </div>
      ` : ''}
    `;

    this.tooltip
      .html(html)
      .style('visibility', 'visible')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  private hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  private createDragBehavior() {
    return d3.drag<SVGCircleElement, GraphNode>()
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

  resetView() {
    this.selectedNodes.clear();
    this.updateNodeSelection();
    
    if (this.nodeElements) {
      this.nodeElements.style('opacity', 1.0);
    }
    if (this.linkElements) {
      this.linkElements.style('opacity', 0.7);
    }
    
    // Reset zoom
    this.svg.transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
  }

  destroy() {
    if (this.simulation) {
      this.simulation.stop();
    }
    if (this.tooltip) {
      this.tooltip.remove();
    }
    window.removeEventListener('resize', () => this.updateDimensions());
  }
}