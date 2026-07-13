import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { uploadContextAttachments } from "@/components/shared/operationalContext";

const AlarmTriggerDialog = () => {
  const [open, setOpen] = useState(false);
  const [alarmType, setAlarmType] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());

  const handleTriggerAlarm = async () => {
    if (!alarmType || !location) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("alarm_activations")
        .insert({
          alarm_type: alarmType,
          location: location,
          priority: priority,
          status: "active",
        } as any);

      if (error) throw error;

      toast.success("Test alarm triggered successfully");
      setOpen(false);
      setAlarmType("");
      setLocation("");
      setPriority("medium");
    } catch (error) {
      console.error("Error triggering alarm:", error);
      toast.error("Failed to trigger alarm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="w-4 h-4 mr-2" />
          Test Alarm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trigger Test Alarm</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="alarmType">Alarm Type *</Label>
            <Select value={alarmType} onValueChange={setAlarmType}>
              <SelectTrigger id="alarmType">
                <SelectValue placeholder="Select alarm type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Panic Button">Panic Button</SelectItem>
                <SelectItem value="Fire Alarm">Fire Alarm</SelectItem>
                <SelectItem value="Intrusion">Intrusion</SelectItem>
                <SelectItem value="Motion Detection">Motion Detection</SelectItem>
                <SelectItem value="Glass Break">Glass Break</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g. JKIA Terminal 2 - Security Desk"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <OperationalContextFields value={ctx} onChange={setCtx} title="Alarm Context" />

          <Button
            onClick={handleTriggerAlarm}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Triggering..." : "Trigger Test Alarm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlarmTriggerDialog;
