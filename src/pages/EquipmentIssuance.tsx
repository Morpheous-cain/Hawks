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
import { Package, Plus, Search, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EquipmentIssuance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: "", item_name: "", item_type: "radio", serial_number: "",
    quantity: 1, condition: "good", notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchRecords(), fetchStaff()]);
    setLoading(false);
  };

  const fetchRecords = async () => {
    const { data } = await supabase.from("documents")
      .select("*")
      .eq("category", "operational")
      .order("created_at", { ascending: false });
    setRecords((data || []).filter(d => {
      const meta = d.metadata as any;
      return meta?.sub_type === "equipment_issuance";
    }).map(d => {
      const meta = d.metadata as any;
      return { ...d, ...(meta || {}) };
    }));
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("id, full_name, staff_id").eq("status", "active");
    setStaff(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const staffMember = staff.find(s => s.id === formData.staff_id);
    const metadata = {
      sub_type: "equipment_issuance",
      staff_id: formData.staff_id,
      staff_name: staffMember?.full_name,
      item_name: formData.item_name,
      item_type: formData.item_type,
      serial_number: formData.serial_number,
      quantity: formData.quantity,
      condition: formData.condition,
      issue_date: new Date().toISOString(),
      return_date: null,
      eq_status: "issued",
    };
    const { error } = await supabase.from("documents").insert([{
      title: `${formData.item_name} → ${staffMember?.full_name || "Unknown"}`,
      description: formData.notes,
      category: "operational" as any,
      metadata,
      uploaded_by: user?.id,
      status: "active",
      file_name: "equipment_issuance",
      file_url: "#",
      document_number: `EQ-${Date.now()}`,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Equipment issued");
    setOpen(false);
    fetchRecords();
  };

  const markReturned = async (record: any) => {
    const meta = (record.metadata || {}) as any;
    meta.eq_status = "returned";
    meta.return_date = new Date().toISOString();
    const { error } = await supabase.from("documents")
      .update({ metadata: meta, status: "archived" })
      .eq("id", record.id);
    if (error) toast.error(error.message);
    else { toast.success("Item marked as returned"); fetchRecords(); }
  };

  if (loading) return <LoadingPulse />;

  const filtered = records.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.staff_name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const issued = records.filter(r => r.eq_status === "issued").length;
  const returned = records.filter(r => r.eq_status === "returned").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={Package} title="Equipment Issuance & Returns" description="Track radios, keys, firearms, uniforms per officer per shift" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Issue Equipment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue Equipment</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Officer *</Label>
                <Select required value={formData.staff_id} onValueChange={v => setFormData({ ...formData, staff_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select officer" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Item Name *</Label><Input required value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} placeholder="Motorola Radio" /></div>
                <div className="space-y-2"><Label>Item Type</Label>
                  <Select value={formData.item_type} onValueChange={v => setFormData({ ...formData, item_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radio">Radio</SelectItem><SelectItem value="keys">Keys</SelectItem>
                      <SelectItem value="firearm">Firearm</SelectItem><SelectItem value="uniform">Uniform</SelectItem>
                      <SelectItem value="torch">Torch</SelectItem><SelectItem value="baton">Baton</SelectItem>
                      <SelectItem value="body_cam">Body Cam</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Serial Number</Label><Input value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} /></div>
                <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} /></div>
                <div className="space-y-2"><Label>Condition</Label>
                  <Select value={formData.condition} onValueChange={v => setFormData({ ...formData, condition: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="damaged">Damaged</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Issue Equipment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Records</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{records.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Currently Issued</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{issued}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Returned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{returned}</div></CardContent></Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Officer</TableHead>
                <TableHead>Serial #</TableHead><TableHead>Qty</TableHead><TableHead>Condition</TableHead>
                <TableHead>Issued</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.item_name || r.title}</TableCell>
                  <TableCell className="capitalize">{r.item_type || "—"}</TableCell>
                  <TableCell>{r.staff_name || "—"}</TableCell>
                  <TableCell>{r.serial_number || "—"}</TableCell>
                  <TableCell>{r.quantity || 1}</TableCell>
                  <TableCell className="capitalize">{r.condition || "—"}</TableCell>
                  <TableCell>{r.issue_date ? format(new Date(r.issue_date), "dd MMM yyyy") : r.created_at ? format(new Date(r.created_at), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell><Badge variant={r.eq_status === "returned" ? "default" : "secondary"}>{r.eq_status || "issued"}</Badge></TableCell>
                  <TableCell>
                    {r.eq_status === "issued" && (
                      <Button size="sm" variant="outline" onClick={() => markReturned(r)}>
                        <ArrowRightLeft className="w-3 h-3 mr-1" />Return
                      </Button>
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
