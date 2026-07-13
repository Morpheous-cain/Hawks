import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardCheck, Plus, Search, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AttRow { id: string; staff_id: string; site: string; check_in: string; check_out: string | null; shift_type: string | null; status: string | null; notes: string | null; staff?: { full_name: string; staff_id: string } | null; }

export default function HRAttendance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AttRow[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: "", site: "Westlands HQ", shift_type: "day", status: "present", notes: "" });

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("att-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => fetchRows())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchAll = async () => { await Promise.all([fetchRows(), fetchStaff()]); setLoading(false); };
  const fetchRows = async () => {
    const { data } = await supabase.from("attendance").select("*, staff:staff_id(full_name, staff_id)").order("check_in", { ascending: false }).limit(200);
    setRows((data as any) || []);
  };
  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("id, full_name, staff_id").eq("status", "active").order("full_name");
    setStaff(data || []);
  };

  const onCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id || !form.site) { toast.error("Staff and site are required"); return; }
    const { error } = await supabase.from("attendance").insert([{ ...form, check_in: new Date().toISOString() }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Check-in recorded");
    setOpen(false); setForm({ staff_id: "", site: "Westlands HQ", shift_type: "day", status: "present", notes: "" });
  };

  const onCheckOut = async (id: string) => {
    const { error } = await supabase.from("attendance").update({ check_out: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Check-out recorded");
  };

  const filtered = useMemo(() => rows.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !`${r.staff?.full_name ?? ""} ${r.site}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [rows, search, statusFilter]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter(r => r.check_in?.slice(0, 10) === today).length;
  const onDuty = rows.filter(r => !r.check_out).length;
  const lateCount = rows.filter(r => r.status === "late").length;

  if (loading) return <LoadingPulse />;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Attendance & Timesheets" description="Live officer attendance, check-ins and timesheet history." icon={ClipboardCheck} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Today's Check-ins</div><div className="text-2xl font-semibold">{todayCount}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Currently On Duty</div><div className="text-2xl font-semibold">{onDuty}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Late Arrivals</div><div className="text-2xl font-semibold">{lateCount}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Records</div><div className="text-2xl font-semibold">{rows.length}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Attendance Log</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8 w-48" placeholder="Search staff or site" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Check-in</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record Check-in</DialogTitle></DialogHeader>
                  <form onSubmit={onCheckIn} className="space-y-3">
                    <div><Label>Staff</Label>
                      <Select value={form.staff_id} onValueChange={v => setForm({ ...form, staff_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select officer" /></SelectTrigger>
                        <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Site</Label><Input value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Shift</Label>
                        <Select value={form.shift_type} onValueChange={v => setForm({ ...form, shift_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="day">Day</SelectItem><SelectItem value="night">Night</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><Label>Status</Label>
                        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="present">Present</SelectItem><SelectItem value="late">Late</SelectItem><SelectItem value="absent">Absent</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Record</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Officer</TableHead><TableHead>Site</TableHead><TableHead>Shift</TableHead>
                <TableHead>Check-in</TableHead><TableHead>Check-out</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>
                ) : filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.staff?.full_name ?? "—"}</TableCell>
                    <TableCell>{r.site}</TableCell>
                    <TableCell><Badge variant="outline">{r.shift_type ?? "—"}</Badge></TableCell>
                    <TableCell className="text-xs">{format(new Date(r.check_in), "dd MMM HH:mm")}</TableCell>
                    <TableCell className="text-xs">{r.check_out ? format(new Date(r.check_out), "dd MMM HH:mm") : <Badge>On duty</Badge>}</TableCell>
                    <TableCell><Badge variant={r.status === "late" ? "destructive" : "default"}>{r.status}</Badge></TableCell>
                    <TableCell>{!r.check_out && <Button size="sm" variant="outline" onClick={() => onCheckOut(r.id)}><Clock className="h-3 w-3 mr-1" />Out</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
