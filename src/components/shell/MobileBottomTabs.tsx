import { Home, Radio, AlertTriangle, BookOpen, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Tab {
  path: string | null;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface Props {
  notifications?: number;
  tabs?: Tab[];
}

/**
 * Native-app-style bottom tab bar — visible only on mobile (<md).
 * Sits above iOS home indicator via safe-area inset.
 */
export const MobileBottomTabs = ({ notifications = 0, tabs }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const openMenu = () => window.dispatchEvent(new CustomEvent("blackhawk:open-mobile-nav"));

  const defaultTabs: Tab[] = [
    { path: "/management", label: "Home", icon: Home },
    { path: "/control-room", label: "Control", icon: Radio },
    { path: "/incidents", label: "Report", icon: AlertTriangle, badge: notifications },
    { path: "/dob", label: "O.B", icon: BookOpen },
  ];
  const items = tabs ?? defaultTabs;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-border bg-background/95 backdrop-blur-xl",
        "shadow-[0_-4px_24px_-8px_hsl(0_0%_0%/0.5)]"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 gap-0.5 px-1 pt-1.5">
        {items.slice(0, 4).map((tab) => {
          const Icon = tab.icon;
          const active = tab.path !== null && pathname === tab.path;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => tab.path && navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground active:text-foreground"
              )}
            >
              <span className="relative">
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]")} />
                {tab.badge ? (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              {active && (
                <span className="absolute inset-x-3 -top-1.5 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={openMenu}
          className="relative flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-muted-foreground active:text-foreground"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomTabs;
