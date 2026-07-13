import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Camera, DoorOpen, Zap, Bell, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EquipmentCreateDialog } from "./EquipmentCreateDialog";
import { exportToCSV } from "@/utils/exportData";

const EquipmentRegistry = () => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchEquipment = async () => {
    setLoading(true);
    let query = supabase
      .from('technical_equipment')
      .select('*')
      .order('created_at', { ascending: false });

    if (typeFilter !== 'all') {
      query = query.eq('equipment_type', typeFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setEquipment(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEquipment();

    const channel = supabase
      .channel('equipment-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_equipment' }, () => {
        fetchEquipment();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [typeFilter]);

  const filteredEquipment = equipment.filter(item =>
    searchTerm === "" ||
    item.model_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.equipment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-alert-normal text-primary-foreground";
      case "maintenance": return "bg-alert-caution text-primary-foreground";
      case "faulty": return "bg-alert-critical text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-alert-normal";
    if (health >= 60) return "text-alert-caution";
    return "text-alert-critical";
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "cctv": return Camera;
      case "access_control": return DoorOpen;
      case "electric_fence": return Zap;
      case "alarm": return Bell;
      default: return Camera;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search equipment..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cctv">CCTV</SelectItem>
              <SelectItem value="access_control">Access Control</SelectItem>
              <SelectItem value="electric_fence">Electric Fence</SelectItem>
              <SelectItem value="alarm">Alarm Systems</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredEquipment, 'equipment')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <EquipmentCreateDialog onSuccess={fetchEquipment} />
        </div>
      </div>

      {/* Equipment List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading equipment...</div>
      ) : filteredEquipment.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No equipment found. Click "Register Equipment" to add.</div>
      ) : (
        <div className="space-y-4">
          {filteredEquipment.map((item) => {
            const Icon = getIcon(item.equipment_type);
            return (
              <Card key={item.id} className="p-4 border-border hover:border-primary/50 transition-colors">
                <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="space-y-1 flex-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {item.model_number || item.equipment_type}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.equipment_id} • {item.equipment_category}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <span className="ml-2 text-foreground font-medium">{item.location_description}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Health:</span>
                          <span className={`ml-2 font-bold ${getHealthColor(item.health_score || 100)}`}>
                            {item.health_score || 100}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Service:</span>
                          <span className="ml-2 text-foreground font-medium">
                            {item.last_maintenance_date || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Service:</span>
                          <span className="ml-2 text-foreground font-medium">
                            {item.next_maintenance_due || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    <Badge variant="outline" className="border-border">
                      {item.lifecycle_stage || 'active'}
                    </Badge>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EquipmentRegistry;
