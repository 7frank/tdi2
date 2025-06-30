// src/components/di-dependency-viewer/ServiceNode.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ServiceNodeProps {
  data: {
    implementationClass: string;
    interfaceName: string;
    filePath: string;
    isGeneric: boolean;
    typeParameters?: string[];
    isClassBased?: boolean;
    isInheritanceBased?: boolean;
    isStateBased?: boolean;
    stateType?: string;
  };
}

export const ServiceNode: React.FC<ServiceNodeProps> = ({ data }) => {
  const getNodeColor = () => {
    if (data.isStateBased) return '#8B5CF6'; // Purple for state-based
    if (data.isInheritanceBased) return '#06B6D4'; // Cyan for inheritance-based
    if (data.isClassBased) return '#F59E0B'; // Amber for class-based
    return '#10B981'; // Emerald for interface-based
  };

  const getNodeIcon = () => {
    if (data.isStateBased) return '🎯';
    if (data.isInheritanceBased) return '🧬';
    if (data.isClassBased) return '📦';
    return '🔌';
  };

  return (
    <div
      className="px-4 py-2 shadow-lg rounded-lg border-2 min-w-[200px] relative"
      style={{
        backgroundColor: getNodeColor(),
        borderColor: getNodeColor(),
        color: 'white',
      }}
    >
      {/* Input handle (for incoming dependencies) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#fff',
          border: `2px solid ${getNodeColor()}`,
          width: 10,
          height: 10,
        }}
      />
      
      {/* Output handle (for outgoing dependencies) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#fff',
          border: `2px solid ${getNodeColor()}`,
          width: 10,
          height: 10,
        }}
      />

      <div className="flex items-center gap-2 mb-1">
        <span>{getNodeIcon()}</span>
        <div className="font-bold text-sm">{data.implementationClass}</div>
      </div>
      <div className="text-xs opacity-90 mb-1">
        implements: {data.interfaceName}
      </div>
      {data.isGeneric && (
        <div className="text-xs opacity-75">
          &lt;{data.typeParameters?.join(', ')}&gt;
        </div>
      )}
      {data.stateType && (
        <div className="text-xs opacity-75">
          state: {data.stateType}
        </div>
      )}
      <div className="text-xs opacity-60 mt-1">
        {data.filePath?.split('/').pop()}
      </div>
    </div>
  );
};