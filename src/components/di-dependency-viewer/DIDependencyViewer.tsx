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
    } else if (layout === 'tree') {
      // Simple tree layout: spread nodes vertically with minimal horizontal spacing
      const spacing = 180;
      const startY = 100;
      
      for (let i = 0; i < nodeCount; i++) {
        positions.push({
          x: centerX,
          y: startY + i * spacing,
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

    console.log('🔍 Creating nodes and edges from data:', diData);

    // Filter implementations - remove duplicates by implementation class
    const uniqueImplementations = new Map<string, [string, InterfaceImplementation]>();
    
    diData.implementations.forEach(([key, impl]) => {
      // Use implementation class as unique key, prefer interface-based registrations
      const existingEntry = uniqueImplementations.get(impl.implementationClass);
      
      if (!existingEntry || (!impl.isClassBased && existingEntry[1].isClassBased)) {
        uniqueImplementations.set(impl.implementationClass, [key, impl]);
      }
    });

    const filteredImplementations = Array.from(uniqueImplementations.values()).filter(([key, impl]) => {
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

    console.log('🔍 Filtered implementations:', filteredImplementations.length);

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
    }));

    console.log('🔍 Created nodes:', newNodes.length);

    // Create edges from dependencies
    const newEdges: Edge[] = [];
    const visibleServices = new Set(filteredImplementations.map(([, impl]) => impl.implementationClass));
    
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
      if (impl.interfaceName !== token && impl.interfaceName !== impl.implementationClass) {
        tokenToService.set(impl.interfaceName, impl.implementationClass);
      }
    });

    console.log('🔍 Token to service mapping entries:', Array.from(tokenToService.entries()).slice(0, 10));

    diData.dependencies.forEach(([serviceClass, dependency]) => {
      // Only show edges for visible services
      if (!visibleServices.has(serviceClass)) {
        return;
      }

      console.log(`🔗 Processing dependencies for ${serviceClass}:`, dependency.interfaceDependencies);

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
            if (token.includes(param.sanitizedKey) || param.sanitizedKey.includes(token)) {
              targetService = service;
              console.log(`🔍 Found partial match: ${param.sanitizedKey} -> ${token} -> ${service}`);
              break;
            }
          }
        }
        
        if (!targetService) {
          console.warn(`⚠️  No service found for dependency token: ${param.sanitizedKey} (interface: ${param.interfaceType})`);
          console.log(`🔍 Available tokens:`, Array.from(tokenToService.keys()).filter(k => k.toLowerCase().includes(param.sanitizedKey.toLowerCase().split('_')[0])));
          return;
        }

        if (!visibleServices.has(targetService)) {
          console.log(`🔍 Target service ${targetService} not visible, skipping edge`);
          return;
        }

        const shouldShow = (param.isOptional && filters.showOptional) || (!param.isOptional && filters.showRequired);
        if (!shouldShow) {
          return;
        }

        const edgeId = `${targetService}-${serviceClass}-${paramIndex}`;
        
        const edge: Edge = {
          id: edgeId,
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
        };

        newEdges.push(edge);
        console.log(`✅ Created edge: ${targetService} -> ${serviceClass} (${param.paramName})`);
      });
    });

    console.log('🔍 Created edges:', newEdges.length);

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
    <div className="w-full h-screen" style = {{height:968,width: 1200}}>
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