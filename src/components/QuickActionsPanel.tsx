import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Download, 
  Bell, 
  BellOff, 
  Settings, 
  RefreshCw,
  FileText,
  TrendingUp 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsPanelProps {
  onExport: () => void;
  onRefresh: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const QuickActionsPanel = ({ 
  onExport, 
  onRefresh, 
  soundEnabled, 
  onToggleSound 
}: QuickActionsPanelProps) => {
  const navigate = useNavigate();

  const currentPlatform = (() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/^\/platform\/([^/]+)/);
    return match?.[1] ?? null;
  })();

  const routeWithinWorkspace = (moduleKey: string) => {
    if (currentPlatform) {
      navigate(`/platform/${currentPlatform}/m/${moduleKey}`);
      return;
    }

    const selectedRole = typeof window !== 'undefined'
      ? sessionStorage.getItem('selected_management_role')
      : null;

    const roleRoutes: Record<string, string> = {
      ceo: '/platform/ceo',
      coo: '/platform/coo',
      gm: '/platform/gm',
      country_director: '/platform/country-director',
      risk_director: '/platform/risk-director',
      finance_director: '/platform/finance-director',
      control: '/platform/control-room',
      contract_manager: '/platform/contract-manager',
      guard_force_admin: '/platform/guard-force-admin',
      hr: '/platform/hr-manager',
      hr_officer: '/platform/hr-officer',
      finance: '/platform/finance-manager',
      finance_officer: '/platform/finance-officer',
      payroll_officer: '/platform/payroll-officer',
      ops_manager: '/platform/ops-manager',
      regional_ops_manager: '/platform/regional-ops-manager',
      branch_ops_manager: '/platform/branch-ops-manager',
      assistant_senior_ops_manager: '/platform/asst-snr-ops-manager',
      area_manager: '/platform/area-manager',
      facilities_ops_manager: '/platform/facilities-ops-manager',
      admin_manager: '/platform/admin-manager',
      admin_officer: '/platform/admin-officer',
      branch_manager: '/platform/branch-manager',
      regional_manager: '/platform/regional-manager',
      cit_manager: '/platform/cit-manager',
      cit_officer: '/platform/cit-officer',
      courier_manager: '/platform/courier-manager',
      courier_dispatcher: '/platform/courier-dispatcher',
      courier_officer: '/platform/courier-officer',
      compliance: '/platform/compliance',
      system_admin: '/platform/system-admin',
    };

    const baseRoute = selectedRole ? roleRoutes[selectedRole] : null;
    navigate(baseRoute ? `${baseRoute}/m/${moduleKey}` : `/${moduleKey}`);
  };

  const handleGenerateReport = () => {
    routeWithinWorkspace('analytics-dashboard');
  };

  const handleViewAnalytics = () => {
    routeWithinWorkspace('analytics-dashboard');
  };

  const handleSettings = () => {
    routeWithinWorkspace('settings');
  };

  const handleNewIncident = () => {
    routeWithinWorkspace('incidents');
  };

  return (
    <Card className="p-4 border-border bg-card/80 backdrop-blur">
      <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onRefresh}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onExport}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onToggleSound}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80"
        >
          {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          Sound
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleGenerateReport}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80"
        >
          <FileText className="w-4 h-4" />
          Report
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleViewAnalytics}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80"
        >
          <TrendingUp className="w-4 h-4" />
          Analytics
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleSettings}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          onClick={handleNewIncident}
          className="flex items-center gap-2 bg-gradient-command"
        >
          New Incident
        </Button>
      </div>
    </Card>
  );
};

export default QuickActionsPanel;
