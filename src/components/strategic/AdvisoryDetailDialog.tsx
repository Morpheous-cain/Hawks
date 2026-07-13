import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, AlertTriangle, XCircle, FileText, MapPin, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface AdvisoryDetailDialogProps {
  advisory: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const AdvisoryDetailDialog = ({ advisory, open, onOpenChange, onUpdate }: AdvisoryDetailDialogProps) => {
  const { toast } = useToast();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const getSeverityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical": return "bg-alert-critical text-white";
      case "caution": return "bg-alert-warning text-white";
      case "normal": return "bg-alert-normal text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      Active: "bg-alert-normal",
      Investigating: "bg-alert-warning",
      Resolved: "bg-muted",
      Archived: "bg-muted-foreground"
    };
    return colors[status as keyof typeof colors] || "bg-muted";
  };

  const handleAcknowledge = async () => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("strategic_advisories")
        .update({
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
          status: "Investigating"
        })
        .eq("id", advisory.id);

      if (error) throw error;

      // Log audit trail
      await supabase.from("strategic_advisory_audit").insert({
        advisory_id: advisory.id,
        action: "Acknowledged",
        performed_by: user?.id,
        action_details: { previous_status: advisory.status }
      });

      toast({ title: "Advisory Acknowledged", description: "You are now investigating this incident." });
      onUpdate();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEscalate = async () => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("strategic_advisories")
        .update({
          is_escalated: true,
          escalated_by: user?.id,
          escalated_at: new Date().toISOString()
        })
        .eq("id", advisory.id);

      if (error) throw error;

      await supabase.from("strategic_advisory_audit").insert({
        advisory_id: advisory.id,
        action: "Escalated",
        performed_by: user?.id
      });

      toast({ title: "Advisory Escalated", description: "Supervisor has been notified." });
      onUpdate();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast({ title: "Resolution notes required", description: "Please provide resolution details.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("strategic_advisories")
        .update({
          status: "Resolved",
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq("id", advisory.id);

      if (error) throw error;

      await supabase.from("strategic_advisory_audit").insert({
        advisory_id: advisory.id,
        action: "Resolved",
        performed_by: user?.id,
        action_details: { resolution_notes: resolutionNotes }
      });

      toast({ title: "Advisory Resolved", description: "Incident has been marked as resolved." });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!advisory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{advisory.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getSeverityColor(advisory.severity)}>
                  {advisory.severity}
                </Badge>
                <Badge className={getStatusBadge(advisory.status)} variant="outline">
                  {advisory.status}
                </Badge>
                <Badge variant="outline">
                  {advisory.category} • {advisory.sub_category}
                </Badge>
                {advisory.is_escalated && (
                  <Badge variant="destructive">Escalated</Badge>
                )}
                {advisory.sla_breached && (
                  <Badge variant="destructive">SLA Breached</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Incident ID and Timing */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" /> Incident ID
              </p>
              <p className="font-mono font-bold">{advisory.incident_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Detected
              </p>
              <p className="font-semibold">
                {format(new Date(advisory.timestamp_detected), "PPpp")}
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Location
            </h3>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Scope: </span>
                {advisory.location_scope_hierarchy?.join(" → ")}
              </p>
              {advisory.proximate_poi && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Near: </span>
                  {advisory.proximate_poi}
                </p>
              )}
              {advisory.location_lat && advisory.location_lon && (
                <p className="text-sm font-mono">
                  <span className="text-muted-foreground">Coordinates: </span>
                  {advisory.location_lat.toFixed(6)}, {advisory.location_lon.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
              {advisory.description}
            </p>
          </div>

          {/* Recommended Action */}
          {advisory.recommended_action && (
            <div>
              <h3 className="font-semibold mb-2">Recommended Action</h3>
              <p className="text-sm p-4 bg-alert-warning/10 border border-alert-warning/30 rounded-lg">
                {advisory.recommended_action}
              </p>
            </div>
          )}

          {/* Sources */}
          {advisory.sources && advisory.sources.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Intelligence Sources</h3>
              <div className="space-y-2">
                {advisory.sources.map((source: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{source.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {source.reliability || "Unknown"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">ID: {source.id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Section - Only show if not resolved */}
          {advisory.status !== "Resolved" && advisory.status !== "Archived" && (
            <div>
              <h3 className="font-semibold mb-2">Resolution Notes</h3>
              <Textarea
                placeholder="Enter resolution details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Resolution Details - Show if resolved */}
          {advisory.resolution_notes && (
            <div>
              <h3 className="font-semibold mb-2">Resolution</h3>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm">{advisory.resolution_notes}</p>
                {advisory.resolved_at && (
                  <p className="text-xs text-muted-foreground">
                    Resolved on {format(new Date(advisory.resolved_at), "PPpp")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {advisory.status !== "Resolved" && advisory.status !== "Archived" && (
            <div className="flex gap-2 pt-4 border-t">
              {!advisory.acknowledged_by && (
                <Button
                  onClick={handleAcknowledge}
                  disabled={isUpdating}
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge
                </Button>
              )}
              {!advisory.is_escalated && advisory.status === "Investigating" && (
                <Button
                  onClick={handleEscalate}
                  disabled={isUpdating}
                  className="flex-1"
                  variant="outline"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Escalate to Supervisor
                </Button>
              )}
              {advisory.status === "Investigating" && (
                <Button
                  onClick={handleResolve}
                  disabled={isUpdating || !resolutionNotes.trim()}
                  className="flex-1"
                  variant="default"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvisoryDetailDialog;