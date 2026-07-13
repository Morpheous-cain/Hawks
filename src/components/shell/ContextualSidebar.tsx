import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { workspaceForPath, workspaces, type NavModule, type NavSection, type Workspace } from "./workspaceConfig";
import { useLiveCounts } from "./useLiveCounts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * ContextualSidebar — 240px sidebar showing the modules that belong
 * to the active workspace (resolved from the URL).
 *
 * Editorial calm: serif italic workspace title, tiny tracked-uppercase
 * section labels, hairline active indicator (no gradient pill, no glow).
 */
export const ContextualSidebar = ({
  onNavigate,
}: {
  onNavigate?: () => void;
}) => {
  const { pathname } = useLocation();
  const activeWorkspace = workspaceForPath(pathname);
  const counts = useLiveCounts();

  // Build the master section list from EVERY workspace so users can
  // scroll across all modules without switching workspaces.
  const allSections = useMemo<Array<NavSection & { workspaceId: string; workspaceName: string }>>(
    () =>
      workspaces.flatMap((ws: Workspace) =>
        ws.sections.map((s) => ({ ...s, workspaceId: ws.id, workspaceName: ws.name })),
      ),
    [],
  );

  const sectionKey = (s: { workspaceId: string; name: string }) => `${s.workspaceId}::${s.name}`;

  // Track open/closed per section. Default-open from config + active workspace's sections.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      allSections.map((s) => [sectionKey(s), !!s.defaultOpen || s.workspaceId === activeWorkspace.id]),
    ),
  );

  // Auto-open whichever section contains the active route.
  useEffect(() => {
    const active = allSections.find((s) => s.modules.some((m) => m.path === pathname));
    if (active) {
      const k = sectionKey(active);
      setOpenMap((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
    }
  }, [pathname, allSections]);

  const toggle = (key: string) =>
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));

  // Group sections by workspace for visual hierarchy.
  const grouped = useMemo(() => {
    return workspaces.map((ws) => ({
      workspace: ws,
      sections: allSections.filter((s) => s.workspaceId === ws.id),
    }));
  }, [allSections]);

  return (
    <aside
      aria-label="All modules navigation"
      className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar"
    >
      {/* Workspace heading — reflects active workspace context */}
      <div className="border-b border-border px-5 pb-5 pt-6">
        <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-text-muted">
          All Modules
        </div>
        <h2 className="mt-1 font-display text-2xl italic leading-none text-foreground">
          {activeWorkspace.name}
        </h2>
        <p className="mt-2 text-xs text-text-muted">{activeWorkspace.tagline}</p>
      </div>

      {/* Sections — scrollable across every workspace */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className="flex flex-col gap-3">
          {grouped.map(({ workspace, sections }) => {
            const WsIcon = workspace.icon;
            return (
              <div key={workspace.id} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-2xs font-bold uppercase tracking-[0.2em] text-foreground/70">
                  <WsIcon className="h-3 w-3" aria-hidden />
                  <span>{workspace.name}</span>
                </div>
                {sections.map((section) => {
                  const k = sectionKey(section);
                  return (
                    <SidebarSection
                      key={k}
                      section={section}
                      open={!!openMap[k]}
                      onToggle={() => toggle(k)}
                      activePath={pathname}
                      counts={counts}
                      onNavigate={onNavigate}
                    />
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer — live indicator */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-2xs text-text-muted">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              counts.isLive ? "bg-[hsl(var(--alert-normal))]" : "bg-text-dim",
            )}
            aria-hidden
          />
          <span className="uppercase tracking-[0.14em]">
            {counts.isLive ? "Live · realtime" : "Offline"}
          </span>
        </div>
      </div>
    </aside>
  );
};

interface SectionProps {
  section: NavSection;
  open: boolean;
  onToggle: () => void;
  activePath: string;
  counts: { incidents: number; alarms: number };
  onNavigate?: () => void;
}

const SidebarSection = ({
  section,
  open,
  onToggle,
  activePath,
  counts,
  onNavigate,
}: SectionProps) => {
  const hasActive = useMemo(
    () => section.modules.some((m) => m.path === activePath),
    [section.modules, activePath],
  );

  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <CollapsibleTrigger
        className={cn(
          "group flex w-full items-center justify-between rounded-md px-2 py-1.5",
          "text-2xs font-semibold uppercase tracking-[0.16em] text-text-muted",
          "hover:text-foreground transition-colors",
        )}
      >
        <span className="flex items-center gap-1.5">
          <span>{section.name}</span>
          {hasActive && !open && (
            <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
          )}
        </span>
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-90",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-0.5 flex flex-col gap-0.5 pb-2">
          {section.modules.map((module) => (
            <SidebarModule
              key={module.path}
              module={module}
              active={activePath === module.path}
              counts={counts}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface ModuleProps {
  module: NavModule;
  active: boolean;
  counts: { incidents: number; alarms: number };
  onNavigate?: () => void;
}

const SidebarModule = ({ module, active, counts, onNavigate }: ModuleProps) => {
  const Icon = module.icon;
  const badgeValue = module.badgeKey ? counts[module.badgeKey] : 0;
  const showBadge = badgeValue > 0;

  return (
    <li>
      <Link
        to={module.path}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5",
          "text-sm transition-colors duration-150",
          active
            ? "bg-surface-2 text-foreground font-medium"
            : "text-text-muted hover:bg-surface-2 hover:text-foreground",
        )}
      >
        {/* Active indicator: 2px left bar */}
        {active && (
          <span
            aria-hidden
            className="absolute -left-2 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary"
          />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary" : "text-text-dim",
          )}
          strokeWidth={active ? 2.25 : 1.75}
        />
        <span className="flex-1 truncate">{module.name}</span>
        {showBadge && (
          <span
            className={cn(
              "ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1",
              "font-mono text-[10px] font-semibold tabular-nums",
              module.badgeKey === "alarms"
                ? "bg-[hsl(var(--alert-critical)/0.15)] text-[hsl(var(--alert-critical))]"
                : "bg-[hsl(var(--alert-caution)/0.15)] text-[hsl(var(--alert-caution))]",
            )}
          >
            {badgeValue > 99 ? "99+" : badgeValue}
          </span>
        )}
      </Link>
    </li>
  );
};

export default ContextualSidebar;
