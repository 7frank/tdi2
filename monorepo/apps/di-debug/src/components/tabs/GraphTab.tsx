import { useEffect } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { GraphServiceInterface } from '../../services/interfaces/GraphServiceInterface';
import { GraphControls } from '../graph/GraphControls';
import { GraphVisualization } from '../graph/GraphVisualization';

interface GraphTabProps {
  graphService: Inject<GraphServiceInterface>;
}

export function GraphTab({ graphService }: GraphTabProps) {
  const { isLoading } = graphService.state;

  useEffect(() => {
    graphService.loadGraph();
  }, []);

  return (
    <div id="graph" className="tab-content">
      <GraphControls />
      
      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading graph data...</p>
        </div>
      ) : (
        <div className="graph-container">
          <GraphVisualization />
        </div>
      )}
    </div>
  );
}