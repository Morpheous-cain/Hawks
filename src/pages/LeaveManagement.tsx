import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

export default function LeaveManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: "", leave_type: "annual", start_date: "", end_date: "", reason: "",
  });

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('leave-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_records' }, () => fetchRecords())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchRecords(), fetchStaff()]);
    setLoading(false);
  };

  const fetchRecords = async () => {
    const { data } = await supabase.from("leave_records")
      .select("*, staff:staff_id(full_name, staff_id)")
      .order("created_at", { ascending: false });
    setRecords(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("id, full_name, staff_id").eq("status", "active");
    setStaff(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1;
    if (days <= 0) { toast.error("End date must be after start date"); return; }
    const { error } = await supabase.from("leave_records").insert([{
      staff_id: formData.staff_id,
      leave_type: formData.leave_type as any,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
      days_count: days,
      created_by: user?.id,
      status: "pending",
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Leave request submitted");
    setOpen(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === 'approved') update.approved_by = user?.id;
    const { error } = await supabase.from("leave_records").update(update).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Leave ${status}`); fetchRecords(); }
  };

  if (loading) return <LoadingPulse />;

  const filtered = records.filter(r => {
    const matchSearch = r.staff?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pending = records.filter(r => r.status === 'pending').length;
  const approved = records.filter(r => r.status === 'approved').length;
  const rejected = records.filter(r => r.status === 'rejected').length;

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary", approved: "default", rejected: "destructive",
    };
    return <Badge variant={map[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={CalendarDays} title="Leave & HR Management" description="Leave requests, approvals, and availability tracking" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Request Leave</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Staff Member *</Label>
                <Select required value={formData.staff_id} onValueChange={v => setFormData({ ...formData, staff_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Leave Type *</Label>
                <Select value={formData.leave_type} onValueChange={v => setFormData({ ...formData, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem><SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem><SelectItem value="paternity">Paternity</SelectItem>
                    <SelectItem value="compassionate">Compassionate</SelectItem><SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Start Date *</Label><Input type="date" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>End Date *</Label><Input type="date" required value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Reason</Label><Textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for leave..." /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{approved}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" />Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{rejected}</div></CardContent></Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead>
                <TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No leave records found</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.staff?.full_name || "N/A"}</TableCell>
                  <TableCell className="capitalize">{r.leave_type?.replace('_', ' ')}</TableCell>
                  <TableCell>{r.start_date ? format(new Date(r.start_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>{r.end_date ? format(new Date(r.end_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>{r.days_count}</TableCell>
                  <TableCell>{statusBadge(r.status || "pending")}</TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" onClick={() => updateStatus(r.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, 'rejected')}>Reject</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
