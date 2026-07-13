import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Upload, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CheckpointData {
  id: string;
  checkpoint_name: string;
  qr_code: string;
  gps_coordinates: string | null;
  sequence: number;
  frequency: string;
  risk_tier: string;
  remarks: string;
}

interface CreatePatrolFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreatePatrolForm = ({ onSuccess, onCancel }: CreatePatrolFormProps) => {
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<CheckpointData[]>([]);
  
  const [formData, setFormData] = useState({
    patrol_date: new Date().toISOString().split('T')[0],
    shift_start: "22:00",
    shift_end: "06:00",
    patrol_type: "routine",
    supervisor_id: "",
    client_name: "",
    site_name: "",
    vehicle_assigned: "",
    k9_assigned: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, clientsRes, sitesRes, checkpointsRes] = await Promise.all([
        supabase.from('staff').select('*').eq('status', 'active'),
        supabase.from('clients').select('*').eq('status', 'active'),
        supabase.from('sites').select('*'),
        supabase.from('checkpoints').select('*').eq('is_active', true)
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (sitesRes.data) setSites(sitesRes.data);
      if (checkpointsRes.data) setCheckpoints(checkpointsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    }
  };

  const addCheckpoint = (checkpointId: string) => {
    const checkpoint = checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;

    const newCheckpoint: CheckpointData = {
      id: checkpoint.id,
      checkpoint_name: checkpoint.checkpoint_name,
      qr_code: checkpoint.qr_code,
      gps_coordinates: checkpoint.gps_coordinates,
      sequence: selectedCheckpoints.length + 1,
      frequency: "every_2_hours",
      risk_tier: "medium",
      remarks: ""
    };

    setSelectedCheckpoints([...selectedCheckpoints, newCheckpoint]);
  };

  const removeCheckpoint = (index: number) => {
    const updated = selectedCheckpoints.filter((_, i) => i !== index);
    // Re-sequence
    const resequenced = updated.map((cp, idx) => ({ ...cp, sequence: idx + 1 }));
    setSelectedCheckpoints(resequenced);
  };

  const updateCheckpoint = (index: number, field: string, value: any) => {
    const updated = [...selectedCheckpoints];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedCheckpoints(updated);
  };

  const handleSubmit = async (activate: boolean = false) => {
    if (!formData.supervisor_id || !formData.site_name || selectedCheckpoints.length === 0) {
      toast.error('Please fill in all required fields and add at least one checkpoint');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Get supervisor RFID
      const supervisor = staff.find(s => s.id === formData.supervisor_id);
      
      // Calculate next patrol time
      const nextPatrolTime = new Date();
      nextPatrolTime.setHours(parseInt(formData.shift_start.split(':')[0]));
      nextPatrolTime.setMinutes(parseInt(formData.shift_start.split(':')[1]));

      const { data, error } = await supabase
        .from('patrols')
        .insert([{
          guard_id: formData.supervisor_id,
          site_name: formData.site_name,
          client_name: formData.client_name || null,
          patrol_date: formData.patrol_date || null,
          shift_start: formData.shift_start || null,
          shift_end: formData.shift_end || null,
          patrol_type: formData.patrol_type || 'routine',
          supervisor_rfid_id: supervisor?.rfid_card_number || null,
          vehicle_assigned: formData.vehicle_assigned || null,
          k9_assigned: formData.k9_assigned || null,
          frequency: 'daily',
          status: activate ? 'active' : 'draft',
          notes: formData.notes || null,
          route_data: JSON.parse(JSON.stringify({
            checkpoints: selectedCheckpoints
          })),
          next_patrol_time: nextPatrolTime.toISOString(),
          created_by: user.id,
          start_time: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(activate ? 'Patrol activated successfully!' : 'Patrol draft saved!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating patrol:', error);
      toast.error(error.message || 'Failed to create patrol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patrol Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patrol Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patrol_date">Patrol Date *</Label>
              <Input
                id="patrol_date"
                type="date"
                value={formData.patrol_date}
                onChange={(e) => setFormData({ ...formData, patrol_date: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="patrol_type">Patrol Type *</Label>
              <Select value={formData.patrol_type} onValueChange={(value) => setFormData({ ...formData, patrol_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="perimeter">Perimeter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shift_start">Shift Start *</Label>
              <Input
                id="shift_start"
                type="time"
                value={formData.shift_start}
                onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="shift_end">Shift End *</Label>
              <Input
                id="shift_end"
                type="time"
                value={formData.shift_end}
                onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="supervisor_id">Supervisor *</Label>
              <Select value={formData.supervisor_id} onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} - {member.rank || member.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label htmlFor="client_name">Client *</Label>
              <Select value={formData.client_name} onValueChange={(value) => setFormData({ ...formData, client_name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.legal_name}>
                      {client.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="site_name">Site *</Label>
              <Select value={formData.site_name} onValueChange={(value) => setFormData({ ...formData, site_name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.site_name}>
                      {site.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vehicle_assigned">Vehicle Assigned (Optional)</Label>
              <Input
                id="vehicle_assigned"
                placeholder="e.g., KDH 221B"
                value={formData.vehicle_assigned}
                onChange={(e) => setFormData({ ...formData, vehicle_assigned: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="k9_assigned">K9 Assigned (Optional)</Label>
              <Input
                id="k9_assigned"
                placeholder="e.g., Alpha K9-07"
                value={formData.k9_assigned}
                onChange={(e) => setFormData({ ...formData, k9_assigned: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional instructions or remarks..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checkpoint Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Checkpoints ({selectedCheckpoints.length})</CardTitle>
            <div className="flex gap-2">
              <Select onValueChange={addCheckpoint}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Add checkpoint" />
                </SelectTrigger>
                <SelectContent>
                  {checkpoints
                    .filter(cp => !selectedCheckpoints.find(scp => scp.id === cp.id))
                    .map((cp) => (
                      <SelectItem key={cp.id} value={cp.id}>
                        {cp.checkpoint_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedCheckpoints.length === 0 ? (
            <div className="text-center py-8 text-foreground/80">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No checkpoints added yet</p>
              <p className="text-sm">Select checkpoints from the dropdown above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seq</TableHead>
                    <TableHead>Checkpoint</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCheckpoints.map((cp, index) => (
                    <TableRow key={cp.id}>
                      <TableCell>{cp.sequence}</TableCell>
                      <TableCell className="font-medium">{cp.checkpoint_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{cp.qr_code}</Badge>
                      </TableCell>
                      <TableCell>
                        {cp.gps_coordinates ? '✓' : '-'}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={cp.frequency} 
                          onValueChange={(value) => updateCheckpoint(index, 'frequency', value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="every_2_hours">2 hr</SelectItem>
                            <SelectItem value="every_4_hours">4 hr</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={cp.risk_tier} 
                          onValueChange={(value) => updateCheckpoint(index, 'risk_tier', value)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Notes..."
                          value={cp.remarks}
                          onChange={(e) => updateCheckpoint(index, 'remarks', e.target.value)}
                          className="w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCheckpoint(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={loading}>
          Save Draft
        </Button>
        <Button onClick={() => handleSubmit(true)} disabled={loading}>
          Activate Patrol
        </Button>
      </div>
    </div>
  );
};

export default CreatePatrolForm;