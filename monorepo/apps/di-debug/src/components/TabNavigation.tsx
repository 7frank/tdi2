import type { Inject } from '@tdi2/di-core/markers';
import type { DashboardServiceInterface } from '../services/interfaces/DashboardServiceInterface';

interface TabNavigationProps {
  dashboardService: Inject<DashboardServiceInterface>;
}

export function TabNavigation({ dashboardService }: TabNavigationProps) {
  const { currentTab } = dashboardService.state;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'graph', label: '🕸️ Dependency Graph' },
    { id: 'analysis', label: '🔍 Analysis' },
    { id: 'issues', label: '⚠️ Issues' },
    { id: 'config', label: '⚙️ Configuration' },
  ] as const;

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${currentTab === tab.id ? 'active' : ''}`}
          onClick={() => dashboardService.switchTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}