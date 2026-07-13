import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Plus, Fuel, Wrench, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

export default function FleetManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    registration_number: "",
    vehicle_type: "car",
    call_sign: "",
    region: "",
    status: "available",
    fuel_level: 100,
    mileage: 0,
  });

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('vehicles-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => fetchVehicles())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchVehicles(), fetchStaff()]);
    setLoading(false);
  };

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("*, staff:current_officer_id(full_name)")
      .order("created_at", { ascending: false });
    setVehicles(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("id, full_name").eq("status", "active");
    setStaff(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("vehicles").insert([formData]);
    if (error) { toast.error(error.message); return; }
    toast.success("Vehicle added");
    setOpen(false);
    setFormData({ vehicle_id: "", registration_number: "", vehicle_type: "car", call_sign: "", region: "", status: "available", fuel_level: 100, mileage: 0 });
  };

  const updateVehicleStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("vehicles").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Status updated");
  };

  const assignOfficer = async (vehicleId: string, officerId: string) => {
    const { error } = await supabase.from("vehicles").update({ current_officer_id: officerId || null }).eq("id", vehicleId);
    if (error) toast.error(error.message);
    else { toast.success("Officer assigned"); fetchVehicles(); }
  };

  if (loading) return <LoadingPulse />;

  const filtered = vehicles.filter(v => {
    const matchSearch = v.vehicle_id?.toLowerCase().includes(search.toLowerCase()) ||
      v.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
      v.call_sign?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const available = vehicles.filter(v => v.status === 'available').length;
  const onDuty = vehicles.filter(v => ['en_route', 'on_scene', 'patrolling'].includes(v.status)).length;
  const maintenance = vehicles.filter(v => v.status === 'maintenance').length;

  const statusColors: Record<string, string> = {
    available: "default", en_route: "secondary", on_scene: "destructive",
    patrolling: "outline", off_duty: "secondary", maintenance: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={Car} title="Fleet & Vehicle Management" description="Track vehicles, assignments, fuel, and service history" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Vehicle</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Vehicle ID *</Label><Input required value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} placeholder="VEH-001" /></div>
                <div className="space-y-2"><Label>Registration *</Label><Input required value={formData.registration_number} onChange={e => setFormData({ ...formData, registration_number: e.target.value })} placeholder="KAA 123A" /></div>
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={formData.vehicle_type} onValueChange={v => setFormData({ ...formData, vehicle_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem><SelectItem value="motorbike">Motorbike</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem><SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Call Sign</Label><Input value={formData.call_sign} onChange={e => setFormData({ ...formData, call_sign: e.target.value })} placeholder="ALPHA-01" /></div>
                <div className="space-y-2"><Label>Region</Label><Input value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} placeholder="Nairobi" /></div>
                <div className="space-y-2"><Label>Mileage (km)</Label><Input type="number" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Add Vehicle</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Fleet</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{vehicles.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Available</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{available}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">On Duty</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{onDuty}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">In Maintenance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{maintenance}</div></CardContent></Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem><SelectItem value="available">Available</SelectItem>
            <SelectItem value="en_route">En Route</SelectItem><SelectItem value="on_scene">On Scene</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="off_duty">Off Duty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle ID</TableHead><TableHead>Registration</TableHead><TableHead>Type</TableHead>
                <TableHead>Call Sign</TableHead><TableHead>Officer</TableHead><TableHead>Fuel</TableHead>
                <TableHead>Mileage</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vehicles found</TableCell></TableRow>
              ) : filtered.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.vehicle_id}</TableCell>
                  <TableCell>{v.registration_number}</TableCell>
                  <TableCell className="capitalize">{v.vehicle_type}</TableCell>
                  <TableCell>{v.call_sign || "—"}</TableCell>
                  <TableCell>
                    <Select value={v.current_officer_id || "unassigned"} onValueChange={val => assignOfficer(v.id, val === "unassigned" ? "" : val)}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Assign" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3" />
                      <span className={v.fuel_level < 25 ? "text-destructive" : ""}>{v.fuel_level || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{(v.mileage || 0).toLocaleString()} km</TableCell>
                  <TableCell>
                    <Select value={v.status} onValueChange={val => updateVehicleStatus(v.id, val)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem><SelectItem value="en_route">En Route</SelectItem>
                        <SelectItem value="on_scene">On Scene</SelectItem><SelectItem value="patrolling">Patrolling</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="off_duty">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/map?vehicle=${v.id}`)} title="Locate on map">
                      <MapPin className="w-4 h-4" />
                    </Button>
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
