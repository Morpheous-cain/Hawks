import { useState, useEffect } from "react";
import { Globe, PlusCircle, FileDown, RefreshCw, Rss, LayoutGrid, List, Radio, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AdvisoryDetailDialog from "@/components/strategic/AdvisoryDetailDialog";
import AdvisoryFilters from "@/components/strategic/AdvisoryFilters";
import AdvisoryCreateDialog from "@/components/strategic/AdvisoryCreateDialog";
import AdvisoryExportDialog from "@/components/strategic/AdvisoryExportDialog";
import AdvisorySLAMonitor from "@/components/strategic/AdvisorySLAMonitor";
import StrategicMapView from "@/components/strategic/StrategicMapView";
import AdvisorySummaryStats from "@/components/strategic/AdvisorySummaryStats";
import AdvisoryFeedList from "@/components/strategic/AdvisoryFeedList";

const StrategicAdvisory = () => {
  const { toast } = useToast();
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [filteredAdvisories, setFilteredAdvisories] = useState<any[]>([]);
  const [selectedAdvisory, setSelectedAdvisory] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"split" | "list">("split");
  const [filters, setFilters] = useState({
    category: "all",
    severity: "all",
    status: "all",
    search: "",
    timeRange: "all"
  });

  const fetchLiveAdvisories = async (silent = false) => {
    setIsFetchingLive(true);
    try {
      if (!silent) {
        toast({ title: "Fetching Live Data", description: "Pulling from NTSA, Kenya Met, US Embassy, DCI Kenya, Kenyan media..." });
      }
      const { data, error } = await supabase.functions.invoke('fetch-advisories');
      if (error) throw error;
      if (data?.success) {
        setLastLiveUpdate(new Date());
        if (!silent && data.count > 0) {
          toast({ title: "Live Data Updated", description: `${data.count} new advisories from ${data.sources?.length} sources` });
        }
        fetchAdvisories();
      } else {
        throw new Error(data?.error || 'Failed to fetch live data');
      }
    } catch (error: any) {
      console.error('Live fetch error:', error);
      if (!silent) {
        toast({ title: "Live Fetch Error", description: error.message || "Could not fetch live advisories", variant: "destructive" });
      }
    } finally {
      setIsFetchingLive(false);
    }
  };

  const fetchAdvisories = async () => {
    try {
      // Fetch advisories from the last 96 hours
      const cutoff = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("strategic_advisories")
        .select("*")
        .gte("timestamp_detected", cutoff)
        .order("timestamp_detected", { ascending: false });
      if (error) throw error;
      setAdvisories(data || []);
    } catch (error: any) {
      toast({ title: "Error loading advisories", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch from DB + live sources, then auto-fetch live every 90 seconds
  useEffect(() => {
    fetchAdvisories();
    fetchLiveAdvisories(true);

    const interval = setInterval(() => {
      console.log("[Strategic Advisory] Auto-fetching live data (90s cycle)...");
      fetchLiveAdvisories(true);
    }, 90000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("strategic-advisories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "strategic_advisories" }, (payload) => {
        console.log("[Strategic Advisory] Realtime update received:", payload.eventType);
        fetchAdvisories();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Apply all filters
  useEffect(() => {
    let filtered = [...advisories];
    if (activeCategory !== "all") filtered = filtered.filter(a => a.category === activeCategory);
    if (filters.category !== "all") filtered = filtered.filter(a => a.category === filters.category);
    if (filters.severity !== "all") filtered = filtered.filter(a => a.severity === filters.severity);
    if (filters.status !== "all") filtered = filtered.filter(a => a.status === filters.status);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(search) ||
        a.description?.toLowerCase().includes(search) ||
        a.incident_id?.toLowerCase().includes(search)
      );
    }
    setFilteredAdvisories(filtered);
  }, [advisories, filters, activeCategory]);

  const criticalCount = advisories.filter(a => a.severity === "CRITICAL" && a.status === "Active").length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ── */}
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Title + live badge */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Strategic Advisory</h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-alert-normal/10 border border-alert-normal/20">
                    <Radio className="w-3 h-3 text-alert-normal animate-pulse" />
                    <span className="text-[11px] font-semibold text-alert-normal uppercase tracking-wider">Live</span>
                  </div>
                  {criticalCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-alert-critical/10 border border-alert-critical/20 animate-pulse">
                      <span className="text-[11px] font-bold text-alert-critical">{criticalCount} CRITICAL</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Real-time intelligence · NTSA, Kenya Met, US Embassy, DCI Kenya
                  </span>
                  {lastLiveUpdate && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                      <Clock className="w-3 h-3" />
                      {lastLiveUpdate.toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View toggle */}
              <div className="flex rounded-lg border border-border/40 overflow-hidden bg-card/50">
                <button
                  onClick={() => setViewMode("split")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                    viewMode === "split"
                      ? "bg-primary/15 text-primary border-r border-primary/20"
                      : "text-muted-foreground hover:text-foreground border-r border-border/40"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Map
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  List
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLiveAdvisories(false)}
                disabled={isFetchingLive}
                className="h-8 text-xs border-border/40"
              >
                {isFetchingLive ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Rss className="w-3.5 h-3.5 mr-1.5" />}
                {isFetchingLive ? "Fetching…" : "Refresh"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)} className="h-8 text-xs border-border/40">
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Create
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowExportDialog(true)} className="h-8 text-xs">
                <FileDown className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 space-y-4">
        {/* ── Summary Stats ── */}
        <AdvisorySummaryStats
          advisories={advisories}
          onCategoryClick={setActiveCategory}
          activeCategory={activeCategory}
        />

        {/* ── Filters ── */}
        <AdvisoryFilters
          filters={filters}
          onFilterChange={setFilters}
          activeCount={Object.values(filters).filter(v => v !== "all" && v !== "").length}
        />

        {/* ── SLA Monitor (only if needed) ── */}
        <AdvisorySLAMonitor advisories={advisories} onAdvisoryClick={setSelectedAdvisory} />

        {/* ── Main Content ── */}
        {viewMode === "split" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Map */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Intelligence Map</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {filteredAdvisories.length} markers
                  </span>
                </div>
                <div className="h-[560px]">
                  <StrategicMapView advisories={filteredAdvisories} onMarkerClick={setSelectedAdvisory} />
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Advisory Feed</span>
                    {activeCategory !== "all" && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                        {activeCategory}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {filteredAdvisories.length}
                  </span>
                </div>
                <div className="p-2">
                  <AdvisoryFeedList advisories={filteredAdvisories} onAdvisoryClick={setSelectedAdvisory} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">All Advisories</span>
                {activeCategory !== "all" && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                    {activeCategory}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {filteredAdvisories.length} results
              </span>
            </div>
            <div className="p-2">
              <AdvisoryFeedList advisories={filteredAdvisories} onAdvisoryClick={setSelectedAdvisory} fullWidth />
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedAdvisory && (
        <AdvisoryDetailDialog
          advisory={selectedAdvisory}
          open={!!selectedAdvisory}
          onOpenChange={(open) => !open && setSelectedAdvisory(null)}
          onUpdate={fetchAdvisories}
        />
      )}
      <AdvisoryCreateDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={fetchAdvisories} />
      <AdvisoryExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} advisories={filteredAdvisories} />
    </div>
  );
};

export default StrategicAdvisory;
