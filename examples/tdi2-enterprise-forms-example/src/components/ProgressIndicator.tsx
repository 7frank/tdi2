import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { FormDAGServiceInterface } from '../services/FormDAGServiceInterface';

interface ProgressIndicatorProps {
  completedNodes: string[];
  availableNodes: string[];
  currentNodes: string[];
  onNodeSelect: (nodeId: string) => void;
  dagService?: Inject<FormDAGServiceInterface>;
}

interface NodeDisplay {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'available' | 'blocked';
  dependencies: string[];
  position: { x: number; y: number };
}

export function ProgressIndicator({
  completedNodes,
  availableNodes,
  currentNodes,
  onNodeSelect,
  dagService
}: ProgressIndicatorProps) {
  
  // Calculate optimal layout for DAG visualization
  const calculateNodeLayout = (): NodeDisplay[] => {
    const nodeDisplays: NodeDisplay[] = [
      {
        id: 'demographics',
        label: 'Demographics',
        status: getNodeStatus('demographics'),
        dependencies: [],
        position: { x: 50, y: 10 }
      },
      {
        id: 'insurance_primary',
        label: 'Primary Insurance',
        status: getNodeStatus('insurance_primary'),
        dependencies: ['demographics'],
        position: { x: 20, y: 30 }
      },
      {
        id: 'guardian_insurance',
        label: 'Guardian Insurance',
        status: getNodeStatus('guardian_insurance'),
        dependencies: ['demographics'],
        position: { x: 80, y: 30 }
      },
      {
        id: 'medical_history',
        label: 'Medical History',
        status: getNodeStatus('medical_history'),
        dependencies: ['demographics'],
        position: { x: 50, y: 45 }
      },
      {
        id: 'specialist_referral',
        label: 'Specialist Referral',
        status: getNodeStatus('specialist_referral'),
        dependencies: ['medical_history', 'insurance_primary'],
        position: { x: 20, y: 65 }
      },
      {
        id: 'prior_authorization',
        label: 'Prior Authorization',
        status: getNodeStatus('prior_authorization'),
        dependencies: ['specialist_referral'],
        position: { x: 20, y: 80 }
      },
      {
        id: 'emergency_contacts',
        label: 'Emergency Contacts',
        status: getNodeStatus('emergency_contacts'),
        dependencies: ['demographics'],
        position: { x: 80, y: 55 }
      },
      {
        id: 'hipaa_consent',
        label: 'HIPAA Consent',
        status: getNodeStatus('hipaa_consent'),
        dependencies: ['demographics', 'insurance_primary', 'medical_history'],
        position: { x: 50, y: 85 }
      },
      {
        id: 'financial_responsibility',
        label: 'Financial Agreement',
        status: getNodeStatus('financial_responsibility'),
        dependencies: ['insurance_primary', 'specialist_referral'],
        position: { x: 80, y: 75 }
      }
    ];

    return nodeDisplays;
  };

  const getNodeStatus = (nodeId: string): 'completed' | 'current' | 'available' | 'blocked' => {
    if (completedNodes.includes(nodeId)) return 'completed';
    if (currentNodes.includes(nodeId)) return 'current';
    if (availableNodes.includes(nodeId)) return 'available';
    return 'blocked';
  };

  const handleNodeClick = (node: NodeDisplay) => {
    if (node.status === 'available' || node.status === 'current' || node.status === 'completed') {
      onNodeSelect(node.id);
    }
  };

  const renderDependencyLines = (nodes: NodeDisplay[]) => {
    const lines: JSX.Element[] = [];
    
    nodes.forEach(node => {
      node.dependencies.forEach(depId => {
        const depNode = nodes.find(n => n.id === depId);
        if (depNode) {
          const lineId = `line-${depId}-${node.id}`;
          lines.push(
            <line
              key={lineId}
              x1={`${depNode.position.x}%`}
              y1={`${depNode.position.y}%`}
              x2={`${node.position.x}%`}
              y2={`${node.position.y}%`}
              stroke="#ccc"
              strokeWidth="2"
              strokeDasharray={node.status === 'blocked' ? '5,5' : 'none'}
              className={`dependency-line ${node.status}`}
            />
          );
        }
      });
    });
    
    return lines;
  };

  const nodes = calculateNodeLayout();
  const completionPercentage = Math.round((completedNodes.length / nodes.length) * 100);

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <h3>Registration Progress</h3>
        <div className="progress-stats">
          <span className="completion-percentage">{completionPercentage}% Complete</span>
          <span className="node-counts">
            {completedNodes.length} of {nodes.length} sections completed
          </span>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="dag-visualization">
        <svg viewBox="0 0 100 100" className="dag-svg">
          {/* Dependency lines */}
          {renderDependencyLines(nodes)}
          
          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id} className={`dag-node ${node.status}`}>
              <circle
                cx={`${node.position.x}%`}
                cy={`${node.position.y}%`}
                r="3"
                className={`node-circle ${node.status}`}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: node.status !== 'blocked' ? 'pointer' : 'not-allowed' }}
              />
              <text
                x={`${node.position.x}%`}
                y={`${node.position.y + 8}%`}
                textAnchor="middle"
                className={`node-label ${node.status}`}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: node.status !== 'blocked' ? 'pointer' : 'not-allowed' }}
              >
                {node.label}
              </text>
              
              {/* Status indicator */}
              {node.status === 'completed' && (
                <text
                  x={`${node.position.x}%`}
                  y={`${node.position.y + 1}%`}
                  textAnchor="middle"
                  className="status-icon completed"
                  fontSize="2"
                >
                  ✓
                </text>
              )}
              
              {node.status === 'current' && (
                <circle
                  cx={`${node.position.x}%`}
                  cy={`${node.position.y}%`}
                  r="4"
                  fill="none"
                  stroke="#007bff"
                  strokeWidth="1"
                  className="current-indicator"
                >
                  <animate
                    attributeName="r"
                    values="3;5;3"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-icon completed">●</span>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon current">●</span>
          <span>Current</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon available">●</span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon blocked">●</span>
          <span>Blocked</span>
        </div>
      </div>

      {dagService && (
        <div className="quick-actions">
          <button
            onClick={() => {
              const optimalPath = dagService.calculateOptimalPath();
              if (optimalPath.length > 0) {
                onNodeSelect(optimalPath[0]);
              }
            }}
            className="action-button optimal"
            disabled={availableNodes.length === 0}
          >
            📍 Go to Optimal Next
          </button>
          
          <button
            onClick={() => {
              const availableCount = availableNodes.filter(id => !currentNodes.includes(id)).length;
              if (availableCount > 0) {
                // Open all available sections for parallel completion
                availableNodes.forEach(nodeId => {
                  if (!currentNodes.includes(nodeId)) {
                    onNodeSelect(nodeId);
                  }
                });
              }
            }}
            className="action-button parallel"
            disabled={availableNodes.filter(id => !currentNodes.includes(id)).length === 0}
          >
            ⚡ Open All Available
          </button>
        </div>
      )}
    </div>
  );
}