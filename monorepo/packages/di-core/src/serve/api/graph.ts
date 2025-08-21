// Graph API handlers for TDI2 serve module

import { Request, Response } from 'express';
import { DIAnalytics } from '../../analytics/index.js';
import type { ServerOptions, GraphResponse, GraphNode, GraphEdge, FilterOptions } from '../types.js';

export function createGraphHandler(analytics: DIAnalytics, options: ServerOptions) {
  // Cache for graph data
  let graphCache: { 
    data: GraphResponse; 
    timestamp: number; 
    srcPath: string 
  } | null = null;
  
  const CACHE_TTL = 30000; // 30 seconds

  async function loadDIConfig(srcPath: string = options.srcPath): Promise<any> {
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    
    const configPaths = [
      join(srcPath, '.tdi2', 'di-config.mjs'),
      join(srcPath, '.tdi2', 'di-config.cjs'), 
      join(srcPath, '.tdi2', 'di-config.js'),
      join(srcPath, '.tdi2', 'di-config.ts'),
      join(srcPath, 'di-config.mjs'),
      join(srcPath, 'di-config.cjs'),
      join(srcPath, 'di-config.js'),
      join(srcPath, 'di-config.ts')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          if (require.cache[configPath]) {
            delete require.cache[configPath];
          }
          const config = await import(configPath);
          return config.default || config;
        } catch (error) {
          console.warn(`⚠️ Failed to load config from ${configPath}:`, error);
        }
      }
    }
    return {};
  }

  async function generateEnhancedGraph(diConfig: any, forceReload: boolean = false): Promise<GraphResponse> {
    const now = Date.now();
    
    if (!forceReload && graphCache && 
        (now - graphCache.timestamp < CACHE_TTL) &&
        graphCache.srcPath === options.srcPath) {
      return graphCache.data;
    }

    // Get analysis data for issue detection
    const analysis = analytics.analyzeConfiguration(diConfig);
    const dependencyGraph = analytics.getDependencyGraph(diConfig);
    const validation = analytics.validate(diConfig);

    // Build enhanced graph with interfaces, classes, and dependencies
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const processedNodes = new Set<string>();

    // Helper function to determine node color based on issues
    function getNodeColor(nodeId: string, issues: any[]): string {
      const nodeIssues = issues.filter(issue => 
        issue.location?.service === nodeId || issue.message?.includes(nodeId)
      );
      
      if (nodeIssues.some(issue => issue.type === 'error')) return '#ff4d4d'; // Red for errors
      if (nodeIssues.some(issue => issue.type === 'warning')) return '#ffa500'; // Orange for warnings
      return '#4CAF50'; // Green for healthy
    }

    // Helper function to get node size based on connection count
    function getNodeSize(nodeId: string): number {
      const connections = (dependencyGraph.dependencies[nodeId]?.length || 0) + 
                         (dependencyGraph.dependents[nodeId]?.length || 0);
      return Math.max(20, Math.min(60, 20 + connections * 3));
    }

    // Process all services from the dependency graph
    Object.keys(dependencyGraph.nodes).forEach(serviceId => {
      if (processedNodes.has(serviceId)) return;
      
      const service = dependencyGraph.nodes[serviceId];
      const allIssues = [...(validation.issues.errors || []), ...(validation.issues.warnings || [])];
      
      // Determine node type based on naming patterns and metadata
      let nodeType: GraphNode['type'] = 'service';
      if (serviceId.includes('Interface') || serviceId.endsWith('Interface')) {
        nodeType = 'interface';
      } else if (serviceId.includes('Component') || serviceId.endsWith('Component')) {
        nodeType = 'component';
      } else if (serviceId.includes('Service') || serviceId.endsWith('Service')) {
        nodeType = 'service';
      } else if (service?.type === 'class') {
        nodeType = 'class';
      }

      const node: GraphNode = {
        id: serviceId,
        label: serviceId.replace(/Interface$/, '').replace(/Service$/, ''),
        type: nodeType,
        metadata: {
          dependencies: dependencyGraph.dependencies[serviceId] || [],
          dependents: dependencyGraph.dependents[serviceId] || [],
          issues: allIssues.filter(issue => 
            issue.location?.service === serviceId || issue.message?.includes(serviceId)
          ),
          scope: service?.scope || 'singleton',
          filePath: service?.filePath,
          lifecycle: service?.lifecycle || []
        },
        color: getNodeColor(serviceId, allIssues),
        size: getNodeSize(serviceId)
      };

      nodes.push(node);
      processedNodes.add(serviceId);
    });

    // Create edges for dependencies
    Object.entries(dependencyGraph.dependencies).forEach(([sourceId, deps]) => {
      (deps as string[]).forEach(targetId => {
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        
        if (sourceNode && targetNode) {
          // Determine edge type based on node types
          let edgeType: GraphEdge['type'] = 'dependency';
          if (sourceNode.type === 'class' && targetNode.type === 'interface') {
            edgeType = 'implementation';
          } else if (targetNode.type === 'interface') {
            edgeType = 'injection';
          } else if (sourceNode.type === 'class' && targetNode.type === 'class') {
            edgeType = 'inheritance';
          }

          edges.push({
            source: sourceId,
            target: targetId,
            type: edgeType,
            optional: false, // Could be enhanced with actual optionality detection
            metadata: {
              strength: 1
            }
          });
        }
      });
    });

    // Generate layouts using existing GraphVisualizer
    const mermaidDiagram = analytics.visualizeGraph({
      format: 'mermaid',
      includeDetails: true,
      showProfiles: false
    }, diConfig);

    // Simple layout algorithms (could be enhanced with more sophisticated positioning)
    const hierarchicalLayout = generateHierarchicalLayout(nodes, edges);
    const forceLayout = generateForceLayout(nodes, edges);
    const circularLayout = generateCircularLayout(nodes);

    const graphResponse: GraphResponse = {
      nodes,
      edges,
      layouts: {
        hierarchical: hierarchicalLayout,
        force: forceLayout,
        circular: circularLayout
      },
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        analysisTimestamp: new Date().toISOString(),
        sourceInfo: {
          path: options.srcPath,
          configFiles: [] // Could be enhanced to list actual config files found
        }
      }
    };

    graphCache = {
      data: graphResponse,
      timestamp: now,
      srcPath: options.srcPath
    };

    return graphResponse;
  }

  // Simple hierarchical layout algorithm
  function generateHierarchicalLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const levels: { [nodeId: string]: number } = {};
    const positions: { [nodeId: string]: { x: number; y: number } } = {};
    
    // Assign levels based on dependency depth
    const visited = new Set<string>();
    const assignLevel = (nodeId: string, level: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      levels[nodeId] = Math.max(levels[nodeId] || 0, level);
      
      // Find dependencies and assign deeper levels
      edges.filter(e => e.source === nodeId).forEach(edge => {
        assignLevel(edge.target, level + 1);
      });
    };

    // Start with interfaces at the top
    nodes.filter(n => n.type === 'interface').forEach(node => assignLevel(node.id, 0));
    nodes.filter(n => n.type !== 'interface').forEach(node => assignLevel(node.id, 1));

    // Position nodes
    const levelWidth = 200;
    const nodeHeight = 100;
    const levelCounts: { [level: number]: number } = {};
    
    Object.entries(levels).forEach(([nodeId, level]) => {
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    const levelPositions: { [level: number]: number } = {};
    Object.entries(levels).forEach(([nodeId, level]) => {
      const positionInLevel = levelPositions[level] || 0;
      levelPositions[level] = positionInLevel + 1;
      
      positions[nodeId] = {
        x: level * levelWidth,
        y: positionInLevel * nodeHeight - (levelCounts[level] * nodeHeight / 2)
      };
    });

    return {
      nodes: Object.entries(positions).map(([id, pos]) => ({ id, ...pos })),
      bounds: { 
        width: Math.max(...Object.values(levels)) * levelWidth + 100,
        height: Math.max(...Object.values(levelCounts)) * nodeHeight + 100
      }
    };
  }

  // Simple force-directed layout (placeholder - would use D3 force simulation in real implementation)
  function generateForceLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const positions: { [nodeId: string]: { x: number; y: number } } = {};
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.min(200, 50 + nodes.length * 10);
      positions[node.id] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    });

    return {
      nodes: Object.entries(positions).map(([id, pos]) => ({ id, ...pos })),
      bounds: { width: 500, height: 500 }
    };
  }

  // Circular layout
  function generateCircularLayout(nodes: GraphNode[]) {
    const positions: { [nodeId: string]: { x: number; y: number } } = {};
    const radius = Math.max(150, nodes.length * 15);
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      positions[node.id] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    });

    return {
      nodes: Object.entries(positions).map(([id, pos]) => ({ id, ...pos })),
      bounds: { width: radius * 2 + 100, height: radius * 2 + 100 }
    };
  }

  return {
    async getGraph(req: Request, res: Response): Promise<void> {
      try {
        const forceReload = req.query.reload === 'true';
        const diConfig = await loadDIConfig();
        const graph = await generateEnhancedGraph(diConfig, forceReload);
        
        res.json(graph);
      } catch (error) {
        console.error('Graph generation error:', error);
        res.status(500).json({
          error: 'Graph generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },

    async getNodes(req: Request, res: Response): Promise<void> {
      try {
        const diConfig = await loadDIConfig();
        const graph = await generateEnhancedGraph(diConfig);
        res.json(graph.nodes);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get nodes',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },

    async getEdges(req: Request, res: Response): Promise<void> {
      try {
        const diConfig = await loadDIConfig();
        const graph = await generateEnhancedGraph(diConfig);
        res.json(graph.edges);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get edges',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },

    async filterGraph(req: Request, res: Response): Promise<void> {
      try {
        const filters: FilterOptions = req.body;
        const diConfig = await loadDIConfig();
        const fullGraph = await generateEnhancedGraph(diConfig);
        
        // Apply filters
        let filteredNodes = fullGraph.nodes;
        let filteredEdges = fullGraph.edges;

        // Filter by node types
        if (filters.nodeTypes && filters.nodeTypes.size > 0) {
          filteredNodes = filteredNodes.filter(node => 
            filters.nodeTypes.has(node.type)
          );
          const nodeIds = new Set(filteredNodes.map(n => n.id));
          filteredEdges = filteredEdges.filter(edge =>
            nodeIds.has(edge.source) && nodeIds.has(edge.target)
          );
        }

        // Filter by search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filteredNodes = filteredNodes.filter(node =>
            node.label.toLowerCase().includes(query) ||
            node.id.toLowerCase().includes(query)
          );
          const nodeIds = new Set(filteredNodes.map(n => n.id));
          filteredEdges = filteredEdges.filter(edge =>
            nodeIds.has(edge.source) && nodeIds.has(edge.target)
          );
        }

        // Filter by issue level
        if (filters.issueLevel && filters.issueLevel !== 'all') {
          filteredNodes = filteredNodes.filter(node =>
            node.metadata.issues?.some(issue => issue.type === filters.issueLevel)
          );
        }

        res.json({
          ...fullGraph,
          nodes: filteredNodes,
          edges: filteredEdges,
          metadata: {
            ...fullGraph.metadata,
            filteredNodes: filteredNodes.length,
            filteredEdges: filteredEdges.length,
            appliedFilters: filters
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Graph filtering failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },

    async getLayout(req: Request, res: Response): Promise<void> {
      try {
        const { type } = req.params;
        const diConfig = await loadDIConfig();
        const graph = await generateEnhancedGraph(diConfig);
        
        const layout = graph.layouts[type as keyof typeof graph.layouts];
        if (!layout) {
          return res.status(400).json({
            error: 'Invalid layout type',
            availableTypes: Object.keys(graph.layouts)
          });
        }
        
        res.json(layout);
      } catch (error) {
        res.status(500).json({
          error: 'Layout generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };
}