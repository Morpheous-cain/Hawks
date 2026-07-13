import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Wifi, WifiOff, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MDTHeaderProps {
  vehicle: any;
}

const statusColors: Record<string, string> = {
  available: "bg-green-500",
  on_patrol: "bg-blue-500",
  en_route: "bg-yellow-500",
  on_scene: "bg-orange-500",
  break: "bg-muted",
  off_duty: "bg-slate-500",
  emergency: "bg-red-500",
};

const MDTHeader = ({ vehicle }: MDTHeaderProps) => {
  const { user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  return (
    <Card className="p-4 mb-4 sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{vehicle.vehicle_id}</h1>
              <Badge className={statusColors[vehicle.status]}>
                {vehicle.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-foreground/80 font-medium">
              {profile?.full_name || "Officer"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{vehicle.current_assignment || "No Assignment"}</p>
            <p className="text-xs text-foreground/80 font-medium">{vehicle.vehicle_type}</p>
          </div>

          <div className="flex gap-2">
            {online ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive" />
            )}
            <Navigation className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MDTHeader;
