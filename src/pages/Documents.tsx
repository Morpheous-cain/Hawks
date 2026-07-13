import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, Clock, AlertTriangle, CheckCircle, Search, Filter, Download, Eye } from "lucide-react";
import { DocumentUploadDialog } from "@/components/DocumentUploadDialog";
import { CertificationTracker } from "@/components/CertificationTracker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Documents = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory as any);
      }

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const categoryConfig = {
    // HR & Employment
    hr_employment: { label: "HR & Employment", color: "bg-primary/10 text-primary border-primary/20" },
    employee_contract: { label: "Employee Contract", color: "bg-primary/10 text-primary border-primary/20" },
    job_description: { label: "Job Description", color: "bg-primary/10 text-primary border-primary/20" },
    employee_handbook: { label: "Employee Handbook", color: "bg-primary/10 text-primary border-primary/20" },
    leave_policy: { label: "Leave Policy", color: "bg-primary/10 text-primary border-primary/20" },
    nda: { label: "NDA", color: "bg-primary/10 text-primary border-primary/20" },
    
    // Health & Safety
    health_safety: { label: "Health & Safety", color: "bg-destructive/10 text-destructive border-destructive/20" },
    risk_assessment: { label: "Risk Assessment", color: "bg-destructive/10 text-destructive border-destructive/20" },
    incident_report: { label: "Incident Report", color: "bg-destructive/10 text-destructive border-destructive/20" },
    safety_certificate: { label: "Safety Certificate", color: "bg-destructive/10 text-destructive border-destructive/20" },
    emergency_plan: { label: "Emergency Plan", color: "bg-destructive/10 text-destructive border-destructive/20" },
    
    // Financial
    financial: { label: "Financial Document", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    financial_statement: { label: "Financial Statement", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    audit_report: { label: "Audit Report", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    tax_document: { label: "Tax Document", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    invoice_template: { label: "Invoice Template", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    
    // Operational
    operational: { label: "Operational Document", color: "bg-secondary/10 text-secondary-foreground border-secondary/20" },
    sop: { label: "Standard Operating Procedure", color: "bg-secondary/10 text-secondary-foreground border-secondary/20" },
    process_documentation: { label: "Process Documentation", color: "bg-secondary/10 text-secondary-foreground border-secondary/20" },
    training_material: { label: "Training Material", color: "bg-secondary/10 text-secondary-foreground border-secondary/20" },
    work_instruction: { label: "Work Instruction", color: "bg-secondary/10 text-secondary-foreground border-secondary/20" },
    
    // Staff Certifications
    staff_certification: { label: "Staff Certification", color: "bg-primary/10 text-primary border-primary/20" },
    psra_license: { label: "PSRA License", color: "bg-primary/10 text-primary border-primary/20" },
    first_aid: { label: "First Aid Certificate", color: "bg-primary/10 text-primary border-primary/20" },
    drivers_license: { label: "Driver's License", color: "bg-primary/10 text-primary border-primary/20" },
    firearms_license: { label: "Firearms License", color: "bg-primary/10 text-primary border-primary/20" },
    
    // Client Management
    client_management: { label: "Client Document", color: "bg-muted text-muted-foreground border-border" },
    client_contract: { label: "Client Contract", color: "bg-muted text-muted-foreground border-border" },
    service_agreement: { label: "Service Agreement", color: "bg-muted text-muted-foreground border-border" },
    proposal: { label: "Proposal/Quotation", color: "bg-muted text-muted-foreground border-border" },
    site_sop: { label: "Site-Specific SOP", color: "bg-muted text-muted-foreground border-border" },
    
    // Policies & Procedures
    policy: { label: "Company Policy", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    code_of_conduct: { label: "Code of Conduct", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    ethics_policy: { label: "Ethics Policy", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    security_policy: { label: "Security Policy", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    vehicle_policy: { label: "Vehicle Policy", color: "bg-accent/10 text-accent-foreground border-accent/20" },
    
    // Investigation (existing)
    investigation: { label: "Investigation", color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const statusConfig = {
    active: { label: "Active", color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle },
    expired: { label: "Expired", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
    pending_review: { label: "Pending Review", color: "bg-accent/10 text-accent-foreground border-accent/20", icon: Clock },
    archived: { label: "Archived", color: "bg-muted text-muted-foreground border-border", icon: FileText },
  };

  const logAccess = async (documentId: string, accessType: "view" | "download") => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase.from("document_access_logs").insert({
      document_id: documentId,
      accessed_by: userId,
      access_type: accessType,
      user_agent: navigator.userAgent,
    });
  };

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage.from("documents").download(doc.file_url);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
      await logAccess(doc.id, "download");
    }
  };

  const handleView = async (doc: any) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 60);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      await logAccess(doc.id, "view");
    }
  };
  const stats = {
    total: documents?.length || 0,
    active: documents?.filter((d) => d.status === "active").length || 0,
    expiringSoon: documents?.filter((d) => {
      if (!d.expiry_date) return false;
      const daysUntilExpiry = Math.floor((new Date(d.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length || 0,
    expired: documents?.filter((d) => d.status === "expired").length || 0,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Documents & Compliance"
        description="Centralized document management, staff certifications, and compliance tracking"
        icon={FileText}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-primary">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-accent-foreground">{stats.expiringSoon}</p>
            </div>
            <Clock className="h-8 w-8 text-accent-foreground" />
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="documents" className="data-[state=active]:bg-background">All Documents</TabsTrigger>
          <TabsTrigger value="certifications" className="data-[state=active]:bg-background">Staff Certifications</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-background">Expiry Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                >
                  {config.label}
                </Button>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : documents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents?.map((doc) => {
                    const StatusIcon = statusConfig[doc.status as keyof typeof statusConfig]?.icon || FileText;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.document_number}</TableCell>
                        <TableCell>{doc.title}</TableCell>
                        <TableCell>
                          <Badge className={categoryConfig[doc.category as keyof typeof categoryConfig]?.color}>
                            {categoryConfig[doc.category as keyof typeof categoryConfig]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[doc.status as keyof typeof statusConfig]?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[doc.status as keyof typeof statusConfig]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>Staff</TableCell>
                        <TableCell>{format(new Date(doc.uploaded_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {doc.expiry_date ? format(new Date(doc.expiry_date), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <CertificationTracker />
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Expiring Certifications Alert</h3>
            <p className="text-muted-foreground">Certifications expiring within 30 days will appear here.</p>
          </Card>
        </TabsContent>
      </Tabs>

      <DocumentUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </div>
  );
};

export default Documents;
