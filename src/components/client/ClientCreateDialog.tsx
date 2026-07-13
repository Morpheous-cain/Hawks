import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const clientSchema = z.object({
  legal_name: z.string().trim().min(2, "Company name must be at least 2 characters").max(200, "Name too long"),
  client_id: z.string().trim().min(3, "Client ID required").max(50, "Client ID too long"),
  sector: z.string().min(1, "Sector is required"),
  primary_contact_name: z.string().trim().min(2, "Contact name required").max(100, "Name too long"),
  primary_contact_role: z.string().trim().max(100, "Role too long").optional(),
  background: z.string().trim().max(1000, "Background too long").optional(),
  gps_lat: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= -90 && parseFloat(val) <= 90), "Latitude must be between -90 and 90"),
  gps_lng: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= -180 && parseFloat(val) <= 180), "Longitude must be between -180 and 180"),
  geofence_radius_meters: z.string().optional().refine((val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 10 && parseInt(val) <= 1000), "Radius must be between 10 and 1000 meters")
});

interface ClientCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ClientCreateDialog = ({ open, onOpenChange, onSuccess }: ClientCreateDialogProps) => {
  const [formData, setFormData] = useState({
    legal_name: "",
    client_id: "",
    trading_name: "",
    sector: "",
    primary_contact_name: "",
    primary_contact_role: "",
    primary_contact_phone: "",
    secondary_contact_name: "",
    secondary_contact_role: "",
    secondary_contact_phone: "",
    background: "",
    status: "active",
    gps_lat: "",
    gps_lng: "",
    geofence_radius_meters: "50",
    contract_start_date: undefined as Date | undefined,
    contract_end_date: undefined as Date | undefined
  });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      clientSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      let contractFileUrl = null;

