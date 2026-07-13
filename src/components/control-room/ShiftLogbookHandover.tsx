import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShiftLogbookHandoverProps {
  shiftData: any;
}

const ShiftLogbookHandover = ({ shiftData }: ShiftLogbookHandoverProps) => {
  const [handoverNotes, setHandoverNotes] = useState("");

  const endShift = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !shiftData) return;

      const { error } = await supabase
        .from('shift_logs')
        .update({
          shift_end: new Date().toISOString(),
          handover_notes: handoverNotes,
          signed_off_at: new Date().toISOString(),
          signed_off_by: user.id
        })
        .eq('id', shiftData.id);

      if (error) throw error;

      toast.success('Shift ended successfully');
    } catch (error: any) {
      toast.error('Failed to end shift');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Shift Logbook & Handover
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {shiftData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Shift ID</p>
                  <p className="font-semibold">{shiftData.shift_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Started</p>
                  <p className="font-semibold">
                    {new Date(shiftData.shift_start).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Incidents Handled</p>
                  <p className="font-semibold">{shiftData.incidents_handled || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Alarms Acknowledged</p>
                  <p className="font-semibold">{shiftData.alarms_acknowledged || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dispatches Made</p>
                  <p className="font-semibold">{shiftData.dispatches_made || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">SLA Breaches</p>
                  <p className="font-semibold text-alert-critical">{shiftData.sla_breaches || 0}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Handover Notes
                </label>
                <Textarea
                  placeholder="Enter handover notes for incoming operator..."
                  rows={6}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                />
              </div>

              <Button onClick={endShift} className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Sign Off & End Shift
              </Button>
            </>
          )}

          {!shiftData && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active shift</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftLogbookHandover;