import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertTriangle, Shield, Clock, CheckCircle, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";

// Short synthesised "ping" so we don't need a binary asset.
const playPing = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.42);
  } catch { /* audio unavailable */ }
};

const showBrowserNotification = (title: string, body: string) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/favicon.ico" }); } catch { /* ignore */ }
  }
};

interface Notification {
  id: string;
  type: "alarm" | "incident" | "sla" | "system" | "patrol";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: "info" | "warning" | "critical";
  link?: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => localStorage.getItem("notif_sound") !== "off");
  const knownIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  useEffect(() => {
    // Build notifications from real-time data
    const fetchNotifications = async () => {
      const notifs: Notification[] = [];

      // Active alarms
      const { data: alarms } = await supabase.from("alarm_activations")
        .select("id, alarm_number, alarm_type, location, triggered_at, status, priority")
        .in("status", ["active", "triggered", "dispatched", "acknowledged", "arrived"])
        .order("triggered_at", { ascending: false })
        .limit(10);

      (alarms || []).forEach(a => {
        notifs.push({
          id: `alarm-${a.id}`,
          type: "alarm",
          title: `Alarm ${a.alarm_number}`,
          message: `${a.alarm_type} at ${a.location} — ${a.status}`,
          timestamp: a.triggered_at,
          read: false,
          severity: a.priority === "critical" ? "critical" : "warning",
        });
      });

      // Open incidents
      const { data: incidents } = await supabase.from("incidents")
        .select("id, incident_number, incident_type, location, created_at, status, severity")
        .in("status", ["open", "in_progress", "investigating"])
        .order("created_at", { ascending: false })
        .limit(10);

      (incidents || []).forEach(i => {
        notifs.push({
          id: `incident-${i.id}`,
          type: "incident",
          title: `Incident ${i.incident_number}`,
          message: `${i.incident_type} at ${i.location || "Unknown"} — ${i.status}`,
          timestamp: i.created_at,
          read: false,
          severity: i.severity === "high" || i.severity === "critical" ? "critical" : "warning",
        });
      });

      // Active SOS alerts
      try {
        const { data: sos } = await supabase.from("sos_alerts")
          .select("id, alert_number, gps_lat, gps_lng, triggered_at, status")
          .in("status", ["active", "acknowledged"])
          .order("triggered_at", { ascending: false })
          .limit(10);
        (sos || []).forEach((s: any) => {
          notifs.push({
            id: `sos-${s.id}`,
            type: "alarm",
            title: `SOS ${s.alert_number}`,
            message: `Officer SOS — ${s.gps_lat ? `GPS ${s.gps_lat.toFixed(4)}, ${s.gps_lng.toFixed(4)}` : "location pending"} — ${s.status}`,
            timestamp: s.triggered_at,
            read: false,
            severity: "critical",
          });
        });
      } catch (e) { /* table may not exist */ }

      // Expiring certifications
      try {
        const { data: certs } = await supabase.rpc("check_expiring_certifications");
        (certs || []).forEach((c: any) => {
          notifs.push({
            id: `cert-${c.staff_id}-${c.certification_type}`,
            type: "system",
            title: "Certification Expiring",
            message: `${c.staff_name}: ${c.certification_type} expires in ${c.days_until_expiry} days`,
            timestamp: new Date().toISOString(),
            read: false,
            severity: c.days_until_expiry <= 7 ? "critical" : "warning",
          });
        });
      } catch (e) { /* RPC may not exist yet */ }

      // Pending leave requests
      try {
        const { count: leaveCount } = await supabase.from("leave_records")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        if (leaveCount && leaveCount > 0) {
          notifs.push({
            id: "leave-pending",
            type: "system",
            title: "Leave Requests",
            message: `${leaveCount} pending leave request${leaveCount > 1 ? "s" : ""} awaiting approval`,
            timestamp: new Date().toISOString(),
            read: false,
            severity: "info",
          });
        }
      } catch (e) { /* table may not be accessible */ }

      // Sort by timestamp
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      // Detect brand-new notifications (skip first load)
      const newOnes = notifs.filter(n => !knownIdsRef.current.has(n.id));
      const isFirst = firstLoadRef.current;
      notifs.forEach(n => knownIdsRef.current.add(n.id));
      firstLoadRef.current = false;
      if (!isFirst && newOnes.length > 0) {
        const top = newOnes[0];
        if (localStorage.getItem("notif_sound") !== "off" && top.severity !== "info") playPing();
        showBrowserNotification(top.title, top.message);
      }
      setNotifications(notifs);
    };

    fetchNotifications();

    // Real-time subscriptions
    const channel = supabase
      .channel("notification-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "alarm_activations" }, fetchNotifications)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, fetchNotifications)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, fetchNotifications)
      .subscribe();

    // Refresh every 60s
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const severityIcon = (severity: string) => {
    if (severity === "critical") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (severity === "warning") return <Shield className="w-4 h-4 text-amber-500" />;
    return <CheckCircle className="w-4 h-4 text-blue-500" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={soundOn ? "Mute alert sound" : "Enable alert sound"}
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                localStorage.setItem("notif_sound", next ? "on" : "off");
                if (next && "Notification" in window && Notification.permission === "default") {
                  Notification.requestPermission().then((p) => {
                    if (p === "granted") toast.success("Browser alerts enabled");
                  });
                }
              }}
            >
              {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => markRead(n.id)}
              >
                <div className="mt-0.5">{severityIcon(n.severity)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(n.timestamp), "dd MMM HH:mm")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