      // Upload contract file if selected
      if (contractFile) {
        const fileExt = contractFile.name.split('.').pop();
        const fileName = `${formData.client_id}-contract-${Date.now()}.${fileExt}`;
        const filePath = `contracts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, contractFile);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast.error('Failed to upload contract file');
          return;
        }

        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        contractFileUrl = urlData.publicUrl;
      }

      const { data: clientData, error } = await supabase
        .from('clients')
        .insert([{
          legal_name: formData.legal_name,
          client_id: formData.client_id,
          trading_name: formData.trading_name || null,
          sector: formData.sector,
          primary_contact_name: formData.primary_contact_name,
          primary_contact_role: formData.primary_contact_role || null,
          primary_contact_phone: formData.primary_contact_phone || null,
          secondary_contact_name: formData.secondary_contact_name || null,
          secondary_contact_role: formData.secondary_contact_role || null,
          secondary_contact_phone: formData.secondary_contact_phone || null,
          background: formData.background || null,
          status: formData.status,
          gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
          gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
          geofence_radius_meters: formData.geofence_radius_meters ? parseInt(formData.geofence_radius_meters) : 50,
          contract_start_date: formData.contract_start_date ? format(formData.contract_start_date, 'yyyy-MM-dd') : null,
          contract_end_date: formData.contract_end_date ? format(formData.contract_end_date, 'yyyy-MM-dd') : null,
          contract_ref: contractFileUrl,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Client created successfully');
      onSuccess();
      onOpenChange(false);
      setFormData({
        legal_name: "",
        client_id: "",
        trading_name: "",
        sector: "",
        primary_contact_name: "",
        primary_contact_role: "",
        primary_contact_phone: "",
        secondary_contact_name: "",
        secondary_contact_role: "",
        secondary_contact_phone: "",
        background: "",
        status: "active",
        gps_lat: "",
        gps_lng: "",
        geofence_radius_meters: "50",
        contract_start_date: undefined,
        contract_end_date: undefined
      });
      setContractFile(null);
      setErrors({});
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setContractFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legal Name *</Label>
              <Input
                value={formData.legal_name}
                onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                placeholder="ABC Company Limited"
                className={errors.legal_name ? "border-alert-critical" : ""}
                maxLength={200}
              />
              {errors.legal_name && <p className="text-sm text-alert-critical">{errors.legal_name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Client ID *</Label>
              <Input
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                placeholder="CL-2025-001"
                className={errors.client_id ? "border-alert-critical" : ""}
                maxLength={50}
              />
              {errors.client_id && <p className="text-sm text-alert-critical">{errors.client_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Trading Name (Optional)</Label>
              <Input
                value={formData.trading_name}
                onChange={(e) => setFormData({...formData, trading_name: e.target.value})}
                placeholder="ABC Corp"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Sector *</Label>
              <Select value={formData.sector} onValueChange={(value) => setFormData({...formData, sector: value})}>
                <SelectTrigger className={errors.sector ? "border-alert-critical" : ""}>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="banking">Banking & Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.sector && <p className="text-sm text-alert-critical">{errors.sector}</p>}
            </div>

            <div className="space-y-2">
              <Label>Primary Contact Name *</Label>
              <Input
                value={formData.primary_contact_name}
                onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                placeholder="John Doe"
                className={errors.primary_contact_name ? "border-alert-critical" : ""}
                maxLength={100}
              />
              {errors.primary_contact_name && <p className="text-sm text-alert-critical">{errors.primary_contact_name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Primary Contact Role</Label>
              <Input
                value={formData.primary_contact_role}
                onChange={(e) => setFormData({...formData, primary_contact_role: e.target.value})}
                placeholder="Security Manager"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Primary Contact Phone</Label>
              <Input
                value={formData.primary_contact_phone}
                onChange={(e) => setFormData({...formData, primary_contact_phone: e.target.value})}
                placeholder="+254 700 000 000"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label>Secondary Contact Name</Label>
              <Input
                value={formData.secondary_contact_name}
                onChange={(e) => setFormData({...formData, secondary_contact_name: e.target.value})}
                placeholder="Jane Smith"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Secondary Contact Role</Label>
              <Input
                value={formData.secondary_contact_role}
                onChange={(e) => setFormData({...formData, secondary_contact_role: e.target.value})}
                placeholder="Operations Director"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Secondary Contact Phone</Label>
              <Input
                value={formData.secondary_contact_phone}
                onChange={(e) => setFormData({...formData, secondary_contact_phone: e.target.value})}
                placeholder="+254 700 000 001"
                maxLength={20}
              />
            </div>
          </div>

          {/* Location & Geofence Section */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-base font-medium mb-3 block">Location Coordinates (for Guard QR Verification)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Set the client location to enable geofence-based QR scanning for guards. Scans outside this area will be rejected.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lat}
                  onChange={(e) => setFormData({...formData, gps_lat: e.target.value})}
                  placeholder="-1.2921"
                  className={errors.gps_lat ? "border-alert-critical" : ""}
                />
                {errors.gps_lat && <p className="text-sm text-alert-critical">{errors.gps_lat}</p>}
              </div>

              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lng}
                  onChange={(e) => setFormData({...formData, gps_lng: e.target.value})}
                  placeholder="36.8219"
                  className={errors.gps_lng ? "border-alert-critical" : ""}
                />
                {errors.gps_lng && <p className="text-sm text-alert-critical">{errors.gps_lng}</p>}
              </div>

              <div className="space-y-2">
                <Label>Geofence Radius (meters)</Label>
                <Input
                  type="number"
                  value={formData.geofence_radius_meters}
                  onChange={(e) => setFormData({...formData, geofence_radius_meters: e.target.value})}
                  placeholder="50"
                  min="10"
                  max="1000"
                  className={errors.geofence_radius_meters ? "border-alert-critical" : ""}
                />
                {errors.geofence_radius_meters && <p className="text-sm text-alert-critical">{errors.geofence_radius_meters}</p>}
              </div>
            </div>
          </div>

          {/* Contract Dates Section */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-base font-medium mb-3 block">Contract Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.contract_start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.contract_start_date ? format(formData.contract_start_date, "PPP") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.contract_start_date}
                      onSelect={(date) => setFormData({...formData, contract_start_date: date})}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.contract_end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.contract_end_date ? format(formData.contract_end_date, "PPP") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.contract_end_date}
                      onSelect={(date) => setFormData({...formData, contract_end_date: date})}
                      disabled={(date) => formData.contract_start_date ? date < formData.contract_start_date : false}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Contract Upload Section */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-base font-medium mb-3 block">Upload Contract Document (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Upload an existing contract (PDF or Word document, max 10MB)
            </p>
            
            {contractFile ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{contractFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setContractFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label>Background (Optional, max 1000 characters)</Label>
            <Textarea
              value={formData.background}
              onChange={(e) => setFormData({...formData, background: e.target.value})}
              placeholder="Brief background about the client, special requirements, history..."
              rows={4}
              className={errors.background ? "border-alert-critical" : ""}
              maxLength={1000}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{errors.background && <span className="text-alert-critical">{errors.background}</span>}</span>
              <span>{formData.background.length}/1000</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
