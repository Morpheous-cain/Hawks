import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface CSStaffMember {
  id: string;
  email: string | null;
  role: string;
  full_name: string | null;
  open_tickets: number;
}

const CSTeam = () => {
  const [officers, setOfficers] = useState<CSStaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    setLoading(true);

    // Fetch all users with CS roles
    const { data: roleRows, error } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["customer_service_officer", "customer_service_manager"]);

    if (error || !roleRows?.length) {
      setOfficers([]);
      setLoading(false);
      return;
    }

    const userIds = roleRows.map((r) => r.user_id);

    // Fetch profiles for those users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    // Fetch open ticket counts per assigned user
    const { data: ticketData } = await supabase
      .from("support_tickets")
      .select("assigned_to")
      .in("assigned_to", userIds)
      .in("status", ["open", "in_progress", "pending_client"])
      .is("deleted_at", null);

    const ticketCounts: Record<string, number> = {};
    (ticketData ?? []).forEach((t: any) => {
      if (t.assigned_to) ticketCounts[t.assigned_to] = (ticketCounts[t.assigned_to] ?? 0) + 1;
    });

    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

    setOfficers(
      roleRows.map((r) => ({
        id: r.user_id,
        email: profileMap[r.user_id]?.email ?? null,
        full_name: profileMap[r.user_id]?.full_name ?? null,
        role: r.role,
        open_tickets: ticketCounts[r.user_id] ?? 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const filtered = officers.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (o.email ?? "").toLowerCase().includes(q) || (o.full_name ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description="Customer service officers — ticket load and role assignments"
        icon={Users}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-border overflow-hidden">
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading team…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {officers.length === 0
                ? "No CS officers provisioned yet. Assign roles via System Admin."
                : "No results match your search."}
            </div>
          ) : filtered.map((officer) => (
            <div key={officer.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">
                  {officer.full_name ?? officer.email ?? officer.id.slice(0, 8)}
                </p>
                {officer.email && officer.full_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{officer.email}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    officer.role === "customer_service_manager"
                      ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                      : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {officer.role === "customer_service_manager" ? "Manager" : "Officer"}
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{officer.open_tickets}</p>
                  <p className="text-[10px] text-muted-foreground">open tickets</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CSTeam;
