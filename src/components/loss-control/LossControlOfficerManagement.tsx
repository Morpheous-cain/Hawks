import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

interface Officer {
  id: string;
  name: string;
  role: string;
  site: string;
  status: "active" | "inactive";
  cases_assigned: number;
}

const MOCK_OFFICERS: Officer[] = [
  { id: "1", name: "Inspector Mwangi", role: "Lead Investigator", site: "JKIA Terminal 2", status: "active", cases_assigned: 4 },
  { id: "2", name: "Sgt. Wanjiku", role: "Loss Prevention Officer", site: "Two Rivers Mall", status: "active", cases_assigned: 2 },
  { id: "3", name: "Cpl. Otieno", role: "Loss Prevention Officer", site: "Westgate Mall", status: "active", cases_assigned: 3 },
  { id: "4", name: "Inspector Kamau", role: "Fraud Investigator", site: "Nairobi Hospital", status: "inactive", cases_assigned: 0 },
  { id: "5", name: "Sgt. Achieng", role: "Shrinkage Specialist", site: "Villa Rosa Kempinski", status: "active", cases_assigned: 1 },
];

interface LossControlOfficerManagementProps {
  onClose: () => void;
}

export const LossControlOfficerManagement = ({ onClose }: LossControlOfficerManagementProps) => {
  const queryClient = useQueryClient();

  const { data: staffRows, isLoading } = useQuery({
    queryKey: ['loss-control-officers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, staff_id, phone, rank, status, current_site')
        .or('rank.ilike.%loss control%,rank.ilike.%loss-control%,rank.ilike.%investigator%')
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    retry: false,
  });

  // Derive display list from query; fall back to mock when query fails so UI still renders.
  const dbOfficers: Officer[] = (staffRows || []).map(s => ({
    id: s.id,
    name: s.full_name,
    role: s.rank || 'Loss Control Officer',
    site: s.current_site || 'Unassigned',
    status: (s.status === 'active' ? 'active' : 'inactive') as Officer["status"],
    cases_assigned: 0,
  }));

  const [extraOfficers, setExtraOfficers] = useState<Officer[]>([]);
  const [toggledIds, setToggledIds] = useState<Record<string, "active" | "inactive">>({});
  const officers = [...dbOfficers, ...extraOfficers].map(o =>
    toggledIds[o.id] ? { ...o, status: toggledIds[o.id] } : o
  );
  const hasDbData = (staffRows?.length ?? 0) > 0;
  const fallbackOfficers = MOCK_OFFICERS.map(o =>
    toggledIds[o.id] ? { ...o, status: toggledIds[o.id] } : o
  );
  const displayOfficers = hasDbData ? officers : [...fallbackOfficers, ...extraOfficers];

  const [showAdd, setShowAdd] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: "", role: "", site: "" });

  const addOfficer = () => {
    if (!newOfficer.name.trim()) {
      toast.error("Officer name required");
      return;
    }
    const officer: Officer = {
      id: `o-${Date.now()}`,
      name: newOfficer.name.trim(),
      role: newOfficer.role.trim() || "Loss Prevention Officer",
      site: newOfficer.site.trim() || "Unassigned",
      status: "active",
      cases_assigned: 0,
    };
    setExtraOfficers([...extraOfficers, officer]);
    setNewOfficer({ name: "", role: "", site: "" });
    setShowAdd(false);
    toast.success(`${officer.name} added`);
  };

  const toggleStatus = (id: string) => {
    const current = displayOfficers.find(o => o.id === id)?.status || 'active';
    setToggledIds({ ...toggledIds, [id]: current === 'active' ? 'inactive' : 'active' });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Loss Control Officer Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {officers.filter(o => o.status === "active").length} active officers
            </p>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1">
              <Plus className="w-4 h-4" />
              Add Officer
            </Button>
          </div>

          {showAdd && (
            <div className="p-3 border border-border rounded-lg space-y-3 bg-muted/20">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input
                    value={newOfficer.name}
                    onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })}
                    placeholder="Officer name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Input
                    value={newOfficer.role}
                    onChange={e => setNewOfficer({ ...newOfficer, role: e.target.value })}
                    placeholder="e.g. Lead Investigator"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Site</Label>
                  <Input
                    value={newOfficer.site}
                    onChange={e => setNewOfficer({ ...newOfficer, site: e.target.value })}
                    placeholder="e.g. JKIA Terminal 2"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button size="sm" onClick={addOfficer}>Add</Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officers.map((officer) => (
                <TableRow key={officer.id}>
                  <TableCell className="font-medium">{officer.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{officer.role}</TableCell>
                  <TableCell className="text-sm">{officer.site}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{officer.cases_assigned}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={officer.status === "active" ? "bg-alert-normal/20 text-alert-normal border-alert-normal/30" : "bg-muted text-muted-foreground"}
                      variant="outline"
                    >
                      {officer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleStatus(officer.id)}
                      title={officer.status === "active" ? "Deactivate" : "Activate"}
                    >
                      {officer.status === "active" ? (
                        <X className="w-3.5 h-3.5" />
                      ) : (
                        <Shield className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};