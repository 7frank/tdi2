import type { Inject } from '@tdi2/di-core/markers';
import type { DashboardServiceInterface } from '../services/interfaces/DashboardServiceInterface';
import type { NotificationServiceInterface } from '../services/interfaces/NotificationServiceInterface';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import { TabNavigation } from './TabNavigation';
import { OverviewTab } from './tabs/OverviewTab';
import { GraphTab } from './tabs/GraphTab';
import { AnalysisTab } from './tabs/AnalysisTab';
import { IssuesTab } from './tabs/IssuesTab';
import { ConfigTab } from './tabs/ConfigTab';
import { NotificationContainer } from './ui/NotificationContainer';

interface DashboardProps {
  dashboardService: Inject<DashboardServiceInterface>;
  notificationService: Inject<NotificationServiceInterface>;
}

export function Dashboard({ dashboardService, notificationService }: DashboardProps) {
  const { currentTab } = dashboardService.state;

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewTab />;
      case 'graph':
        return <GraphTab />;
      case 'analysis':
        return <AnalysisTab />;
      case 'issues':
        return <IssuesTab />;
      case 'config':
        return <ConfigTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="dashboard-container">
      <Header />
      
      <TabNavigation />
      
      <div className="content-area">
        {renderTabContent()}
      </div>
      
      <Footer />
      
      <NotificationContainer />
    </div>
  );
}