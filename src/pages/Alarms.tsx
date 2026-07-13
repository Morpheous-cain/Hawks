import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Bell, AlertTriangle, Flame, DoorOpen, Radio, Activity, MapPin, Clock, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AlarmTriggerDialog from "@/components/AlarmTriggerDialog";
import AlarmResponseWorkflow from "@/components/AlarmResponseWorkflow";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import AlarmCommandInsights, { type AlarmFilters } from "@/components/alarms/AlarmCommandInsights";
import AlarmResolveDialog from "@/components/alarms/AlarmResolveDialog";
import { useAlarms } from "@/hooks/useAlarms";

// Haversine distance in km — pure helper, kept local to the page.
const distanceKm = (lat1?: number, lng1?: number, lat2?: number, lng2?: number) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const Alarms = () => {
  // All data + actions come from the reusable hook.
  const { vehicles, alarmActivations, sensors, loading, acknowledge, dispatch, resolve } = useAlarms();

  const [filters, setFilters] = useState<AlarmFilters>({ search: "", priority: "all", type: "all", status: "all" });
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; alarm: any | null; mode: "resolve" | "false_alarm" }>({ open: false, alarm: null, mode: "resolve" });

  // Filtered alarms based on filter bar
  const filteredAlarms = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return alarmActivations.filter((a) => {
      if (filters.priority !== "all" && (a.priority || "").toLowerCase() !== filters.priority) return false;
      if (filters.type !== "all" && (a.alarm_type || "").toLowerCase() !== filters.type) return false;
      if (filters.status !== "all" && (a.status || "").toLowerCase() !== filters.status) return false;
      if (q && !(`${a.alarm_number} ${a.location} ${a.alarm_type}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [alarmActivations, filters]);

  // Sort vehicles by proximity to a given alarm
  const vehiclesByProximity = (alarm: any, includeResponding = false) => {
    const pool = vehicles.filter((v) => v.status === "available" || (includeResponding && v.status === "responding"));
    const withDist = pool.map((v) => ({
      ...v,
      _distKm: distanceKm(alarm.gps_lat, alarm.gps_lng, v.last_gps_lat, v.last_gps_lng),
    }));
    withDist.sort((a: any, b: any) => {
      if (a._distKm == null && b._distKm == null) return 0;
      if (a._distKm == null) return 1;
      if (b._distKm == null) return -1;
      return a._distKm - b._distKm;
    });
    return withDist;
  };




  // Calculate sensor statistics by site
  const sensorStats = sensors.reduce((acc: any, sensor) => {
    const siteName = sensor.location_description.split(' - ')[0] || 'Unknown Site';
    if (!acc[siteName]) {
      acc[siteName] = { site: siteName, fire: 0, panic: 0, intrusion: 0, status: 'operational' };
    }
    if (sensor.sensor_type === 'fire') acc[siteName].fire++;
    if (sensor.sensor_type === 'panic') acc[siteName].panic++;
    if (sensor.sensor_type === 'intrusion') acc[siteName].intrusion++;
    if (sensor.status === 'maintenance' || sensor.status === 'faulty') {
      acc[siteName].status = sensor.status;
    }
    return acc;
  }, {});

  const sensorStatusBySite = Object.values(sensorStats);

  const priorityConfig = {
    critical: "border-l-4 border-alert-critical bg-alert-critical/5",
    caution: "border-l-4 border-alert-caution bg-alert-caution/5",
    normal: "border-l-4 border-alert-normal bg-alert-normal/5",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading control room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Alarm & Sensor Integration + Mobile Response Network"
          description="Fire, panic, intrusion feeds with auto-dispatch | Real-time vehicle tracking & emergency response"
          icon={Radio}
        />
        <AlarmTriggerDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-alert-critical bg-alert-critical/10 shadow-[0_0_30px_hsl(var(--alert-critical)/0.4)] hover:shadow-glow-strong transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-critical/20">
              <AlertTriangle className="w-8 h-8 text-alert-critical" />
            </div>
            <div>
              <p className="text-xs text-primary/70 uppercase tracking-wide">Active Alarms</p>
              <p className="text-4xl font-bold text-foreground">{alarmActivations.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 border-alert-caution bg-alert-caution/10 shadow-[0_0_30px_hsl(var(--alert-caution)/0.3)] hover:shadow-glow-strong transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-caution/20">
              <Flame className="w-8 h-8 text-alert-caution" />
            </div>
            <div>
              <p className="text-xs text-primary/70 uppercase tracking-wide">Fire Sensors</p>
              <p className="text-4xl font-bold text-foreground">
                {sensors.filter(s => s.sensor_type === 'fire').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 border-primary bg-primary/10 shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-glow-strong transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-xs text-primary/70 uppercase tracking-wide">Panic Buttons</p>
              <p className="text-4xl font-bold text-foreground">
                {sensors.filter(s => s.sensor_type === 'panic').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 border-accent bg-accent/10 shadow-[0_0_30px_hsl(var(--accent)/0.3)] hover:shadow-glow-strong transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <DoorOpen className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-xs text-primary/70 uppercase tracking-wide">Intrusion</p>
              <p className="text-4xl font-bold text-foreground">
                {sensors.filter(s => s.sensor_type === 'intrusion').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Command Insights: 24h KPIs, Sensor Health, Filters */}
      <AlarmCommandInsights sensors={sensors} filters={filters} onFiltersChange={setFilters} />

      {/* Active Alarms */}
      <Card className="p-4 border-2 border-primary/50 bg-card shadow-glow">
        <h3 className="font-semibold text-foreground mb-4 text-lg uppercase tracking-wide flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Active Alarms - Immediate Attention Required (BH-MDT-MRT-2025)
          <Badge variant="outline" className="ml-2">{filteredAlarms.length} / {alarmActivations.length}</Badge>
        </h3>
        {filteredAlarms.length === 0 ? (
          <p className="text-foreground font-medium text-center py-8">
            {alarmActivations.length === 0 ? "No active alarms at this time" : "No alarms match the current filters"}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredAlarms.map((alarm) => {
              const priorityClass = alarm.priority === "high" || alarm.priority === "critical"
                ? "border-l-4 border-alert-critical bg-alert-critical/10 shadow-[0_0_15px_hsl(var(--alert-critical)/0.3)]"
                : alarm.priority === "medium"
                ? "border-l-4 border-alert-caution bg-alert-caution/10 shadow-[0_0_15px_hsl(var(--alert-caution)/0.3)]"
                : "border-l-4 border-alert-normal bg-alert-normal/10 shadow-[0_0_15px_hsl(var(--alert-normal)/0.3)]";

              const dispatchPool = vehiclesByProximity(alarm, false);
              const reassignPool = vehiclesByProximity(alarm, true);

              return (
                <div key={alarm.id} className={`p-4 rounded-lg ${priorityClass} border border-border/50 hover:shadow-glow transition-all`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-foreground text-lg">{alarm.alarm_number}</p>
                        <Badge className={`${
                          alarm.priority === "high" || alarm.priority === "critical"
                            ? "bg-alert-critical"
                            : alarm.priority === "medium"
                            ? "bg-alert-caution"
                            : "bg-alert-normal"
                        } text-primary-foreground`}>
                          {alarm.priority?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {alarm.status}
                        </Badge>
                        {alarm.alarm_source && (
                          <Badge variant="secondary">{alarm.alarm_source}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm font-medium text-foreground/90 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alarm.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(alarm.triggered_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-foreground/90 mt-2">
                        <strong>Type:</strong> {alarm.alarm_type}
                        {alarm.gps_lat && alarm.gps_lng && (
                          <> | <strong>GPS:</strong> {alarm.gps_lat}, {alarm.gps_lng}</>
                        )}
                      </div>
                    </div>

                    {alarm.sla_deadline && (
                      <SLAStatusBadge 
                        triggeredAt={alarm.triggered_at}
                        slaDeadline={alarm.sla_deadline}
                        status={alarm.status}
                      />
                    )}
                  </div>

                  {alarm.status === "arrived" && (
                    <div className="my-3">
                      <AlarmResponseWorkflow alarm={alarm} />
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap mt-3">
                    {alarm.status === "active" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => acknowledge(alarm.id)}
                        >
                          Acknowledge
                        </Button>
                        <Select onValueChange={(vehicleId) => dispatch(alarm.id, vehicleId)}>
                          <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="Dispatch nearest unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {dispatchPool.length === 0 && (
                              <SelectItem value="__none" disabled>No available units</SelectItem>
                            )}
                            {dispatchPool.map((vehicle: any, idx: number) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                <span className="flex items-center gap-2">
                                  {idx === 0 && vehicle._distKm != null && <Star className="w-3 h-3 text-alert-caution" />}
                                  {vehicle.call_sign || vehicle.vehicle_id} · {vehicle.vehicle_type}
                                  {vehicle._distKm != null && (
                                    <span className="text-xs text-muted-foreground">({vehicle._distKm.toFixed(1)} km)</span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    {(alarm.status === "acknowledged" || alarm.status === "dispatched") && (
                      <Select onValueChange={(vehicleId) => dispatch(alarm.id, vehicleId)}>
                        <SelectTrigger className="w-[260px]">
                          <SelectValue placeholder="Assign / reassign nearest" />
                        </SelectTrigger>
                        <SelectContent>
                          {reassignPool.length === 0 && (
                            <SelectItem value="__none" disabled>No units available</SelectItem>
                          )}
                          {reassignPool.map((vehicle: any, idx: number) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              <span className="flex items-center gap-2">
                                {idx === 0 && vehicle._distKm != null && <Star className="w-3 h-3 text-alert-caution" />}
                                {vehicle.call_sign || vehicle.vehicle_id} · {vehicle.vehicle_type}
                                {vehicle._distKm != null && (
                                  <span className="text-xs text-muted-foreground">({vehicle._distKm.toFixed(1)} km)</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {alarm.status === "arrived" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => setResolveDialog({ open: true, alarm, mode: "resolve" })}
                        >
                          Mark Resolved
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setResolveDialog({ open: true, alarm, mode: "false_alarm" })}
                        >
                          False Alarm
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Sensor Status by Site */}
      <Card className="p-4 border-2 border-primary/50 bg-card shadow-glow">
        <h3 className="font-semibold text-foreground mb-4 text-lg uppercase tracking-wide flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Sensor Status by Site
        </h3>
        {sensorStatusBySite.length === 0 ? (
          <p className="text-foreground font-medium text-center py-8">No sensor data available</p>
        ) : (
          <div className="space-y-3">
            {sensorStatusBySite.map((site: any) => (
              <div key={site.site} className="p-4 bg-muted/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-foreground">{site.site}</p>
                  <Badge className={site.status === "operational" ? "bg-alert-normal text-background shadow-glow" : "bg-alert-caution text-background shadow-glow"}>
                    {site.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-primary">Fire Sensors</p>
                    <p className="text-lg font-bold text-foreground">{site.fire}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary">Panic Buttons</p>
                    <p className="text-lg font-bold text-foreground">{site.panic}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary">Intrusion</p>
                    <p className="text-lg font-bold text-foreground">{site.intrusion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AlarmResolveDialog
        open={resolveDialog.open}
        onOpenChange={(open) => setResolveDialog((s) => ({ ...s, open }))}
        alarm={resolveDialog.alarm}
        mode={resolveDialog.mode}
        onConfirm={(alarmId, notes, isFalse) => resolve(alarmId, notes, isFalse)}
      />
    </div>
  );
};

export default Alarms;
