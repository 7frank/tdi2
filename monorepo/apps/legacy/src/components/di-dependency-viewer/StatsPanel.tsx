// src/components/di-dependency-viewer/StatsPanel.tsx
import React, { useMemo } from 'react';
import { Panel } from '@xyflow/react';
import type { DIDebugInfo } from './types';

interface StatsPanelProps {
  data: DIDebugInfo;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ data }) => {
  const stats = useMemo(() => {
    const implementationTypes = data.implementations.reduce((acc, [, impl]) => {
      if (impl.isStateBased) acc.state++;
      else if (impl.isInheritanceBased) acc.inheritance++;
      else if (impl.isClassBased) acc.class++;
      else acc.interface++;
      return acc;
    }, { interface: 0, class: 0, inheritance: 0, state: 0 });

    const totalDependencies = data.dependencies.reduce(
      (acc, [, dep]) => acc + dep.constructorParams.length,
      0
    );

    const optionalDeps = data.dependencies.reduce(
      (acc, [, dep]) => acc + dep.constructorParams.filter(p => p.isOptional).length,
      0
    );

    return {
      totalServices: data.implementations.length,
      totalDependencies,
      optionalDependencies: optionalDeps,
      requiredDependencies: totalDependencies - optionalDeps,
      ...implementationTypes,
      isValid: data.validation.isValid,
      circularCount: data.validation.circularDependencies.length,
      missingCount: data.validation.missingImplementations.length,
    };
  }, [data]);

  return (
    <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border min-w-[250px]">
      <h3 className="font-bold text-lg mb-3">📊 Statistics</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total Services:</span>
          <span className="font-semibold">{stats.totalServices}</span>
        </div>
        
        <hr className="my-2" />
        
        <div className="flex justify-between">
          <span>🔌 Interface-based:</span>
          <span style={{ color: '#10B981' }}>{stats.interface}</span>
        </div>
        <div className="flex justify-between">
          <span>📦 Class-based:</span>
          <span style={{ color: '#F59E0B' }}>{stats.class}</span>
        </div>
        <div className="flex justify-between">
          <span>🧬 Inheritance-based:</span>
          <span style={{ color: '#06B6D4' }}>{stats.inheritance}</span>
        </div>
        <div className="flex justify-between">
          <span>🎯 State-based:</span>
          <span style={{ color: '#8B5CF6' }}>{stats.state}</span>
        </div>
        
        <hr className="my-2" />
        
        <div className="flex justify-between">
          <span>Total Dependencies:</span>
          <span className="font-semibold">{stats.totalDependencies}</span>
        </div>
        <div className="flex justify-between">
          <span>Required:</span>
          <span className="text-red-600">{stats.requiredDependencies}</span>
        </div>
        <div className="flex justify-between">
          <span>Optional:</span>
          <span className="text-green-600">{stats.optionalDependencies}</span>
        </div>
        
        <hr className="my-2" />
        
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={stats.isValid ? 'text-green-600' : 'text-red-600'}>
            {stats.isValid ? '✅ Valid' : '❌ Invalid'}
          </span>
        </div>
        {stats.circularCount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Circular Deps:</span>
            <span>{stats.circularCount}</span>
          </div>
        )}
        {stats.missingCount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Missing Impls:</span>
            <span>{stats.missingCount}</span>
          </div>
        )}
      </div>
    </Panel>
  );
};