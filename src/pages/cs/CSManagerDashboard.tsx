import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { MessageSquare, Ticket, AlertTriangle, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  openTickets: number;
  resolvedToday: number;
  openComplaints: number;
  escalatedComplaints: number;
  inProgressTickets: number;
  pendingClientTickets: number;
}

interface RecentTicket {
  id: string;
  ticket_number: string | null;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  client_name: string | null;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending_client: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const CSManagerDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0, resolvedToday: 0, openComplaints: 0,
    escalatedComplaints: 0, inProgressTickets: 0, pendingClientTickets: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const [openRes, resolvedRes, complaintsRes, escalatedRes, recentRes] = await Promise.all([
      supabase.from("support_tickets").select("id, status").in("status", ["open", "in_progress", "pending_client"]).is("deleted_at", null),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "resolved").gte("resolved_at", todayStart).is("deleted_at", null),
      supabase.from("client_complaints").select("id", { count: "exact", head: true }).not("status", "in", '("resolved","closed")').is("deleted_at", null),
      supabase.from("client_complaints").select("id", { count: "exact", head: true }).eq("escalated", true).not("status", "in", '("resolved","closed")').is("deleted_at", null),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("support_tickets") as any).select("id, ticket_number, subject, priority, status, created_at, clients(legal_name)").is("deleted_at", null).order("created_at", { ascending: false }).limit(8),
    ]);

    const openData = openRes.data ?? [];
    setStats({
      openTickets: openData.filter((t) => t.status === "open").length,
      inProgressTickets: openData.filter((t) => t.status === "in_progress").length,
      pendingClientTickets: openData.filter((t) => t.status === "pending_client").length,
      resolvedToday: resolvedRes.count ?? 0,
      openComplaints: complaintsRes.count ?? 0,
      escalatedComplaints: escalatedRes.count ?? 0,
    });

    setRecentTickets(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recentRes.data ?? []).map((t: any) => ({
        ...t,
        client_name: t.clients?.legal_name ?? null,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpiCards = [
    { label: "Open Tickets", value: stats.openTickets, icon: Ticket, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "In Progress", value: stats.inProgressTickets, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pending Client", value: stats.pendingClientTickets, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Resolved Today", value: stats.resolvedToday, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Open Complaints", value: stats.openComplaints, icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Escalated", value: stats.escalatedComplaints, icon: TrendingUp, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Service Dashboard"
        description="Live overview of support tickets, complaints and team performance"
        icon={MessageSquare}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-4 border-border">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Tickets</h3>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
          ) : recentTickets.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No tickets yet.</div>
          ) : recentTickets.map((t) => (
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

export default CSManagerDashboard;
