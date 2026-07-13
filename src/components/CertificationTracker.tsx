import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const CertificationTracker = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    staffId: "",
    certificationType: "",
    certificationNumber: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });

  const { data: certifications, isLoading } = useQuery({
    queryKey: ["staff-certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_certifications")
        .select("*, staff:staff(full_name, staff_id)")
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: staffList } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, full_name, staff_id")
        .eq("status", "active")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const handleAddCertification = async () => {
    if (!formData.staffId || !formData.certificationType || !formData.expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("staff_certifications").insert({
        staff_id: formData.staffId,
        certification_type: formData.certificationType,
        certification_number: formData.certificationNumber || null,
        issuing_authority: formData.issuingAuthority || null,
        issue_date: formData.issueDate,
        expiry_date: formData.expiryDate,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certification added successfully",
      });

      setAddDialogOpen(false);
      setFormData({
        staffId: "",
        certificationType: "",
        certificationNumber: "",
        issuingAuthority: "",
        issueDate: "",
        expiryDate: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) {
      return { label: "Expired", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
    } else if (days <= 30) {
      return { label: "Expiring Soon", color: "bg-accent/10 text-accent-foreground border-accent/20", icon: Clock };
    }
    return { label: "Active", color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle };
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Staff Certifications</h3>
          <p className="text-sm text-foreground/80 font-medium">Track and manage staff certifications and licenses</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Name</TableHead>
            <TableHead>Staff ID</TableHead>
            <TableHead>Certification Type</TableHead>
            <TableHead>Certification Number</TableHead>
            <TableHead>Issuing Authority</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Days Until Expiry</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                Loading certifications...
              </TableCell>
            </TableRow>
          ) : certifications?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                No certifications found
              </TableCell>
            </TableRow>
          ) : (
            certifications?.map((cert) => {
              const expiryStatus = getExpiryStatus(cert.expiry_date);
              const daysUntilExpiry = differenceInDays(new Date(cert.expiry_date), new Date());
              const StatusIcon = expiryStatus.icon;

              return (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.staff?.full_name}</TableCell>
                  <TableCell>{cert.staff?.staff_id}</TableCell>
                  <TableCell>{cert.certification_type}</TableCell>
                  <TableCell>{cert.certification_number || "N/A"}</TableCell>
                  <TableCell>{cert.issuing_authority || "N/A"}</TableCell>
                  <TableCell>{cert.issue_date ? format(new Date(cert.issue_date), "MMM dd, yyyy") : "N/A"}</TableCell>
                  <TableCell>{format(new Date(cert.expiry_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <span className={daysUntilExpiry < 0 ? "text-red-500 font-semibold" : daysUntilExpiry <= 30 ? "text-yellow-500 font-semibold" : ""}>
                      {daysUntilExpiry} days
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={expiryStatus.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {expiryStatus.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-foreground">Add Staff Certification</DialogTitle>
            <p className="text-sm text-muted-foreground">Register a new certification or training credential for a staff member</p>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Staff Member *</Label>
              <Select value={formData.staffId} onValueChange={(value) => setFormData({ ...formData, staffId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList?.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name} ({staff.staff_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Certification Type *</Label>
              <Select
                value={formData.certificationType}
                onValueChange={(value) => setFormData({ ...formData, certificationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select certification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PSRA License">PSRA License</SelectItem>
                  <SelectItem value="First Aid">First Aid</SelectItem>
                  <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                  <SelectItem value="Driving License">Driving License</SelectItem>
                  <SelectItem value="K9 Handler">K9 Handler</SelectItem>
                  <SelectItem value="CCTV Operator">CCTV Operator</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Certification Number</Label>
              <Input
                value={formData.certificationNumber}
                onChange={(e) => setFormData({ ...formData, certificationNumber: e.target.value })}
                placeholder="Certificate/License number"
              />
            </div>

            <div>
              <Label>Issuing Authority</Label>
              <Input
                value={formData.issuingAuthority}
                onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                placeholder="e.g., PSRA, Red Cross"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>

              <div>
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCertification}>
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
