import type { Inject } from '@tdi2/di-core/markers';
import type { GraphServiceInterface } from '../../services/interfaces/GraphServiceInterface';

interface GraphControlsProps {
  graphService: Inject<GraphServiceInterface>;
}

export function GraphControls({ graphService }: GraphControlsProps) {
  const { layout, filters, searchTerm } = graphService.state;

  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    graphService.setLayout(e.target.value as 'force' | 'hierarchical' | 'circular');
  };

  const handleNodeTypeToggle = (nodeType: string) => {
    const newNodeTypes = new Set(filters.nodeTypes);
    if (newNodeTypes.has(nodeType)) {
      newNodeTypes.delete(nodeType);
    } else {
      newNodeTypes.add(nodeType);
    }
    graphService.updateFilters({ nodeTypes: newNodeTypes });
  };

  const handleIssuesOnlyToggle = () => {
    graphService.updateFilters({ showIssuesOnly: !filters.showIssuesOnly });
  };

  const handlePotentialToggle = () => {
    graphService.updateFilters({ showPotential: !filters.showPotential });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    graphService.searchNodes(e.target.value);
  };

  const handleClearSearch = () => {
    graphService.clearSearch();
  };

  const handleReload = () => {
    graphService.reloadGraph();
  };

  const handleExport = () => {
    graphService.exportGraph();
  };

  const handleClearSelection = () => {
    graphService.clearSelection();
  };

  return (
    <div className="controls-panel">
      <div className="control-group">
        <label>Layout:</label>
        <select value={layout} onChange={handleLayoutChange}>
          <option value="force">Force-Directed</option>
          <option value="hierarchical">Hierarchical</option>
          <option value="circular">Circular</option>
        </select>
      </div>

      <div className="control-group">
        <label>Show Node Types:</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['interface', 'class', 'service', 'component'].map(nodeType => (
            <label key={nodeType} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={filters.nodeTypes.has(nodeType)}
                onChange={() => handleNodeTypeToggle(nodeType)}
              />
              {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}s
            </label>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>Filters:</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={filters.showIssuesOnly}
              onChange={handleIssuesOnlyToggle}
            />
            Issues Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={filters.showPotential}
              onChange={handlePotentialToggle}
            />
            Show Potential
          </label>
        </div>
      </div>

      <div className="control-group">
        <label>Search:</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button type="button" onClick={handleClearSearch}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="control-group">
        <label>Actions:</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleReload}>
            🔄 Reload
          </button>
          <button className="btn" onClick={handleClearSelection}>
            ❌ Clear Selection
          </button>
          <button className="btn" onClick={handleExport}>
            📥 Export
          </button>
        </div>
      </div>
    </div>
  );
}