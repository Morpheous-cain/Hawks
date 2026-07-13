import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, ClipboardList, Eye, Pencil, Trash2, Send, MapPin } from "lucide-react";
import { format } from "date-fns";

interface FieldOpsOBPanelProps {
  onEntryCreated?: () => void;
}

interface OBEntry {
  id: string;
  entry_number: string;
  date: string;
  time: string;
  officer_name: string;
  nature_of_occurrence: string;
  signature: string;
  remarks: string;
  entry_type: string;
  assignment_site: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "control_room_officer", label: "Control Room Officer" },
  { value: "operations_supervisor", label: "Operations Supervisor" },
  { value: "site_supervisor", label: "Site Supervisor" },
  { value: "senior_supervisor", label: "Senior Supervisor" },
  { value: "guard", label: "Security Guard" },
  { value: "field_officer", label: "Field Officer" },
  { value: "patrol_officer", label: "Patrol Officer" },
  { value: "response_officer", label: "Response Officer" },
  { value: "k9_handler", label: "K9 Handler" },
  { value: "driver", label: "Driver" },
  { value: "dispatch_officer", label: "Dispatch Officer" },
  { value: "hr_custodian", label: "HR Custodian" },
  { value: "administrator", label: "Administrator" },
  { value: "bdo", label: "BDO" },
  { value: "ceo", label: "CEO" },
  { value: "coo", label: "COO" },
  { value: "system_admin", label: "System Administrator" },
];

const fieldOpsRoles = ROLE_OPTIONS;

const entryTypes = [
  { value: "taking_over", label: "Taking Over (Start of shift)" },
  { value: "handover", label: "Handover (End of shift)" },
  { value: "midnight_closing", label: "Midnight Closing (23:59)" },
  { value: "opening", label: "Opening (00:01)" },
  { value: "late_entry", label: "Late Entry of OB" },
  { value: "incident", label: "Incident" },
  { value: "normal_occurrence", label: "Normal Occurrence" },
  { value: "supervisor_patrol", label: "Supervisor Patrol" },
];

const FieldOpsOBPanel = ({ onEntryCreated }: FieldOpsOBPanelProps) => {
  const [entries, setEntries] = useState<OBEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Field Ops Form State
  const [fieldRole, setFieldRole] = useState("");
  const [fieldAssignment, setFieldAssignment] = useState("");
  const [fieldOfficerName, setFieldOfficerName] = useState("");
  const [fieldNature, setFieldNature] = useState("");
  const [fieldSignature, setFieldSignature] = useState("");
  const [fieldRemarks, setFieldRemarks] = useState("");
  const [fieldEntryType, setFieldEntryType] = useState("");
  const [fieldSubmitting, setFieldSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dob_entries')
        .select('*')
        .ilike('site_name', '%Field Ops%')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedEntries: OBEntry[] = (data || []).map((entry, index) => ({
        id: entry.id,
        entry_number: `FO-${String(index + 1).padStart(4, '0')}`,
        date: format(new Date(entry.entry_time), 'dd/MM/yyyy'),
        time: format(new Date(entry.entry_time), 'HH:mm:ss'),
        officer_name: entry.recorded_by || '',
        nature_of_occurrence: entry.description,
        signature: '',
        remarks: '',
        entry_type: entry.entry_type,
        assignment_site: entry.site_name,
        created_at: entry.created_at
      }));
      
      setEntries(transformedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSubmit = async () => {
    if (!fieldRole || !fieldAssignment || !fieldOfficerName || !fieldNature || !fieldEntryType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setFieldSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const roleLabel = fieldOpsRoles.find(r => r.value === fieldRole)?.label;
      
      const { error } = await supabase.from('dob_entries').insert({
        entry_type: fieldEntryType,
        site_name: `Field Ops - ${fieldAssignment}`,
        description: `[${roleLabel}] Officer: ${fieldOfficerName} | ${fieldNature}${fieldRemarks ? ` | Remarks: ${fieldRemarks}` : ''}${fieldSignature ? ` | Signature: ${fieldSignature}` : ''}`,
        recorded_by: userData.user?.id || fieldOfficerName,
      });

      if (error) throw error;

      toast.success("Field Ops OB entry created successfully");
      
      setFieldRole("");
      setFieldAssignment("");
      setFieldOfficerName("");
      setFieldNature("");
      setFieldSignature("");
      setFieldRemarks("");
      setFieldEntryType("");
      
      fetchEntries();
      onEntryCreated?.();
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error("Failed to create OB entry");
    } finally {
      setFieldSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('dob_entries').delete().eq('id', id);
      if (error) throw error;
      toast.success("Entry deleted successfully");
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error("Failed to delete entry");
    }
  };

  return (
    <div className="space-y-6">
      {/* Field Ops O.B Entry Form */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Field Ops O.B Entry
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            For Guards, Site Supervisors, and Project Officers/Managers
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Your Role *</Label>
              <Select value={fieldRole} onValueChange={setFieldRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {fieldOpsRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Assignment / Site *
              </Label>
              <Input 
                value={fieldAssignment} 
                onChange={(e) => setFieldAssignment(e.target.value)}
                placeholder="Enter assignment or site name"
              />
            </div>

            <div className="space-y-2">
              <Label>Type of Entry *</Label>
              <Select value={fieldEntryType} onValueChange={setFieldEntryType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entry type..." />
                </SelectTrigger>
                <SelectContent>
                  {entryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Name of Officer Making Entry *</Label>
              <Input 
                value={fieldOfficerName} 
                onChange={(e) => setFieldOfficerName(e.target.value)}
                placeholder="Enter officer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Signature</Label>
              <Input 
                value={fieldSignature} 
                onChange={(e) => setFieldSignature(e.target.value)}
                placeholder="Digital signature"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nature of Occurrence / Details *</Label>
            <Textarea 
              value={fieldNature} 
              onChange={(e) => setFieldNature(e.target.value)}
              placeholder="Describe the occurrence or details..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea 
              value={fieldRemarks} 
              onChange={(e) => setFieldRemarks(e.target.value)}
              placeholder="Additional remarks..."
              rows={2}
            />
          </div>

          <Button onClick={handleFieldSubmit} className="w-full gap-2" disabled={fieldSubmitting}>
            <Send className="h-4 w-4" />
            {fieldSubmitting ? "Submitting..." : "Make OB Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Field Ops Entries Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Field Ops OB Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment / Site</TableHead>
                  <TableHead>Entry No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Name of Officer</TableHead>
                  <TableHead>Nature of Occurrence / Details</TableHead>
                  <TableHead>Signature</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No Field Ops entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.assignment_site.replace('Field Ops - ', '')}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.entry_number}</TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell>{entry.officer_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.nature_of_occurrence}</TableCell>
                      <TableCell>{entry.signature || '-'}</TableCell>
                      <TableCell>{entry.remarks || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entryTypes.find(t => t.value === entry.entry_type)?.label || entry.entry_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldOpsOBPanel;
