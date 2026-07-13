import { Home, Bell, Settings, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import alphaLogo from "@/assets/black-hawk-logo.png";
import {
  rankSidebarConfig,
  getRankDisplayName,
  getRankIcon,
  isModuleVisible,
} from "@/config/rankSidebarConfig";
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

interface FieldAppSidebarNewProps {
  rank: string;
  activeModule: string | null;
  onModuleSelect: (moduleId: string | null) => void;
  onLogout: () => void;
  userName?: string;
  notifications?: number;
}

/**
 * Field Portal sidebar — mirrors PlatformShell's SidebarBody design language
 * (hairline border, mono eyebrow, serif brand, primary accent on active).
 */
export const FieldAppSidebarNew = ({
  rank,
  activeModule,
  onModuleSelect,
  onLogout,
  userName = "Field Officer",
  notifications = 0,
}: FieldAppSidebarNewProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const modules = (rankSidebarConfig[rank] || rankSidebarConfig.guard).filter(
    (m) => isModuleVisible(m.id, rank),
  );
  const rankDisplayName = getRankDisplayName(rank);
  const RankIcon = getRankIcon(rank);

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
                Field Portal
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
                <RankIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{userName}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {rankDisplayName}
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
              Home
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeModule === null}
                  onClick={() => onModuleSelect(null)}
                  tooltip="Dashboard"
                  className={cn(
                    "relative h-9 rounded-md px-3 text-sm transition-colors",
                    activeModule === null
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {activeModule === null && !isCollapsed && (
                    <span
                      aria-hidden
                      className="absolute -left-1 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary"
                    />
                  )}
                  <Home
                    className={cn(
                      "h-4 w-4 shrink-0",
                      activeModule === null ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Modules
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;
                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onModuleSelect(module.id)}
                      tooltip={module.name}
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
                      <span className="truncate">{module.name}</span>
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
              Quick Actions
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Notifications"
                  className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Bell className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">Notifications</span>
                  {notifications > 0 && !isCollapsed && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      {notifications}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Settings"
                  className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className="truncate">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-0">
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
              Field platform · v1.0
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
