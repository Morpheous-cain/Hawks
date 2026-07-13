import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  AlertTriangle, 
  Cloud, 
  Shield, 
  MapPin,
  RefreshCw,
  ChevronRight,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ClientPortalAdvisoriesProps {
  clientId?: string;
}

interface Advisory {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  location_scope_hierarchy: string[];
  recommended_action: string;
  timestamp_detected: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
  sla_breached?: boolean;
}

const ClientPortalAdvisories = ({ clientId }: ClientPortalAdvisoriesProps) => {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filter, setFilter] = useState<string>("all");

  const fetchAdvisories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("strategic_advisories")
        .select("*")
        .in("status", ["Active", "Monitoring"])
        .order("timestamp_detected", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAdvisories(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching advisories:', error);
    }
  }, []);

  useEffect(() => {
    fetchAdvisories();

    const channel = supabase
      .channel('client-portal-advisories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'strategic_advisories' },
        () => {
          fetchAdvisories();
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAdvisories]);

  const getSeverityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical": return "bg-alert-critical text-white";
      case "caution": return "bg-alert-warning text-white";
      case "normal": return "bg-alert-normal text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "traffic": return <MapPin className="w-4 h-4" />;
      case "protest": return <AlertTriangle className="w-4 h-4" />;
      case "terror": return <Shield className="w-4 h-4" />;
      case "weather": return <Cloud className="w-4 h-4" />;
      case "crime": return <AlertTriangle className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "traffic": return "text-primary";
      case "protest": return "text-alert-warning";
      case "terror": return "text-alert-critical";
      case "weather": return "text-blue-500";
      case "crime": return "text-orange-500";
      default: return "text-muted-foreground";
    }
  };

  const categories = ["all", "Traffic", "Protest", "Terror", "Weather", "Crime"];
  
  const filteredAdvisories = filter === "all" 
    ? advisories 
    : advisories.filter(a => a.category?.toLowerCase() === filter.toLowerCase());

  const criticalCount = advisories.filter(a => a.severity?.toLowerCase() === "critical").length;
  const cautionCount = advisories.filter(a => a.severity?.toLowerCase() === "caution").length;

  return (
    <div className="space-y-6 pb-20">
      {/* Live Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-alert-normal animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm text-muted-foreground">
            {isLive ? 'Live Intelligence Feed Active' : 'Connecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{advisories.length}</p>
                <p className="text-xs text-muted-foreground">Active Advisories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-critical/10">
                <Shield className="w-5 h-5 text-alert-critical" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-warning/10">
                <AlertTriangle className="w-5 h-5 text-alert-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{cautionCount}</p>
                <p className="text-xs text-muted-foreground">Caution Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-normal/10">
                <Clock className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {advisories.filter(a => a.status === "Monitoring").length}
                </p>
                <p className="text-xs text-muted-foreground">Being Monitored</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={filter === category ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(category)}
            className="gap-2"
          >
            {category !== "all" && getCategoryIcon(category)}
            {category === "all" ? "All Categories" : category}
            {category !== "all" && (
              <Badge variant="secondary" className="ml-1">
                {advisories.filter(a => a.category?.toLowerCase() === category.toLowerCase()).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Advisories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Advisory List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Strategic Advisories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAdvisories.length > 0 ? (
              filteredAdvisories.map((advisory) => (
                <div
                  key={advisory.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedAdvisory?.id === advisory.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-muted/30'
                  }`}
                  onClick={() => setSelectedAdvisory(advisory)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className={getCategoryColor(advisory.category)}>
                        {getCategoryIcon(advisory.category)}
                      </span>
                      <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                        {advisory.title}
                      </h4>
                    </div>
                    <Badge className={getSeverityColor(advisory.severity)}>
                      {advisory.severity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {advisory.location_scope_hierarchy?.[advisory.location_scope_hierarchy.length - 1] || "Unknown"}
                    </span>
                    <span>{advisory.incident_id}</span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {advisory.description}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(advisory.timestamp_detected), "dd MMM yyyy, HH:mm")}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No advisories in this category</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advisory Detail */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Advisory Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAdvisory ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      {selectedAdvisory.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedAdvisory.incident_id}
                    </p>
                  </div>
                  <Badge className={getSeverityColor(selectedAdvisory.severity)}>
                    {selectedAdvisory.severity}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <div className="flex items-center gap-2">
                      <span className={getCategoryColor(selectedAdvisory.category)}>
                        {getCategoryIcon(selectedAdvisory.category)}
                      </span>
                      <span className="text-sm font-medium">{selectedAdvisory.category}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline">{selectedAdvisory.status}</Badge>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      {selectedAdvisory.location_scope_hierarchy?.join(" → ") || "Unknown"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-foreground">
                    {selectedAdvisory.description}
                  </p>
                </div>

                {selectedAdvisory.recommended_action && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs text-primary font-medium mb-1">Recommended Action</p>
                    <p className="text-sm text-foreground">
                      {selectedAdvisory.recommended_action}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Clock className="w-3 h-3" />
                  Detected: {format(new Date(selectedAdvisory.timestamp_detected), "dd MMM yyyy, HH:mm:ss")}
                </div>

                {selectedAdvisory.sla_breached && (
                  <div className="p-3 bg-alert-critical/10 border border-alert-critical/20 rounded-lg">
                    <p className="text-sm text-alert-critical font-medium">
                      ⚠️ SLA Breached - Escalation Required
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select an advisory to view details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalCount > 0 && (
        <Card className="border-alert-critical/50 bg-alert-critical/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-critical/20">
                <AlertTriangle className="w-5 h-5 text-alert-critical" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''} Active
                </p>
                <p className="text-sm text-muted-foreground">
                  Immediate attention may be required for your operational areas
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setFilter("all")}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientPortalAdvisories;
