import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  full_name: string;
  position: string;
  current_site: string | null;
}

const BulkShiftScheduler = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState('day');
  const [site, setSite] = useState('');
  const [sites, setSites] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaffAndSites();
  }, []);

  const fetchStaffAndSites = async () => {
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, full_name, position, current_site')
      .eq('status', 'active')
      .order('full_name');

    if (staffData) setStaff(staffData);

    const { data: siteData } = await supabase
      .from('sites')
      .select('site_name')
      .order('site_name');

    if (siteData) setSites(siteData.map((s: any) => s.site_name));
  };

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedStaff.size === staff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(staff.map(s => s.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStaff.size === 0) {
      toast.error('Select at least one officer');
      return;
    }
    if (!site) {
      toast.error('Select a site');
      return;
    }

    setSubmitting(true);
    try {
      const shiftStart = shiftType === 'day' ? '06:00:00' : '18:00:00';
      const records = Array.from(selectedStaff).map(staffId => ({
        staff_id: staffId,
        check_in: `${shiftDate}T${shiftStart}`,
        site,
        shift_type: shiftType,
        status: 'scheduled' as const,
        notes: `Bulk scheduled for ${shiftType} shift`,
      }));

      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;

      toast.success(`${selectedStaff.size} officers scheduled for ${shiftType} shift at ${site}`);
      setSelectedStaff(new Set());
    } catch (err) {
      console.error('Bulk schedule error:', err);
      toast.error('Failed to schedule shifts');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Bulk Shift Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Shift Type</Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day (06:00–18:00)</SelectItem>
                <SelectItem value="night">Night (18:00–06:00)</SelectItem>
                <SelectItem value="24hr">24-Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Site</Label>
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
              <SelectContent>
                {sites.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Staff Selection */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedStaff.size === staff.length && staff.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="text-sm font-medium">
                Select Officers ({selectedStaff.size}/{staff.length})
              </span>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            {staff.map(member => (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedStaff.has(member.id) ? 'bg-primary/10' : ''
                }`}
                onClick={() => toggleStaff(member.id)}
              >
                <Checkbox checked={selectedStaff.has(member.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.position} • {member.current_site || 'Unassigned'}</p>
                </div>
                {selectedStaff.has(member.id) && (
                  <CheckCircle className="w-4 h-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleBulkAssign}
          disabled={submitting || selectedStaff.size === 0}
          className="w-full"
        >
          {submitting ? (
            'Scheduling...'
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Schedule {selectedStaff.size} Officer{selectedStaff.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkShiftScheduler;
