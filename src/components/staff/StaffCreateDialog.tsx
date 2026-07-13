import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { User, Phone, Briefcase, GraduationCap, Heart, Shield, Shirt, Wallet, Camera, PenTool } from "lucide-react";

const staffSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  national_id: z.string().trim().min(5, "National ID required").max(20, "National ID too long"),
  phone: z.string().trim().regex(/^(\+254|0)?[17]\d{8}$/, "Invalid Kenyan phone number"),
  staff_id: z.string().trim().min(3, "Staff ID required").max(50, "Staff ID too long"),
  position: z.string().min(1, "Position is required"),
  contract_type: z.string().min(1, "Contract type is required")
});

interface StaffCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const StaffCreateDialog = ({ open, onOpenChange, onSuccess }: StaffCreateDialogProps) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: "",
    gender: "",
    date_of_birth: "",
    nationality: "Kenyan",
    national_id: "",
    kra_pin: "",
    nssf_number: "",
    nhif_number: "",
    marital_status: "",
    languages_spoken: "",
    
    // Contact Information
    phone: "",
    phone_alternate: "",
    email: "",
    residential_address: "",
    county: "",
    sub_county: "",
    ward: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    
    // Employment Details
    staff_id: "",
    position: "",
    deployment_site: "",
    contract_type: "",
    date_employed: new Date().toISOString().split('T')[0],
    reporting_supervisor: "",
    
    // Training & Certifications
    basic_security_training: false,
    basic_security_training_date: "",
    refresher_training: false,
    refresher_training_date: "",
    fire_safety_training: false,
    fire_safety_training_date: "",
    first_aid_training: false,
    first_aid_training_date: "",
    weapon_handling: false,
    weapon_handling_date: "",
    special_certifications: "",
    
    // Medical & Fitness
    medical_fitness_cleared: false,
    last_medical_check_date: "",
    blood_group: "",
    medical_conditions: "",
    
    // Security Screening
    background_check_completed: false,
    good_conduct_number: "",
    good_conduct_issue_date: "",
    previous_employers: "",
    reference_contacts: "",
    
    // Uniform & Equipment
    uniform_size: "",
    boot_size: "",
    uniform_qty: "2",
    boots_issued: false,
    baton_issued: false,
    whistle_issued: false,
    radio_issued: false,
    id_card_issued: false,
    reflector_jacket_issued: false,
    other_equipment: "",
    
    // Payroll Details
    salary_scale: "",
    bank_name: "",
    bank_branch: "",
    account_number: "",
    payment_cycle: "monthly",
    payroll_deductions: "",
    
    // Photo & Signatures
    photo_url: "",
    officer_signature: "",
    hr_signature: "",
    signature_date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      staffSchema.parse(formData);
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
      toast.error('Please fix form errors in Personal Information and Employment Details tabs');
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .insert([{
          full_name: formData.full_name,
          national_id: formData.national_id,
          phone: formData.phone,
          staff_id: formData.staff_id,
          position: formData.position,
          contract_type: formData.contract_type,
          date_employed: formData.date_employed,
          status: 'active'
        }]);

      if (error) throw error;

      toast.success('Officer bio data created successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error('Failed to create officer record');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      gender: "",
      date_of_birth: "",
      nationality: "Kenyan",
      national_id: "",
      kra_pin: "",
      nssf_number: "",
      nhif_number: "",
      marital_status: "",
      languages_spoken: "",
      phone: "",
      phone_alternate: "",
      email: "",
      residential_address: "",
      county: "",
      sub_county: "",
      ward: "",
      emergency_contact_name: "",
      emergency_contact_relationship: "",
      emergency_contact_phone: "",
      staff_id: "",
      position: "",
      deployment_site: "",
      contract_type: "",
      date_employed: new Date().toISOString().split('T')[0],
      reporting_supervisor: "",
      basic_security_training: false,
      basic_security_training_date: "",
      refresher_training: false,
      refresher_training_date: "",
      fire_safety_training: false,
      fire_safety_training_date: "",
      first_aid_training: false,
      first_aid_training_date: "",
      weapon_handling: false,
      weapon_handling_date: "",
      special_certifications: "",
      medical_fitness_cleared: false,
      last_medical_check_date: "",
      blood_group: "",
      medical_conditions: "",
      background_check_completed: false,
      good_conduct_number: "",
      good_conduct_issue_date: "",
      previous_employers: "",
      reference_contacts: "",
      uniform_size: "",
      boot_size: "",
      uniform_qty: "2",
      boots_issued: false,
      baton_issued: false,
      whistle_issued: false,
      radio_issued: false,
      id_card_issued: false,
      reflector_jacket_issued: false,
      other_equipment: "",
      salary_scale: "",
      bank_name: "",
      bank_branch: "",
      account_number: "",
      payment_cycle: "monthly",
      payroll_deductions: "",
      photo_url: "",
      officer_signature: "",
      hr_signature: "",
      signature_date: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setActiveTab("personal");
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Officer Bio Data Form</DialogTitle>
          <p className="text-sm text-muted-foreground">Security Officer / Guard / Supervisor / Controller / Investigator / Operations</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 h-auto">
              <TabsTrigger value="personal" className="flex flex-col items-center gap-1 p-2 text-xs">
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Phone className="h-4 w-4" />
                <span className="hidden lg:inline">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Briefcase className="h-4 w-4" />
                <span className="hidden lg:inline">Employment</span>
              </TabsTrigger>
              <TabsTrigger value="training" className="flex flex-col items-center gap-1 p-2 text-xs">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden lg:inline">Training</span>
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Heart className="h-4 w-4" />
                <span className="hidden lg:inline">Medical</span>
              </TabsTrigger>
              <TabsTrigger value="screening" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Shield className="h-4 w-4" />
                <span className="hidden lg:inline">Screening</span>
              </TabsTrigger>
              <TabsTrigger value="uniform" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Shirt className="h-4 w-4" />
                <span className="hidden lg:inline">Uniform</span>
              </TabsTrigger>
              <TabsTrigger value="payroll" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Wallet className="h-4 w-4" />
                <span className="hidden lg:inline">Payroll</span>
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Camera className="h-4 w-4" />
                <span className="hidden lg:inline">Photo</span>
              </TabsTrigger>
              <TabsTrigger value="signatures" className="flex flex-col items-center gap-1 p-2 text-xs">
                <PenTool className="h-4 w-4" />
                <span className="hidden lg:inline">Sign</span>
              </TabsTrigger>
            </TabsList>

            {/* 1. Personal Information */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">1. Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    placeholder="Enter full name"
                    className={errors.full_name ? "border-destructive" : ""}
                  />
                  {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={formData.date_of_birth} onChange={(e) => updateField('date_of_birth', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input value={formData.nationality} onChange={(e) => updateField('nationality', e.target.value)} placeholder="Kenyan" />
                </div>
                <div className="space-y-2">
                  <Label>ID/Passport Number *</Label>
                  <Input
                    value={formData.national_id}
                    onChange={(e) => updateField('national_id', e.target.value)}
                    placeholder="Enter ID number"
                    className={errors.national_id ? "border-destructive" : ""}
                  />
                  {errors.national_id && <p className="text-sm text-destructive">{errors.national_id}</p>}
                </div>
                <div className="space-y-2">
                  <Label>KRA PIN</Label>
                  <Input value={formData.kra_pin} onChange={(e) => updateField('kra_pin', e.target.value)} placeholder="A000000000X" />
                </div>
                <div className="space-y-2">
                  <Label>NSSF Number</Label>
                  <Input value={formData.nssf_number} onChange={(e) => updateField('nssf_number', e.target.value)} placeholder="Enter NSSF number" />
                </div>
                <div className="space-y-2">
                  <Label>NHIF Number</Label>
                  <Input value={formData.nhif_number} onChange={(e) => updateField('nhif_number', e.target.value)} placeholder="Enter NHIF number" />
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Select value={formData.marital_status} onValueChange={(v) => updateField('marital_status', v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Languages Spoken</Label>
                  <Input value={formData.languages_spoken} onChange={(e) => updateField('languages_spoken', e.target.value)} placeholder="English, Swahili, etc." />
                </div>
              </div>
            </TabsContent>

            {/* 2. Contact Information */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">2. Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number (Primary) *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+254712345678"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone Number (Alternate)</Label>
                  <Input value={formData.phone_alternate} onChange={(e) => updateField('phone_alternate', e.target.value)} placeholder="+254712345678" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="officer@email.com" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Current Residential Address</Label>
                  <Textarea value={formData.residential_address} onChange={(e) => updateField('residential_address', e.target.value)} placeholder="Enter full address" />
                </div>
                <div className="space-y-2">
                  <Label>County</Label>
                  <Input value={formData.county} onChange={(e) => updateField('county', e.target.value)} placeholder="Nairobi" />
                </div>
                <div className="space-y-2">
                  <Label>Sub-County</Label>
                  <Input value={formData.sub_county} onChange={(e) => updateField('sub_county', e.target.value)} placeholder="Westlands" />
                </div>
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Input value={formData.ward} onChange={(e) => updateField('ward', e.target.value)} placeholder="Parklands" />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input value={formData.emergency_contact_name} onChange={(e) => updateField('emergency_contact_name', e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select value={formData.emergency_contact_relationship} onValueChange={(v) => updateField('emergency_contact_relationship', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={formData.emergency_contact_phone} onChange={(e) => updateField('emergency_contact_phone', e.target.value)} placeholder="+254712345678" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 3. Employment Details */}
            <TabsContent value="employment" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">3. Employment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Black Hawk Employee Number *</Label>
                  <Input
                    value={formData.staff_id}
                    onChange={(e) => updateField('staff_id', e.target.value)}
                    placeholder="BH-2025-001"
                    className={errors.staff_id ? "border-destructive" : ""}
                  />
                  {errors.staff_id && <p className="text-sm text-destructive">{errors.staff_id}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Position / Rank *</Label>
                  <Select value={formData.position} onValueChange={(v) => updateField('position', v)}>
                    <SelectTrigger className={errors.position ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security_guard">Security Guard</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="controller">Controller</SelectItem>
                      <SelectItem value="investigator">Investigator</SelectItem>
                      <SelectItem value="patrol_officer">Patrol Officer</SelectItem>
                      <SelectItem value="control_room_operator">Control Room Operator</SelectItem>
                      <SelectItem value="response_team">Response Team</SelectItem>
                      <SelectItem value="k9_handler">K9 Handler</SelectItem>
                      <SelectItem value="escort_officer">Escort Officer</SelectItem>
                      <SelectItem value="deployment_officer">Deployment Officer</SelectItem>
                      <SelectItem value="field_ops_officer">Field Operations Officer</SelectItem>
                      <SelectItem value="operations_officer">Operations Officer</SelectItem>
                      <SelectItem value="operations_manager">Operations Manager</SelectItem>
                      <SelectItem value="area_manager">Area Manager</SelectItem>
                      <SelectItem value="branch_ops_manager">Branch Operations Manager</SelectItem>
                      <SelectItem value="regional_ops_manager">Regional Operations Manager</SelectItem>
                      <SelectItem value="assistant_senior_ops_manager">Assistant Senior Operations Manager</SelectItem>
                      <SelectItem value="facilities_ops_manager">Manager, Facilities & Operations</SelectItem>
                      <SelectItem value="branch_manager">Branch Manager</SelectItem>
                      <SelectItem value="regional_manager">Regional Manager</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                      <SelectItem value="contract_manager">Contract Manager</SelectItem>
                      <SelectItem value="guard_force_admin">Guard Force Admin</SelectItem>
                      <SelectItem value="technical_manager">Technical Manager</SelectItem>
                      <SelectItem value="technical_officer">Technical Officer</SelectItem>
                      <SelectItem value="training_manager">Training Manager</SelectItem>
                      <SelectItem value="training_officer">Training Officer</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                      <SelectItem value="hr_officer">HR Officer</SelectItem>
                      <SelectItem value="finance_manager">Finance Manager</SelectItem>
                      <SelectItem value="finance_officer">Finance Officer</SelectItem>
                      <SelectItem value="finance_director">Finance Director</SelectItem>
                      <SelectItem value="payroll_officer">Payroll Officer</SelectItem>
                      <SelectItem value="admin_manager">Admin Manager</SelectItem>
                      <SelectItem value="admin_officer">Admin Officer</SelectItem>
                      <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                      <SelectItem value="cit_manager">CIT Manager</SelectItem>
                      <SelectItem value="cit_officer">CIT Officer</SelectItem>
                      <SelectItem value="courier_manager">Courier Manager</SelectItem>
                      <SelectItem value="courier_dispatcher">Courier Dispatcher</SelectItem>
                      <SelectItem value="courier_officer">Courier Officer</SelectItem>
                      <SelectItem value="rider_driver">Rider / Driver</SelectItem>
                      <SelectItem value="event_security">Event Security</SelectItem>
                      <SelectItem value="risk_director">Director of Risk, Insurance & Welfare</SelectItem>
                      <SelectItem value="country_director">Country Director / Managing Director</SelectItem>
                      <SelectItem value="general_manager">General Manager</SelectItem>
                      <SelectItem value="coo">Chief Operations Officer</SelectItem>
                      <SelectItem value="ceo">Chief Executive Officer</SelectItem>
                      <SelectItem value="administrator">Administrator</SelectItem>
                      <SelectItem value="system_admin">System Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Deployment Site</Label>
                  <Input value={formData.deployment_site} onChange={(e) => updateField('deployment_site', e.target.value)} placeholder="Site name" />
                </div>
                <div className="space-y-2">
                  <Label>Employment Type *</Label>
                  <Select value={formData.contract_type} onValueChange={(v) => updateField('contract_type', v)}>
                    <SelectTrigger className={errors.contract_type ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Full-time (Permanent)</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="casual">Part-time / Casual</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.contract_type && <p className="text-sm text-destructive">{errors.contract_type}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Date Employed</Label>
                  <Input type="date" value={formData.date_employed} onChange={(e) => updateField('date_employed', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Reporting Supervisor</Label>
                  <Input value={formData.reporting_supervisor} onChange={(e) => updateField('reporting_supervisor', e.target.value)} placeholder="Supervisor name" />
                </div>
              </div>
            </TabsContent>

            {/* 4. Training & Certifications */}
            <TabsContent value="training" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">4. Training & Certifications</h3>
              <div className="space-y-4">
                {[
                  { key: 'basic_security_training', label: 'Basic Security Training' },
                  { key: 'refresher_training', label: 'Refresher Training' },
                  { key: 'fire_safety_training', label: 'Fire Safety Training' },
                  { key: 'first_aid_training', label: 'First Aid Training' },
                  { key: 'weapon_handling', label: 'Weapon Handling (if applicable)' }
                ].map((training) => (
                  <div key={training.key} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={formData[training.key as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => updateField(training.key, checked)}
                      />
                      <Label className="cursor-pointer">{training.label}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Date Completed:</Label>
                      <Input
                        type="date"
                        className="w-40"
                        value={formData[`${training.key}_date` as keyof typeof formData] as string}
                        onChange={(e) => updateField(`${training.key}_date`, e.target.value)}
                        disabled={!formData[training.key as keyof typeof formData]}
                      />
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Special Certifications (CCTV, K9, VIP Protection, etc.)</Label>
                  <Textarea
                    value={formData.special_certifications}
                    onChange={(e) => updateField('special_certifications', e.target.value)}
                    placeholder="List any special certifications..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* 5. Medical & Fitness */}
            <TabsContent value="medical" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">5. Medical & Fitness Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg col-span-2">
                  <Checkbox
                    checked={formData.medical_fitness_cleared}
                    onCheckedChange={(checked) => updateField('medical_fitness_cleared', checked)}
                  />
                  <Label>Medical Fitness Cleared</Label>
                </div>
                <div className="space-y-2">
                  <Label>Last Medical Check Date</Label>
                  <Input type="date" value={formData.last_medical_check_date} onChange={(e) => updateField('last_medical_check_date', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={formData.blood_group} onValueChange={(v) => updateField('blood_group', v)}>
                    <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Any Medical Conditions (Optional/Confidential)</Label>
                  <Textarea
                    value={formData.medical_conditions}
                    onChange={(e) => updateField('medical_conditions', e.target.value)}
                    placeholder="Enter any relevant medical conditions..."
                  />
                  <p className="text-xs text-muted-foreground">NOTE: Do not store sensitive health data unless legally required and approved by the officer.</p>
                </div>
              </div>
            </TabsContent>

            {/* 6. Security Screening */}
            <TabsContent value="screening" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">6. Security Screening & Vetting</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg col-span-2">
                  <Checkbox
                    checked={formData.background_check_completed}
                    onCheckedChange={(checked) => updateField('background_check_completed', checked)}
                  />
                  <Label>Background Check Completed</Label>
                </div>
                <div className="space-y-2">
                  <Label>Certificate of Good Conduct Number</Label>
                  <Input value={formData.good_conduct_number} onChange={(e) => updateField('good_conduct_number', e.target.value)} placeholder="Certificate number" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Issue</Label>
                  <Input type="date" value={formData.good_conduct_issue_date} onChange={(e) => updateField('good_conduct_issue_date', e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Previous Employer(s)</Label>
                  <Textarea value={formData.previous_employers} onChange={(e) => updateField('previous_employers', e.target.value)} placeholder="List previous employers..." />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Reference Contacts</Label>
                  <Textarea value={formData.reference_contacts} onChange={(e) => updateField('reference_contacts', e.target.value)} placeholder="Name, phone, relationship..." />
                </div>
              </div>
            </TabsContent>

            {/* 7. Uniform & Equipment */}
            <TabsContent value="uniform" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">7. Uniform & Equipment Issued</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Uniform Size</Label>
                  <Select value={formData.uniform_size} onValueChange={(v) => updateField('uniform_size', v)}>
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                      <SelectItem value="XXXL">XXXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Boot Size</Label>
                  <Input value={formData.boot_size} onChange={(e) => updateField('boot_size', e.target.value)} placeholder="e.g., 42" />
                </div>
                <div className="space-y-2">
                  <Label>Uniform Quantity</Label>
                  <Input type="number" value={formData.uniform_qty} onChange={(e) => updateField('uniform_qty', e.target.value)} placeholder="2" />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Items Issued</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'boots_issued', label: 'Boots' },
                    { key: 'baton_issued', label: 'Baton' },
                    { key: 'whistle_issued', label: 'Whistle' },
                    { key: 'radio_issued', label: 'Radio' },
                    { key: 'id_card_issued', label: 'ID Card' },
                    { key: 'reflector_jacket_issued', label: 'Reflector Jacket' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => updateField(item.key, checked)}
                      />
                      <Label className="cursor-pointer text-sm">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Other Equipment</Label>
                  <Input value={formData.other_equipment} onChange={(e) => updateField('other_equipment', e.target.value)} placeholder="Any other equipment issued..." />
                </div>
              </div>
            </TabsContent>

            {/* 8. Payroll Details */}
            <TabsContent value="payroll" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">8. Payroll Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salary Scale / Rank</Label>
                  <Select value={formData.salary_scale} onValueChange={(v) => updateField('salary_scale', v)}>
                    <SelectTrigger><SelectValue placeholder="Select scale" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grade_1">Grade 1 (Entry)</SelectItem>
                      <SelectItem value="grade_2">Grade 2</SelectItem>
                      <SelectItem value="grade_3">Grade 3</SelectItem>
                      <SelectItem value="grade_4">Grade 4 (Supervisor)</SelectItem>
                      <SelectItem value="grade_5">Grade 5 (Senior)</SelectItem>
                      <SelectItem value="grade_6">Grade 6 (Manager)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={formData.bank_name} onChange={(e) => updateField('bank_name', e.target.value)} placeholder="e.g., Equity Bank" />
                </div>
                <div className="space-y-2">
                  <Label>Bank Branch</Label>
                  <Input value={formData.bank_branch} onChange={(e) => updateField('bank_branch', e.target.value)} placeholder="e.g., Westlands" />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={formData.account_number} onChange={(e) => updateField('account_number', e.target.value)} placeholder="Enter account number" />
                </div>
                <div className="space-y-2">
                  <Label>Payment Cycle</Label>
                  <Select value={formData.payment_cycle} onValueChange={(v) => updateField('payment_cycle', v)}>
                    <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Payroll Deductions (Loans, Penalties, Welfare)</Label>
                  <Textarea value={formData.payroll_deductions} onChange={(e) => updateField('payroll_deductions', e.target.value)} placeholder="List any deductions..." />
                </div>
              </div>
            </TabsContent>

            {/* 9. Officer Photo */}
            <TabsContent value="photo" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">9. Officer Photo</h3>
              <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
                <div className="w-32 h-40 bg-muted rounded-lg flex items-center justify-center">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Officer" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 text-center">
                  <Label>Passport Photo URL</Label>
                  <Input
                    value={formData.photo_url}
                    onChange={(e) => updateField('photo_url', e.target.value)}
                    placeholder="Enter photo URL or upload in system"
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">Attach passport-size photo</p>
                </div>
              </div>
            </TabsContent>

            {/* 10. Digital Signatures */}
            <TabsContent value="signatures" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg border-b pb-2">10. Digital Signatures</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Officer Signature</Label>
                  <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <Input
                      value={formData.officer_signature}
                      onChange={(e) => updateField('officer_signature', e.target.value)}
                      placeholder="Type full name as signature"
                      className="border-0 bg-transparent text-center text-lg font-script"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>HR/Operations Signature</Label>
                  <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <Input
                      value={formData.hr_signature}
                      onChange={(e) => updateField('hr_signature', e.target.value)}
                      placeholder="Type full name as signature"
                      className="border-0 bg-transparent text-center text-lg font-script"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.signature_date} onChange={(e) => updateField('signature_date', e.target.value)} className="max-w-xs" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              * Required fields must be completed in Personal Information and Employment Details
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Officer Record
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
