import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Save, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/utils/auditLog";

interface StaffActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: any;
  actionType: string;
}

const StaffActionDialog = ({ open, onOpenChange, staff, actionType }: StaffActionDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    reportedBy: "",
    authorizedBy: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: "",
    remarks: "",
    newSite: "",
    newClient: "",
    duration: "",
    formNumber: "",
  });

  const actionConfig = {
    "off-duty": {
      title: "Mark Staff as Off Duty",
      description: "Record off-duty status - Requires Off-Duty Form",
      requiredFields: ["reportedBy", "effectiveDate", "reason", "formNumber"],
    },
    "leave": {
      title: "Grant Leave",
      description: "Approve leave request - Specify duration",
      requiredFields: ["reportedBy", "effectiveDate", "duration", "formNumber"],
    },
    "transfer": {
      title: "Transfer Staff",
      description: "Transfer to another site - Requires Transfer Order",
      requiredFields: ["reportedBy", "effectiveDate", "newSite", "newClient", "formNumber"],
    },
    "suspend": {
      title: "Suspend Staff",
      description: "Temporary suspension pending investigation - Requires Suspension Memo",
      requiredFields: ["reportedBy", "authorizedBy", "effectiveDate", "reason", "formNumber"],
    },
    "terminate": {
      title: "Terminate Employment",
      description: "Dismissal for cause - Requires Termination Letter",
      requiredFields: ["reportedBy", "authorizedBy", "effectiveDate", "reason", "formNumber"],
    },
    "reinstate": {
      title: "Reinstate Staff",
      description: "Return to active duty - Requires Authorization",
      requiredFields: ["reportedBy", "authorizedBy", "effectiveDate", "remarks"],
    },
  };

  const config = actionConfig[actionType as keyof typeof actionConfig];

  const handleSubmit = async () => {
    if (!config) return;

    // Validate required fields
    const missingFields = config.requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Log to audit trail
    await logAudit({
      module: "staff_management",
      action: `staff_${actionType}`,
      recordId: staff?.id,
      changes: {
        staffName: staff?.name,
        actionType,
        ...formData,
        status: "pending-supervisor-approval",
      },
    });

    toast({
      title: "Action Recorded",
      description: `${config.title} submitted for supervisor verification`,
    });

    onOpenChange(false);
  };

  if (!config || !staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <Card className="p-4 bg-muted/50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-foreground/90 font-semibold">Staff ID:</span>
              <span className="ml-2 font-medium">{staff.id}</span>
            </div>
            <div>
              <span className="text-foreground/90 font-semibold">Name:</span>
              <span className="ml-2 font-medium">{staff.name}</span>
            </div>
            <div>
              <span className="text-foreground/90 font-semibold">Current Site:</span>
              <span className="ml-2 font-medium">{staff.site}</span>
            </div>
            <div>
              <span className="text-foreground/90 font-semibold">Current Status:</span>
              <span className="ml-2 font-medium">{staff.status}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportedBy">Reported By (Site Supervisor) *</Label>
              <Input
                id="reportedBy"
                value={formData.reportedBy}
                onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                placeholder="Supervisor name"
              />
            </div>
            
            {config.requiredFields.includes("authorizedBy") && (
              <div>
                <Label htmlFor="authorizedBy">Authorized By (COO/Operations) *</Label>
                <Input
                  id="authorizedBy"
                  value={formData.authorizedBy}
                  onChange={(e) => setFormData({ ...formData, authorizedBy: e.target.value })}
                  placeholder="Authorizing officer"
                />
              </div>
            )}

            <div>
              <Label htmlFor="effectiveDate">Effective Date *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>

            {config.requiredFields.includes("formNumber") && (
              <div>
                <Label htmlFor="formNumber">Form/Document Number *</Label>
                <Input
                  id="formNumber"
                  value={formData.formNumber}
                  onChange={(e) => setFormData({ ...formData, formNumber: e.target.value })}
                  placeholder="e.g., OFF-001, TRN-045"
                />
              </div>
            )}
          </div>

          {actionType === "transfer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newSite">New Site *</Label>
                <Input
                  id="newSite"
                  value={formData.newSite}
                  onChange={(e) => setFormData({ ...formData, newSite: e.target.value })}
                  placeholder="Destination site"
                />
              </div>
              <div>
                <Label htmlFor="newClient">New Client *</Label>
                <Input
                  id="newClient"
                  value={formData.newClient}
                  onChange={(e) => setFormData({ ...formData, newClient: e.target.value })}
                  placeholder="Client name"
                />
              </div>
            </div>
          )}

          {actionType === "leave" && (
            <div>
              <Label htmlFor="duration">Leave Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 7 days, 2 weeks"
              />
            </div>
          )}

          {config.requiredFields.includes("reason") && (
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Detailed reason for this action"
                className="min-h-[100px]"
              />
            </div>
          )}

          <div>
            <Label htmlFor="remarks">Additional Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Any additional notes or observations"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <Card className="p-3 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              This action will be logged in the system and requires supervisor verification before approval.
              All entries are auditable and must be supported by proper documentation.
            </p>
          </div>
        </Card>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2 bg-gradient-command">
            <Save className="w-4 h-4" />
            Submit for Approval
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffActionDialog;
