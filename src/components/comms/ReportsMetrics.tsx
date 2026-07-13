import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Phone, MessageCircle, CheckCircle } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { startOfDay, endOfDay, subDays } from "date-fns";

const ReportsMetrics = () => {
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const startYesterday = startOfDay(subDays(today, 1));
  const endYesterday = endOfDay(subDays(today, 1));

  const { data: todayCalls } = useQuery({
    queryKey: ["calls-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .gte("started_at", startToday.toISOString())
        .lte("started_at", endToday.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const { data: yesterdayCalls } = useQuery({
    queryKey: ["calls-yesterday"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .gte("started_at", startYesterday.toISOString())
        .lte("started_at", endYesterday.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const { data: todayTickets } = useQuery({
    queryKey: ["tickets-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communication_tickets")
        .select("*")
        .gte("created_at", startToday.toISOString())
        .lte("created_at", endToday.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const avgCallDuration = todayCalls?.length
    ? todayCalls.reduce((acc, call) => acc + (call.duration_seconds || 0), 0) / todayCalls.filter(c => c.duration_seconds).length
    : 0;

  const callsAnswered = todayCalls?.filter(c => c.status === 'ended').length || 0;
  const callsMissed = todayCalls?.filter(c => c.status === 'missed').length || 0;
  const callsAbandoned = todayCalls?.filter(c => c.status === 'abandoned').length || 0;

  const ticketsResolved = todayTickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;
  const ticketsOpen = todayTickets?.filter(t => t.status !== 'resolved' && t.status !== 'closed').length || 0;

  const avgResponseTime = 8; // Placeholder - would calculate from actual data

  const calculateTrend = (today: number, yesterday: number) => {
    if (!yesterday) return 0;
    return ((today - yesterday) / yesterday) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Communication Performance Metrics
        </h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Calls Today"
          value={todayCalls?.length || 0}
          icon={Phone}
          trend={`${calculateTrend(todayCalls?.length || 0, yesterdayCalls?.length || 0) > 0 ? '+' : ''}${Math.round(calculateTrend(todayCalls?.length || 0, yesterdayCalls?.length || 0))}% vs yesterday`}
          status="normal"
        />
        <StatsCard
          title="Calls Answered"
          value={callsAnswered}
          icon={CheckCircle}
          status="normal"
        />
        <StatsCard
          title="Calls Missed"
          value={callsMissed}
          icon={Phone}
          status={callsMissed > 5 ? "caution" : "normal"}
        />
        <StatsCard
          title="Avg Response Time"
          value={`${avgResponseTime}s`}
          icon={Clock}
          status={avgResponseTime > 15 ? "caution" : "normal"}
        />
        <StatsCard
          title="Tickets Created"
          value={todayTickets?.length || 0}
          icon={MessageCircle}
          status="normal"
        />
        <StatsCard
          title="Tickets Resolved"
          value={ticketsResolved}
          icon={CheckCircle}
          status="normal"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Call Statistics
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Total Calls</span>
              <span className="text-lg font-bold">{todayCalls?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Answered</span>
              <span className="text-lg font-bold text-alert-normal">{callsAnswered}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Missed</span>
              <span className="text-lg font-bold text-alert-critical">{callsMissed}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Abandoned</span>
              <span className="text-lg font-bold text-destructive">{callsAbandoned}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Avg Duration</span>
              <span className="text-lg font-bold">{Math.round(avgCallDuration)}s</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Ticket Statistics
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Total Tickets</span>
              <span className="text-lg font-bold">{todayTickets?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Open Tickets</span>
              <span className="text-lg font-bold text-alert-caution">{ticketsOpen}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Resolved Today</span>
              <span className="text-lg font-bold text-alert-normal">{ticketsResolved}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Phone Channel</span>
              <span className="text-lg font-bold">{todayTickets?.filter(t => t.channel === 'phone').length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">WhatsApp Channel</span>
              <span className="text-lg font-bold">{todayTickets?.filter(t => t.channel === 'whatsapp').length || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Performance Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Answer Rate</div>
            <div className="text-2xl font-bold text-alert-normal">
              {todayCalls?.length ? Math.round((callsAnswered / todayCalls.length) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Target: &gt;95%
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Resolution Rate</div>
            <div className="text-2xl font-bold text-alert-normal">
              {todayTickets?.length ? Math.round((ticketsResolved / todayTickets.length) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Target: &gt;85%
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">SLA Compliance</div>
            <div className="text-2xl font-bold text-alert-normal">
              98%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Target: &gt;95%
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsMetrics;