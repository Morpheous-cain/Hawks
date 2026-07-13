import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, Search, User, Phone, Car, MapPin, Edit, Trash2, 
  MoreHorizontal, Mail, RefreshCw, Bike
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RiderDriver {
  id: string;
  rider_id: string;
  rider_name: string;
  phone: string;
  email?: string;
  vehicle_type: string;
  vehicle_registration?: string;
  zone?: string;
  status: string;
  created_at: string;
}

interface RiderDriverFormData {
  rider_name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_registration: string;
  zone: string;
  status: string;
}

const initialFormData: RiderDriverFormData = {
  rider_name: "",
  phone: "",
  email: "",
  vehicle_type: "motorcycle",
  vehicle_registration: "",
  zone: "",
  status: "active",
};

export const RidersManagement = () => {
  const [ridersDrivers, setRidersDrivers] = useState<RiderDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<RiderDriver | null>(null);
  const [formData, setFormData] = useState<RiderDriverFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const isDriver = (vehicleType: string) => ['car', 'van', 'truck'].includes(vehicleType);
  const isRider = (vehicleType: string) => ['motorcycle', 'bicycle'].includes(vehicleType);

  useEffect(() => {
    fetchRidersDrivers();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('courier_riders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courier_riders' },
        () => fetchRidersDrivers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRidersDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('courier_riders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRidersDrivers(data || []);
    } catch (error) {
      console.error('Error fetching riders/drivers:', error);
      toast.error('Failed to fetch riders/drivers');
    } finally {
      setLoading(false);
    }
  };

  const generateId = (vehicleType: string) => {
    const prefix = isDriver(vehicleType) ? 'DRV' : 'RDR';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleAdd = async () => {
    if (!formData.rider_name || !formData.phone || !formData.vehicle_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const personType = isDriver(formData.vehicle_type) ? 'Driver' : 'Rider';
      
      const { error } = await supabase
        .from('courier_riders')
        .insert({
          rider_id: generateId(formData.vehicle_type),
          rider_name: formData.rider_name,
          phone: formData.phone,
          email: formData.email || null,
          vehicle_type: formData.vehicle_type,
          vehicle_registration: formData.vehicle_registration || null,
          zone: formData.zone || null,
          status: formData.status,
          created_by: userData.user?.id,
        });

      if (error) throw error;

      toast.success(`${personType} added successfully`);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      fetchRidersDrivers();
    } catch (error) {
      console.error('Error adding:', error);
      toast.error('Failed to add rider/driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPerson || !formData.rider_name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const personType = isDriver(formData.vehicle_type) ? 'Driver' : 'Rider';
      const { error } = await supabase
        .from('courier_riders')
        .update({
          rider_name: formData.rider_name,
          phone: formData.phone,
          email: formData.email || null,
          vehicle_type: formData.vehicle_type,
          vehicle_registration: formData.vehicle_registration || null,
          zone: formData.zone || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPerson.id);

      if (error) throw error;

      toast.success(`${personType} updated successfully`);
      setIsEditDialogOpen(false);
      setSelectedPerson(null);
      setFormData(initialFormData);
      fetchRidersDrivers();
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (person: RiderDriver) => {
    const personType = isDriver(person.vehicle_type) ? 'driver' : 'rider';
    if (!confirm(`Are you sure you want to delete ${personType} ${person.rider_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courier_riders')
        .delete()
        .eq('id', person.id);

      if (error) throw error;

      toast.success(`${personType.charAt(0).toUpperCase() + personType.slice(1)} deleted successfully`);
      fetchRidersDrivers();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const openEditDialog = (person: RiderDriver) => {
    setSelectedPerson(person);
    setFormData({
      rider_name: person.rider_name,
      phone: person.phone,
      email: person.email || "",
      vehicle_type: person.vehicle_type,
      vehicle_registration: person.vehicle_registration || "",
      zone: person.zone || "",
      status: person.status,
    });
    setIsEditDialogOpen(true);
  };

  const filteredList = ridersDrivers.filter(person => {
    const matchesSearch = 
      person.rider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.rider_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || person.status === statusFilter;
    
    const matchesVehicle = vehicleFilter === "all" || 
      (vehicleFilter === "riders" && isRider(person.vehicle_type)) ||
      (vehicleFilter === "drivers" && isDriver(person.vehicle_type));
    
    return matchesSearch && matchesStatus && matchesVehicle;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-alert-normal/20 text-alert-normal border-alert-normal/30">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-muted text-muted-foreground">Inactive</Badge>;
      case 'on_delivery':
        return <Badge className="bg-primary/20 text-primary border-primary/30">On Delivery</Badge>;
      case 'offline':
        return <Badge className="bg-alert-caution/20 text-alert-caution border-alert-caution/30">Offline</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVehicleIcon = (type: string) => {
    if (isRider(type)) return <Bike className="w-4 h-4" />;
    return <Car className="w-4 h-4" />;
  };

  const getPersonType = (vehicleType: string) => isDriver(vehicleType) ? 'Driver' : 'Rider';

  const PersonForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rider_name">Full Name *</Label>
          <Input
            id="rider_name"
            value={formData.rider_name}
            onChange={(e) => setFormData({ ...formData, rider_name: e.target.value })}
            placeholder="Enter rider's full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+254 7XX XXX XXX"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="rider@example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Vehicle Type *</Label>
          <Select
            value={formData.vehicle_type}
            onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="motorcycle">Motorcycle</SelectItem>
              <SelectItem value="bicycle">Bicycle</SelectItem>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle_registration">Vehicle Registration</Label>
          <Input
            id="vehicle_registration"
            value={formData.vehicle_registration}
            onChange={(e) => setFormData({ ...formData, vehicle_registration: e.target.value })}
            placeholder="KXX 000X"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zone">Operating Zone</Label>
          <Input
            id="zone"
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            placeholder="e.g., Nairobi CBD, Westlands"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_delivery">On Delivery</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setFormData(initialFormData);
          }}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );

  const totalRiders = ridersDrivers.filter(p => isRider(p.vehicle_type)).length;
  const totalDrivers = ridersDrivers.filter(p => isDriver(p.vehicle_type)).length;
  const activeCount = ridersDrivers.filter(p => p.status === 'active').length;
  const onDeliveryCount = ridersDrivers.filter(p => p.status === 'on_delivery').length;
  const offlineCount = ridersDrivers.filter(p => p.status === 'offline' || p.status === 'inactive').length;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Riders</p>
                <p className="text-2xl font-bold">{totalRiders}</p>
              </div>
              <Bike className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{totalDrivers}</p>
              </div>
              <Car className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-alert-normal">{activeCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-alert-normal animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Delivery</p>
                <p className="text-2xl font-bold text-primary">{onDeliveryCount}</p>
              </div>
              <MapPin className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-alert-caution">{offlineCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-alert-caution" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Riders & Drivers Directory
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData(initialFormData)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rider/Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Rider/Driver</DialogTitle>
              </DialogHeader>
              <PersonForm onSubmit={handleAdd} submitLabel="Add" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="riders">Riders Only</SelectItem>
                <SelectItem value="drivers">Drivers Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_delivery">On Delivery</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchRidersDrivers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No riders or drivers found</p>
              <p className="text-sm">Add your first rider or driver to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {person.rider_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{person.rider_name}</p>
                            <p className="text-xs text-muted-foreground">{person.rider_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getPersonType(person.vehicle_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {person.phone}
                          </div>
                          {person.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {person.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getVehicleIcon(person.vehicle_type)}
                          <div>
                            <p className="text-sm capitalize">{person.vehicle_type}</p>
                            {person.vehicle_registration && (
                              <p className="text-xs text-muted-foreground">{person.vehicle_registration}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {person.zone ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3" />
                            {person.zone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(person.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(person)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(person)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {selectedPerson ? getPersonType(selectedPerson.vehicle_type) : 'Rider/Driver'}</DialogTitle>
          </DialogHeader>
          <PersonForm onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
};
