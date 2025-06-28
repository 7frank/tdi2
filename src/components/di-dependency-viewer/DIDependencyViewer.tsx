// src/components/di-dependency-viewer/DIDependencyViewer.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FilterPanel } from './FilterPanel';
import { StatsPanel } from './StatsPanel';
import { ServiceNode } from './ServiceNode';
import { processDIConfig } from './diDataProcessor';
import type { DIDebugInfo, FilterState } from './types';

const nodeTypes = {
  service: ServiceNode,
};

interface DIDependencyViewerProps {
  diConfig: any; // The actual DI_CONFIG from the import
}

export default function DIDependencyViewer({ diConfig }: DIDependencyViewerProps) {
  const [diData, setDiData] = useState<DIDebugInfo | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    types: {
      interface: true,
      class: true,
      inheritance: true,
      state: true,
    },
    showOptional: true,
    showRequired: true,
    search: '',
    layout: 'hierarchical',
  });

  // Process DI config data
  useEffect(() => {
    const processData = () => {
      try {
        console.log('🔍 Processing DI config:', diConfig);
        const processedData = processDIConfig(diConfig);
        setDiData(processedData);
        console.log('✅ Processed DI data:', processedData);
      } catch (error) {
        console.error('❌ Failed to process DI config:', error);
        setDiData({
          implementations: [],
          dependencies: [],
          validation: {
            isValid: false,
            missingImplementations: [],
            circularDependencies: [error.message],
          },
          configHash: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [diConfig]);

  // Generate layout positions
  const generateLayout = useCallback((layout: string, nodeCount: number) => {
    const positions = [];
    const centerX = 400;
    const centerY = 300;
    
    if (layout === 'hierarchical') {
      const levels = Math.ceil(Math.sqrt(nodeCount));
      const nodesPerLevel = Math.ceil(nodeCount / levels);
      
      for (let i = 0; i < nodeCount; i++) {
        const level = Math.floor(i / nodesPerLevel);
        const posInLevel = i % nodesPerLevel;
        const offsetX = (posInLevel - nodesPerLevel / 2) * 250;
        const offsetY = level * 150;
        
        positions.push({
          x: centerX + offsetX,
          y: centerY + offsetY,
        });
      }
    } else if (layout === 'circular') {
      const radius = Math.max(200, nodeCount * 30);
      
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * 2 * Math.PI;
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      }
    } else { // grid
      const cols = Math.ceil(Math.sqrt(nodeCount));
      
      for (let i = 0; i < nodeCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        positions.push({
          x: centerX + (col - cols / 2) * 300,
          y: centerY + row * 200,
        });
      }
    }
    
    return positions;
  }, []);

  // Process data and create nodes/edges
  useEffect(() => {
    if (!diData) return;

    // Filter implementations
    const filteredImplementations = diData.implementations.filter(([key, impl]) => {
      // Type filter
      const typeMatches = (
        (filters.types.interface && !impl.isClassBased && !impl.isInheritanceBased && !impl.isStateBased) ||
        (filters.types.class && impl.isClassBased) ||
        (filters.types.inheritance && impl.isInheritanceBased) ||
        (filters.types.state && impl.isStateBased)
      );
      
      // Search filter
      const searchMatches = !filters.search || 
        impl.implementationClass.toLowerCase().includes(filters.search.toLowerCase()) ||
        impl.interfaceName.toLowerCase().includes(filters.search.toLowerCase());
      
      return typeMatches && searchMatches;
    });

    // Create nodes
    const positions = generateLayout(filters.layout, filteredImplementations.length);
    const newNodes: Node[] = filteredImplementations.map(([key, impl], index) => ({
      id: impl.implementationClass,
      type: 'service',
      position: positions[index] || { x: 0, y: 0 },
      data: {
        ...impl,
        label: impl.implementationClass,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));

    // Create edges from dependencies
    const newEdges: Edge[] = [];
    const serviceToKey = new Map(filteredImplementations.map(([key, impl]) => [impl.implementationClass, key]));
    const keyToService = new Map(diData.implementations.map(([key, impl]) => [impl.sanitizedKey, impl.implementationClass]));

    diData.dependencies.forEach(([serviceClass, dependency]) => {
      if (!serviceToKey.has(serviceClass)) return;

      dependency.constructorParams.forEach((param) => {
        const targetService = keyToService.get(param.sanitizedKey);
        if (!targetService || !serviceToKey.has(targetService)) return;

        const shouldShow = (param.isOptional && filters.showOptional) || (!param.isOptional && filters.showRequired);
        if (!shouldShow) return;

        newEdges.push({
          id: `${serviceClass}-${param.sanitizedKey}`,
          source: targetService,
          target: serviceClass,
          type: 'smoothstep',
          style: {
            stroke: param.isOptional ? '#9CA3AF' : '#374151',
            strokeWidth: param.isOptional ? 1 : 2,
            strokeDasharray: param.isOptional ? '5,5' : undefined,
          },
          label: param.paramName,
          labelStyle: {
            fontSize: 10,
            fill: '#6B7280',
          },
          markerEnd: {
            type: 'arrowclosed',
            color: param.isOptional ? '#9CA3AF' : '#374151',
          },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [diData, filters, generateLayout, setNodes, setEdges]);

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
    <div className="w-full h-screen">
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
            if (node.data.isStateBased) return '#8B5CF6';
            if (node.data.isInheritanceBased) return '#06B6D4';
            if (node.data.isClassBased) return '#F59E0B';
            return '#10B981';
          }}
          pannable 
          zoomable 
        />
        
        <FilterPanel filters={filters} onFiltersChange={setFilters} />
        <StatsPanel data={diData} />
        
        <Panel position="bottom-center" className="bg-white px-3 py-1 rounded shadow text-xs">
          Config: {diData.configHash} | 
          Services: {nodes.length} | 
          Dependencies: {edges.length}
        </Panel>
      </ReactFlow>
    </div>
  );
}