import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, PhoneMissed, Clock, Users, AlertCircle, PhoneOff } from "lucide-react";
import { format } from "date-fns";
import StatsCard from "@/components/StatsCard";

const LiveCallsDashboard = () => {
  const { data: calls, isLoading } = useQuery({
    queryKey: ["live-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select("*, assigned_operator:profiles(full_name)")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: operators } = useQuery({
    queryKey: ["operator-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operator_statuses")
        .select("*, operator:profiles(full_name)")
        .order("status_changed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const stats = {
    incoming: calls?.filter(c => c.status === 'ringing').length || 0,
    active: calls?.filter(c => c.status === 'on_call').length || 0,
    missed: calls?.filter(c => c.status === 'missed' && new Date(c.started_at) > new Date(Date.now() - 3600000)).length || 0,
    abandoned: calls?.filter(c => c.status === 'abandoned').length || 0,
    operatorsLoggedIn: operators?.filter(o => o.status !== 'logged_out').length || 0,
    operatorsAvailable: operators?.filter(o => o.status === 'available').length || 0,
  };

  const statusColors = {
    ringing: "bg-alert-caution text-alert-caution",
    on_call: "bg-alert-normal text-alert-normal",
    on_hold: "bg-primary text-primary",
    ended: "bg-muted text-muted-foreground",
    missed: "bg-alert-critical text-alert-critical",
    abandoned: "bg-destructive text-destructive-foreground",
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-alert-normal text-alert-normal",
    high: "bg-alert-caution text-alert-caution",
    emergency: "bg-alert-critical text-alert-critical",
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Incoming Calls"
          value={stats.incoming}
          icon={Phone}
          status={stats.incoming > 0 ? "caution" : "normal"}
        />
        <StatsCard
          title="Active Calls"
          value={stats.active}
          icon={Phone}
          status="normal"
        />
        <StatsCard
          title="Missed (Last Hour)"
          value={stats.missed}
          icon={PhoneMissed}
          status={stats.missed > 3 ? "critical" : "normal"}
        />
        <StatsCard
          title="Abandoned Today"
          value={stats.abandoned}
          icon={PhoneOff}
          status={stats.abandoned > 5 ? "caution" : "normal"}
        />
        <StatsCard
          title="Operators Logged In"
          value={stats.operatorsLoggedIn}
          icon={Users}
          status="normal"
        />
        <StatsCard
          title="Operators Available"
          value={stats.operatorsAvailable}
          icon={Users}
          status={stats.operatorsAvailable === 0 ? "critical" : "normal"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Calls Table */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Live Call Feed
          </h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Caller</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading calls...
                    </TableCell>
                  </TableRow>
                ) : calls?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No active calls
                    </TableCell>
                  </TableRow>
                ) : (
                  calls?.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(call.started_at), "HH:mm")}
                      </TableCell>
                      <TableCell>{call.caller_name || "Unknown"}</TableCell>
                      <TableCell className="font-mono text-sm">{call.caller_number}</TableCell>
                      <TableCell>{call.source_line}</TableCell>
                      <TableCell>{call.assigned_operator?.full_name || "Unassigned"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[call.status as keyof typeof statusColors]}>
                          {call.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[call.priority as keyof typeof priorityColors]}>
                          {call.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.status === 'ringing' && (
                          <Button size="sm" variant="default">Answer</Button>
                        )}
                        {call.status === 'on_call' && (
                          <Button size="sm" variant="outline">View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Operator Status Panel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Operator Status
          </h3>
          <div className="space-y-3">
            {operators?.map((op) => (
              <div key={op.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{op.operator?.full_name}</span>
                  <Badge variant={op.status === 'available' ? 'default' : 'outline'}>
                    {op.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(op.status_changed_at), "HH:mm")}
                  </span>
                  <span>Calls: {op.calls_handled_today}</span>
                </div>
              </div>
            ))}
            {!operators || operators.length === 0 && (
              <div className="text-center py-4 text-muted-foreground flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No operators online
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LiveCallsDashboard;