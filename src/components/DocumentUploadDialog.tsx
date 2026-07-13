import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investigationId?: string;
}

export const DocumentUploadDialog = ({ open, onOpenChange, investigationId }: DocumentUploadDialogProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    expiryDate: "",
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.title || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = formData.file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const bucket = formData.category === "staff_certification" ? "certifications" : "documents";
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        document_number: `DOC-${Date.now()}`,
        title: formData.title,
        description: formData.description || null,
        category: formData.category as any,
        file_url: filePath,
        file_name: formData.file.name,
        file_size: formData.file.size,
        file_type: formData.file.type,
        expiry_date: formData.expiryDate || null,
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      onOpenChange(false);
      setFormData({ title: "", description: "", category: "", expiryDate: "", file: null });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-foreground">Upload Document</DialogTitle>
          <p className="text-sm text-muted-foreground">Add a new document to the compliance repository</p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter document title"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a brief description of the document"
              className="bg-background border-border min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select document category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-[300px]">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">HR & EMPLOYMENT</div>
                <SelectItem value="hr_employment">HR & Employment (General)</SelectItem>
                <SelectItem value="employee_contract">Employee Contract</SelectItem>
                <SelectItem value="job_description">Job Description</SelectItem>
                <SelectItem value="employee_handbook">Employee Handbook</SelectItem>
                <SelectItem value="leave_policy">Leave Policy</SelectItem>
                <SelectItem value="nda">Non-Disclosure Agreement (NDA)</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">HEALTH & SAFETY</div>
                <SelectItem value="health_safety">Health & Safety (General)</SelectItem>
                <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                <SelectItem value="incident_report">Incident Report</SelectItem>
                <SelectItem value="safety_certificate">Safety Certificate</SelectItem>
                <SelectItem value="emergency_plan">Emergency Plan</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">FINANCIAL</div>
                <SelectItem value="financial">Financial Document (General)</SelectItem>
                <SelectItem value="financial_statement">Financial Statement</SelectItem>
                <SelectItem value="audit_report">Audit Report</SelectItem>
                <SelectItem value="tax_document">Tax Document</SelectItem>
                <SelectItem value="invoice_template">Invoice Template</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">OPERATIONAL</div>
                <SelectItem value="operational">Operational Document (General)</SelectItem>
                <SelectItem value="sop">Standard Operating Procedure</SelectItem>
                <SelectItem value="process_documentation">Process Documentation</SelectItem>
                <SelectItem value="training_material">Training Material</SelectItem>
                <SelectItem value="work_instruction">Work Instruction</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">STAFF CERTIFICATIONS</div>
                <SelectItem value="staff_certification">Staff Certification (General)</SelectItem>
                <SelectItem value="psra_license">PSRA License</SelectItem>
                <SelectItem value="first_aid">First Aid Certificate</SelectItem>
                <SelectItem value="drivers_license">Driver's License</SelectItem>
                <SelectItem value="firearms_license">Firearms License</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">CLIENT MANAGEMENT</div>
                <SelectItem value="client_management">Client Document (General)</SelectItem>
                <SelectItem value="client_contract">Client Contract</SelectItem>
                <SelectItem value="service_agreement">Service Agreement</SelectItem>
                <SelectItem value="proposal">Proposal/Quotation</SelectItem>
                <SelectItem value="site_sop">Site-Specific SOP</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">POLICIES & PROCEDURES</div>
                <SelectItem value="policy">Company Policy (General)</SelectItem>
                <SelectItem value="code_of_conduct">Code of Conduct</SelectItem>
                <SelectItem value="ethics_policy">Ethics Policy</SelectItem>
                <SelectItem value="security_policy">Security Policy</SelectItem>
                <SelectItem value="vehicle_policy">Vehicle Policy</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">OTHER</div>
                <SelectItem value="investigation">Investigation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Expiry Date (Optional)</Label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">Set an expiry date if this document has a validity period</p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">File *</Label>
            <Input 
              type="file" 
              onChange={handleFileChange} 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="bg-background border-border cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 50MB)</p>
            {formData.file && (
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-sm text-foreground font-medium">
                  📎 {formData.file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
