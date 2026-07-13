import { Link, useLocation } from "react-router-dom";
import { 
  Camera, BookOpen, Bell, CreditCard, Radio, Dog, Car, Search, 
  MessageSquare, BarChart3, LayoutDashboard, ExternalLink, Users, 
  Building2, AlertTriangle, Calendar, Settings, Map, QrCode, Tablet, 
  MonitorDot, Truck, FileText, Video, Wrench, TrendingDown, Globe, 
  GraduationCap, CalendarDays, UserCog, ChevronRight, Zap, Package,
  ShieldAlert, ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/black-hawk-logo.png";
import { sidebarStyles, LiveStatusIndicator } from "@/components/shared/SidebarStyles";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const overviewModules = [
  { name: "Executive Dashboard", path: "/", icon: LayoutDashboard },
];

const commandModules = [
  { name: "Control Room Command", path: "/control-room", icon: Radio },
  { name: "War Room (Major Incident)", path: "/war-room", icon: ShieldAlert },
  { name: "Shift Handover Pack", path: "/shift-handover", icon: ClipboardCheck },
  { name: "Auto-Dispatch Rules", path: "/auto-dispatch", icon: Zap },
  { name: "Strategic Advisory", path: "/strategic-advisory", icon: Globe },
];

const surveillanceModules = [
  { name: "CCTV & Video", path: "/cctv", icon: Camera },
  { name: "Body Cam & Field Video", path: "/bodycam", icon: Video },
  { name: "Loss Control System", path: "/loss-control", icon: TrendingDown },
];

const operationsModules = [
  { name: "Digital Occurrence Book", path: "/dob", icon: BookOpen },
  { name: "Alarm & Mobile Response", path: "/alarms", icon: Bell },
  { name: "Access Control", path: "/access", icon: CreditCard },
  { name: "Patrol Suite", path: "/supervision-patrol", icon: QrCode },
  { name: "Mobile Data Terminal", path: "/mdt", icon: Tablet },
];

const specializedModules = [
  { name: "Technical Security", path: "/technical-security", icon: Wrench },
  { name: "K9 Management", path: "/k9", icon: Dog },
  { name: "Escort & VIP", path: "/escort", icon: Car },
  { name: "Investigations", path: "/investigations", icon: Search },
  { name: "Courier Operations", path: "/courier", icon: Truck },
  { name: "Event Security", path: "/event-security", icon: CalendarDays },
];

const hrModules = [
  { name: "HR Suite", path: "/hr", icon: Users },
];

const managementModules = [
  { name: "Training Management", path: "/training", icon: GraduationCap },
  { name: "Client Management", path: "/clients", icon: Building2 },
  { name: "Fleet Management", path: "/fleet", icon: Car },
  { name: "Equipment Issuance", path: "/equipment", icon: Package },
];

const financeModules = [
  { name: "Billing & Invoicing", path: "/billing", icon: CreditCard },
];

const quickAccessModules = [
  { name: "Incidents", path: "/incidents", icon: AlertTriangle },
  { name: "SOP Library", path: "/sop-library", icon: BookOpen },
  { name: "Emergency Plans", path: "/emergency-plans", icon: ShieldAlert },
  
  { name: "Documents", path: "/documents", icon: FileText },
  { name: "Operational Map", path: "/map", icon: Map },
  { name: "Communications", path: "/comms", icon: MessageSquare },
  { name: "Analytics & Reports", path: "/analytics-dashboard", icon: BarChart3 },
  { name: "Compliance Centre", path: "/compliance", icon: ShieldAlert },
  { name: "Training Drills", path: "/training-drills", icon: ShieldAlert },
  { name: "Audit Log", path: "/audit-log", icon: ShieldAlert },
  { name: "Tenants (SaaS)", path: "/tenants", icon: Building2 },
  { name: "Settings", path: "/settings", icon: Settings },
];

interface ModuleGroup {
  name: string;
  modules: { name: string; path: string; icon: any }[];
  defaultOpen?: boolean;
}

const moduleGroups: ModuleGroup[] = [
  { name: "Command Centre", modules: commandModules, defaultOpen: true },
  { name: "Surveillance", modules: surveillanceModules },
  { name: "Operations", modules: operationsModules, defaultOpen: true },
  { name: "Specialized Units", modules: specializedModules },
  { name: "HR & People", modules: hrModules },
  { name: "Administration", modules: managementModules },
  { name: "Finance", modules: financeModules },
];

export const ConsoleSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isLive, setIsLive] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Command Centre": true,
    "Operations": true,
  });
  const [alertCounts, setAlertCounts] = useState({ incidents: 0, alarms: 0 });

  // Check which groups should be open based on current route
  useEffect(() => {
    moduleGroups.forEach(group => {
      if (group.modules.some(m => location.pathname === m.path)) {
        setOpenGroups(prev => ({ ...prev, [group.name]: true }));
      }
    });
  }, [location.pathname]);

  // Subscribe to live counts
  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: incidentCount }, { count: alarmCount }] = await Promise.all([
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('alarm_activations').select('*', { count: 'exact', head: true }).in('status', ['triggered', 'dispatched']),
      ]);
      setAlertCounts({ incidents: incidentCount || 0, alarms: alarmCount || 0 });
    };
    
    fetchCounts();
    
    const channel = supabase
      .channel('sidebar-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alarm_activations' }, fetchCounts)
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const renderMenuItem = (module: { name: string; path: string; icon: any }, showBadge?: number) => {
    const isActive = location.pathname === module.path;
    const Icon = module.icon;
    
    return (
      <SidebarMenuItem key={module.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={module.name}
          className={cn(
            sidebarStyles.menuButton,
            isActive && sidebarStyles.menuButtonActive
          )}
        >
          <Link to={module.path} className="flex items-center gap-3">
            <Icon className={cn(sidebarStyles.menuIcon, isActive && sidebarStyles.menuIconActive)} />
            <span className="flex-1">{module.name}</span>
            {showBadge !== undefined && showBadge > 0 && !isCollapsed && (
              <Badge className={sidebarStyles.badgeDestructive}>
                {showBadge}
              </Badge>
            )}
            {isActive && !isCollapsed && (
              <ChevronRight className={sidebarStyles.activeIndicator} />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className={sidebarStyles.container}>
      {/* Header */}
      <SidebarHeader className={sidebarStyles.header}>
        <div className={cn(sidebarStyles.headerContent, isCollapsed && "justify-center")}>
          <div className={sidebarStyles.logoContainer}>
            <div className={sidebarStyles.logoGlow} />
            <img 
              src={logo} 
              alt="Black Hawk SOC-OS" 
              className={sidebarStyles.logo}
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className={sidebarStyles.brandTitle}>Black Hawk SOC-OS</h2>
              <div className="flex items-center justify-between">
                <p className={sidebarStyles.brandSubtitle}>Control Console</p>
                <LiveStatusIndicator isLive={isLive} />
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="sidebar-scrollbar">
        {/* Overview Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={sidebarStyles.groupLabel}>
            <Zap className="w-3 h-3 mr-1 inline" />
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewModules.map(module => renderMenuItem(module))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible Module Groups */}
        {moduleGroups.map((group) => (
          <Collapsible
            key={group.name}
            open={isCollapsed ? false : openGroups[group.name]}
            onOpenChange={() => !isCollapsed && toggleGroup(group.name)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel 
                  className={cn(
                    sidebarStyles.groupLabel,
                    "cursor-pointer hover:text-foreground transition-colors flex items-center justify-between w-full"
                  )}
                >
                  <span>{group.name}</span>
                  {!isCollapsed && (
                    <ChevronRight 
                      className={cn(
                        "w-3 h-3 transition-transform duration-200",
                        openGroups[group.name] && "rotate-90"
                      )} 
                    />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.modules.map(module => {
                      const badge = module.path === '/alarms' ? alertCounts.alarms : undefined;
                      return renderMenuItem(module, badge);
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* Quick Access Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={sidebarStyles.groupLabel}>
            Quick Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickAccessModules.map(module => {
                const badge = module.path === '/incidents' ? alertCounts.incidents : undefined;
                return renderMenuItem(module, badge);
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className={sidebarStyles.footer}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Security Updates"
              className={sidebarStyles.externalLink}
            >
              <a
                href="https://whatsapp.com/channel/0029VaYK4yj5a240m41ucj01"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="flex-1">Security Updates</span>
                {!isCollapsed && <ExternalLink className="w-3 h-3" />}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <style>{sidebarStyles.scrollbarCSS}</style>
    </Sidebar>
  );
};

export default ConsoleSidebar;
