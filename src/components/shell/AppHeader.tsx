import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  LogOut,
  Menu,
  Search,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import NotificationCenter from "@/components/NotificationCenter";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CommandPalette from "@/components/command/CommandPalette";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { workspaces, workspaceForPath } from "./workspaceConfig";
import { ContextualSidebar } from "./ContextualSidebar";
import logo from "@/assets/black-hawk-logo.png";

/**
 * AppHeader — sits above the main content area.
 *
 * Layout (desktop):
 *   [breadcrumb] · · · · · · · · · · · · [⌘K search] [presence] [user] [lang] [notif] [logout]
 *
 * Layout (mobile):
 *   [hamburger] [logo] [clock] · · · · · · [⌘K] [notif]
 *
 * Hamburger opens a Sheet containing the IconRail + ContextualSidebar
 * stacked vertically — preserves nav on phones/tablets.
 */
export const AppHeader = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const { presenceCount } = usePresence();
  const [now, setNow] = useState(new Date());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const open = () => setMobileNavOpen(true);
    window.addEventListener("blackhawk:open-mobile-nav", open);
    return () => window.removeEventListener("blackhawk:open-mobile-nav", open);
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Global ⌘K / Ctrl+K
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

  const breadcrumb = useMemo(() => {
    const ws = workspaceForPath(pathname);
    let moduleName = "";
    for (const s of ws.sections) {
      const found = s.modules.find((m) => m.path === pathname);
      if (found) {
        moduleName = found.name;
        break;
      }
    }
    return { workspace: ws.name, module: moduleName };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-3 backdrop-blur-md md:px-5">
      {/* Mobile menu */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0 bg-sidebar border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <MobileNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Mobile brand */}
      <Link to="/" className="flex items-center gap-2 md:hidden">
        <img src={logo} alt="" className="h-7 w-7 rounded object-contain" />
        <span className="font-display text-base italic">Black Hawk SOC-OS</span>
      </Link>

      {/* Breadcrumb (desktop) */}
      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-1 items-center gap-2 text-sm md:flex"
      >
        <span className="text-text-muted">{breadcrumb.workspace}</span>
        {breadcrumb.module && (
          <>
            <span className="text-text-dim">/</span>
            <span className="truncate font-medium text-foreground">{breadcrumb.module}</span>
          </>
        )}
      </nav>

      {/* Spacer (mobile pushes actions right) */}
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Clock */}
        <div className="hidden items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-1.5 lg:flex">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {format(now, "HH:mm:ss")}
          </span>
          <span className="h-3 w-px bg-border" />
          <Calendar className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">{format(now, "EEE, dd MMM")}</span>
        </div>

        {/* ⌘K trigger */}
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

        {/* Presence */}
        {presenceCount > 0 && (
          <Badge variant="normal" className="hidden lg:inline-flex">
            <Users className="h-3 w-3" />
            <span className="tabular-nums">{presenceCount}</span>
            <span className="ml-1">online</span>
          </Badge>
        )}

        <LanguageSwitcher />
        <NotificationCenter />

        {/* User */}
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

// ---------- Mobile Nav (rail + sidebar stacked inside a sheet) ----------

const MobileNav = ({ onNavigate }: { onNavigate: () => void }) => {
  const { pathname } = useLocation();
  const active = workspaceForPath(pathname);

  return (
    <div className="flex h-full">
      {/* Mini rail */}
      <nav
        aria-label="Workspaces"
        className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar py-3"
      >
        <Link
          to="/"
          onClick={onNavigate}
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card"
        >
          <img src={logo} alt="" className="h-7 w-7 rounded object-contain" />
        </Link>
        {workspaces.map((ws) => {
          const Icon = ws.icon;
          const isActive = active.id === ws.id;
          const landing = ws.sections[0]?.modules[0]?.path ?? "/";
          return (
            <Link
              key={ws.id}
              to={landing}
              onClick={onNavigate}
              aria-label={ws.name}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                isActive
                  ? "bg-surface-2 text-foreground"
                  : "text-text-muted hover:bg-surface-2",
              )}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -left-[7px] top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary"
                />
              )}
              <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 1.75} />
            </Link>
          );
        })}
      </nav>

      {/* Sidebar contents using the desktop component (md:flex hidden, so we
          render an inline copy here that's always visible on mobile) */}
      <div className="flex-1">
        <MobileSidebar onNavigate={onNavigate} />
      </div>
    </div>
  );
};

const MobileSidebar = ({ onNavigate }: { onNavigate: () => void }) => {
  // Same structure as ContextualSidebar but always shown (without md:flex gate).
  // We render ContextualSidebar by removing its md gate via a wrapper class hack
  // is messy; instead inline a simple version that re-uses the same data.
  // For simplicity, we re-use ContextualSidebar in a flex container that forces it
  // visible via a class override.
  return (
    <div className="contents [&>aside]:!flex [&>aside]:w-full [&>aside]:border-r-0">
      <ContextualSidebar onNavigate={onNavigate} />
    </div>
  );
};

export default AppHeader;
