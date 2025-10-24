// src/components/di-dependency-viewer/DIDependencyViewer.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  ConnectionLineType,
  Panel,
  useReactFlow,
  type Node,
  type Edge,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FilterPanel } from "./FilterPanel";
import { StatsPanel } from "./StatsPanel";
import { ServiceNode } from "./ServiceNode";
import { processDIConfig } from "./diDataProcessor";
import type { DIDebugInfo, FilterState } from "./types";

// Import ELK.js
import ELK from "elkjs/lib/elk.bundled.js";

const nodeTypes = {
  service: ServiceNode,
};

interface DIDependencyViewerProps {
  diConfig: any; // The actual DI_CONFIG from the import
}

function DIDependencyViewerComponent({ diConfig }: DIDependencyViewerProps) {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();
  const [diData, setDiData] = useState<DIDebugInfo | null>(null);
  const [nodes, setNodesState, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    types: {
      interface: true,
      class: true,
      inheritance: true,
    },
    showOptional: true,
    showRequired: true,
    search: "",
    layout: "hierarchical",
  });

  const elk = useMemo(() => new ELK(), []);

  // ELK layout options for different layouts
  const getLayoutOptions = useCallback((layout: string) => {
    const baseOptions = {
      "elk.spacing.nodeNode": 80,
      "elk.layered.spacing.nodeNodeBetweenLayers": 150,
    };

    switch (layout) {
      case "tree":
        return {
          ...baseOptions,
          "elk.algorithm": "layered",
          "elk.direction": "DOWN",
          "elk.layered.spacing.nodeNodeBetweenLayers": 200,
        };
      case "hierarchical":
        return {
          ...baseOptions,
          "elk.algorithm": "layered",
          "elk.direction": "RIGHT",
        };
      case "circular":
        return {
          ...baseOptions,
          "elk.algorithm": "org.eclipse.elk.radial",
        };
      case "force":
        return {
          ...baseOptions,
          "elk.algorithm": "org.eclipse.elk.force",
        };
      case "grid":
        return {
          ...baseOptions,
          "elk.algorithm": "org.eclipse.elk.box",
          "elk.box.packingMode": "SIMPLE",
        };
      default:
        return {
          ...baseOptions,
          "elk.algorithm": "layered",
          "elk.direction": "DOWN",
        };
    }
  }, []);

  // Apply ELK layout
  const applyLayout = useCallback(
    async (layoutType: string) => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();

      if (currentNodes.length === 0) return;

      const layoutOptions = getLayoutOptions(layoutType);

      const graph = {
        id: "root",
        layoutOptions,
        children: currentNodes.map((node) => ({
          ...node,
          // ELK needs width and height - use defaults if not measured
          width: node.measured?.width || 250,
          height: node.measured?.height || 100,
        })),
        edges: currentEdges,
      };

      try {
        const layoutedGraph = await elk.layout(graph);

        // Update node positions
        const layoutedNodes = layoutedGraph.children.map((node: any) => ({
          ...node,
          position: { x: node.x, y: node.y },
        }));

        setNodes(layoutedNodes);

        // Fit view after a short delay to ensure layout is applied
        setTimeout(() => fitView(), 100);
      } catch (error) {
        console.error("ELK layout failed:", error);
      }
    },
    [elk, getNodes, getEdges, setNodes, fitView, getLayoutOptions]
  );

  // Process DI config data
  useEffect(() => {
    const processData = () => {
      try {
        console.log("🔍 Processing DI config:", diConfig);
        const processedData = processDIConfig(diConfig);
        setDiData(processedData);
        console.log("✅ Processed DI data:", processedData);
      } catch (error) {
        console.error("❌ Failed to process DI config:", error);
        setDiData({
          implementations: [],
          dependencies: [],
          validation: {
            isValid: false,
            missingImplementations: [],
            circularDependencies: [error.message],
          },
          configHash: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [diConfig]);

  // Process data and create nodes/edges
  useEffect(() => {
    if (!diData) return;

    console.log("🔍 Creating nodes and edges from data:", diData);

    // Filter implementations - remove duplicates by implementation class
    const uniqueImplementations = new Map<string, [string, any]>();

    diData.implementations.forEach(([key, impl]) => {
      // Use implementation class as unique key, prefer interface-based registrations
      const existingEntry = uniqueImplementations.get(impl.implementationClass);

      if (
        !existingEntry ||
        (!impl.isClassBased && existingEntry[1].isClassBased)
      ) {
        uniqueImplementations.set(impl.implementationClass, [key, impl]);
      }
    });

    const filteredImplementations = Array.from(
      uniqueImplementations.values()
    ).filter(([key, impl]) => {
      // Type filter
      const typeMatches =
        (filters.types.interface &&
          !impl.isClassBased &&
          !impl.isInheritanceBased) ||
        (filters.types.class && impl.isClassBased) ||
        (filters.types.inheritance && impl.isInheritanceBased);

      // Search filter
      const searchMatches =
        !filters.search ||
        impl.implementationClass
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        impl.interfaceName.toLowerCase().includes(filters.search.toLowerCase());

      return typeMatches && searchMatches;
    });

    console.log("🔍 Filtered implementations:", filteredImplementations.length);

    // Create nodes with initial positions (ELK will reposition them)
    const newNodes: Node[] = filteredImplementations.map(
      ([key, impl], index) => ({
        id: impl.implementationClass,
        type: "service",
        position: { x: index * 100, y: index * 100 }, // Temporary positions
        data: {
          ...impl,
          label: impl.implementationClass,
        },
      })
    );

    console.log("🔍 Created nodes:", newNodes.length);

    // Create edges from dependencies
    const newEdges: Edge[] = [];
    const visibleServices = new Set(
      filteredImplementations.map(([, impl]) => impl.implementationClass)
    );

    // Create comprehensive mapping from dependency token to implementation class
    const tokenToService = new Map<string, string>();

    // First pass: direct mappings
    diData.implementations.forEach(([token, impl]) => {
      tokenToService.set(token, impl.implementationClass);

      // Also map the sanitized key if different
      if (impl.sanitizedKey !== token) {
        tokenToService.set(impl.sanitizedKey, impl.implementationClass);
      }

      // Map the interface name to the implementation
      if (
        impl.interfaceName !== token &&
        impl.interfaceName !== impl.implementationClass
      ) {
        tokenToService.set(impl.interfaceName, impl.implementationClass);
      }
    });

    console.log(
      "🔍 Token to service mapping entries:",
      Array.from(tokenToService.entries()).slice(0, 10)
    );

    diData.dependencies.forEach(([serviceClass, dependency]) => {
      // Only show edges for visible services
      if (!visibleServices.has(serviceClass)) {
        return;
      }

      console.log(
        `🔗 Processing dependencies for ${serviceClass}:`,
        dependency.interfaceDependencies
      );

      dependency.constructorParams.forEach((param, paramIndex) => {
        // Try multiple strategies to find the target service
        let targetService = tokenToService.get(param.sanitizedKey);

        if (!targetService) {
          // Try the interface type
          targetService = tokenToService.get(param.interfaceType);
        }

        if (!targetService) {
          // Try looking for a partial match for sanitized keys
          for (const [token, service] of tokenToService.entries()) {
            if (
              token.includes(param.sanitizedKey) ||
              param.sanitizedKey.includes(token)
            ) {
              targetService = service;
              console.log(
                `🔍 Found partial match: ${param.sanitizedKey} -> ${token} -> ${service}`
              );
              break;
            }
          }
        }

        if (!targetService) {
          console.warn(
            `⚠️  No service found for dependency token: ${param.sanitizedKey} (interface: ${param.interfaceType})`
          );
          return;
        }

        if (!visibleServices.has(targetService)) {
          console.log(
            `🔍 Target service ${targetService} not visible, skipping edge`
          );
          return;
        }

        const shouldShow =
          (param.isOptional && filters.showOptional) ||
          (!param.isOptional && filters.showRequired);
        if (!shouldShow) {
          return;
        }

        const edgeId = `${targetService}-${serviceClass}-${paramIndex}`;

        const edge: Edge = {
          id: edgeId,
          source: targetService,
          target: serviceClass,
          type: "smoothstep",
          style: {
            stroke: param.isOptional ? "#9CA3AF" : "#374151",
            strokeWidth: param.isOptional ? 1 : 2,
            strokeDasharray: param.isOptional ? "5,5" : undefined,
          },
          label: param.paramName,
          labelStyle: {
            fontSize: 10,
            fill: "#6B7280",
          },
          markerEnd: {
            type: "arrowclosed",
            color: param.isOptional ? "#9CA3AF" : "#374151",
          },
        };

        newEdges.push(edge);
        console.log(
          `✅ Created edge: ${targetService} -> ${serviceClass} (${param.paramName})`
        );
      });
    });

    console.log("🔍 Created edges:", newEdges.length);

    setNodesState(newNodes);
    setEdges(newEdges);

    // Apply layout after nodes are set
    setTimeout(() => {
      applyLayout(filters.layout);
    }, 100);
  }, [
    diData,
    filters.types,
    filters.search,
    filters.showOptional,
    filters.showRequired,
    setNodesState,
    setEdges,
  ]);

  // Apply layout when layout type changes
  useEffect(() => {
    if (nodes.length > 0) {
      applyLayout(filters.layout);
    }
  }, [filters.layout, applyLayout, nodes.length]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg">Loading DI dependency tree...</div>
      </div>
    );
  }

  if (!diData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load DI data</div>
      </div>
    );
  }

  return (
    <div style={{ height: 1200, width: 1600 }}>
      <FilterPanel filters={filters} onFiltersChange={setFilters} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isInheritanceBased) return "#06B6D4";
            if (node.data.isClassBased) return "#F59E0B";
            return "#10B981";
          }}
          pannable
          zoomable
        />

        <StatsPanel data={diData} />

        <Panel
          position="bottom-center"
          className="bg-white px-3 py-1 rounded shadow text-xs"
        >
          Config: {diData.configHash} | Services: {nodes.length} | Dependencies:{" "}
          {edges.length}
        </Panel>

        <Panel position="bottom-right" className="bg-white p-2 rounded shadow">
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFilters((f) => ({ ...f, layout: "tree" }))}
              className="px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
            >
              Tree ⬇️
            </button>
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, layout: "hierarchical" }))
              }
              className="px-2 py-1 bg-green-100 rounded hover:bg-green-200"
            >
              Horizontal ➡️
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, layout: "circular" }))}
              className="px-2 py-1 bg-purple-100 rounded hover:bg-purple-200"
            >
              Radial 🌐
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, layout: "force" }))}
              className="px-2 py-1 bg-red-100 rounded hover:bg-red-200"
            >
              Force ⚡
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function DIDependencyViewer(props: DIDependencyViewerProps) {
  return (
    <ReactFlowProvider>
      <DIDependencyViewerComponent {...props} />
    </ReactFlowProvider>
  );
}
