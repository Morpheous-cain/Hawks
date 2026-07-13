import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Layout, Grid3X3, Maximize2, Minimize2, 
  Eye, Bell, Shield, MapPin, Radio, Settings
} from "lucide-react";
import UnifiedModuleActivityFeed from "./UnifiedModuleActivityFeed";
import SmartAlertAggregation from "./SmartAlertAggregation";
import CrossModuleEventCorrelation from "./CrossModuleEventCorrelation";
import UnifiedTimelineView from "./UnifiedTimelineView";

type PanelType = 'feed' | 'alerts' | 'correlation' | 'timeline';

interface WorkspacePanel {
  id: PanelType;
  label: string;
  icon: any;
  component: React.ComponentType;
}

const EnhancedOperatorWorkspace = () => {
  const [layout, setLayout] = useState<'2x2' | '1x2' | 'focus'>('2x2');
  const [activePanels, setActivePanels] = useState<PanelType[]>(['feed', 'alerts', 'correlation', 'timeline']);
  const [focusedPanel, setFocusedPanel] = useState<PanelType | null>(null);

  const availablePanels: WorkspacePanel[] = [
    { id: 'feed', label: 'Activity Feed', icon: Eye, component: UnifiedModuleActivityFeed },
    { id: 'alerts', label: 'Smart Alerts', icon: Bell, component: SmartAlertAggregation },
    { id: 'correlation', label: 'Correlations', icon: Shield, component: CrossModuleEventCorrelation },
    { id: 'timeline', label: 'Timeline', icon: MapPin, component: UnifiedTimelineView },
  ];

  const togglePanel = (panelId: PanelType) => {
    if (activePanels.includes(panelId)) {
      setActivePanels(prev => prev.filter(p => p !== panelId));
    } else {
      setActivePanels(prev => [...prev, panelId]);
    }
  };

  const handleFocus = (panelId: PanelType) => {
    if (focusedPanel === panelId) {
      setFocusedPanel(null);
      setLayout('2x2');
    } else {
      setFocusedPanel(panelId);
      setLayout('focus');
    }
  };

  const renderPanel = (panel: WorkspacePanel) => {
    const Component = panel.component;
    return (
      <div key={panel.id} className="relative h-full">
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => handleFocus(panel.id)}
          >
            {focusedPanel === panel.id ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </Button>
        </div>
        <Component />
      </div>
    );
  };

  const getGridClass = () => {
    if (layout === 'focus') return 'grid-cols-1';
    if (layout === '1x2') return 'grid-cols-1 lg:grid-cols-2';
    return 'grid-cols-1 lg:grid-cols-2';
  };

  const visiblePanels = focusedPanel 
    ? availablePanels.filter(p => p.id === focusedPanel)
    : availablePanels.filter(p => activePanels.includes(p.id));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            Operator Workspace
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                size="icon"
                variant={layout === '2x2' ? 'secondary' : 'ghost'}
                className="h-6 w-6"
                onClick={() => { setLayout('2x2'); setFocusedPanel(null); }}
              >
                <Grid3X3 className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant={layout === '1x2' ? 'secondary' : 'ghost'}
                className="h-6 w-6"
                onClick={() => { setLayout('1x2'); setFocusedPanel(null); }}
              >
                <Layout className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              {availablePanels.map(panel => (
                <Button
                  key={panel.id}
                  size="icon"
                  variant={activePanels.includes(panel.id) ? 'secondary' : 'ghost'}
                  className="h-7 w-7"
                  onClick={() => togglePanel(panel.id)}
                  title={panel.label}
                >
                  <panel.icon className="w-3 h-3" />
                </Button>
              ))}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className={`grid ${getGridClass()} gap-4`}>
          {visiblePanels.map(panel => renderPanel(panel))}
        </div>

        {visiblePanels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Settings className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No panels selected</p>
            <p className="text-xs">Click panel icons above to add views</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedOperatorWorkspace;
