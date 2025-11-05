import { useEffect, useRef } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { GraphServiceInterface } from '../../services/interfaces/GraphServiceInterface';
import { GraphVisualizationEngine } from '../../utils/graphVisualization';

interface GraphVisualizationProps {
  graphService: Inject<GraphServiceInterface>;
}

export function GraphVisualization({ graphService }: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GraphVisualizationEngine | null>(null);
  const { filteredData, layout, selectedNodes } = graphService.state;

  useEffect(() => {
    if (!containerRef.current) return;

    // Create unique ID for this container
    const containerId = `graph-viz-${Date.now()}`;
    containerRef.current.id = containerId;

    // Initialize visualization engine
    engineRef.current = new GraphVisualizationEngine(containerId);
    
    // Set node click handler
    engineRef.current.setNodeClickHandler((nodeId) => {
      graphService.selectNode(nodeId);
    });

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Update data when filteredData changes
  useEffect(() => {
    if (engineRef.current && filteredData) {
      engineRef.current.setData(filteredData);
    }
  }, [filteredData]);

  // Update layout when layout changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setLayout(layout);
    }
  }, [layout]);

  // Update selected nodes when selection changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedNodes(selectedNodes);
    }
  }, [selectedNodes]);

  return (
    <div 
      ref={containerRef}
      className="graph-visualization"
      style={{
        width: '100%',
        height: '600px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: 'white'
      }}
    />
  );
}