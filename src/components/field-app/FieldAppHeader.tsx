import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WifiOff, Battery, Signal, Bell, ChevronLeft, Clock, Calendar,
} from "lucide-react";

interface FieldAppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  notifications?: number;
  onNotificationClick?: () => void;
}

/**
 * Editorial Black Hawk SOC-OS header for the Field Portal — mirrors PlatformShell's
 * hairline header (mono eyebrow + serif breadcrumb + LiveClock) while
 * keeping the field-specific status bar (online + battery).
 */
export const FieldAppHeader = ({
  title,
  showBack = false,
  onBack,
  notifications = 0,
  onNotificationClick,
}: FieldAppHeaderProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-1 items-center gap-2 md:gap-3 min-w-0">
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-1 items-center gap-2 text-sm md:flex"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Field Portal
        </span>
        <span className="text-muted-foreground/60">/</span>
        <span className="truncate font-medium text-foreground">{title}</span>
      </nav>

      {/* Mobile title */}
      <div className="md:hidden flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Field
        </p>
        <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
      </div>

      {/* Live clock — desktop */}
      <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 lg:flex">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-sm font-medium tabular-nums text-foreground">
          {format(now, "HH:mm:ss")}
        </span>
        <span className="h-3 w-px bg-border" />
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{format(now, "EEE, dd MMM")}</span>
      </div>

      {/* Status pills */}
      {isOnline ? (
        <Badge variant="outline" className="gap-1 text-[10px] py-0 h-6 border-emerald-500/30 text-emerald-500">
          <Signal className="h-2.5 w-2.5" /> Online
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-[10px] py-0 h-6 border-rose-500/30 text-rose-500">
          <WifiOff className="h-2.5 w-2.5" /> Offline
        </Badge>
      )}
      {batteryLevel !== null && (
        <span
          className={`hidden sm:flex items-center gap-1 font-mono text-xs tabular-nums ${
            batteryLevel < 20 ? "text-rose-500" : "text-muted-foreground"
          }`}
        >
          <Battery className="h-3 w-3" />
          {batteryLevel}%
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8"
        onClick={onNotificationClick}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {notifications > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] flex items-center justify-center text-white font-medium">
            {notifications > 9 ? "9+" : notifications}
          </span>
        )}
      </Button>
    </div>
  );
};
