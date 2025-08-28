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

  // Reuse the exact same config loading logic from CLI
  async function loadDIConfig(srcPath: string = options.srcPath): Promise<Record<string, any>> {
    const { join, resolve } = await import('path');
    const { existsSync } = await import('fs');
    
    const configPaths = [
      join(srcPath, ".tdi2", "di-config.mjs"),
      join(srcPath, ".tdi2", "di-config.cjs"),
      join(srcPath, ".tdi2", "di-config.js"),
      join(srcPath, ".tdi2", "di-config.ts"),
      join(srcPath, "di-config.mjs"),
      join(srcPath, "di-config.cjs"),
      join(srcPath, "di-config.js"),
      join(srcPath, "di-config.ts"),
    ];

    const { pathToFileURL } = await import("node:url");

    for (const configPath of configPaths) {
      const fullPath = resolve(configPath);
      if (!existsSync(fullPath)) continue;

      const isTS = fullPath.endsWith(".ts");
      if (isTS) {
        try {
          // Registers ts-node only if available; no hard dependency
          await import("ts-node/register/transpile-only");
        } catch {
          console.warn(
            `⚠️  TypeScript config detected but 'ts-node' is not available: ${configPath}`
          );
          console.warn(
            "   Install 'ts-node' to load TypeScript configs, or provide a JS config."
          );
          continue;
        }
      }

      try {
        const mod = await import(pathToFileURL(fullPath).href);

        const di =
          mod?.DI_CONFIG ?? mod?.default ?? mod?.diConfig ?? mod?.config ?? null;

        if (di && typeof di === "object") {
          if (options.verbose) {
            console.log(`📄 Loaded DI config from ${configPath}`);
          }
          return di as Record<string, any>;
        } else {
          console.warn(
            `⚠️  No DI config export found in ${configPath}. Expected 'DI_CONFIG' or default export.`
          );
          continue;
        }
      } catch (err: any) {
        console.warn(
          `⚠️  Failed to import DI config at ${configPath}: ${err?.message || err}`
        );
        continue;
      }
    }

    console.warn("⚠️  No DI configuration found. Using empty configuration.");
    if (options.verbose) {
      console.warn("   BasePath: ", resolve(srcPath));
      console.warn("   Expected locations:");
      configPaths.forEach((p) => console.warn(`   • ${p}`));
    }
    return {};
  }

  async function generateEnhancedGraph(diConfig: any, forceReload: boolean = false, serverOptions: ServerOptions = options): Promise<GraphResponse> {
    const now = Date.now();
    
    if (!forceReload && graphCache && 
        (now - graphCache.timestamp < CACHE_TTL) &&
        graphCache.srcPath === options.srcPath) {
      return graphCache.data;
    }

    // Get analysis data for issue detection
    const analysis = analytics.analyzeConfiguration(diConfig);
    const dependencyGraph = analysis.graph; // Use the graph from analysis
    const validation = analysis.validation; // Use validation from analysis
    
    // Get additional validation details for enhanced issue reporting
    const fullValidation = analytics.validate(diConfig, 'all');

    // Build enhanced graph with interfaces, classes, and dependencies
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const processedNodes = new Set<string>();

    // Helper function to determine node color based on issues
    function getNodeColor(nodeId: string, allIssues: any[]): string {
      const nodeIssues = allIssues.filter(issue => 
        issue.location?.service === nodeId || 
        issue.token === nodeId ||
        issue.message?.includes(nodeId) ||
        issue.relatedTokens?.includes(nodeId)
      );
      
      if (nodeIssues.some(issue => issue.severity === 'error' || issue.type === 'error')) return '#F44336'; // Red for errors
      if (nodeIssues.some(issue => issue.severity === 'warning' || issue.type === 'warning')) return '#FF9800'; // Orange for warnings
      return '#4CAF50'; // Green for healthy
    }

    // Helper function to get node size based on connection count
    function getNodeSize(nodeId: string): number {
      const dependencies = dependencyGraph.dependencies.get(nodeId) || [];
      const dependents = dependencyGraph.dependents.get(nodeId) || [];
      const connections = dependencies.length + dependents.length;
      return Math.max(20, Math.min(60, 20 + connections * 3));
    }

    // Process all services from the dependency graph
    Array.from(dependencyGraph.nodes.keys()).forEach(serviceId => {
      if (processedNodes.has(serviceId)) return;
      
      const service = dependencyGraph.nodes.get(serviceId);
      const allIssues = [
        ...(validation.issues.errors || []), 
        ...(validation.issues.warnings || []),
        ...(fullValidation.issues.errors || []),
        ...(fullValidation.issues.warnings || [])
      ];
      
      // Determine node type based on naming patterns and metadata
      let nodeType: GraphNode['type'] = 'service';
      if (serviceId.includes('Interface') || serviceId.endsWith('Interface')) {
        nodeType = 'interface';
      } else if (serviceId.includes('Component') || serviceId.endsWith('Component')) {
        nodeType = 'component';
      } else if (serviceId.includes('Service') || serviceId.endsWith('Service')) {
        nodeType = 'service';
      } else if (service?.metadata?.isClass) {
        nodeType = 'class';
      }

      // Get service config to extract implementationClass for cleaner labels
      const serviceConfig = diConfig[serviceId];
      const cleanLabel = serviceConfig?.implementationClass

      const node: GraphNode = {
        id: serviceId,
        label: cleanLabel,
        type: nodeType,
        metadata: {
          dependencies: dependencyGraph.dependencies.get(serviceId) || [],
          dependents: dependencyGraph.dependents.get(serviceId) || [],
          issues: allIssues.filter(issue => 
            issue.location?.service === serviceId || 
            issue.token === serviceId ||
            issue.message?.includes(serviceId) ||
            issue.relatedTokens?.includes(serviceId)
          ).map(issue => ({
            type: issue.severity || issue.type || 'info',
            code: issue.code || 'UNKNOWN',
            message: issue.message || issue.toString(),
            suggestion: issue.suggestion
          })),
          scope: service?.scope || 'singleton',
          filePath: service?.filePath || undefined,
          lifecycle: service?.lifecycle || [],
          // Add detailed service information for tooltips
          fullToken: serviceId, // The full implementationClassPath token
          implementationClass: serviceConfig?.implementationClass,
          implementationClassPath: serviceConfig?.implementationClassPath,
          interfaceName: serviceConfig?.interfaceName,
          registrationType: serviceConfig?.registrationType
        },
        color: getNodeColor(serviceId, allIssues),
        size: getNodeSize(serviceId)
      };

      nodes.push(node);
      processedNodes.add(serviceId);
    });

    // Create edges for dependencies
    Array.from(dependencyGraph.dependencies.entries()).forEach(([sourceId, deps]) => {
      deps.forEach(targetId => {
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        
        if (sourceNode && targetNode) {
          // Determine edge type based on node types
          let edgeType: GraphEdge['type'] = 'dependency';
          if (targetNode.type === 'interface') {
            edgeType = 'injection'; // Service depends on interface
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

    // Add interface-implementation relationships using the existing GraphVisualizer logic
    const interfaceNodes = new Set<string>();
    const classNodes = new Set<string>();

    // Collect interfaces and classes based on metadata
    for (const [token, node] of dependencyGraph.nodes.entries()) {
      if (node.metadata?.isInterface) interfaceNodes.add(token);
      else if (node.metadata?.isClass || (!node.metadata?.isInheritanceBased && !node.metadata?.isInterface)) {
        classNodes.add(token);
      }
    }

    // Build mapping: interface -> implementations using the same logic as GraphVisualizer
    const implsByInterface = new Map<string, Set<string>>();
    for (const intf of interfaceNodes) implsByInterface.set(intf, new Set<string>());

    // Method 1: Explicit metadata - class node lists interfaces it implements
    for (const [token, node] of dependencyGraph.nodes.entries()) {
      if (!(node.metadata?.isClass)) continue;
      const interfaces = Array.isArray(node.metadata?.interfaces) ? node.metadata.interfaces : [];
      for (const intfName of interfaces) {
        if (interfaceNodes.has(intfName)) {
          implsByInterface.get(intfName)!.add(token);
        }
      }
    }

    // Method 2: Explicit metadata - interface node lists implementations
    for (const [token, node] of dependencyGraph.nodes.entries()) {
      if (!(node.metadata?.isInterface)) continue;
      const implementations = Array.isArray(node.metadata?.implementations) ? node.metadata.implementations : [];
      for (const impl of implementations) {
        if (dependencyGraph.nodes.has(impl) && dependencyGraph.nodes.get(impl)?.metadata?.isClass) {
          implsByInterface.get(token)!.add(impl);
        }
      }
    }

    // Method 3: Conventional - interface.implementationClass points to a class token
    for (const intf of interfaceNodes) {
      const iNode = dependencyGraph.nodes.get(intf);
      const impl = iNode?.implementationClass;
      if (impl && impl !== intf && dependencyGraph.nodes.get(impl)?.metadata?.isClass) {
        implsByInterface.get(intf)!.add(impl);
      }
    }

    // Method 4: Enhanced heuristic fallback using better pattern matching
    for (const intf of interfaceNodes) {
      if (implsByInterface.get(intf)!.size > 0) continue; // Skip if we already have implementations
      
      const interfaceBaseName = intf.replace(/Interface$/,'');
      
      // Look for exact matches and common patterns
      for (const className of classNodes) {
        const implementsInterface = (
          // Exact base match: LoggerInterface -> ConsoleLogger, MemoryLogger, etc.
          className.includes(interfaceBaseName) ||
          // Service pattern: ExampleApiInterface -> ExampleApiService, ExampleApiServiceImpl
          className === `${interfaceBaseName}Service` ||
          className === `${interfaceBaseName}ServiceImpl` ||
          className === `${interfaceBaseName}Impl` ||
          // Specific known mappings
          (intf === 'LoggerInterface' && (className === 'ConsoleLogger' || className === 'ConsoleLoggerService')) ||
          (intf === 'LoggerService' && (className === 'ConsoleLogger' || className === 'ConsoleLoggerService')) ||
          (intf === 'CacheInterface' && className === 'MemoryCache') ||
          (intf === 'ExampleApiInterface' && (className === 'ExampleApiService' || className === 'UserApiServiceImpl' || className === 'MockUserApiService'))
        );
        
        if (implementsInterface) {
          implsByInterface.get(intf)!.add(className);
        }
      }
    }

    // Create implementation edges
    for (const [interfaceName, implementations] of implsByInterface.entries()) {
      for (const implName of implementations) {
        // Ensure both nodes exist in our filtered graph
        const interfaceNode = nodes.find(n => n.id === interfaceName);
        const implNode = nodes.find(n => n.id === implName);
        
        if (interfaceNode && implNode && 
            !edges.some(e => e.source === implName && e.target === interfaceName && e.type === 'implementation')) {
          edges.push({
            source: implName,
            target: interfaceName,
            type: 'implementation',
            optional: false,
            metadata: { strength: 2 }
          });
        }
      }
    }

    // Add potential/missing dependency relationships using existing analytics
    // Always generate potential relationships - UI will control visibility
      const problems = analytics.findProblematicServices(diConfig);
      
      // Get missing dependency issues from analysis validation (already computed above)
      const missingIssues = [
        ...(validation.issues?.errors || []),
        ...(validation.issues?.warnings || [])
      ].filter(issue => 
        issue.type === 'missing-service'
      );
      
      // Debug logging
      if (serverOptions.verbose) {
        console.log(`🔍 Found ${missingIssues.length} missing service issues for potential relationships`);
        missingIssues.forEach(issue => {
          console.log(`  - ${issue.token} (${issue.message})`);
        });
      }
      
      for (const issue of missingIssues) {
        // Use the existing relatedTokens if available, or extract from message
        const sourceService = issue.relatedTokens?.[0] || extractServiceFromMessage(issue.message || '');
        const missingToken = issue.token;
        
        if (sourceService && missingToken) {
          const sourceNode = nodes.find(n => n.id === sourceService);
          
          // Use existing analytics suggestion logic
          const suggestion = issue.suggestion || '';
          const suggestedTokens = extractSuggestedTokens(suggestion);
          
          for (const suggestedToken of suggestedTokens) {
            const targetNode = nodes.find(n => n.id === suggestedToken);
            
            if (sourceNode && targetNode && !edges.some(e => 
              e.source === sourceService && e.target === suggestedToken
            )) {
              edges.push({
                source: sourceService,
                target: suggestedToken,
                type: 'potential',
                optional: true,
                metadata: { 
                  strength: 0.3,
                  reason: `Potential match for missing '${missingToken}'`,
                  suggestion: suggestion || `Consider connecting ${sourceService} to ${suggestedToken}`
                }
              });
            }
          }
        }
      }

    function extractServiceFromMessage(message: string): string | null {
      const match = message?.match(/required by '([^']+)'/);
      return match ? match[1] : null;
    }

    function extractSuggestedTokens(suggestion: string): string[] {
      // Extract suggested tokens from suggestions like "💡 Did you mean: CacheInterface_T, MemoryCache?"
      const match = suggestion.match(/Did you mean:\s*([^?]+)/);
      if (match) {
        return match[1].split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    }

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
        const graph = await generateEnhancedGraph(diConfig, forceReload, options);
        
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
        const graph = await generateEnhancedGraph(diConfig, false, options);
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
        const graph = await generateEnhancedGraph(diConfig, false, options);
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
        const fullGraph = await generateEnhancedGraph(diConfig, false, options);
        
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
        const graph = await generateEnhancedGraph(diConfig, false, options);
        
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