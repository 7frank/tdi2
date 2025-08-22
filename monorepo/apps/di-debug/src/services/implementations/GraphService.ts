import { Service, Inject } from '@tdi2/di-core/decorators';
import type { 
  GraphServiceInterface, 
  GraphData, 
  FilterOptions,
  GraphNode,
  GraphEdge 
} from '../interfaces/GraphServiceInterface';
import type { NotificationServiceInterface } from '../interfaces/NotificationServiceInterface';

@Service()
export class GraphService implements GraphServiceInterface {
  state = {
    graphData: { nodes: [], edges: [] } as GraphData,
    filteredData: { nodes: [], edges: [] } as GraphData,
    filters: {
      nodeTypes: new Set(['interface', 'class', 'service', 'component']),
      showIssuesOnly: false,
      showPotential: true,
    } as FilterOptions,
    selectedNodes: new Set<string>(),
    layout: 'force' as const,
    searchTerm: '',
    isLoading: true,
    error: null as string | null,
  };

  constructor(
    @Inject() private notificationService: NotificationServiceInterface
  ) {}

  async loadGraph(): Promise<void> {
    console.log('[GraphService] loadGraph called, current nodes:', this.state.graphData.nodes.length);
    if (this.state.graphData.nodes.length > 0) {
      console.log('[GraphService] Already loaded, skipping');
      return; // Already loaded
    }

    console.log('[GraphService] Starting graph load...');
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/graph');
      if (!response.ok) {
        throw new Error(`Failed to load graph: ${response.statusText}`);
      }

      const graphData = await response.json();
      console.log('[GraphService] Received data:', graphData);
      console.log('[GraphService] Nodes count:', graphData.nodes?.length);
      this.state.graphData = graphData;
      this.applyFilters();
      console.log('[GraphService] Applied filters, filteredData:', this.state.filteredData);
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to load dependency graph');
    } finally {
      this.state.isLoading = false;
    }
  }

  async reloadGraph(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/graph?reload=true');
      if (!response.ok) {
        throw new Error(`Failed to reload graph: ${response.statusText}`);
      }

      const graphData = await response.json();
      this.state.graphData = graphData;
      this.applyFilters();
      this.notificationService.showSuccess('Graph reloaded successfully');
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to reload graph');
    } finally {
      this.state.isLoading = false;
    }
  }

  updateFilters(filters: Partial<FilterOptions>): void {
    if (filters.nodeTypes) {
      this.state.filters.nodeTypes = filters.nodeTypes;
    }
    if (filters.showIssuesOnly !== undefined) {
      this.state.filters.showIssuesOnly = filters.showIssuesOnly;
    }
    if (filters.showPotential !== undefined) {
      this.state.filters.showPotential = filters.showPotential;
    }
    this.applyFilters();
  }

  setLayout(layout: 'force' | 'hierarchical' | 'circular'): void {
    this.state.layout = layout;
  }

  selectNode(nodeId: string): void {
    if (this.state.selectedNodes.has(nodeId)) {
      this.state.selectedNodes.delete(nodeId);
    } else {
      this.state.selectedNodes.add(nodeId);
    }
    // Create new Set to trigger reactivity
    this.state.selectedNodes = new Set(this.state.selectedNodes);
  }

  clearSelection(): void {
    this.state.selectedNodes.clear();
    this.state.selectedNodes = new Set();
  }

  searchNodes(term: string): void {
    this.state.searchTerm = term;
    this.applyFilters();
  }

  clearSearch(): void {
    this.state.searchTerm = '';
    this.applyFilters();
  }

  exportGraph(): void {
    if (this.state.graphData.nodes.length === 0) {
      this.notificationService.showWarning('No graph data to export');
      return;
    }

    try {
      const dataStr = JSON.stringify(this.state.filteredData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `tdi2-graph-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      this.notificationService.showSuccess('Graph exported successfully');
    } catch (error) {
      this.notificationService.showError('Failed to export graph');
    }
  }

  private applyFilters(): void {
    let filteredNodes = this.state.graphData.nodes.filter(node => {
      // Filter by node type
      if (!this.state.filters.nodeTypes.has(node.type)) {
        return false;
      }

      // Filter by issues
      if (this.state.filters.showIssuesOnly && node.metadata.issues.length === 0) {
        return false;
      }

      // Filter by search term
      if (this.state.searchTerm) {
        const searchLower = this.state.searchTerm.toLowerCase();
        if (!node.label.toLowerCase().includes(searchLower) &&
            !node.id.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    let filteredEdges = this.state.graphData.edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      // Both nodes must be in filtered set
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
        return false;
      }

      // Filter potential edges
      if (edge.type === 'potential' && !this.state.filters.showPotential) {
        return false;
      }

      return true;
    });

    this.state.filteredData = {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }
}