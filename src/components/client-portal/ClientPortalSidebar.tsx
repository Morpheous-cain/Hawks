import {
  BarChart3, Building2, FileText, PlusCircle, MessageSquare,
  Globe, LogOut, Bell, Phone, Shield, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import alphaLogo from "@/assets/black-hawk-logo.png";
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
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientPortalSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  clientName?: string;
  clientId?: string;
}

const menuItems = [
  { id: "dashboard", name: "Dashboard", icon: BarChart3 },
  { id: "advisories", name: "Security Advisories", icon: Globe },
  { id: "sites", name: "Site Status", icon: Building2 },
  { id: "patrol-proof", name: "Patrol Verification", icon: Shield },
  { id: "incidents", name: "Incident Reports", icon: FileText },
  { id: "requests", name: "Service Requests", icon: PlusCircle },
  { id: "messages", name: "Messages", icon: MessageSquare },
];

/**
 * Client Portal sidebar — mirrors PlatformShell's SidebarBody design language
 * (hairline border, mono eyebrow, serif brand, primary accent on active).
 */
export const ClientPortalSidebar = ({
  activeTab,
  onTabChange,
  onLogout,
  clientName = "Client Portal",
  clientId,
}: ClientPortalSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [alertCounts, setAlertCounts] = useState({ incidents: 0, advisories: 0 });

  useEffect(() => {
    if (!clientId) return;

    const fetchCounts = async () => {
      const [{ count: incidentCount }, { count: advisoryCount }] = await Promise.all([
        supabase.from("incidents").select("*", { count: "exact", head: true })
          .eq("client_id", clientId).eq("status", "open"),
        supabase.from("strategic_advisories").select("*", { count: "exact", head: true })
          .eq("status", "Active"),
      ]);
      setAlertCounts({
        incidents: incidentCount || 0,
        advisories: advisoryCount || 0,
      });
    };

    fetchCounts();

    const channel = supabase
      .channel("client-sidebar-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "strategic_advisories" }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const getBadgeCount = (id: string) => {
    if (id === "incidents") return alertCounts.incidents;
    if (id === "advisories") return alertCounts.advisories;
    return 0;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      {/* Brand */}
      <SidebarHeader className="border-b border-border p-0">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-4",
            isCollapsed && "justify-center px-2"
          )}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            <img src={alphaLogo} alt="Black Hawk SOC-OS" className="h-full w-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Client Portal
              </div>
              <div className="truncate font-display text-base italic leading-tight text-foreground">
                Black Hawk SOC-OS
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="border-t border-border px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{clientName}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Protected Client
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Modules
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeCount = getBadgeCount(item.id);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onTabChange(item.id)}
                      tooltip={item.name}
                      className={cn(
                        "relative h-9 rounded-md px-3 text-sm transition-colors",
                        isActive
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {isActive && !isCollapsed && (
                        <span
                          aria-hidden
                          className="absolute -left-1 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary"
                        />
                      )}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {badgeCount > 0 && !isCollapsed && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          {badgeCount}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Quick Contact
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="24/7 Hotline"
                  className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">24/7 Hotline</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Notifications"
                  className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Bell className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">Notifications</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-0">
        {!isCollapsed && (
          <div className="px-3 py-2">
            <Button variant="destructive" size="sm" className="w-full gap-2">
              <AlertTriangle className="h-4 w-4" />
              Report Emergency
            </Button>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip="Sign Out"
              className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!isCollapsed && (
          <div className="px-3 pb-3 pt-1">
            <p className="text-[10px] text-muted-foreground">Black Hawk SOC-OS</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
              Client platform · v1.0
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
