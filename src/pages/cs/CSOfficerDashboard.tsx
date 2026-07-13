import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Headphones, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OfficerStats {
  openCount: number;
  inProgressCount: number;
  pendingClientCount: number;
  resolvedTodayCount: number;
}

interface AssignedTicket {
  id: string;
  ticket_number: string | null;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  client_name: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending_client: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const CSOfficerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OfficerStats>({ openCount: 0, inProgressCount: 0, pendingClientCount: 0, resolvedTodayCount: 0 });
  const [tickets, setTickets] = useState<AssignedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const [activeRes, resolvedRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("support_tickets") as any)
        .select("id, ticket_number, subject, priority, status, created_at, clients(legal_name)")
        .eq("assigned_to", user.id)
        .in("status", ["open", "in_progress", "pending_client"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", user.id)
        .eq("status", "resolved")
        .gte("resolved_at", todayStart)
        .is("deleted_at", null),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeData: any[] = activeRes.data ?? [];
    setStats({
      openCount: activeData.filter((t: any) => t.status === "open").length,
      inProgressCount: activeData.filter((t: any) => t.status === "in_progress").length,
      pendingClientCount: activeData.filter((t: any) => t.status === "pending_client").length,
      resolvedTodayCount: resolvedRes.count ?? 0,
    });
    setTickets(activeData.map((t: any) => ({ ...t, client_name: t.clients?.legal_name ?? null })));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpiCards = [
    { label: "Open", value: stats.openCount, icon: MessageSquare, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "In Progress", value: stats.inProgressCount, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pending Client", value: stats.pendingClientCount, icon: Headphones, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Resolved Today", value: stats.resolvedTodayCount, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description="Your assigned support tickets and today's performance"
        icon={Headphones}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-4 border-border">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">My Active Tickets</h3>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No active tickets assigned to you.</div>
          ) : tickets.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.ticket_number ?? t.id.slice(0, 8)} · {t.client_name ?? "No client"} · {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLOR[t.priority] ?? ""}`}>
                  {t.priority}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[t.status] ?? ""}`}>
                  {t.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CSOfficerDashboard;
