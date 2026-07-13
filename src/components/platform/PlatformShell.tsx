import { ReactNode, useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { format } from "date-fns";
import {
  LogOut, Menu, ChevronLeft, ChevronRight,
  Clock, Calendar, Search, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import NotificationCenter from "@/components/NotificationCenter";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CommandPalette from "@/components/command/CommandPalette";
import { cn } from "@/lib/utils";
import logo from "@/assets/black-hawk-logo.png";
import { CATEGORY_ORDER, type ModuleCategory, type PlatformDefinition, type PlatformModule } from "./platformRegistry";
import { prefetchModule } from "./modulePrefetch";

/**
 * PlatformShell — unified, isolated, COLLAPSIBLE shell for one designation.
 *
 * IMPORTANT: SidebarBody and Header are MODULE-level components (not nested
 * inside PlatformShell). Nesting them caused React to treat them as new
 * component types on every render — every clock tick / presence update
 * unmounted+remounted the entire header + sidebar (the visible "flicker"
 * from the session replay).
 */

interface Props {
  platform: PlatformDefinition;
  children: ReactNode;
}

const STORAGE_KEY = (id: string) => `platform_sidebar_collapsed:${id}`;

interface SidebarBodyProps {
  platform: PlatformDefinition;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}

const SidebarBody = ({ platform, onNavigate, isCollapsed = false }: SidebarBodyProps) => {
  const { pathname } = useLocation();
  const Icon = platform.icon;
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        isCollapsed ? "w-[68px]" : "w-[260px]",
      )}
    >
      {/* Brand */}
      <Link
        to={`/platform/${platform.id}`}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 border-b border-border px-3 py-4",
          isCollapsed && "justify-center px-2",
        )}
        title={platform.name}
      >
        <div className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-md", platform.gradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              {platform.eyebrow}
            </div>
            <div className="truncate font-display text-base italic leading-tight text-foreground">
              {platform.name}
            </div>
          </div>
        )}
      </Link>

      {/* Grouped module navigation */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 sidebar-scroll"
        aria-label={`${platform.name} navigation`}
      >
        {(() => {
          // Group by category, preserving canonical order.
          const groups = new Map<ModuleCategory, PlatformModule[]>();
          for (const m of platform.modules) {
            const cat = (m.category ?? "Command & Monitoring") as ModuleCategory;
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat)!.push(m);
          }
          const ordered = CATEGORY_ORDER.filter((c) => groups.has(c));

          return ordered.map((cat) => {
            const items = groups.get(cat)!;
            return (
              <div key={cat} className="mb-3">
                {!isCollapsed && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                    {cat}
                  </div>
                )}
                {isCollapsed && cat !== "Overview" && (
                  <div className="mx-2 my-2 h-px bg-border/60" aria-hidden />
                )}
                <ul className="space-y-0.5">
                  {items.map((m) => {
                    const welcomePath = `/platform/${platform.id}`;
                    const active = m.to === welcomePath ? pathname === welcomePath : pathname.startsWith(m.to);
                    const M = m.icon;
                    const prefetch = () => prefetchModule(m.moduleKey);
                    return (
                      <li key={m.to}>
                        <NavLink
                          to={m.to}
                          onClick={onNavigate}
                          onMouseEnter={prefetch}
                          onFocus={prefetch}
                          onTouchStart={prefetch}
                          title={m.name}
                          className={cn(
                            "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            isCollapsed && "justify-center px-2",
                            active
                              ? "bg-surface-2 text-foreground font-medium"
                              : "text-text-muted hover:bg-surface-2 hover:text-foreground",
                          )}
                        >
                          {active && !isCollapsed && (
                            <span
                              aria-hidden
                              className="absolute -left-1 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary"
                            />
                          )}
                          <M className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-text-dim")} />
                          {!isCollapsed && <span className="truncate">{m.name}</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          });
        })()}
      </nav>

      <div className={cn("border-t border-border px-3 py-3", isCollapsed && "px-2 text-center")}>
        {!isCollapsed ? (
          <>
            <p className="text-2xs text-text-muted">Black Hawk SOC-OS</p>
            <p className="mt-0.5 text-2xs text-text-dim">Isolated platform · v1.0</p>
          </>
        ) : (
          <p className="text-2xs text-text-dim">v1.0</p>
        )}
      </div>
    </aside>
  );
};

interface HeaderBarProps {
  platform: PlatformDefinition;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (v: boolean) => void;
}

const LiveClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-1.5 lg:flex">
      <Clock className="h-3.5 w-3.5 text-text-muted" />
      <span className="font-mono text-sm font-medium tabular-nums text-foreground">
        {format(now, "HH:mm:ss")}
      </span>
      <span className="h-3 w-px bg-border" />
      <Calendar className="h-3.5 w-3.5 text-text-muted" />
      <span className="text-xs text-text-muted">{format(now, "EEE, dd MMM")}</span>
    </div>
  );
};

const HeaderBar = ({
  platform,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileOpenChange,
}: HeaderBarProps) => {
  const { user, signOut } = useAuth();
  const { presenceCount } = usePresence();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:gap-3 md:px-5">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-border">
          <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
          <SidebarBody platform={platform} onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapsed}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Mobile brand */}
      <Link to={`/platform/${platform.id}`} className="flex items-center gap-2 md:hidden">
        <img src={logo} alt="" className="h-7 w-7 rounded object-contain" />
        <span className="font-display text-base italic">Black Hawk SOC-OS</span>
      </Link>

      {/* Breadcrumb (desktop) */}
      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-1 items-center gap-2 text-sm md:flex"
      >
        <span className="text-text-muted">{platform.eyebrow}</span>
        <span className="text-text-dim">/</span>
        <span className="truncate font-medium text-foreground">{platform.name}</span>
      </nav>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1.5 md:gap-2">
        <LiveClock />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaletteOpen(true)}
          className="hidden gap-2 md:inline-flex"
          aria-label="Open command palette"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs text-text-muted">Search…</span>
          <kbd className="ml-2 inline-flex h-4 items-center rounded border border-border bg-background px-1 font-mono text-[10px] text-text-muted">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPaletteOpen(true)}
          className="md:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {presenceCount > 0 && (
          <Badge variant="normal" className="hidden lg:inline-flex">
            <Users className="h-3 w-3" />
            <span className="tabular-nums">{presenceCount}</span>
            <span className="ml-1">online</span>
          </Badge>
        )}

        <LanguageSwitcher />
        <NotificationCenter />

        {user && (
          <>
            <div className="hidden text-right xl:block">
              <p className="max-w-[160px] truncate text-xs font-medium text-foreground">
                {user.email}
              </p>
              <p className="text-2xs uppercase tracking-wider text-text-muted">
                Authenticated
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out & switch platform"
              className="text-text-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
};

export const PlatformShell = ({ platform, children }: Props) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY(platform.id)) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY(platform.id), collapsed ? "1" : "0");
  }, [collapsed, platform.id]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="hidden md:block h-full">
        <SidebarBody platform={platform} isCollapsed={collapsed} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderBar
          platform={platform}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <ErrorBoundary>
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </ErrorBoundary>
        </main>
      </div>

      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 8px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 8px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.4); }
        .sidebar-scroll { scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent; }
      `}</style>
    </div>
  );
};

export default PlatformShell;
