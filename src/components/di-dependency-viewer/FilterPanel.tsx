// src/components/di-dependency-viewer/FilterPanel.tsx
import React from 'react';
import { Panel } from '@xyflow/react';
import type { FilterState } from './types';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange }) => {
  return (
    <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg border min-w-[300px]">
      <h3 className="font-bold text-lg mb-3">🔍 Filters</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Service Types:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'interface', label: '🔌 Interface-based', color: '#10B981' },
              { key: 'class', label: '📦 Class-based', color: '#F59E0B' },
              { key: 'inheritance', label: '🧬 Inheritance-based', color: '#06B6D4' },
              { key: 'state', label: '🎯 State-based', color: '#8B5CF6' },
            ].map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={filters.types[key as keyof typeof filters.types]}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    types: { ...filters.types, [key]: e.target.checked }
                  })}
                  className="rounded"
                />
                <span style={{ color }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Show Dependencies:</label>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={filters.showOptional}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  showOptional: e.target.checked
                })}
                className="rounded"
              />
              Optional
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={filters.showRequired}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  showRequired: e.target.checked
                })}
                className="rounded"
              />
              Required
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Search:</label>
          <input
            type="text"
            placeholder="Filter by service name..."
            value={filters.search}
            onChange={(e) => onFiltersChange({
              ...filters,
              search: e.target.value
            })}
            className="w-full px-2 py-1 text-xs border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Layout:</label>
          <select
            value={filters.layout}
            onChange={(e) => onFiltersChange({
              ...filters,
              layout: e.target.value as FilterState['layout']
            })}
            className="w-full px-2 py-1 text-xs border rounded"
          >
            <option value="hierarchical">Hierarchical</option>
            <option value="circular">Circular</option>
            <option value="grid">Grid</option>
          </select>
        </div>
      </div>
    </Panel>
  );
};