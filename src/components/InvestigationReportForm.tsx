import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Save, Send, Clock, AlertCircle, CheckCircle, FileCheck, Upload, Paperclip, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvestigationReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId?: string;
}

const InvestigationReportForm = ({ open, onOpenChange, caseId }: InvestigationReportFormProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cover");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [reportMode, setReportMode] = useState<"manual" | "upload">("manual");
  const [uploadedReport, setUploadedReport] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    // I. Cover Page
    caseNumber: caseId || "",
    title: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    investigationOfficer: "",
    submissionDate: new Date().toISOString().split('T')[0],
    
    // II. Executive Summary
    executiveSummary: "",
    
    // III. Background
    background: "",
    complainant: "",
    subject: "",
    witnesses: "",
    
    // IV. Methodology
    methodology: "",
    
    // V. Findings
    findings: "",
    
    // VI. Evidence List
    evidenceList: "",
    
    // VII. Analysis and Conclusion
    analysis: "",
    
    // VIII. Recommendations
    recommendations: "",
    
    // IX. Attachments
    attachments: "",
    
    // X. Signatures
    investigatorSignature: "",
    approverSignature: "",
    approvalDate: "",
    
    // Workflow fields
    reportStatus: "draft" as "draft" | "in-progress" | "under-review" | "final-submission" | "approved" | "returned",
    cooRemarks: "",
    auditTrail: [] as Array<{
      action: string;
      officer: string;
      timestamp: string;
      remarks?: string;
    }>,
  });

  // Load draft on mount (sessionStorage only — drafts are short-lived and
  // cleared when the browser tab closes; sensitive case data must not persist
  // unencrypted in localStorage).
  useEffect(() => {
    if (caseId) {
      const savedDraft = sessionStorage.getItem(`investigation-report-${caseId}`);
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
      }
    }
  }, [caseId]);

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    
    // Add audit trail entry for significant changes
    if (field !== "cooRemarks" && field !== "reportStatus") {
      const auditEntry = {
        action: `Updated ${field}`,
        officer: formData.investigationOfficer || "System",
        timestamp: new Date().toISOString(),
      };
      updatedData.auditTrail = [...formData.auditTrail, auditEntry];
    }
    
    setFormData(updatedData);
  };

  const handleSaveDraft = () => {
    const updatedData = {
      ...formData,
      reportStatus: "draft" as const,
    };
    
    updatedData.auditTrail = [
      ...formData.auditTrail,
      {
        action: "Draft Saved",
        officer: formData.investigationOfficer || "System",
        timestamp: new Date().toISOString(),
      }
    ];
    
    sessionStorage.setItem(`investigation-report-${formData.caseNumber}`, JSON.stringify(updatedData));
    setFormData(updatedData);
    
    toast({
      title: "Draft Saved",
      description: "Your investigation report has been saved. You can continue editing anytime.",
    });
  };

  const handleUploadExistingReport = async () => {
    if (!uploadedReport) {
      toast({
        title: "No File Selected",
        description: "Please select a report file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for the report",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = uploadedReport.name.split(".").pop();
      const fileName = `${Date.now()}-${uploadedReport.name}`;
      const filePath = `investigations/${caseId}/reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, uploadedReport);

      if (uploadError) throw uploadError;

      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert({
          document_number: `DOC-INV-${Date.now()}`,
          title: formData.title,
          description: formData.executiveSummary || "Uploaded investigation report",
          category: "investigation",
          file_url: filePath,
          file_name: uploadedReport.name,
          file_size: uploadedReport.size,
          file_type: uploadedReport.type,
        })
        .select()
        .single();

      if (docError) throw docError;

      const { error: attachError } = await supabase
        .from("investigation_attachments")
        .insert({
          investigation_id: caseId || formData.caseNumber,
          document_id: docData.id,
          attachment_type: "Final Report",
          notes: "Main investigation report (uploaded)",
        });

      if (attachError) throw attachError;

      toast({
        title: "Report Uploaded Successfully",
        description: "The investigation report has been uploaded and attached to this case",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
      toast({
        title: "Files Added",
        description: `${newFiles.length} file(s) added to investigation`,
      });
    }
  };

  const handleUploadAttachments = async () => {
    if (attachments.length === 0 || !caseId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of attachments) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `investigations/${caseId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: docData, error: docError } = await supabase
          .from("documents")
          .insert({
            document_number: `DOC-INV-${Date.now()}`,
            title: file.name,
            category: "investigation",
            file_url: filePath,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
          })
          .select()
          .single();

        if (docError) throw docError;

        const { error: attachError } = await supabase
          .from("investigation_attachments")
          .insert({
            investigation_id: caseId,
            document_id: docData.id,
            attached_by: user.id,
          });

        if (attachError) throw attachError;
      }

      toast({
        title: "Success",
        description: "Documents uploaded and attached to investigation",
      });

      setAttachments([]);
      loadAttachedDocuments();
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadAttachedDocuments = async () => {
    if (!caseId) return;

    try {
      const { data, error } = await supabase
        .from("investigation_attachments")
        .select("*, document:documents(*)")
        .eq("investigation_id", caseId);

      if (error) throw error;
      setUploadedDocs(data || []);
    } catch (error: any) {
      console.error("Error loading attachments:", error);
    }
  };

  useEffect(() => {
    if (open && caseId) {
      loadAttachedDocuments();
    }
  }, [open, caseId]);

  const handleSubmitReport = async () => {
    // Validate required fields
    if (!formData.caseNumber || !formData.title || !formData.investigationOfficer) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Case Number, Title, Investigation Officer).",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save to incidents table for Investigator App sync
      const { error } = await supabase
        .from("incidents")
        .insert([{
          incident_number: formData.caseNumber,
          title: formData.title,
          incident_type: "Investigation",
          location: formData.location || "Not specified",
          description: formData.executiveSummary || formData.background || "",
          severity: "medium",
          status: "open",
          occurred_at: formData.date || new Date().toISOString(),
        }]);

      if (error) {
        // If duplicate, try to update instead
        if (error.code === "23505") {
          const { error: updateError } = await supabase
            .from("incidents")
            .update({
              title: formData.title,
              location: formData.location || "Not specified",
              description: formData.executiveSummary || formData.background || "",
            })
            .eq("incident_number", formData.caseNumber);

          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      const updatedData = {
        ...formData,
        reportStatus: "final-submission" as const,
        submissionDate: new Date().toISOString().split('T')[0],
      };

      updatedData.auditTrail = [
        ...formData.auditTrail,
        {
          action: "Final Submission",
          officer: formData.investigationOfficer,
          timestamp: new Date().toISOString(),
          remarks: "Report submitted to COO for approval"
        }
      ];

      // Final reports are persisted to the `incidents` table above (RLS
      // protected). Do NOT mirror sensitive case content to localStorage —
      // it survives browser restarts and is readable by any script on the page.
      // Clear any in-progress draft from sessionStorage now that submission succeeded.
      sessionStorage.removeItem(`investigation-report-${formData.caseNumber}`);

      toast({
        title: "Report Submitted",
        description: "Final investigation report submitted to COO for approval.",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    "draft": { label: "Draft", color: "bg-muted", icon: FileText },
    "in-progress": { label: "In Progress", color: "bg-blue-500", icon: Clock },
    "under-review": { label: "Under Review", color: "bg-yellow-500", icon: AlertCircle },
    "final-submission": { label: "Final Submission", color: "bg-purple-500", icon: Send },
    "approved": { label: "Approved", color: "bg-green-500", icon: CheckCircle },
    "returned": { label: "Returned for Revision", color: "bg-orange-500", icon: FileCheck },
  };

  const tabs = [
    { value: "cover", label: "Cover Page", number: "I" },
    { value: "summary", label: "Executive Summary", number: "II" },
    { value: "background", label: "Background", number: "III" },
    { value: "methodology", label: "Methodology", number: "IV" },
    { value: "findings", label: "Findings", number: "V" },
    { value: "evidence", label: "Evidence List", number: "VI" },
    { value: "analysis", label: "Analysis", number: "VII" },
    { value: "recommendations", label: "Recommendations", number: "VIII" },
    { value: "attachments", label: "Attachments", number: "IX" },
    { value: "signatures", label: "Signatures", number: "X" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <DialogTitle>Final Investigation Report</DialogTitle>
            </div>
            <Badge className={statusConfig[formData.reportStatus].color}>
              {statusConfig[formData.reportStatus].label}
            </Badge>
          </div>
          <DialogDescription>
            Comprehensive investigation report per Black Hawk Investigation Manual - Non-blocking workflow: Continue editing at any stage
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={reportMode === "manual" ? "default" : "outline"}
            onClick={() => setReportMode("manual")}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Fill Form Manually
          </Button>
          <Button
            variant={reportMode === "upload" ? "default" : "outline"}
            onClick={() => setReportMode("upload")}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Existing Report
          </Button>
        </div>

        {reportMode === "manual" ? (
        <>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 h-auto flex-wrap">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-2">
                {tab.number}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* I. Cover Page */}
          <TabsContent value="cover" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">I. Cover Page</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="caseNumber">Case Number *</Label>
                  <Input
                    id="caseNumber"
                    value={formData.caseNumber}
                    onChange={(e) => handleInputChange("caseNumber", e.target.value)}
                    placeholder="INV-2025-XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title/Type of Incident *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Unauthorized Access - JKIA"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Site/Location"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date of Incident</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="investigationOfficer">Investigation Officer *</Label>
                  <Input
                    id="investigationOfficer"
                    value={formData.investigationOfficer}
                    onChange={(e) => handleInputChange("investigationOfficer", e.target.value)}
                    placeholder="Name and Rank"
                  />
                </div>
                <div>
                  <Label htmlFor="submissionDate">Date of Submission</Label>
                  <Input
                    id="submissionDate"
                    type="date"
                    value={formData.submissionDate}
                    onChange={(e) => handleInputChange("submissionDate", e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* II. Executive Summary */}
          <TabsContent value="summary" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">II. Executive Summary</h3>
              <div>
                <Label htmlFor="executiveSummary">Brief overview of the case, scope, and conclusion</Label>
                <Textarea
                  id="executiveSummary"
                  value={formData.executiveSummary}
                  onChange={(e) => handleInputChange("executiveSummary", e.target.value)}
                  placeholder="Provide a concise overview of the investigation including key findings and conclusions..."
                  className="min-h-[200px] mt-2"
                />
              </div>
            </Card>
          </TabsContent>

          {/* III. Background */}
          <TabsContent value="background" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">III. Background</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="background">How and when the incident was reported</Label>
                  <Textarea
                    id="background"
                    value={formData.background}
                    onChange={(e) => handleInputChange("background", e.target.value)}
                    placeholder="Describe how the incident came to light and the initial report..."
                    className="min-h-[120px] mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="complainant">Complainant</Label>
                  <Input
                    id="complainant"
                    value={formData.complainant}
                    onChange={(e) => handleInputChange("complainant", e.target.value)}
                    placeholder="Name and details of person who reported"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Person(s) under investigation"
                  />
                </div>
                <div>
                  <Label htmlFor="witnesses">Witnesses</Label>
                  <Textarea
                    id="witnesses"
                    value={formData.witnesses}
                    onChange={(e) => handleInputChange("witnesses", e.target.value)}
                    placeholder="List all witnesses and their roles..."
                    className="min-h-[80px] mt-2"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* IV. Methodology */}
          <TabsContent value="methodology" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">IV. Methodology</h3>
              <div>
                <Label htmlFor="methodology">Steps taken during the investigation</Label>
                <Textarea
                  id="methodology"
                  value={formData.methodology}
                  onChange={(e) => handleInputChange("methodology", e.target.value)}
                  placeholder="Detail all investigative steps: interviews conducted, inspections performed, documents reviewed, CCTV footage analyzed, etc."
                  className="min-h-[200px] mt-2"
                />
              </div>
            </Card>
          </TabsContent>

          {/* V. Findings */}
          <TabsContent value="findings" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">V. Findings</h3>
              <div>
                <Label htmlFor="findings">Facts established, supported by evidence and statements</Label>
                <Textarea
                  id="findings"
                  value={formData.findings}
                  onChange={(e) => handleInputChange("findings", e.target.value)}
                  placeholder="Present all established facts and findings, referencing supporting evidence..."
                  className="min-h-[200px] mt-2"
                />
              </div>
            </Card>
          </TabsContent>

          {/* VI. Evidence List */}
          <TabsContent value="evidence" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">VI. Evidence List</h3>
              <div>
                <Label htmlFor="evidenceList">Summary of all evidence collected</Label>
                <Textarea
                  id="evidenceList"
                  value={formData.evidenceList}
                  onChange={(e) => handleInputChange("evidenceList", e.target.value)}
                  placeholder="List all evidence: documents, photographs, CCTV clips, physical items, etc. Include evidence IDs where applicable..."
                  className="min-h-[200px] mt-2"
                />
              </div>
            </Card>
          </TabsContent>

          {/* VII. Analysis and Conclusion */}
          <TabsContent value="analysis" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">VII. Analysis and Conclusion</h3>
              <div>
                <Label htmlFor="analysis">Evaluation of evidence and determination</Label>
                <Textarea
                  id="analysis"
                  value={formData.analysis}
                  onChange={(e) => handleInputChange("analysis", e.target.value)}
                  placeholder="Analyze all evidence, establish cause and responsibility, and provide your professional conclusion..."
                  className="min-h-[200px] mt-2"
                />
              </div>
            </Card>
          </TabsContent>

          {/* VIII. Recommendations */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">VIII. Recommendations</h3>
              <div>
                <Label htmlFor="recommendations">Corrective and preventive actions</Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange("recommendations", e.target.value)}
                  placeholder="Recommend disciplinary actions, procedural changes, operational improvements, or preventive measures..."
                  className="min-h-[200px] mt-2"
                />
              </div>
            </Card>
          </TabsContent>

          {/* IX. Attachments */}
          <TabsContent value="attachments" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">IX. Attachments</h3>
              <div>
                <Label htmlFor="attachments">List of attached documents</Label>
                <Textarea
                  id="attachments"
                  value={formData.attachments}
                  onChange={(e) => handleInputChange("attachments", e.target.value)}
                  placeholder="List all attachments: witness statements, photographs, evidence logs, supporting documents, etc."
                  className="min-h-[150px] mt-2"
                />
              </div>
            </Card>
          </TabsContent>

          {/* X. Signatures */}
          <TabsContent value="signatures" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-foreground">X. Signatures</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="investigatorSignature">Investigator's Signature/Name</Label>
                  <Input
                    id="investigatorSignature"
                    value={formData.investigatorSignature}
                    onChange={(e) => handleInputChange("investigatorSignature", e.target.value)}
                    placeholder="Digital signature or full name"
                  />
                </div>
                <div>
                  <Label htmlFor="approverSignature">COO/Authorized Officer Signature</Label>
                  <Input
                    id="approverSignature"
                    value={formData.approverSignature}
                    onChange={(e) => handleInputChange("approverSignature", e.target.value)}
                    placeholder="Approval signature (to be completed by COO)"
                  />
                </div>
                <div>
                  <Label htmlFor="approvalDate">Approval Date</Label>
                  <Input
                    id="approvalDate"
                    type="date"
                    value={formData.approvalDate}
                    onChange={(e) => handleInputChange("approvalDate", e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Audit Trail Section */}
        {formData.auditTrail.length > 0 && (
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2 text-sm text-foreground/90">Audit Trail</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
              {formData.auditTrail.slice(-5).map((entry, idx) => (
                <div key={idx} className="flex justify-between text-foreground/80">
                  <span>{entry.action} - {entry.officer}</span>
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Select
              value={formData.reportStatus}
              onValueChange={(value) => handleInputChange("reportStatus", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="final-submission">Final Submission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReport} className="gap-2 bg-gradient-command">
              <Send className="w-4 h-4" />
              Submit to COO
            </Button>
          </div>
        </div>
        </>
        ) : (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">Upload Existing Investigation Report</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportFile">Select Report File (PDF, Word, Excel)</Label>
                <Input
                  id="reportFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const maxSize = 50 * 1024 * 1024; // 50MB
                      if (file.size > maxSize) {
                        toast({
                          title: "File Too Large",
                          description: "Maximum file size is 50MB",
                          variant: "destructive",
                        });
                        return;
                      }
                      setUploadedReport(file);
                      handleInputChange("title", file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                />
                {uploadedReport && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {uploadedReport.name} ({(uploadedReport.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="uploadTitle">Report Title *</Label>
                <Input
                  id="uploadTitle"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter report title"
                />
              </div>

              <div>
                <Label htmlFor="uploadSummary">Executive Summary (Optional)</Label>
                <Textarea
                  id="uploadSummary"
                  value={formData.executiveSummary}
                  onChange={(e) => handleInputChange("executiveSummary", e.target.value)}
                  placeholder="Brief summary of the investigation..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadExistingReport} className="gap-2 bg-gradient-command">
              <Upload className="w-4 h-4" />
              Upload Report
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvestigationReportForm;
