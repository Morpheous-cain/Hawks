import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Clock, LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import NotificationCenter from "@/components/NotificationCenter";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CommandPalette from "@/components/command/CommandPalette";
import { useSidebar } from "@/components/ui/sidebar";
import logo from "@/assets/black-hawk-logo.png";

interface PortalHeaderProps {
  /** Eyebrow/breadcrumb root, e.g. "Field Portal" or "Client Portal" */
  portalLabel: string;
  /** Current page/module name shown after the slash */
  pageTitle?: string;
  /** Optional brand link target */
  brandHref?: string;
  /** When true, hides the desktop ⌘K command palette button */
  hideSearch?: boolean;
}

/**
 * PortalHeader — shared header for Field & Client portals so they match the
 * Management Console look (logo + brand, search, language, notifications,
 * logout). Sits inside an existing SidebarProvider — relies on
 * SidebarCollapseToggle for the mobile hamburger.
 */
export const PortalHeader = ({
  portalLabel,
  pageTitle,
  brandHref = "/",
  hideSearch = false,
}: PortalHeaderProps) => {
  const { user, signOut } = useAuth();
  const { setOpenMobile, toggleSidebar, isMobile } = useSidebar();
  const [now, setNow] = useState(new Date());
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:gap-3 md:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="-ml-1"
        aria-label="Open navigation menu"
        onClick={() => {
          if (isMobile) setOpenMobile(true);
          else toggleSidebar();
          window.dispatchEvent(new CustomEvent("blackhawk:open-mobile-nav"));
        }}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Link to={brandHref} className="flex items-center gap-2">
        <img src={logo} alt="" className="h-7 w-7 rounded object-contain" />
        <span className="font-display text-base italic">Black Hawk SOC-OS</span>
      </Link>

      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-1 items-center gap-2 text-sm md:flex"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {portalLabel}
        </span>
        {pageTitle && (
          <>
            <span className="text-muted-foreground/60">/</span>
            <span className="truncate font-medium text-foreground">{pageTitle}</span>
          </>
        )}
      </nav>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-1.5 lg:flex">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {format(now, "HH:mm:ss")}
          </span>
          <span className="h-3 w-px bg-border" />
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{format(now, "EEE, dd MMM")}</span>
        </div>

        {!hideSearch && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaletteOpen(true)}
              className="hidden gap-2 md:inline-flex"
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs text-muted-foreground">Search…</span>
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
          </>
        )}

        <LanguageSwitcher />
        <NotificationCenter />

        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!hideSearch && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}
    </header>
  );
};

export default PortalHeader;
